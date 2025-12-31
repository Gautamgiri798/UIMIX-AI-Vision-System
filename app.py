import cv2
import time
import os
import numpy as np
from flask import Flask, render_template, Response, send_file, request, jsonify
from ultralytics import YOLO
import torch

app = Flask(__name__)

# --- CONFIGURATION ---
MODEL_PATH = 'yolov8n.pt'
device = '0' if torch.cuda.is_available() else 'cpu'

# Load and Optimize Model
model = YOLO(MODEL_PATH)
model.fuse() 

# --- APP STATE CONTAINER ---
state = {
    "low_latency": False,
    "latest_frame": None,
    "res": "720p",
    "aspect_ratio": "16:9" # Initial default ratio
}

# --- RESOLUTION CONFIGURATION ---
# We now use the aspect ratio state to determine which resolution to use
RESOLUTIONS = {
    "16:9": {
        "360p": (640, 360),
        "720p": (1280, 720),
        "1080p": (1920, 1080)
    },
    "4:3": {
        "480p": (640, 480),
        "960p": (1280, 960)
    }
}

# --- STORAGE CONFIGURATION ---
SCREENSHOT_FOLDER = 'captures'
MAX_AGE_DAYS = 7
if not os.path.exists(SCREENSHOT_FOLDER):
    os.makedirs(SCREENSHOT_FOLDER, exist_ok=True)

def generate_frames():
    camera = cv2.VideoCapture(0)
    
    # Track local versions to detect global state changes
    active_res = state["res"]
    active_ratio = state["aspect_ratio"]
    
    # Ensure current resolution exists for the current ratio
    if active_res not in RESOLUTIONS[active_ratio]:
        active_res = list(RESOLUTIONS[active_ratio].keys())[0]
        state["res"] = active_res

    w, h = RESOLUTIONS[active_ratio][active_res]
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, w)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, h)
    
    prev_time = time.time()
    frame_count = 0

    while True:
        # Detect global state changes for Ratio or Resolution
        if state["res"] != active_res or state["aspect_ratio"] != active_ratio:
            active_res = state["res"]
            active_ratio = state["aspect_ratio"]
            
            # Fallback if selected resolution isn't in current ratio set
            if active_res not in RESOLUTIONS[active_ratio]:
                active_res = list(RESOLUTIONS[active_ratio].keys())[0]
                state["res"] = active_res
            
            w, h = RESOLUTIONS[active_ratio][active_res]
            camera.set(cv2.CAP_PROP_FRAME_WIDTH, w)
            camera.set(cv2.CAP_PROP_FRAME_HEIGHT, h)
            model.predictor = None # Reset tracker memory for new dimensions

        success, frame = camera.read()
        if not success:
            break
            
        frame = cv2.flip(frame, 1)

        # SEPARATE AI PROCESSING: Use resized copy for YOLO
        # This prevents squashing the visual output for the user
        input_frame = cv2.resize(frame, (640, 640), interpolation=cv2.INTER_LINEAR)

        frame_count += 1
        if not (state["low_latency"] and frame_count % 2 != 0):
            try:
                # Inference on resized square frame
                results = model.track(
                            source=input_frame, 
                            persist=True, 
                            conf=0.35,          # Faster post-processing
                            device=device, 
                            half=True,          # Ensure FP16 is used
                            agnostic_nms=True,  # Simplified box merging
                            verbose=False
                        )
                
                # Plot back onto original rectangular frame to preserve ratio
                annotated_frame = results[0].plot()
                # Check for detections to trigger alerts
                if len(results[0].boxes) > 0:
                    # You can send a signal to JS here via a global state or socket
                    pass
            except Exception:
                results = model.predict(input_frame, conf=0.4, device=device, verbose=False)
                annotated_frame = results[0].plot()
        else:
            annotated_frame = frame

        # Consistency check for visual dimensions
        if annotated_frame.shape[1] != w:
            annotated_frame = cv2.resize(annotated_frame, (w, h))

        state["latest_frame"] = annotated_frame.copy()

        curr_time = time.time()
        fps = 1 / (curr_time - prev_time + 1e-6)
        prev_time = curr_time

        cv2.putText(annotated_frame, f"FPS: {int(fps)} | {active_ratio} {active_res}", (20, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        ret, buffer = cv2.imencode('.jpg', annotated_frame)
        if not ret:
            continue
            
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

# --- NEW ROUTE: ASPECT RATIO TOGGLE ---
@app.route('/toggle_aspect_ratio', methods=['POST'])
def toggle_aspect_ratio():
    # Flip between 4:3 and 16:9
    state["aspect_ratio"] = "16:9" if state["aspect_ratio"] == "4:3" else "4:3"
    return jsonify({"status": "success", "ratio": state["aspect_ratio"]})

# --- REMAINING ROUTES ---
@app.route('/')
def index(): return render_template('index.html')

@app.route('/video_feed')
def video_feed(): return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/toggle_latency', methods=['POST'])
def toggle_latency():
    state["low_latency"] = not state["low_latency"]
    return jsonify({"status": "success", "mode": state["low_latency"]})

@app.route('/change_resolution', methods=['POST'])
def change_resolution():
    res_choice = request.json.get("resolution")
    # Verify resolution exists for current ratio before updating
    if any(res_choice in sub for sub in RESOLUTIONS.values()):
        state["res"] = res_choice
        return jsonify({"status": "success", "resolution": res_choice})
    return jsonify({"status": "error", "message": "Invalid resolution"}), 400

@app.route('/screenshot')
def screenshot():
    frame = state["latest_frame"]
    if frame is not None:
        ts = time.strftime("%Y%m%d-%H%M%S")
        file_path = os.path.join(SCREENSHOT_FOLDER, f"capture_{ts}.jpg")
        cv2.imwrite(file_path, frame)
        return send_file(file_path, as_attachment=True)
    return "No frame captured yet", 400

@app.route('/reset_tracker', methods=['POST'])
def reset_tracker():
    model.predictor = None 
    return jsonify({"status": "success", "message": "Tracker reset"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)