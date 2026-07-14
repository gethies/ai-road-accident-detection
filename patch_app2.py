import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update startSimulatedCCTV to auto-start AI detection and remove any old mock logic
# It currently has:
#         monitorVideo.play().catch(e => console.log("Auto-play blocked:", e));
#         clearCanvas();
#         resetResultsPanel();
#         showToast("Connected to live simulated CCTV stream.", "success");
#     }

new_simulated = """        monitorVideo.play().catch(e => console.log("Auto-play blocked:", e));
        
        clearCanvas();
        resetResultsPanel();
        showToast("Connected to live simulated CCTV stream.", "success");
        
        // Auto start AI detection on first frame
        monitorVideo.addEventListener('playing', function onPlaying() {
            monitorVideo.removeEventListener('playing', onPlaying);
            // Trigger AI automatically
            document.getElementById("run-detection-btn").click();
        });
    }"""
content = re.sub(r'monitorVideo\.play\(\)\.catch[^\}]+\}\s*$', new_simulated, content, flags=re.MULTILINE)

# 2. Replace triggerAIDetection entirely
# We need to process every 3rd frame. Since a video is usually ~30fps, 
# using requestAnimationFrame we can skip frames or just use setInterval.
# setInterval of 100ms (10 FPS) is good. Every 3rd means we can just use 300ms interval for /predict.
# Or use requestAnimationFrame and a frame counter.

new_trigger = """    let aiDetectionInterval = null;
    let detectionActive = false;

    function triggerAIDetection() {
        if (detectionActive) return;
        
        const monitorVideo = document.getElementById("monitor-video");
        if (!monitorVideo || monitorVideo.style.display === "none") return;
        
        detectionActive = true;
        const overlay = document.getElementById("processing-overlay");
        // No full screen loading overlay blocking UI
        if(overlay) overlay.style.display = "none";
        
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        let frameCount = 0;
        
        function detectFrame() {
            if (!detectionActive || monitorVideo.paused || monitorVideo.ended) {
                if(!monitorVideo.paused) requestAnimationFrame(detectFrame);
                else setTimeout(detectFrame, 100);
                return;
            }
            
            frameCount++;
            if (frameCount % 3 !== 0) {
                requestAnimationFrame(detectFrame);
                return;
            }
            
            // Draw current video frame to canvas
            canvas.width = monitorVideo.videoWidth || 640;
            canvas.height = monitorVideo.videoHeight || 480;
            ctx.drawImage(monitorVideo, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
                if (!blob) {
                    requestAnimationFrame(detectFrame);
                    return;
                }
                
                const formData = new FormData();
                formData.append("image", blob, "frame.jpg");
                const thresholdSlider = document.getElementById("threshold-slider");
                if (thresholdSlider) {
                    formData.append("threshold", parseInt(thresholdSlider.value) / 100);
                }
                
                const apiBase = window.location.protocol === 'file:' ? 'http://127.0.0.1:5000' : '';
                
                fetch(${apiBase}/predict, {
                    method: "POST",
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.detections && data.detections.length > 0) {
                        // Found an accident
                        const highest = data.detections.reduce((prev, curr) => (prev.confidence > curr.confidence) ? prev : curr);
                        updateResultsPanel(highest);
                        drawBoundingBoxes(data.detections);
                        
                        // Play alert sound immediately
                        const siren = document.getElementById("siren-audio");
                        if (siren) siren.play().catch(e => console.log("Siren blocked:", e));
                        
                        // Stop detection loop upon finding an accident or keep going? 
                        // Usually we keep going or pause. We will just keep drawing.
                        
                        // Add to history if not added recently
                        if (Date.now() - (window.lastAccidentTime || 0) > 5000) {
                            window.lastAccidentTime = Date.now();
                            addToHistory(highest);
                        }
                    } else {
                        // clear bounding boxes if no accident
                        clearCanvas();
                    }
                    
                    if (detectionActive) requestAnimationFrame(detectFrame);
                })
                .catch(err => {
                    console.error("AI Prediction Error:", err);
                    if (detectionActive) setTimeout(() => requestAnimationFrame(detectFrame), 1000);
                });
            }, "image/jpeg", 0.7);
        }
        
        requestAnimationFrame(detectFrame);
    }
"""

# Replace the existing triggerAIDetection block
content = re.sub(
    r'function triggerAIDetection\(\) \{.*?(?=function updateResultsPanel)',
    new_trigger + r'\n    ',
    content,
    flags=re.DOTALL
)

# 3. Add JS fallback for grid video autoplay
grid_fallback = """    // Fallback for grid videos
    document.querySelectorAll('.cctv-feed video').forEach(vid => {
        vid.play().catch(e => console.log('Grid autoplay blocked:', e));
    });
"""
content = re.sub(r'(setInterval\(\(\) => \{\s*const timestamps = document\.querySelectorAll\(\'\.grid-timestamp\'\);)', grid_fallback + r'\n    \1', content)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('app.js updated successfully.')
