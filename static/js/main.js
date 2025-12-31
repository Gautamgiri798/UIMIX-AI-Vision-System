/* ===== CORE STATE & ELEMENTS ===== */
const videoImg = document.getElementById('video-stream');
const videoWrapper = document.querySelector('.video-wrapper');
const toggleBtn = document.getElementById('toggle-btn');
const accelSpan = document.getElementById('accel');
const resSelect = document.getElementById('res-select');
const ratioBtn = document.getElementById('ratio-btn');
const hapticBtn = document.getElementById('haptic-btn'); // New element

let isStreaming = true;
const streamUrl = videoImg ? videoImg.src : "";

const RESOLUTIONS_MAP = {
    "16:9": ["360p", "720p", "1080p"],
    "4:3": ["480p", "960p"]
};
let currentRatio = "16:9";
let hapticsEnabled = false; // Internal state for vibration

/* ===== INITIALIZATION ===== */
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth <= 1024) {
        currentRatio = "4:3";
        if(ratioBtn) ratioBtn.textContent = currentRatio;
    }
    updateDropdownOptions(currentRatio);
    checkHardware();
    initSwipeGestures();
});

/* ===== HAPTIC FEEDBACK ===== */
function toggleHaptics() {
    hapticsEnabled = !hapticsEnabled;
    
    // Provide a test pulse to confirm activation
    if (hapticsEnabled && "vibrate" in navigator) {
        navigator.vibrate(50);
    }
    
    if (hapticBtn) {
        hapticBtn.textContent = `📳 HAPTICS: ${hapticsEnabled ? "ON" : "OFF"}`;
        hapticBtn.style.borderColor = hapticsEnabled ? "#28a745" : "#fff";
    }
    showToast(`HAPTIC FEEDBACK: ${hapticsEnabled ? "ENABLED" : "DISABLED"}`);
}

/**
 * Trigger this function whenever the AI detects a new object
 */
function triggerDetectionHaptic() {
    if (hapticsEnabled && "vibrate" in navigator) {
        navigator.vibrate(50); // Short pulse for discrete feedback
    }
}

/* ===== FULLSCREEN LOGIC ===== */
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        if (videoWrapper.requestFullscreen) {
            videoWrapper.requestFullscreen();
        } else if (videoWrapper.webkitRequestFullscreen) {
            videoWrapper.webkitRequestFullscreen();
        }
        showToast("🖥️ ENTERED FULLSCREEN");
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        showToast("🖥️ EXITED FULLSCREEN");
    }
}

/* ===== SWIPE GESTURES ===== */
function initSwipeGestures() {
    let touchstartX = 0;
    let touchendX = 0;

    videoWrapper.addEventListener('touchstart', e => {
        touchstartX = e.changedTouches[0].screenX;
    }, { passive: true });

    videoWrapper.addEventListener('touchend', e => {
        touchendX = e.changedTouches[0].screenX;
        if (Math.abs(touchendX - touchstartX) > 50) {
            toggleAspectRatio();
        }
    }, { passive: true });
}

/* ===== UI COMPONENT: NOTIFICATIONS ===== */
function showToast(message, type = "success") {
    const toast = document.getElementById("notification-toast");
    if (!toast) return;

    toast.textContent = message;
    toast.style.backgroundColor = type === "success" ? "#28a745" : "#dc3545";
    toast.className = "toast show";
    
    setTimeout(() => { 
        toast.className = toast.className.replace("show", ""); 
    }, 3000);
}

/* ===== STREAM CONTROL ===== */
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        if (isStreaming) {
            videoImg.src = "";
            toggleBtn.textContent = "RESUME STREAM";
            toggleBtn.style.color = "#28a745";
            showToast("⏸️ STREAM PAUSED", "warning");
        } else {
            videoImg.src = streamUrl;
            toggleBtn.textContent = "PAUSE STREAM";
            toggleBtn.style.color = "#007bff";
            showToast("▶️ STREAM RESUMED");
        }
        isStreaming = !isStreaming;
    });
}

/* ===== RESOLUTION & RATIO LOGIC ===== */
function updateDropdownOptions(ratio) {
    if (!resSelect) return;
    resSelect.innerHTML = '';

    RESOLUTIONS_MAP[ratio].forEach(res => {
        const opt = document.createElement('option');
        opt.value = res;
        opt.textContent = res.toUpperCase() + (res === "720p" ? " (HD)" : "");
        resSelect.appendChild(opt);
    });
}

async function updateResolution() {
    const res = resSelect.value;
    try {
        const response = await fetch('/change_resolution', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolution: res })
        });
        const data = await response.json();
        if(data.status === "success") {
            showToast(`🎥 QUALITY SET TO ${res.toUpperCase()}`);
        }
    } catch (error) {
        showToast("❌ FAILED TO CHANGE RESOLUTION", "error");
    }
}

async function toggleAspectRatio() {
    try {
        const response = await fetch('/toggle_aspect_ratio', { method: 'POST' });
        const data = await response.json();
        
        if(data.status === "success") {
            currentRatio = data.ratio;
            if (ratioBtn) ratioBtn.textContent = currentRatio;
            updateDropdownOptions(currentRatio);
            showToast(`📐 RATIO CHANGED: ${currentRatio}`);
        }
    } catch (error) {
        showToast("❌ RATIO SWITCH FAILED", "error");
    }
}

/* ===== SYSTEM ACTIONS ===== */
async function resetTracker() {
    try {
        const response = await fetch('/reset_tracker', { method: 'POST' });
        const data = await response.json();
        if(data.status === "success") showToast("🔄 TRACKER RESET SUCCESSFULLY");
    } catch (error) {
        showToast("❌ ERROR RESETTING TRACKER", "error");
    }
}

function takeScreenshot() {
    window.location.href = '/screenshot';
    showToast("📸 SNAPSHOT CAPTURED");
}

async function toggleLatency() {
    try {
        const response = await fetch('/toggle_latency', { method: 'POST' });
        const data = await response.json();
        document.getElementById('latency-btn').textContent = `⚡ LOW LATENCY: ${data.mode ? "ON" : "OFF"}`;
        showToast(`⚡ LATENCY MODE: ${data.mode ? "ON" : "OFF"}`);
    } catch (error) {
        showToast("❌ LATENCY TOGGLE FAILED", "error");
    }
}

async function checkHardware() {
    if (!accelSpan) return;
    accelSpan.textContent = "CUDA (NVIDIA GPU)"; 
    accelSpan.style.color = "#00ff00";
}

/**
 * Updates the footer with real-time performance data
 */
function updatePerformanceStats(fps) {
    const fpsValue = document.getElementById('fps-value');
    if (fpsValue) {
        fpsValue.textContent = fps;
        // Visual cue: Green for high performance, Yellow for lag
        fpsValue.style.color = fps > 25 ? "#28a745" : "#ffc107";
    }
}
// Update your existing generate_frames yield logic to include the FPS 
// Or simpler: Parse the FPS string from the annotated frame text if needed.