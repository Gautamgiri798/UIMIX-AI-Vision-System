## 🌌 **UIMIX | AI Vision System**
UIMIX is a high-performance, real-time object detection dashboard built for both desktop and mobile environments. Utilizing a custom-engineered HUD and an optimized TensorRT inference engine, it provides military-grade visual tracking with ultra-low latency.

**🌐 Live Deployment:** ([https://uimix-vision-system.onrender.com](https://uimix-ai-vision-system.onrender.com))

![Python 3.10](https://img.shields.io/badge/Engine-Python_3.10-blue?style=for-the-badge&logo=python)
![TensorRT](https://img.shields.io/badge/Optimization-TensorRT_FP16-76B900?style=for-the-badge&logo=nvidia)
![YOLOv8](https://img.shields.io/badge/Neural_Net-YOLOv8_Nano-00FFAA?style=for-the-badge)

## 🚀 **Key Features**
- ⚡ Ultra-Fast Inference: Optimized via TensorRT (.engine) and FP16 half-precision to achieve speeds under 5ms per frame.

- 📐 Dynamic Aspect Ratio: Manually toggle between 16:9 Widescreen and 4:3 Standard views with hardware-level synchronization.

- 📱 Mobile Responsive: A fully adaptive UI that features touch-friendly controls and horizontal swipe gestures to change ratios.

- 📳 Haptic & Audio Alerts: Real-time vibration (Android) and spatial audio chimes triggered immediately upon detection.

- 🌙 Vision Enhancement: Integrated Gamma correction and sharpening filters to maintain high confidence scores in low-light environments.

- 🖥️ Fullscreen HUD: An immersive monitoring experience using the Fullscreen API with persistent technical corner accents.

## 🛠️ **Technical Setup**
1. Requirements
Hardware: NVIDIA GPU with CUDA support (for maximum FPS).

Software: Python 3.9+, CUDA Toolkit, and TensorRT.

2. Installation
```Bash

# Clone the repository
git clone https://github.com/yourusername/uimix-vision.git
cd uimix-vision

# Install dependencies
pip install -r requirements.txt

```
3. Model Optimization
To reach the speeds displayed in the FPS counter, export your model to the TensorRT engine format:

Python
```
from ultralytics import YOLO
model = YOLO('yolov8n.pt')
model.export(format='engine', half=True, device=0)
```

## ⚡ Core Engine Specifications
## 🛠️ **Deploying the System**
1. Environment Preparation
Ensure your environment is equipped with CUDA 11.x+ and cuDNN 8.x+. Note that Render deployments require opencv-python-headless and a CPU-compatible model (.pt).

2. Neural Optimization
To achieve 60+ FPS, compile the standard PyTorch model into a TensorRT engine:

## 📱 **Mobile Operational Protocol**
UIMIX is fully mobile-responsive, transforming the dashboard into a vertical tactical interface.

- Fluid Gestures: Swipe horizontally across the video feed to swap hardware aspect ratios (16:9 ↔ 4:3).

- Immersive Mode: Uses the Fullscreen API to strip away browser chrome, providing a dedicated tracking view.

- Haptic Feedback: Vibrates the device (Android) upon successful target acquisition.

## 🖥️ **User Interface & Controls**
- ⚡ LATENCY MODE: Toggles frame-skipping logic to prioritize real-time visual flow over high-density tracking.

- 📸 SNAPSHOT: Captures a high-resolution frame with AI bounding boxes and saves it to the local /captures directory.

- 🔄 RESET: Clears the tracking IDs and resets the model's memory for a clean environment scan.

- 📐 RATIO: Direct hardware command to adjust the camera sensor's active capture area.

## ⚖️ **License & Ethics**
This system is intended for research and educational purposes. Ensure compliance with local privacy laws regarding public surveillance.
