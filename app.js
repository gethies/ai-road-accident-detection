// SURE: AI Road Accident Detection & Response System - Javascript Logic

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initial State and Settings
    let currentView = "landing-view";
    let theme = localStorage.getItem("sure-theme") || "dark";
    let threshold = 60; // default AI threshold
    let detectionsHistory = [];
    let isWebcamStreaming = false;
    let webcamStream = null;
    let activeFeedSource = "";
    let activeFileType = ""; // "image" or "video" or "camera"
    let activeFileObject = null;
    let mapInstance = null;
    let trendChart = null;
    let severityChart = null;
    let isDemoMode = false;
    
    // Original project presets
    const SAMPLE_IMAGE_URL = "assets/input.jpg";
    const SAMPLE_OUTPUT_IMAGE_URL = "assets/output.jpg";
    const CCTV_VIDEOS = [
        "assets/sample-videos/chennai_cctv_traffic.mp4",
        "assets/sample-videos/bangalore_ringroad.mp4",
        "assets/sample-videos/mumbai_expressway.mp4",
        "assets/sample-videos/indian_highway_traffic.mp4"
    ];
    let SAMPLE_VIDEO_URL = CCTV_VIDEOS[Math.floor(Math.random() * CCTV_VIDEOS.length)];

    // Indian Location Presets (Chennai focus)
    const CHENNAI_LOCATIONS = [
        "Kathipara Junction, Chennai",
        "Koyambedu Roundtana, Chennai",
        "Guindy Flyover, Chennai",
        "OMR Toll Plaza, Chennai",
        "Mount Road (Anna Salai), Chennai",
        "Madhuravoyal Bypass, Chennai",
        "Tambaram G.S.T Road, Chennai",
        "Poonamallee High Road, Chennai"
    ];

    // Notification lists
    let activeNotifications = [];

    // Initialize the UI elements
    initApp();

    function initApp() {
        // Apply initial theme
        document.documentElement.setAttribute("data-theme", theme);
        const themeToggle = document.getElementById("theme-toggle");
        themeToggle.checked = (theme === "dark");
        updateThemeToggleIcon(theme === "dark");

        // Start clock
        setInterval(updateClock, 1000);
        updateClock();

        // Load History from Local Storage
        loadHistoryFromStorage();

        // Initialize Map & Charts
        initCharts();
        initMap();
        window.mapInstance = mapInstance;

        // Setup Event Listeners
        setupEventListeners();
        
        // Fetch license & logs files from server
        fetchProjectFiles();
        
        // Populate initial mock data in history if empty
        if (detectionsHistory.length === 0) {
            populateInitialHistory();
        } else {
            renderHistoryTable();
            updateAnalyticsSummary();
        }
        
        // Initialize Server Status Watchdog & WebSocket Connection
        initServerConnection();
        
        // Initialize Dev Console Switching & Phone Emulator
        initDevConsoleAndEmulator();
        initSimulationEngine();
    }

    // 2. Event Listeners
    function setupEventListeners() {
        // Learn Research Button
        const btnLearnResearch = document.getElementById("btn-learn-research");
        if (btnLearnResearch) {
            btnLearnResearch.addEventListener("click", () => {
                switchView("architecture-view");
            });
        }

        // Sidebar navigation clicks
        const menuItems = document.querySelectorAll(".sidebar-menu li");
        menuItems.forEach(item => {
            item.addEventListener("click", () => {
                const targetView = item.getAttribute("data-view");
                switchView(targetView);
            });
        });

        // Mobile sidebar toggle
        const mobileToggle = document.getElementById("mobile-toggle");
        const sidebar = document.getElementById("sidebar");
        mobileToggle.addEventListener("click", () => {
            sidebar.classList.toggle("active");
        });

        // Theme Toggle slider
        const themeToggle = document.getElementById("theme-toggle");
        themeToggle.addEventListener("change", (e) => {
            theme = e.target.checked ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", theme);
            localStorage.setItem("sure-theme", theme);
            updateThemeToggleIcon(e.target.checked);
            showToast(`Switched to ${theme === 'dark' ? 'Dark Mode' : 'Light Mode'}`, "info");
            
            // Re-render map tiles to fit dark mode filter
            if (mapInstance) {
                setTimeout(() => {
                    mapInstance.invalidateSize();
                }, 100);
            }
        });

        // Demo Mode Toggle slider
        const demoModeToggle = document.getElementById("demo-mode-toggle");
        if (demoModeToggle) {
            demoModeToggle.addEventListener("change", (e) => {
                isDemoMode = e.target.checked;
                if(isDemoMode) {
                    showToast("Demo Mode Enabled: Backend bypassed. Running purely on frontend mock data.", "success");
                } else {
                    showToast("Demo Mode Disabled: Connecting to Flask AI Core.", "warning");
                }
            });
        }

        // Notification Bell dropdown toggle
        const bell = document.querySelector(".notification-bell");
        const notifDropdown = document.getElementById("notification-dropdown");
        bell.addEventListener("click", (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle("active");
        });
        
        document.addEventListener("click", () => {
            notifDropdown.classList.remove("active");
        });

        notifDropdown.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        document.getElementById("clear-notifications").addEventListener("click", () => {
            activeNotifications = [];
            renderNotifications();
            showToast("Notifications cleared", "info");
        });

        // Upload Source Selector tabs
        const tabButtons = document.querySelectorAll(".source-tabs .tab-btn");
        tabButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                tabButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                
                const targetTab = btn.getAttribute("data-tab");
                const tabContents = document.querySelectorAll(".tab-content");
                tabContents.forEach(c => c.classList.remove("active"));
                document.getElementById(`tab-${targetTab}`).classList.add("active");
                
                // Stop cameras if switching tab
                                if (targetTab !== "live-camera") {
                    stopWebcam();
                } else {
                    const btn = document.getElementById('start-simulated-camera-btn');
                    if(btn) btn.click();
                }
            });
        });

        // Sample Loading Buttons
        document.getElementById("load-sample-btn").addEventListener("click", () => {
            loadSampleImage();
        });
        
        document.getElementById("load-sample-video-btn").addEventListener("click", () => {
            loadSampleVideo();
        });

        // File Inputs
        const imgInput = document.getElementById("image-input");
        imgInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0], "image");
            }
        });

        const vidInput = document.getElementById("video-input");
        vidInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0], "video");
            }
        });

        // Camera Activation buttons
        

        document.getElementById("start-simulated-camera-btn").addEventListener("click", () => {
            startSimulatedCCTV();
        });

        // Close Monitor Screen
        document.getElementById("close-monitor-btn").addEventListener("click", () => {
            stopWebcam();
            const monitorImage = document.getElementById("monitor-image");
            if (monitorImage) monitorImage.src = "";
            document.getElementById("monitor-container").style.display = "none";
            // Show upload sections
            document.querySelectorAll(".tab-content").forEach(c => {
                if (c.classList.contains("active")) {
                    c.style.display = "block";
                }
            });
            resetResultsPanel();
        });

        // Threshold Slider
        const slider = document.getElementById("threshold-slider");
        const valLabel = document.getElementById("threshold-val");
        slider.addEventListener("input", (e) => {
            threshold = e.target.value;
            valLabel.textContent = `${threshold}%`;
        });

        // Trigger AI Detection button
        const runBtn = document.getElementById("run-detection-btn");
        if (runBtn) {
            runBtn.style.pointerEvents = "auto";
            runBtn.disabled = false;
            runBtn.addEventListener("click", () => {
                console.log("Classifier button clicked");
                try {
                    triggerAIDetection();
                } catch(e) {
                    console.error("Error in triggerAIDetection:", e);
                }
            });
        }

        // History Filters & Search
        document.getElementById("history-search").addEventListener("input", filterHistory);
        document.getElementById("history-filter-severity").addEventListener("change", filterHistory);
        document.getElementById("clear-history-btn").addEventListener("click", () => {
            if (confirm("Are you sure you want to clear the entire log history?")) {
                clearLogs();
            }
        });

        // Modal triggers
        document.getElementById("close-modal-btn").addEventListener("click", closeModal);
        document.getElementById("modal-close-action-btn").addEventListener("click", closeModal);
        document.getElementById("modal-print-btn").addEventListener("click", () => {
            window.print();
        });

        // Alert agency buttons
        const alertPanel = document.getElementById("alerts-panel");
        const dispatchBtns = alertPanel.querySelectorAll(".dispatch-btn");
        dispatchBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                const agencyCard = e.target.closest(".dispatch-panel");
                dispatchAgency(agencyCard);
            });
        });

        // Research sub-tabs switcher
        const researchTabButtons = document.querySelectorAll(".research-tab-btn");
        researchTabButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                researchTabButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                
                const targetTab = btn.getAttribute("data-research-tab");
                const tabContents = document.querySelectorAll(".research-tab-content");
                tabContents.forEach(c => c.classList.remove("active"));
                
                const activeTab = document.getElementById(`research-tab-${targetTab}`);
                if (activeTab) activeTab.classList.add("active");
            });
        });

        // Manual refresh buttons for research content
        const fetchCodeBtn = document.getElementById("fetch-code-btn");
        if (fetchCodeBtn) {
            fetchCodeBtn.addEventListener("click", () => {
                document.getElementById("code-viewer-content").textContent = "Refetching source code...";
                fetchProjectFiles();
            });
        }
        const fetchLogsBtn = document.getElementById("fetch-logs-btn");
        if (fetchLogsBtn) {
            fetchLogsBtn.addEventListener("click", () => {
                document.getElementById("logs-viewer-content").textContent = "Refetching execution logs...";
                fetchProjectFiles();
            });
        }
    }

    // 3. UI Helpers
    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        let seconds = now.getSeconds();
        let ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0'+minutes : minutes;
        seconds = seconds < 10 ? '0'+seconds : seconds;
        
        const clockStr = `${hours}:${minutes}:${seconds} ${ampm}`;
        document.getElementById("system-clock").textContent = clockStr;
    }

    function updateThemeToggleIcon(isDark) {
        const themeLabel = document.querySelector(".theme-label");
        if (isDark) {
            themeLabel.innerHTML = `<i class="fa-solid fa-moon"></i> Dark Mode`;
        } else {
            themeLabel.innerHTML = `<i class="fa-solid fa-sun text-warning"></i> Light Mode`;
        }
    }

    window.switchView = function(viewId) {
        detectionActive = false;
        currentView = viewId;
        const sections = document.querySelectorAll(".view-section");
        sections.forEach(sec => sec.classList.remove("active"));
        
        const activeSec = document.getElementById(viewId);
        if (activeSec) {
            activeSec.classList.add("active");
        }

        const menuItems = document.querySelectorAll(".sidebar-menu li");
        menuItems.forEach(item => {
            item.classList.remove("active");
            if (item.getAttribute("data-view") === viewId) {
                item.classList.add("active");
            }
        });

        // Close mobile sidebar on navigate
        document.getElementById("sidebar").classList.remove("active");

        // Force Leaflet map resize redraw since it was hidden
        if (viewId === "analytics-view" && mapInstance) {
            setTimeout(() => {
                mapInstance.invalidateSize();
            }, 250);
        }
        
        showToast(`Navigated to ${document.querySelector(`.sidebar-menu li[data-view="${viewId}"] span`).textContent}`, "success");
    };

    function showToast(message, type = "info") {
        const container = document.getElementById("toast-container");
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        
        let icon = "fa-info-circle";
        if (type === "error") icon = "fa-triangle-exclamation";
        if (type === "success") icon = "fa-circle-check";
        if (type === "warning") icon = "fa-bell";

        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    // 4. File Handling & Stream Controllers
    function loadSampleImage() {
        const file = new File([""], "accident_1.jpg", { type: "image/jpeg" });
        SAMPLE_IMAGE_URL = "assets/sample-images/accident_1.jpg";
        handleFileSelect(file, "image");
        setTimeout(triggerAIDetection, 500);
    }

    function loadSampleVideo() {
        const file = new File([""], "road_accident_sample.mp4", { type: "video/mp4" });
        SAMPLE_VIDEO_URL = "assets/sample-videos/road_accident_sample.mp4";
        handleFileSelect(file, "video");
        setTimeout(triggerAIDetection, 500);
    }

    function handleFileSelect(file, type) {
        activeFileType = type;
        activeFeedSource = file.name;
        activeFileObject = file;
        
        // Hide upload container in active tab
        const activeTabContent = document.querySelector(".tab-content.active");
        activeTabContent.style.display = "none";
        
        // Show monitor container
        const monitorContainer = document.getElementById("monitor-container");
        monitorContainer.style.display = "flex";
        
        document.getElementById("feed-source-name").textContent = file.name.toUpperCase();
        
        const monitorImage = document.getElementById("monitor-image");
        const monitorVideo = document.getElementById("monitor-video");
        
        resetResultsPanel();

        if (type === "image") {
            monitorVideo.style.display = "none";
            monitorImage.style.display = "block";
            
            const reader = new FileReader();
            reader.onload = function(e) {
                monitorImage.src = e.target.result;
                clearCanvas();
            };
            reader.readAsDataURL(file);
        } else if (type === "video") {
            monitorImage.style.display = "none";
            monitorVideo.style.display = "block";
            
            const fileURL = URL.createObjectURL(file);
            monitorVideo.src = fileURL;
            monitorVideo.load();
            monitorVideo.play();
            clearCanvas();
        }
    }

    function loadSampleImage() {
        activeFileType = "image";
        activeFeedSource = "accident_sample_chennai.jpg";
        activeFileObject = null;
        
        // Fetch the sample image to set as activeFileObject
        fetch(SAMPLE_IMAGE_URL)
            .then(res => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.blob();
            })
            .then(blob => {
                activeFileObject = new File([blob], "input.jpg", { type: "image/jpeg" });
                
                const activeTabContent = document.querySelector(".tab-content.active");
                if (activeTabContent) activeTabContent.style.display = "none";
                
                const monitorContainer = document.getElementById("monitor-container");
                if (monitorContainer) monitorContainer.style.display = "flex";
                
                const feedSourceName = document.getElementById("feed-source-name");
                if (feedSourceName) feedSourceName.textContent = "ACCIDENT_SAMPLE_CHENNAI.JPG";
                
                const monitorImage = document.getElementById("monitor-image");
                const monitorVideo = document.getElementById("monitor-video");
                
                if (monitorVideo) monitorVideo.style.display = "none";
                if (monitorImage) monitorImage.style.display = "block";
                
                if (monitorImage) monitorImage.src = SAMPLE_IMAGE_URL;
                clearCanvas();
                resetResultsPanel();
                
                showToast("Loaded original sample image.", "success");
            })
            .catch(err => {
                console.error("Error fetching sample image blob:", err);
                showToast("Failed to load sample image. Ensure the server is running.", "error");
            });
    }

    function loadSampleVideo() {
        activeFileType = "video";
        activeFeedSource = "cctv_highway_gstdrive.mp4";
        
        const activeTabContent = document.querySelector(".tab-content.active");
        activeTabContent.style.display = "none";
        
        const monitorContainer = document.getElementById("monitor-container");
        monitorContainer.style.display = "flex";
        
        document.getElementById("feed-source-name").textContent = "CCTV_HIGHWAY_GSTDRIVE.MP4";
        
        const monitorImage = document.getElementById("monitor-image");
        const monitorVideo = document.getElementById("monitor-video");
        monitorImage.style.display = "none";
        monitorVideo.style.display = "block";
        
        monitorVideo.src = SAMPLE_VIDEO_URL;
        monitorVideo.load();
        monitorVideo.play().catch(err => {
            showToast("Video playback requires user gesture. Click Run AI to analyze.", "warning");
        });
        clearCanvas();
        resetResultsPanel();
        
        showToast("Loaded sample traffic loop video.", "success");
    }

    function startWebcam() {
        activeFileType = "camera";
        activeFeedSource = "LOCAL_WEBCAM_STREAM";
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    webcamStream = stream;
                    isWebcamStreaming = true;
                    
                    const activeTabContent = document.querySelector(".tab-content.active");
                    activeTabContent.style.display = "none";
                    
                    const monitorContainer = document.getElementById("monitor-container");
                    monitorContainer.style.display = "flex";
                    
                    document.getElementById("feed-source-name").textContent = "LIVE: LOCAL WEBCAM STREAM";
                    
                    const monitorImage = document.getElementById("monitor-image");
                    const monitorVideo = document.getElementById("monitor-video");
                    monitorImage.style.display = "none";
                    monitorVideo.style.display = "block";
                    
                    monitorVideo.srcObject = stream;
                    monitorVideo.play();
                    clearCanvas();
                    resetResultsPanel();
                    
                    showToast("Webcam accessed successfully.", "success");
                })
                .catch(err => {
                    console.error("Camera access error: ", err);
                    showToast("Could not access camera device. Connecting mock stream instead.", "error");
                    startSimulatedCCTV();
                });
        } else {
            showToast("Webcam API not supported. Launching mock CCTV stream.", "error");
            startSimulatedCCTV();
        }
    }

    function stopWebcam() {
        if (isWebcamStreaming && webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            webcamStream = null;
            isWebcamStreaming = false;
        }
        
        const monitorVideo = document.getElementById("monitor-video");
        monitorVideo.srcObject = null;
        monitorVideo.src = "";
    }

        function startSimulatedCCTV() {
        activeFileType = "camera";
        activeFeedSource = "PUBLIC_ACCIDENT_MP4";
        
        const activeTabContent = document.querySelector(".tab-content.active");
        if(activeTabContent) activeTabContent.style.display = "none";
        
        const monitorContainer = document.getElementById("monitor-container");
        monitorContainer.style.display = "flex";
        
        document.getElementById("feed-source-name").textContent = "LIVE CCTV STREAM";
        
        const monitorImage = document.getElementById("monitor-image");
        const monitorVideo = document.getElementById("monitor-video");
        
        monitorImage.style.display = "none";
        monitorVideo.style.display = "block";
        monitorVideo.src = "public/accident.mp4";
        monitorVideo.loop = true;
        monitorVideo.muted = true;
        monitorVideo.autoplay = true;
                monitorVideo.play().catch(e => console.log("Auto-play blocked:", e));
        
        clearCanvas();
        resetResultsPanel();
        showToast("Connected to live simulated CCTV stream.", "success");
        
        // Auto start AI detection on first frame
        monitorVideo.addEventListener('playing', function onPlaying() {
            monitorVideo.removeEventListener('playing', onPlaying);
            // Trigger AI automatically
            document.getElementById("run-detection-btn").click();
        });
    }
    function clearCanvas() {
        const canvas = document.getElementById("monitor-canvas");
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    function drawBoundingBoxes(detections) {
        const canvas = document.getElementById("monitor-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        detections.forEach(det => {
            if (!det.bbox || det.bbox.length < 4) return;
            const [yMin, xMin, yMax, xMax] = det.bbox;
            const x = xMin * canvas.width;
            const y = yMin * canvas.height;
            const width = (xMax - xMin) * canvas.width;
            const height = (yMax - yMin) * canvas.height;
            
            ctx.strokeStyle = "#ff3366";
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, width, height);
            
            ctx.fillStyle = "#ff3366";
            ctx.fillRect(x, y - 25, 120, 25);
            ctx.fillStyle = "white";
            ctx.font = "bold 14px Arial";
            ctx.fillText("ACCIDENT", x + 5, y - 7);
        });
    }

    // 5. Simulated AI Engine -> Real AI Backend Connection
    let aiDetectionInterval = null;
    let detectionActive = false;
    let detectionSessionId = 0;

    function triggerAIDetection() {
        if (detectionActive) return;
        
        detectionSessionId = Date.now();
        const currentSessionId = detectionSessionId;
        
        const monitorVideo = document.getElementById("monitor-video");
        const monitorImage = document.getElementById("monitor-image");
        
        const isVideoDisplay = monitorVideo && monitorVideo.style.display !== "none" && (monitorVideo.src || monitorVideo.srcObject);
        const isImageDisplay = monitorImage && monitorImage.style.display !== "none" && monitorImage.src;
        
        if (!isVideoDisplay && !isImageDisplay) {
            console.warn("No valid media feed found to analyze.");
            showToast("No active media feed. Please upload an image/video or start CCTV.", "error");
            return;
        }
        
        // Force video to play if paused, so frame detection loops don't get stuck
        if (isVideoDisplay && monitorVideo && monitorVideo.paused) {
            monitorVideo.play().catch(e => console.log("Auto-play blocked:", e));
        }
        
        detectionActive = true;
        const overlay = document.getElementById("processing-overlay");
        // No full screen loading overlay blocking UI
        if(overlay) overlay.style.display = "none";
        
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        let frameCount = 0;
        
        function detectFrame() {
            if (!detectionActive || currentSessionId !== detectionSessionId) return;
            
            if (isVideoDisplay) {
                if (monitorVideo.paused || monitorVideo.ended) {
                    if(!monitorVideo.paused) requestAnimationFrame(detectFrame);
                    else setTimeout(detectFrame, 100);
                    return;
                }
                
                frameCount++;
                if (frameCount % 3 !== 0) {
                    requestAnimationFrame(detectFrame);
                    return;
                }
            }
                
            try {
                if (isVideoDisplay) {
                    // Draw current video frame to canvas
                    if (monitorVideo.readyState >= 2) {
                        canvas.width = monitorVideo.videoWidth || 640;
                        canvas.height = monitorVideo.videoHeight || 480;
                        ctx.drawImage(monitorVideo, 0, 0, canvas.width, canvas.height);
                    }
                } else if (isImageDisplay) {
                    // Draw current image to canvas
                    canvas.width = monitorImage.naturalWidth || 640;
                    canvas.height = monitorImage.naturalHeight || 480;
                    ctx.drawImage(monitorImage, 0, 0, canvas.width, canvas.height);
                }
            } catch (drawErr) {
                console.log("DrawImage error (video loading?):", drawErr);
            }
            
            if (isDemoMode) {
                // Simulate a detection after a short delay
                setTimeout(() => {
                    const sourceName = (activeFeedSource || "").toLowerCase();
                    const isAccident = sourceName.includes("accident") || 
                                       sourceName.includes("collision") || 
                                       sourceName.includes("crash") || 
                                       sourceName.includes("damaged") ||
                                       sourceName.includes("cctv") ||
                                       sourceName.includes("highway") ||
                                       sourceName.includes("gstdrive");
                                       
                    const mockData = { detections: [] };
                    
                    if (isAccident) {
                        mockData.detections.push({
                            confidence: (90 + Math.random() * 9).toFixed(1), // 90-99%
                            severity: "High",
                            location: "Camera Feed Node",
                            bbox: [0.3, 0.2, 0.7, 0.6] // yMin, xMin, yMax, xMax
                        });
                    }
                    
                    handlePredictionResponse(mockData);
                }, 500);
                return;
            }

            try {
                canvas.toBlob((blob) => {
                    if (!blob) {
                        if (isVideoDisplay) requestAnimationFrame(detectFrame);
                        else detectionActive = false;
                        return;
                    }
                    
                    const formData = new FormData();
                    formData.append("image", blob, "frame.jpg");
                    const thresholdSlider = document.getElementById("threshold-slider");
                    if (thresholdSlider) {
                        formData.append("threshold", parseInt(thresholdSlider.value) / 100);
                    }
                    
                    const apiBase = window.location.protocol === 'file:' ? 'http://127.0.0.1:5000' : '';
                    
                    fetch(`${apiBase}/predict`, {
                    method: "POST",
                    body: formData
                })
                .then(res => {
                    if (!res.ok) throw new Error("AI model failed to load");
                    return res.json();
                })
                .then(data => {
                    if (currentSessionId !== detectionSessionId) return;
                    handlePredictionResponse(data);
                    
                    // Dynamic DOM check to avoid ghost loop overriding active streams
                    const currentVideoActive = monitorVideo && monitorVideo.style.display !== "none" && (monitorVideo.src || monitorVideo.srcObject);
                    if (!currentVideoActive) detectionActive = false;
                })
                .catch(err => {
                    if (currentSessionId !== detectionSessionId) return;
                    console.error("AI Prediction Error:", err);
                    showToast("AI model failed to load or is offline.", "error");
                    
                    // Display error on results panel
                    const text = document.getElementById("status-text");
                    const icon = document.getElementById("status-icon");
                    const block = document.getElementById("result-status-block");
                    if (block && icon && text) {
                        block.className = "result-status-block warning";
                        icon.className = "fa-solid fa-triangle-exclamation";
                        text.textContent = "AI MODEL OFFLINE";
                    }
                    
                    if (isVideoDisplay && detectionActive) setTimeout(() => requestAnimationFrame(detectFrame), 1000);
                    else detectionActive = false;
                });
            }, "image/jpeg", 0.7);
            } catch (canvasErr) {
                console.error("Canvas toBlob error (likely Tainted Canvas):", canvasErr);
                showToast("Local video access blocked. Enable Demo Mode or run via local server.", "error");
                detectionActive = false;
            }
        }
        
        function handlePredictionResponse(data) {
            if (data.detections && data.detections.length > 0) {
                // Found an accident
                const highest = data.detections.reduce((prev, curr) => (prev.confidence > curr.confidence) ? prev : curr);
                updateResultsPanel(true, highest.confidence, highest.severity || "HIGH", highest.location || "Camera Node 1");
                if (typeof drawBoundingBoxes === 'function') drawBoundingBoxes(data.detections);
                
                // Play alert sound immediately
                        const siren = document.getElementById("siren-audio");
                        if (siren) siren.play().catch(e => console.log("Siren blocked:", e));
                        
                        // Stop detection loop upon finding an accident or keep going? 
                        // Usually we keep going or pause. We will just keep drawing.
                        
                // Add to history if not added recently
                if (Date.now() - (window.lastAccidentTime || 0) > 5000) {
                    window.lastAccidentTime = Date.now();
                    if (typeof addToHistory === 'function') addToHistory(highest);
                    if (typeof activateAlertConsole === 'function') activateAlertConsole(highest.severity || "High", highest.location || "Camera Node 1", "LOG-" + Date.now());
                }
            } else {
                // clear bounding boxes if no accident
                if (typeof clearCanvas === 'function') clearCanvas();
                const safeConfidence = (Math.random() * 10).toFixed(1);
                updateResultsPanel(false, safeConfidence, "None", "--");
            }
            
            if (isVideoDisplay && detectionActive) requestAnimationFrame(detectFrame);
        }
        
        requestAnimationFrame(detectFrame);
    }

    function updateResultsPanel(detected, confidence, severity, location) {
        const panel = document.getElementById("results-panel");
        const block = document.getElementById("result-status-block");
        const icon = document.getElementById("status-icon");
        const text = document.getElementById("status-text");
        const desc = document.getElementById("status-description");
        const timeVal = document.getElementById("detection-time");

        timeVal.textContent = new Date().toLocaleTimeString();

        // Metric values
        document.getElementById("res-class").textContent = detected ? "Car Accident" : "Safe Feed";
        document.getElementById("res-confidence").textContent = detected ? `${confidence}%` : "0%";
        
        const confBar = document.getElementById("res-confidence-bar");
        confBar.style.width = detected ? `${confidence}%` : "0%";
        
        const sevVal = document.getElementById("res-severity");
        sevVal.textContent = detected ? severity.toUpperCase() : "--";
        sevVal.className = "value"; // Reset classes
        if (detected) {
            sevVal.classList.add(`severity-${severity.toLowerCase()}`);
        }

        document.getElementById("res-location").textContent = detected ? location : "--";

        if (detected) {
            block.className = "result-status-block accident";
            icon.className = "fa-solid fa-triangle-exclamation pulse-red-glow";
            text.textContent = "ACCIDENT DETECTED";
            desc.textContent = "Immediate intervention requested. Alerts initialized.";
            
            // Add pulse red glow effect
            panel.classList.add("border-danger");
        } else {
            block.className = "result-status-block safe";
            icon.className = "fa-solid fa-circle-check";
            text.textContent = "NO INCIDENT DETECTED";
            desc.textContent = "System monitoring. Ready for traffic analysis.";
            
            panel.classList.remove("border-danger");
        }
    }

    function resetResultsPanel() {
        detectionActive = false;
        updateResultsPanel(false, 0, "Low", "--");
        document.getElementById("detection-time").textContent = "No active feed";
        document.getElementById("alerts-panel").classList.add("disabled");
        
        const alertBadge = document.querySelector("#alerts-panel .badge-danger");
        alertBadge.textContent = "LOCKED - NO INCIDENT";
        alertBadge.classList.remove("pulse-red-glow");
        
        resetAgencyDispatches();
    }

    // 6. Emergency Dispatch Console
    let currentIncidentLogId = null;

    function activateAlertConsole(severity, location, logId) {
        currentIncidentLogId = logId;
        const panel = document.getElementById("alerts-panel");
        panel.classList.remove("disabled");
        
        const alertBadge = panel.querySelector(".badge-danger");
        alertBadge.textContent = `ALERT INITIATED - SEVERITY: ${severity.toUpperCase()}`;
        alertBadge.classList.add("pulse-red-glow");
        
        // Reset dispatches configuration based on severity
        resetAgencyDispatches();
        
        // Pre-configure agency parameters
        const isHigh = (severity === "High");
        
        // Ambulance params
        const ambCard = document.getElementById("dispatch-ambulance");
        ambCard.querySelector(".dispatch-status").className = "badge badge-primary dispatch-status";
        ambCard.querySelector(".dispatch-status").textContent = "Ready to Alert";
        ambCard.querySelector(".dispatch-nearest").textContent = isHigh ? "Fortis Malar ICU (1.2 km)" : "Sector 4 Depot (2.4 km)";
        ambCard.querySelector(".dispatch-eta").textContent = "3 mins";
        ambCard.querySelector(".dispatch-btn").disabled = false;

        // Police params
        const polCard = document.getElementById("dispatch-police");
        polCard.querySelector(".dispatch-status").className = "badge badge-primary dispatch-status";
        polCard.querySelector(".dispatch-status").textContent = "Ready to Alert";
        polCard.querySelector(".dispatch-nearest").textContent = `${location.split(",")[0]} Chowki`;
        polCard.querySelector(".dispatch-eta").textContent = "5 mins";
        polCard.querySelector(".dispatch-btn").disabled = false;

        // Hospital params
        const hospCard = document.getElementById("dispatch-hospital");
        hospCard.querySelector(".dispatch-status").className = "badge badge-primary dispatch-status";
        hospCard.querySelector(".dispatch-status").textContent = "Ready to Alert";
        hospCard.querySelector(".dispatch-nearest").textContent = isHigh ? "Trauma ICU Unit Room A" : "General Trauma Ward (3 Beds Open)";
        hospCard.querySelector(".dispatch-eta").textContent = "Immediate Pre-alert";
        hospCard.querySelector(".dispatch-btn").disabled = false;
        
        showToast("Emergency Alert Console unlocked. Actions required.", "warning");
        
        // Auto trigger dispatch
        setTimeout(() => dispatchAgency(ambCard), 400);
        setTimeout(() => dispatchAgency(polCard), 800);
        setTimeout(() => dispatchAgency(hospCard), 1200);
    }

    function resetAgencyDispatches() {
        const agencies = ["dispatch-ambulance", "dispatch-police", "dispatch-hospital"];
        agencies.forEach(id => {
            const card = document.getElementById(id);
            card.querySelector(".dispatch-status").className = "badge badge-secondary dispatch-status";
            card.querySelector(".dispatch-status").textContent = "Idle";
            card.querySelector(".dispatch-eta").textContent = "-- mins";
            card.style.background = "";
            card.querySelector(".dispatch-btn").disabled = true;
            card.querySelector(".dispatch-btn").innerHTML = id === "dispatch-hospital" ? 
                `<i class="fa-solid fa-bell"></i> Send Trauma Pre-Alert` : 
                `<i class="fa-solid fa-paper-plane"></i> Dispatch Unit`;
        });
    }

    function dispatchAgency(agencyCard) {
        const agencyId = agencyCard.id;
        const btn = agencyCard.querySelector(".dispatch-btn");
        const statusBadge = agencyCard.querySelector(".dispatch-status");
        
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Triggering Dispatch...`;
        
        // Simulates agency response dispatch hook (like Twilio SMS / Webhook API)
        setTimeout(() => {
            statusBadge.className = "badge badge-success dispatch-status";
            
            let agencyName = "Emergency Agency";
            if (agencyId === "dispatch-ambulance") {
                agencyName = "Ambulance Team 108";
                statusBadge.textContent = "DISPATCHED";
                btn.innerHTML = `<i class="fa-solid fa-truck-fast"></i> En Route`;
            } else if (agencyId === "dispatch-police") {
                agencyName = "Patrol Division";
                statusBadge.textContent = "RESPONDING";
                btn.innerHTML = `<i class="fa-solid fa-shield"></i> Responding`;
            } else if (agencyId === "dispatch-hospital") {
                agencyName = "Trauma Care Emergency Ward";
                statusBadge.textContent = "NOTIFIED";
                btn.innerHTML = `<i class="fa-solid fa-hospital-user"></i> Ward Pre-Alerted`;
            }
            
            agencyCard.style.background = "rgba(0, 230, 118, 0.03)";
            
            showToast(`${agencyName} successfully mobilized.`, "success");
            
            // Save state to History Database
            updateLogDispatchState(currentIncidentLogId, agencyId);
        }, 1000);
    }

    // 7. Storage and History Database
    function loadHistoryFromStorage() {
        const stored = localStorage.getItem("sure-history");
        if (stored) {
            detectionsHistory = JSON.parse(stored);
        } else {
            detectionsHistory = [];
        }
    }

    function saveLogToHistory(logItem) {
        detectionsHistory.unshift(logItem); // Insert at beginning
        localStorage.setItem("sure-history", JSON.stringify(detectionsHistory));
        renderHistoryTable();
        updateAnalyticsSummary();
    }

    function updateLogDispatchState(logId, agencyId) {
        const logIndex = detectionsHistory.findIndex(log => log.id === logId);
        if (logIndex !== -1) {
            const log = detectionsHistory[logIndex];
            
            let name = "";
            if (agencyId === "dispatch-ambulance") name = "Ambulance";
            if (agencyId === "dispatch-police") name = "Police";
            if (agencyId === "dispatch-hospital") name = "Hospital Pre-Alert";
            
            if (!log.dispatchedAgencies.includes(name)) {
                log.dispatchedAgencies.push(name);
            }
            
            log.dispatchStatus = `Notified: ${log.dispatchedAgencies.join(", ")}`;
            detectionsHistory[logIndex] = log;
            
            localStorage.setItem("sure-history", JSON.stringify(detectionsHistory));
            renderHistoryTable();
        }
    }

    function deleteLog(id) {
        detectionsHistory = detectionsHistory.filter(log => log.id !== id);
        localStorage.setItem("sure-history", JSON.stringify(detectionsHistory));
        renderHistoryTable();
        updateAnalyticsSummary();
        showToast("Log entry deleted", "info");
    }

    function clearLogs() {
        detectionsHistory = [];
        localStorage.removeItem("sure-history");
        renderHistoryTable();
        updateAnalyticsSummary();
        showToast("All system logs cleared", "info");
    }

    function renderHistoryTable(filteredLogs = null) {
        const logsToRender = filteredLogs || detectionsHistory;
        const tbody = document.getElementById("history-table-body");
        tbody.innerHTML = "";
        
        if (logsToRender.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="8">No logs found matching selection criteria.</td>
                </tr>
            `;
            return;
        }

        logsToRender.forEach(log => {
            const tr = document.createElement("tr");
            
            // Format labels
            const statusBadge = `<span class="badge ${log.detected === 'YES' ? 'badge-danger' : 'badge-secondary'}">${log.detected === 'YES' ? 'ACCIDENT' : 'SAFE'}</span>`;
            const sevBadge = `<span class="badge ${log.severity === 'High' ? 'badge-danger' : (log.severity === 'Medium' ? 'badge-warning' : 'badge-success')}">${log.severity}</span>`;
            
            let dispatchSummary = log.dispatchStatus;
            if (log.dispatchedAgencies && log.dispatchedAgencies.length > 0) {
                dispatchSummary = `<span class="badge badge-success">${log.dispatchStatus}</span>`;
            }
            
            tr.innerHTML = `
                <td>${log.timestamp}</td>
                <td><strong>${log.feed}</strong></td>
                <td>${statusBadge}</td>
                <td>${log.confidence}</td>
                <td>${sevBadge}</td>
                <td>${log.location}</td>
                <td>${dispatchSummary}</td>
                <td>
                    <button class="btn btn-secondary btn-sm btn-icon" onclick="viewLogDetails(${log.id})"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn btn-secondary btn-sm btn-icon" style="color: var(--color-danger);" onclick="deleteLogEntry(${log.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
    }

    // Expose detail buttons helper to window scope
    window.viewLogDetails = function(id) {
        const log = detectionsHistory.find(l => l.id === id);
        if (!log) return;
        
        const content = document.getElementById("modal-details-content");
        content.innerHTML = `
            <div class="metrics-grid" style="margin-bottom: 20px;">
                <div class="metric-box">
                    <span class="label">Date & Time</span>
                    <span class="value">${log.timestamp}</span>
                </div>
                <div class="metric-box">
                    <span class="label">Location Coordinate</span>
                    <span class="value">${log.location}</span>
                </div>
                <div class="metric-box">
                    <span class="label">Camera Stream node</span>
                    <span class="value">${log.feed}</span>
                </div>
                <div class="metric-box">
                    <span class="label">Detection Confidence</span>
                    <span class="value">${log.confidence}</span>
                </div>
            </div>
            
            <div class="dispatch-panel glass-panel border-danger" style="margin-bottom: 20px;">
                <h4>Dispatch Status: ${log.dispatchStatus}</h4>
                <p style="font-size: 0.8rem; margin-top: 5px; color: var(--text-secondary);">
                    Automated agency routing triggered. Confirmed responder coordinates are backed up in regional traffic centers.
                </p>
            </div>
            
            <div style="border-radius: 8px; overflow: hidden; background: #000; height: 200px; display: flex; align-items: center; justify-content: center;">
                <!-- Displays the loaded output image containing bounding boxes -->
                <img src="${SAMPLE_OUTPUT_IMAGE_URL}" alt="Detected Accident Bounding box" style="height: 100%; object-fit: contain;">
            </div>
        `;
        
        document.getElementById("history-modal").style.display = "flex";
    };

    window.deleteLogEntry = function(id) {
        deleteLog(id);
    };

    function closeModal() {
        document.getElementById("history-modal").style.display = "none";
    }

    function filterHistory() {
        const query = document.getElementById("history-search").value.toLowerCase();
        const severityFilter = document.getElementById("history-filter-severity").value;
        
        const filtered = detectionsHistory.filter(log => {
            const matchesSearch = log.location.toLowerCase().includes(query) || 
                                  log.feed.toLowerCase().includes(query);
            const matchesSeverity = (severityFilter === "ALL") || 
                                    (log.severity.toUpperCase() === severityFilter);
                                    
            return matchesSearch && matchesSeverity;
        });
        
        renderHistoryTable(filtered);
    }

    // Populate initial demo history logs
    function populateInitialHistory() {
        const initialLogs = [
            {
                id: 10001,
                timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString(), // 2 hours ago
                feed: "CCTV_KATHIPARA_FLYOVER_N",
                detected: "YES",
                confidence: "94%",
                severity: "High",
                location: "Kathipara Junction, Chennai",
                dispatchStatus: "Notified: Ambulance, Police, Hospital Pre-Alert",
                dispatchedAgencies: ["Ambulance", "Police", "Hospital Pre-Alert"]
            },
            {
                id: 10002,
                timestamp: new Date(Date.now() - 3600000 * 12).toLocaleString(), // 12 hours ago
                feed: "CCTV_KOYAMBEDU_CIRCLE_E",
                detected: "YES",
                confidence: "82%",
                severity: "Medium",
                location: "Koyambedu Roundtana, Chennai",
                dispatchStatus: "Notified: Police",
                dispatchedAgencies: ["Police"]
            },
            {
                id: 10003,
                timestamp: new Date(Date.now() - 3600000 * 24).toLocaleString(), // 24 hours ago
                feed: "CCTV_TAMBARAM_GST_S",
                detected: "YES",
                confidence: "71%",
                severity: "Low",
                location: "Tambaram G.S.T Road, Chennai",
                dispatchStatus: "Cleared - No Dispatch",
                dispatchedAgencies: []
            }
        ];
        
        detectionsHistory = initialLogs;
        localStorage.setItem("sure-history", JSON.stringify(detectionsHistory));
        renderHistoryTable();
        updateAnalyticsSummary();
    }

    // 8. Toast/Bell Alerts System
    function triggerNotificationAlert(log) {
        // Add to active notifications array
        const notif = {
            id: log.id,
            title: `INCIDENT DETECTED (${log.severity.toUpperCase()})`,
            desc: `Car accident verified at ${log.location} with ${log.confidence} confidence.`,
            time: new Date().toLocaleTimeString(),
            unread: true
        };
        
        activeNotifications.unshift(notif);
        renderNotifications();
        
        // Pulse toast notification
        showToast(`WARNING: ${notif.title} - ${log.location}`, "error");
    }

    function renderNotifications() {
        const list = document.getElementById("dropdown-notifications-list");
        const countBadge = document.getElementById("notification-count");
        
        const unreadCount = activeNotifications.filter(n => n.unread).length;
        countBadge.textContent = unreadCount;
        countBadge.style.display = unreadCount > 0 ? "flex" : "none";
        
        list.innerHTML = "";
        
        if (activeNotifications.length === 0) {
            list.innerHTML = `<div class="empty-notifications">No new emergency alerts.</div>`;
            return;
        }

        activeNotifications.forEach(n => {
            const div = document.createElement("div");
            div.className = `notification-item ${n.unread ? 'unread' : ''}`;
            
            div.innerHTML = `
                <div class="notif-icon bg-red">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div class="notif-content">
                    <h4>${n.title}</h4>
                    <p>${n.desc}</p>
                    <span class="notif-time">${n.time}</span>
                </div>
            `;
            
            // Mark read on click
            div.addEventListener("click", () => {
                n.unread = false;
                renderNotifications();
            });
            
            list.appendChild(div);
        });
    }

    // 9. Interactive GIS Mapping (Leaflet.js)
    function initMap() {
        const mapContainer = document.getElementById("hotspot-map");
        if (!mapContainer) return;
        
        // Safe check for Leaflet library
        if (typeof L === 'undefined') {
            console.warn("Leaflet library not loaded. Map placeholder active.");
            mapContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 30px; background: rgba(0,0,0,0.15); border-radius: 8px;">
                    <i class="fa-solid fa-map-location-dot" style="font-size: 3rem; color: var(--color-danger); margin-bottom: 15px;"></i>
                    <h4>GIS Mapping Service Offline</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 320px; margin-top: 5px;">
                        Could not load Leaflet CDN. Please check your internet connection to enable active GIS layers.
                    </p>
                </div>
            `;
            return;
        }

        // Initial point: Central Chennai (Kathipara Flyover zone)
        const chennaiCoords = [13.0113, 80.2037];
        
        // Initialize Map
        mapInstance = L.map('hotspot-map').setView(chennaiCoords, 12);
        
        // OpenStreetMap Dark Theme Tiles (uses css inversion trick defined in style.css for dark mode compatibility)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);

        // Chennai Hotspots Pins
        const hotspots = [
            {
                coords: [13.0113, 80.2037],
                name: "Kathipara Junction",
                severity: "HIGH",
                incidents: 47,
                eta: "4 mins"
            },
            {
                coords: [13.0732, 80.2098],
                name: "Koyambedu Roundtana",
                severity: "HIGH",
                incidents: 38,
                eta: "5 mins"
            },
            {
                coords: [13.0076, 80.2215],
                name: "Guindy Flyover Intersection",
                severity: "MEDIUM",
                incidents: 22,
                eta: "6 mins"
            },
            {
                coords: [12.9229, 80.2304],
                name: "Sholinganallur Junction (OMR)",
                severity: "HIGH",
                incidents: 31,
                eta: "7 mins"
            },
            {
                coords: [12.9248, 80.1472],
                name: "Tambaram Railway Station GST Road",
                severity: "MEDIUM",
                incidents: 19,
                eta: "8 mins"
            }
        ];

        hotspots.forEach(spot => {
            // Draw custom red glowing circle pins for hotspots
            const circleColor = spot.severity === "HIGH" ? "#ff3366" : "#ffb300";
            
            const marker = L.circleMarker(spot.coords, {
                radius: 10,
                fillColor: circleColor,
                color: "#fff",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(mapInstance);

            const popupContent = `
                <div style="font-family: 'Outfit', sans-serif; padding: 5px;">
                    <h4 style="margin: 0 0 5px; color: ${circleColor}; font-weight:700;">${spot.name}</h4>
                    <hr style="border: none; border-top:1px solid rgba(255,255,255,0.1); margin: 5px 0;">
                    <div style="font-size:0.75rem; line-height: 1.4;">
                        <strong>Historical incidents:</strong> ${spot.incidents} flagged<br>
                        <strong>Risk Profile:</strong> <span style="color:${circleColor}; font-weight:700;">${spot.severity} RISK</span><br>
                        <strong>Avg Dispatch ETA:</strong> ${spot.eta}
                    </div>
                </div>
            `;
            marker.bindPopup(popupContent);
        });
    }

    // 10. Analytics Dashboard (Chart.js)
    function initCharts() {
        const trendCtx = document.getElementById("trend-chart");
        const severityCtx = document.getElementById("severity-chart");
        
        if (!trendCtx || !severityCtx) return;

        // Safe check for Chart.js
        if (typeof Chart === 'undefined') {
            console.warn("Chart.js not loaded. Chart placeholders active.");
            [trendCtx, severityCtx].forEach(ctx => {
                const parent = ctx.parentNode;
                parent.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 0.8rem; color: var(--text-muted); min-height: 150px;">
                        Chart analytics offline (Chart.js not loaded)
                    </div>
                `;
            });
            return;
        }

        // Custom Font setup for Chart.js
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = theme === 'dark' ? '#94a3b8' : '#475569';

        // 1. Monthly Trend Bar Chart
        trendChart = new Chart(trendCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Accidents Logged',
                    data: [42, 38, 59, 45, 68, 52],
                    backgroundColor: 'rgba(0, 242, 254, 0.45)',
                    borderColor: '#00f2fe',
                    borderWidth: 2,
                    borderRadius: 4
                }, {
                    label: 'Emergency Dispatches',
                    data: [38, 35, 55, 41, 64, 49],
                    backgroundColor: 'rgba(127, 0, 255, 0.45)',
                    borderColor: '#7f00ff',
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { boxWidth: 12 }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { 
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        border: { dash: [4, 4] }
                    }
                }
            }
        });

        // 2. Severity Doughnut Chart
        severityChart = new Chart(severityCtx, {
            type: 'doughnut',
            data: {
                labels: ['High Severity', 'Medium Severity', 'Low Severity'],
                datasets: [{
                    data: [48, 32, 20],
                    backgroundColor: [
                        'rgba(255, 51, 102, 0.7)',
                        'rgba(255, 179, 0, 0.7)',
                        'rgba(0, 230, 118, 0.7)'
                    ],
                    borderColor: theme === 'dark' ? '#0f1016' : '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { boxWidth: 12 }
                    }
                },
                cutout: '65%'
            }
        });
    }

    function updateAnalyticsSummary() {
        const totalIncidents = detectionsHistory.length;
        const totalSaved = detectionsHistory.filter(l => l.detected === 'YES' && l.severity !== 'Low').length * 2 + 120; // Simulated factor
        
        // Update stats widgets on Analytics view
        const incidentsCount = document.getElementById("counter-incidents");
        const livesCount = document.getElementById("counter-lives");
        
        if (incidentsCount) incidentsCount.textContent = totalIncidents + 349; // Offset for historical benchmark
        if (livesCount) livesCount.textContent = totalSaved + 224;
    }

    // Dynamic file fetch with fallbacks
    function fetchProjectFiles() {
        const paths = {
            license: [
                '/Accident-Detection-on-Indian-Roads-master/LICENSE',
                '/LICENSE',
                'LICENSE'
            ],
            runLog: [
                '/Accident-Detection-on-Indian-Roads-master/Python Demo/run.log',
                '/Python Demo/run.log',
                'Python Demo/run.log'
            ],
            classifier: [
                '/Accident-Detection-on-Indian-Roads-master/Python Demo/classifier.py',
                '/Python Demo/classifier.py',
                'Python Demo/classifier.py'
            ]
        };

        async function fetchWithFallback(urlArray) {
            for (let url of urlArray) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        return await response.text();
                    }
                } catch (e) {
                    // Fail silently, try next fallback URL
                }
            }
            throw new Error("All fallbacks failed");
        }

        // Fetch GPL License
        fetchWithFallback(paths.license)
            .then(text => {
                const viewer = document.getElementById("license-viewer-content");
                if (viewer) viewer.textContent = text;
            })
            .catch(() => {
                const viewer = document.getElementById("license-viewer-content");
                if (viewer) viewer.textContent = "GNU Affero General Public License v3.0\n\n[Failed to fetch actual LICENSE file dynamically. Make sure the local web server is running in the workspace directory.]";
            });

        // Fetch original execution logs
        fetchWithFallback(paths.runLog)
            .then(text => {
                const viewer = document.getElementById("logs-viewer-content");
                if (viewer) viewer.textContent = text;
            })
            .catch(() => {
                const viewer = document.getElementById("logs-viewer-content");
                if (viewer) viewer.textContent = "WARNING: All log messages before absl::InitializeLog() is called are written to STDERR...\n\ndone. Detections found: 1\nAccident score: 99.99%\n\n[Failed to fetch actual run.log file dynamically. Make sure the local web server is running in the workspace directory.]";
            });

        // Fetch Python Classifier source code
        fetchWithFallback(paths.classifier)
            .then(text => {
                const viewer = document.getElementById("code-viewer-content");
                if (viewer) viewer.textContent = text;
            })
            .catch(() => {
                const viewer = document.getElementById("code-viewer-content");
                if (viewer) viewer.textContent = "import tensorflow as tf\nimport numpy as np\n...\n\n[Failed to fetch actual classifier.py file dynamically. Make sure the local web server is running in the workspace directory.]";
            });
    }

    // 6. Server Connection Status Watchdog & WebSockets
    let isConnected = false;
    function initServerConnection() {
        function enableFallbackDemoMode() {
            if (!isDemoMode) {
                isDemoMode = true;
                const toggle = document.getElementById("demo-mode-toggle");
                if (toggle) toggle.checked = true;
                showToast("Server offline. Switched to Stable Demo Mode.", "warning");
            }
        }

        function checkServerConnection() {
            fetch('/status')
                .then(res => res.json())
                .then(data => {
                    if (data.status === "online") {
                        updateConnectionStatus(true);
                    } else {
                        updateConnectionStatus(false);
                        enableFallbackDemoMode();
                    }
                })
                .catch(() => {
                    updateConnectionStatus(false);
                    enableFallbackDemoMode();
                });
        }

        // Run status checks every 5 seconds (Auto-retry logic)
        setInterval(checkServerConnection, 5000);
        checkServerConnection();

        // Connect WebSocket client
        if (typeof io !== 'undefined') {
            try {
                socket = io(window.location.origin);
                
                socket.on("connect", () => {
                    console.log("[SOCKETCONNECTED]");
                    updateConnectionStatus(true);
                });
                
                socket.on("disconnect", () => {
                    updateConnectionStatus(false);
                });
                
                socket.on("connect_error", () => {
                    updateConnectionStatus(false);
                });
                
                socket.on("accident_alert", (data) => {
                    console.log("Real-time WebSocket accident alert received:", data);
                    const logId = Date.now();
                    
                    const newLog = {
                        id: logId,
                        timestamp: data.timestamp,
                        feed: "REMOTE AI ALERT",
                        detected: "YES",
                        confidence: `${data.confidence}%`,
                        severity: data.severity,
                        location: data.location,
                        dispatchStatus: "Pending Dispatch",
                        dispatchedAgencies: []
                    };
                    
                    saveLogToHistory(newLog);
                    activateAlertConsole(data.severity, data.location, logId);
                    triggerNotificationAlert(newLog);
                    showToast(`REMOTE AI DETECTED ACCIDENT: ${data.location}`, "error");
                    
                    // Update Map Marker
                    if (mapInstance && data.latitude && data.longitude) {
                        const markerColor = data.severity === 'High' ? '#ff3366' : data.severity === 'Medium' ? '#ffb300' : '#00e676';
                        const customIcon = L.divIcon({
                            className: 'custom-div-icon',
                            html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${markerColor};"></div>`,
                            iconSize: [12, 12]
                        });
                        const marker = L.marker([data.latitude, data.longitude], { icon: customIcon }).addTo(mapInstance);
                        marker.bindPopup(`
                            <div style="color: #000; font-family: sans-serif; font-size: 0.8rem;">
                                <strong>Accident Detected!</strong><br>
                                <span>Location: ${data.location}</span><br>
                                <span>Time: ${data.timestamp}</span><br>
                                <span>Confidence: ${data.confidence}%</span>
                            </div>
                        `).openPopup();
                        mapInstance.setView([data.latitude, data.longitude], 13);
                    }
                });
            } catch (err) {
                console.error("SocketIO connection failed: ", err);
            }
        }
    }

    function updateConnectionStatus(online) {
        const dot = document.querySelector(".status-dot");
        const txt = document.querySelector(".status-text");
        if (online) {
            if (!isConnected) {
                isConnected = true;
                if (dot) {
                    dot.className = "status-dot online";
                }
                if (txt) {
                    txt.textContent = "AI Core: Online";
                }
                showToast("Connected to accident detection server.", "success");
            }
        } else {
            if (isConnected || isConnected === false) {
                isConnected = false;
                if (dot) {
                    dot.className = "status-dot offline";
                }
                if (txt) {
                    txt.textContent = "AI Core: Offline (Retrying...)";
                }
            }
        }
    }

    // 7. Developer Consoles and Smartphone Emulator
    function initDevConsoleAndEmulator() {
        const modeCctvBtn = document.getElementById("mode-cctv-btn");
        const modeAndroidBtn = document.getElementById("mode-android-btn");
        const modePythonBtn = document.getElementById("mode-python-btn");
        
        const consoleCctv = document.getElementById("console-cctv-container");
        const consoleAndroid = document.getElementById("console-android-container");
        const consolePython = document.getElementById("console-python-container");
        
        function switchConsoleMode(mode) {
            [modeCctvBtn, modeAndroidBtn, modePythonBtn].forEach(btn => {
                if (btn) btn.classList.remove("active");
            });
            [consoleCctv, consoleAndroid, consolePython].forEach(con => {
                if (con) con.style.display = "none";
            });
            
            if (mode === "cctv") {
                if (modeCctvBtn) modeCctvBtn.classList.add("active");
                if (consoleCctv) consoleCctv.style.display = "block";
            } else if (mode === "android") {
                if (modeAndroidBtn) modeAndroidBtn.classList.add("active");
                if (consoleAndroid) consoleAndroid.style.display = "block";
            } else if (mode === "python") {
                if (modePythonBtn) modePythonBtn.classList.add("active");
                if (consolePython) consolePython.style.display = "block";
            }
        }
        
        if (modeCctvBtn) modeCctvBtn.addEventListener("click", () => switchConsoleMode("cctv"));
        if (modeAndroidBtn) modeAndroidBtn.addEventListener("click", () => switchConsoleMode("android"));
        if (modePythonBtn) modePythonBtn.addEventListener("click", () => {
            switchConsoleMode("python");
            runPythonTerminalDemo();
        });

        // Typing animation for Python terminal
        const terminalCmdDisplay = document.getElementById("terminal-cmd-display");
        const terminalExecutionLog = document.getElementById("terminal-execution-log");
        let typed = false;
        
        function runPythonTerminalDemo() {
            if (typed) return;
            typed = true;
            const command = "python classifier.py input.jpg test_output.jpg";
            let idx = 0;
            if (terminalCmdDisplay) terminalCmdDisplay.textContent = "";
            if (terminalExecutionLog) terminalExecutionLog.style.display = "none";
            
            const typingInterval = setInterval(() => {
                if (idx < command.length) {
                    if (terminalCmdDisplay) terminalCmdDisplay.textContent += command.charAt(idx);
                    idx++;
                } else {
                    clearInterval(typingInterval);
                    setTimeout(() => {
                        if (terminalExecutionLog) terminalExecutionLog.style.display = "block";
                    }, 500);
                }
            }, 50);
        }

        // Android Emulator Layout Elements
        const phoneLoadSampleBtn = document.getElementById("phone-load-sample-btn");
        const phoneAccessCamBtn = document.getElementById("phone-access-cam-btn");
        const phoneDetectBtn = document.getElementById("phone-detect-btn");
        const phoneThresholdSlider = document.getElementById("phone-threshold-slider");
        const phoneThresholdVal = document.getElementById("phone-threshold-val");
        const phoneStreamVideo = document.getElementById("phone-stream-video");
        const phoneStreamImage = document.getElementById("phone-stream-image");
        const phoneCameraEmpty = document.getElementById("phone-camera-empty");
        const phoneThumbnail = document.getElementById("phone-thumbnail");
        const phoneThumbnailEmpty = document.getElementById("phone-thumbnail-empty");
        const phoneTextResults = document.getElementById("phone-text-results");
        
        let phoneActiveFeed = null;
        let phoneWebcamStream = null;
        let phoneThreshold = 60;
        
        if (phoneThresholdSlider) {
            phoneThresholdSlider.addEventListener("input", (e) => {
                phoneThreshold = e.target.value;
                if (phoneThresholdVal) phoneThresholdVal.textContent = `${phoneThreshold}%`;
            });
        }
        
        if (phoneLoadSampleBtn) {
            phoneLoadSampleBtn.addEventListener("click", () => {
                stopPhoneWebcam();
                phoneActiveFeed = "sample";
                
                if (phoneCameraEmpty) phoneCameraEmpty.style.display = "none";
                if (phoneStreamVideo) phoneStreamVideo.style.display = "none";
                if (phoneStreamImage) phoneStreamImage.style.display = "block";
                
                if (phoneStreamImage) phoneStreamImage.src = SAMPLE_IMAGE_URL;
                if (phoneDetectBtn) phoneDetectBtn.removeAttribute("disabled");
                
                if (phoneThumbnail) {
                    phoneThumbnail.src = SAMPLE_IMAGE_URL;
                    phoneThumbnail.style.display = "block";
                }
                if (phoneThumbnailEmpty) phoneThumbnailEmpty.style.display = "none";
                
                showToast("Android Emulator: Loaded sample image", "info");
            });
        }
        
        if (phoneAccessCamBtn) {
            phoneAccessCamBtn.addEventListener("click", () => {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    navigator.mediaDevices.getUserMedia({ video: true })
                        .then(stream => {
                            phoneWebcamStream = stream;
                            phoneActiveFeed = "webcam";
                            
                            if (phoneCameraEmpty) phoneCameraEmpty.style.display = "none";
                            if (phoneStreamImage) phoneStreamImage.style.display = "none";
                            if (phoneStreamVideo) phoneStreamVideo.style.display = "block";
                            
                            if (phoneStreamVideo) {
                                phoneStreamVideo.srcObject = stream;
                                phoneStreamVideo.play();
                            }
                            if (phoneDetectBtn) phoneDetectBtn.removeAttribute("disabled");
                            
                            showToast("Android Emulator: Camera active", "info");
                        })
                        .catch(err => {
                            console.error(err);
                            showToast("Android Emulator: Device camera access failed", "error");
                        });
                } else {
                    showToast("Webcam getUserMedia API not supported", "error");
                }
            });
        }
        
        function stopPhoneWebcam() {
            if (phoneWebcamStream) {
                phoneWebcamStream.getTracks().forEach(track => track.stop());
                phoneWebcamStream = null;
            }
            if (phoneStreamVideo) {
                phoneStreamVideo.srcObject = null;
            }
        }
        
        if (phoneDetectBtn) {
            phoneDetectBtn.addEventListener("click", () => {
                if (phoneActiveFeed === "sample") {
                    fetch(SAMPLE_IMAGE_URL)
                        .then(res => res.blob())
                        .then(blob => {
                            const file = new File([blob], "phone_sample.jpg", { type: "image/jpeg" });
                            uploadPhonePredict(file);
                        });
                } else if (phoneActiveFeed === "webcam") {
                    const canvas = document.createElement("canvas");
                    canvas.width = phoneStreamVideo.videoWidth || 320;
                    canvas.height = phoneStreamVideo.videoHeight || 240;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(phoneStreamVideo, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob(blob => {
                        if (blob) {
                            const file = new File([blob], "phone_frame.jpg", { type: "image/jpeg" });
                            uploadPhonePredict(file);
                        }
                    }, "image/jpeg");
                }
            });
        }
        
        function uploadPhonePredict(file) {
            if (phoneTextResults) phoneTextResults.textContent = "Analyzing emulator frame...";
            const formData = new FormData();
            formData.append("image", file);
            formData.append("threshold", phoneThreshold / 100);
            
            // Generate coordinates around Chennai area
            const lat = 13.0827 + (Math.random() - 0.5) * 0.05;
            const lon = 80.2707 + (Math.random() - 0.5) * 0.05;
            formData.append("latitude", lat);
            formData.append("longitude", lon);
            
            const apiBase = window.location.protocol === 'file:' ? 'http://127.0.0.1:5000' : '';
            fetch(`${apiBase}/predict`, {
                method: "POST",
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    if (phoneThumbnail) {
                        phoneThumbnail.src = data.output_image_url;
                        phoneThumbnail.style.display = "block";
                    }
                    if (phoneThumbnailEmpty) phoneThumbnailEmpty.style.display = "none";
                    
                    let resultStr = `[Detections Count: ${data.bounding_boxes.length}]\n`;
                    if (data.incident_detected) {
                        resultStr += `STATUS: ACCIDENT DETECTED\n`;
                        resultStr += `Accident Class: ${data.accident_class}\n`;
                        resultStr += `Confidence: ${data.confidence}%\n`;
                        resultStr += `Severity: ${data.severity}\n`;
                        resultStr += `IST Timestamp: ${data.timestamp}\n`;
                        resultStr += `Geocoded Address:\n${data.location}\n`;
                    } else {
                        resultStr += `STATUS: CLEAR (No accidents above threshold)`;
                    }
                    if (phoneTextResults) phoneTextResults.textContent = resultStr;
                } else {
                    if (phoneTextResults) phoneTextResults.textContent = "Analysis failed: " + data.error;
                }
            })
            .catch(err => {
                console.error(err);
                if (phoneTextResults) phoneTextResults.textContent = "Error connecting to backend server.";
            });
        }
    }

    // 15. Simulation Engine Orchestrator
    function initSimulationEngine() {
        const enterSimBtn = document.getElementById("enter-sim-mode-btn");
        const simPanel = document.getElementById("simulation-control-panel");
        const monitorContainer = document.getElementById("monitor-container");
        const monitorVideo = document.getElementById("monitor-video");
        const sirenAudio = document.getElementById("siren-audio");
        
        const btnStart = document.getElementById("sim-start-feed-btn");
        const btnTrigger = document.getElementById("sim-trigger-accident-btn");
        const btnReset = document.getElementById("sim-reset-feed-btn");
        const btnNew = document.getElementById("sim-generate-new-btn");
        const scenarioSelect = document.getElementById("simulation-scenario-select");
        
        // Ensure enterSimBtn exists
        if(enterSimBtn) {
            enterSimBtn.addEventListener("click", () => {
                // Hide camera activation
                document.querySelector(".camera-activation-panel").style.display = "none";
                monitorContainer.style.display = "flex";
                simPanel.style.display = "block";
                document.getElementById("feed-source-name").textContent = "SIMULATION ENGINE ACTIVE";
            });
        }

        if(btnStart) {
            btnStart.addEventListener("click", () => {
                // Stage 1: Monitoring
                monitorVideo.style.display = "block";
                document.getElementById("monitor-image").style.display = "none";
                monitorVideo.src = SAMPLE_VIDEO_URL;
                monitorVideo.play().catch(e => console.log(e));
                
                const block = document.getElementById("result-status-block");
                const icon = document.getElementById("status-icon");
                const text = document.getElementById("status-text");
                const desc = document.getElementById("status-description");
                
                block.className = "result-status-block safe";
                icon.className = "fa-solid fa-circle-check";
                text.textContent = "NO INCIDENT DETECTED";
                desc.textContent = "Simulation Feed Started. Monitoring for anomalies...";
                
                document.getElementById("res-confidence").textContent = "--";
                document.getElementById("res-class").textContent = "Safe Feed";
                
                btnStart.disabled = true;
                btnTrigger.disabled = false;
                
                showToast("Simulation Feed Started. Monitoring for anomalies...", "info");
            });
        }
        
        if(btnTrigger) {
            btnTrigger.addEventListener("click", () => {
                // Stage 2: Trigger Accident
                monitorVideo.pause();
                monitorContainer.classList.add("emergency-flash-border");
                
                if(sirenAudio) {
                    sirenAudio.volume = 0.5;
                    sirenAudio.play().catch(e => console.log("Audio play blocked by browser."));
                }
                
                const scenario = scenarioSelect.value;
                let severity = "HIGH";
                let conf = 96;
                let loc = "NH48 Highway, Chennai";
                
                if(scenario === "minor") { severity = "LOW"; conf = 65; loc = "OMR Road, Chennai"; }
                if(scenario === "truck") { severity = "HIGH"; conf = 99; loc = "Chennai Port Trust Gate"; }
                if(scenario === "multi") { severity = "HIGH"; conf = 98; loc = "GST Road Intersection"; }
                
                updateResultsPanel(true, conf, severity, loc);
                
                showToast("CRITICAL: Collision detected in feed!", "error");
                
                // Stage 3: Unlock Alert Console
                setTimeout(() => {
                    const alertCard = document.querySelector(".emergency-alert-card");
                    if(alertCard) {
                        alertCard.classList.add("flash-alert");
                        setTimeout(() => alertCard.classList.remove("flash-alert"), 2000);
                    }
                    
                    const logId = "SIM-" + Math.floor(Math.random() * 10000);
                    activateAlertConsole(severity, loc, logId);
                    
                    // Automatically dispatch
                    setTimeout(() => dispatchAgency(document.getElementById("dispatch-ambulance")), 500);
                    setTimeout(() => dispatchAgency(document.getElementById("dispatch-police")), 1000);
                    setTimeout(() => dispatchAgency(document.getElementById("dispatch-hospital")), 1500);
                    
                    // Stage 4: History Log
                    const logEntry = {
                        id: logId,
                        timestamp: new Date().toLocaleTimeString(),
                        severity: severity,
                        location: loc,
                        confidence: conf + "%",
                        detected: "YES"
                    };
                    detectionsHistory.unshift(logEntry);
                    renderHistoryTable();
                    
                    // Stage 5: Analytics
                    updateAnalyticsSummary();
                    
                    btnTrigger.disabled = true;
                }, 1000);
            });
        }
        
        if(btnReset) {
            btnReset.addEventListener("click", () => {
                monitorContainer.classList.remove("emergency-flash-border");
                if(sirenAudio) {
                    sirenAudio.pause();
                    sirenAudio.currentTime = 0;
                }
                btnStart.disabled = false;
                btnTrigger.disabled = true;
                
                resetResultsPanel();
                
                monitorVideo.pause();
                monitorVideo.src = "";
                
                showToast("Simulation reset to standby.", "info");
            });
        }
        
        if(btnNew) {
            btnNew.addEventListener("click", () => {
                btnReset.click();
                const opts = ["minor", "major", "truck", "multi"];
                const curr = scenarioSelect.value;
                let next = opts[Math.floor(Math.random() * opts.length)];
                while(next === curr) {
                    next = opts[Math.floor(Math.random() * opts.length)];
                }
                scenarioSelect.value = next;
                
                // Shuffle video
                SAMPLE_VIDEO_URL = CCTV_VIDEOS[Math.floor(Math.random() * CCTV_VIDEOS.length)];
                showToast("New scenario generated and video feed randomized.", "success");
            });
        }
    }

    // AI Voice architecture explanation
    const explainArchitectureBtn = document.getElementById("explain-architecture-btn");
    if (explainArchitectureBtn) {
        explainArchitectureBtn.addEventListener("click", () => {
            explainArchitectureVoice();
        });
    }

    function explainArchitectureVoice() {
        if (!('speechSynthesis' in window)) {
            showToast("Speech Synthesis is not supported in this browser.", "error");
            return;
        }

        const btn = document.getElementById("explain-architecture-btn");
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> AI Voice Explanation';
            btn.classList.remove("pulse-red-glow");
            return;
        }

        const textToSpeak = "The SURE system architecture utilizes a Single Shot Multibox Detector, known as SSD, combined with a MobileNet V1 feature extractor. This design choice minimizes inference latency, making it highly efficient for on-device processing. The neural network's input is a fixed 300 by 300 pixel frame, either from a CCTV feed or camera. This frame is processed by the MobileNet V1 feature extractor using depthwise separable convolutions. The extracted features are then passed through SSD Convolutional Predictors, which operate across 6 different scale anchor map layers. A Non-Maximum Suppression step filters out overlapping bounding boxes, enforcing an intersection-over-union cutoff of 0.60. Finally, the model outputs the precise accident bounding box alongside its classification confidence score. This entire pipeline operates in real-time, completing in roughly 85 milliseconds per frame.";
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // Try to find a good English voice, preferably female and professional
        const setVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            let selectedVoice = voices.find(voice => voice.name.includes("Google UK English Female") || voice.name.includes("Google US English") || voice.name.includes("Microsoft Zira"));
            if (!selectedVoice) {
                selectedVoice = voices.find(voice => voice.lang.startsWith("en"));
            }
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            window.speechSynthesis.speak(utterance);
        };

        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            btn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Voice';
            btn.classList.add("pulse-red-glow");
            showToast("Playing AI Architecture Explanation...", "info");
        };

        utterance.onend = () => {
            btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> AI Voice Explanation';
            btn.classList.remove("pulse-red-glow");
        };
        
        utterance.onerror = () => {
            btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> AI Voice Explanation';
            btn.classList.remove("pulse-red-glow");
            showToast("Audio playback interrupted.", "warning");
        };

    // Voices sometimes need to be loaded asynchronously in Chrome
        if (speechSynthesis.getVoices().length === 0) {
            speechSynthesis.addEventListener("voiceschanged", setVoice, { once: true });
        } else {
            setVoice();
        }
    }

    // AI Voice for Project Overview (English and Tamil)
    const voiceOverviewEnBtn = document.getElementById("voice-overview-en-btn");
    const voiceOverviewTaBtn = document.getElementById("voice-overview-ta-btn");
    
    if (voiceOverviewEnBtn) {
        voiceOverviewEnBtn.addEventListener("click", () => {
            explainOverviewVoice("en");
        });
    }
    
    if (voiceOverviewTaBtn) {
        voiceOverviewTaBtn.addEventListener("click", () => {
            explainOverviewVoice("ta");
        });
    }
    
    function explainOverviewVoice(lang) {
        if (!('speechSynthesis' in window)) {
            showToast("Speech Synthesis is not supported in this browser.", "error");
            return;
        }

        const btnEn = document.getElementById("voice-overview-en-btn");
        const btnTa = document.getElementById("voice-overview-ta-btn");
        const isCurrentlySpeaking = window.speechSynthesis.speaking;
        const btn = lang === "en" ? btnEn : btnTa;
        const otherBtn = lang === "en" ? btnTa : btnEn;

        // Reset both buttons
        btnEn.innerHTML = '<i class="fa-solid fa-volume-high"></i> AI Voice (English)';
        btnEn.classList.remove("pulse-red-glow");
        btnTa.innerHTML = '<i class="fa-solid fa-language"></i> AI Voice (Tamil)';
        btnTa.classList.remove("pulse-red-glow");

        if (isCurrentlySpeaking) {
            window.speechSynthesis.cancel();
            // If they clicked the same button that was speaking, just stop
            if (btn.dataset.speaking === "true") {
                btn.dataset.speaking = "false";
                return;
            }
        }
        
        btnEn.dataset.speaking = "false";
        btnTa.dataset.speaking = "false";
        btn.dataset.speaking = "true";

        let textToSpeak = "";
        if (lang === "en") {
            textToSpeak = "According to research issued by the Transport Research Wing, road accidents claim over 150,000 lives annually in India. Over 31% of these fatalities are attributed to delays in medical intervention. The SURE framework attempts to tackle this problem by automating the detection process and connecting CCTV camera grids directly to dispatch agencies, skipping manual calling queues.";
        } else {
            textToSpeak = "போக்குவரத்து ஆராய்ச்சி பிரிவு வெளியிட்ட ஆய்வின்படி, இந்தியாவில் ஒவ்வொரு ஆண்டும் 1 லட்சத்து 50 ஆயிரத்திற்கும் மேற்பட்ட உயிரிழப்புகள் சாலை விபத்துகளால் ஏற்படுகின்றன. இந்த உயிரிழப்புகளில் 31% க்கும் மேற்பட்டவை மருத்துவ உதவி தாமதமாவதால் ஏற்படுகின்றன. SURE கட்டமைப்பு, கண்காணிப்பு கேமராக்களை அவசரகால வாகனங்களுடன் நேரடியாக இணைப்பதன் மூலம் இந்த சிக்கலை தீர்க்க முயற்சிக்கிறது.";
        }
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        const setVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            let selectedVoice;
            if (lang === "ta") {
                selectedVoice = voices.find(voice => voice.lang.startsWith("ta"));
                // Fallback to hi-IN if Tamil is not available (though it might sound weird, better than nothing or English accent on Tamil text)
                if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang.startsWith("hi"));
            } else {
                selectedVoice = voices.find(voice => voice.name.includes("Google UK English Female") || voice.name.includes("Google US English") || voice.name.includes("Microsoft Zira"));
                if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang.startsWith("en"));
            }
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            window.speechSynthesis.speak(utterance);
        };

        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        if (lang === "ta") utterance.lang = "ta-IN";
        else utterance.lang = "en-US";

        utterance.onstart = () => {
            btn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Voice';
            btn.classList.add("pulse-red-glow");
            showToast(`Playing AI Overview Explanation (${lang === 'en' ? 'English' : 'Tamil'})...`, "info");
        };

        utterance.onend = () => {
            btn.innerHTML = lang === "en" ? '<i class="fa-solid fa-volume-high"></i> AI Voice (English)' : '<i class="fa-solid fa-language"></i> AI Voice (Tamil)';
            btn.classList.remove("pulse-red-glow");
            btn.dataset.speaking = "false";
        };
        
        utterance.onerror = () => {
            btn.innerHTML = lang === "en" ? '<i class="fa-solid fa-volume-high"></i> AI Voice (English)' : '<i class="fa-solid fa-language"></i> AI Voice (Tamil)';
            btn.classList.remove("pulse-red-glow");
            btn.dataset.speaking = "false";
            if (event.error !== "canceled") {
                showToast("Audio playback interrupted.", "warning");
            }
        };

        if (speechSynthesis.getVoices().length === 0) {
            speechSynthesis.addEventListener("voiceschanged", setVoice, { once: true });
        } else {
            setVoice();
        }
    }
    
    // AI Voice for Dataset Hub (English and Tamil)
    const voiceDatasetEnBtn = document.getElementById("voice-dataset-en-btn");
    const voiceDatasetTaBtn = document.getElementById("voice-dataset-ta-btn");
    
    if (voiceDatasetEnBtn) {
        voiceDatasetEnBtn.addEventListener("click", () => {
            explainDatasetVoice("en");
        });
    }
    
    if (voiceDatasetTaBtn) {
        voiceDatasetTaBtn.addEventListener("click", () => {
            explainDatasetVoice("ta");
        });
    }
    
    function explainDatasetVoice(lang) {
        if (!('speechSynthesis' in window)) {
            showToast("Speech Synthesis is not supported in this browser.", "error");
            return;
        }

        const btnEn = document.getElementById("voice-dataset-en-btn");
        const btnTa = document.getElementById("voice-dataset-ta-btn");
        const isCurrentlySpeaking = window.speechSynthesis.speaking;
        const btn = lang === "en" ? btnEn : btnTa;

        // Reset both buttons
        btnEn.innerHTML = '<i class="fa-solid fa-volume-high"></i> AI Voice (English)';
        btnEn.classList.remove("pulse-red-glow");
        btnTa.innerHTML = '<i class="fa-solid fa-language"></i> AI Voice (Tamil)';
        btnTa.classList.remove("pulse-red-glow");

        if (isCurrentlySpeaking) {
            window.speechSynthesis.cancel();
            // If they clicked the same button that was speaking, just stop
            if (btn.dataset.speaking === "true") {
                btn.dataset.speaking = "false";
                return;
            }
        }
        
        btnEn.dataset.speaking = "false";
        btnTa.dataset.speaking = "false";
        btn.dataset.speaking = "true";

        let textToSpeak = "";
        if (lang === "en") {
            textToSpeak = "The dataset was specifically annotated to capture vehicle collisions under chaotic traffic and infrastructural conditions common in Indian metropolitan zones. The bounding boxes are defined according to the Pascal V O C structure.";
        } else {
            textToSpeak = "இந்திய பெருநகரப் பகுதிகளில் பொதுவாகக் காணப்படும் நெரிசலான போக்குவரத்து மற்றும் கட்டமைப்பு சூழ்நிலைகளில் வாகன மோதல்களைக் கண்டறிய இந்தத் தரவுத் தொகுப்பு சிறப்பாக வடிவமைக்கப்பட்டுள்ளது. பவுண்டிங் பாக்ஸ்கள் பாஸ்கல் வி ஓ சி கட்டமைப்பின்படி வரையறுக்கப்பட்டுள்ளன.";
        }
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        const setVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            let selectedVoice;
            if (lang === "ta") {
                selectedVoice = voices.find(voice => voice.lang.startsWith("ta"));
                if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang.startsWith("hi"));
            } else {
                selectedVoice = voices.find(voice => voice.name.includes("Google UK English Female") || voice.name.includes("Google US English") || voice.name.includes("Microsoft Zira"));
                if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang.startsWith("en"));
            }
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            window.speechSynthesis.speak(utterance);
        };

        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        if (lang === "ta") utterance.lang = "ta-IN";
        else utterance.lang = "en-US";

        utterance.onstart = () => {
            btn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Voice';
            btn.classList.add("pulse-red-glow");
            showToast(`Playing AI Dataset Explanation (${lang === 'en' ? 'English' : 'Tamil'})...`, "info");
        };

        utterance.onend = () => {
            btn.innerHTML = lang === "en" ? '<i class="fa-solid fa-volume-high"></i> AI Voice (English)' : '<i class="fa-solid fa-language"></i> AI Voice (Tamil)';
            btn.classList.remove("pulse-red-glow");
            btn.dataset.speaking = "false";
        };
        
        utterance.onerror = () => {
            btn.innerHTML = lang === "en" ? '<i class="fa-solid fa-volume-high"></i> AI Voice (English)' : '<i class="fa-solid fa-language"></i> AI Voice (Tamil)';
            btn.classList.remove("pulse-red-glow");
            btn.dataset.speaking = "false";
            if (event.error !== "canceled") {
                showToast("Audio playback interrupted.", "warning");
            }
        };

        if (speechSynthesis.getVoices().length === 0) {
            speechSynthesis.addEventListener("voiceschanged", setVoice, { once: true });
        } else {
            setVoice();
        }
    }

    // Attach selectCCTV to window so it can be called from onclick
    
    // Fetch Source Code and Logs for Project Overview
    const fetchCodeBtn = document.getElementById("fetch-code-btn");
    if (fetchCodeBtn) {
        fetchCodeBtn.addEventListener("click", () => {
            const viewer = document.getElementById("code-viewer-content");
            const originalIcon = fetchCodeBtn.innerHTML;
            fetchCodeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            viewer.textContent = "Fetching source code...";
            fetch("/api/get_classifier_code")
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch code");
                    return res.text();
                })
                .then(text => {
                    viewer.textContent = text;
                    showToast("Source code loaded successfully", "success");
                })
                .catch(err => {
                    viewer.textContent = "Error loading source code. Ensure the backend server is running.";
                    showToast("Failed to load source code", "error");
                    console.error(err);
                })
                .finally(() => {
                    fetchCodeBtn.innerHTML = originalIcon;
                });
        });
    }

    const fetchLogsBtn = document.getElementById("fetch-logs-btn");
    if (fetchLogsBtn) {
        fetchLogsBtn.addEventListener("click", () => {
            const viewer = document.getElementById("logs-viewer-content");
            const originalIcon = fetchLogsBtn.innerHTML;
            fetchLogsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            viewer.textContent = "Fetching logs...";
            fetch("/api/get_run_log")
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch logs");
                    return res.text();
                })
                .then(text => {
                    viewer.textContent = text;
                    showToast("Execution logs loaded successfully", "success");
                })
                .catch(err => {
                    viewer.textContent = "Error loading execution logs. Ensure the backend server is running.";
                    showToast("Failed to load execution logs", "error");
                    console.error(err);
                })
                .finally(() => {
                    fetchLogsBtn.innerHTML = originalIcon;
                });
        });
    }

    // Trigger Accident Demo implementation
    window.triggerAccidentDemo = function() {
        const monitorContainer = document.getElementById('monitor-container');
        monitorContainer.style.display = 'flex';
        
        document.getElementById('monitor-image').style.display = 'none';
        const monitorVideo = document.getElementById('monitor-video');
        monitorVideo.style.display = 'block';
        
        monitorVideo.src = "assets/sample-videos/road_accident_sample.mp4";
        monitorVideo.play().catch(e => console.log("Auto-play blocked:", e));
        
        clearCanvas();
        resetResultsPanel();
        showToast("Connected to live simulated CCTV stream.", "success");
        
        monitorVideo.addEventListener('playing', function onPlaying() {
            monitorVideo.removeEventListener('playing', onPlaying);
            document.getElementById("run-detection-btn").click();
        });
    };

    // Python Console Simulator
    const terminalCmd = document.getElementById('terminal-cmd-display');
    const terminalLog = document.getElementById('terminal-execution-log');
    const cliOutputItem = document.getElementById('cli-output-item');

    document.getElementById('cli-load-input-btn')?.addEventListener('click', () => {
        showToast('Input image loaded to workspace.', 'info');
    });

    document.getElementById('terminal-clear-btn')?.addEventListener('click', () => {
        if(terminalCmd) terminalCmd.textContent = '';
        if(terminalLog) terminalLog.style.display = 'none';
        if(cliOutputItem) cliOutputItem.style.display = 'none';
    });

    document.getElementById('terminal-run-btn')?.addEventListener('click', () => {
        if(terminalCmd) terminalCmd.textContent = 'python classifier.py --input input.jpg --output output.jpg';
        if(terminalLog) terminalLog.style.display = 'none';
        if(cliOutputItem) cliOutputItem.style.display = 'none';
        
        const runBtn = document.getElementById('terminal-run-btn');
        const originalHtml = runBtn.innerHTML;
        runBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';
        runBtn.disabled = true;

        fetch('http://localhost:5000/api/run_cli_script', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if(terminalLog) {
                    terminalLog.style.display = 'block';
                    if (data.success) {
                        const detectionsText = data.detections_count > 0 ? `<span style="color: #00e676; font-weight: bold;">done. Detections found: ${data.detections_count}</span><br>` +
                                               `<span style="color: #00e676; font-weight: bold;">Accident score: ${data.confidence}%</span>` 
                                               : `<span style="color: #ffbd2e; font-weight: bold;">done. No detections found.</span>`;
                                               
                        terminalLog.innerHTML = `WARNING: All log messages before absl::InitializeLog() is called are written to STDERR<br>
                                            <span style="color: #475569;">I0000 00:00:1782149318.222601    2080 port.cc:153] oneDNN custom operations are on. You may see slightly different numerical results...</span><br>
                                            <br>${detectionsText}`;
                        
                        if(cliOutputItem) cliOutputItem.style.display = 'flex';
                        
                        // Store the output URL to use when View Output is clicked
                        document.getElementById('cli-view-output-btn').dataset.imageUrl = data.output_image_url;
                        document.getElementById('cli-view-output-btn').dataset.confidence = data.confidence;
                        document.getElementById('cli-view-output-btn').dataset.severity = data.severity;
                        
                        showToast('Python script execution completed. Output generated.', 'success');
                    } else {
                        terminalLog.innerHTML = `<span style="color: #ff3333;">ERROR: ${data.error || 'Execution failed'}</span>`;
                        showToast('Failed to execute Python script.', 'error');
                    }
                }
            })
            .catch(err => {
                console.error(err);
                if(terminalLog) {
                    terminalLog.style.display = 'block';
                    terminalLog.innerHTML = `<span style="color: #ff3333;">Network Error: Failed to contact backend API. Is the Python server (app.py) running on port 5000?</span>`;
                }
                showToast('API connection error', 'error');
            })
            .finally(() => {
                runBtn.innerHTML = originalHtml;
                runBtn.disabled = false;
            });
    });

    document.getElementById('cli-view-output-btn')?.addEventListener('click', (e) => {
        const monitorContainer = document.getElementById('monitor-container');
        if(monitorContainer) monitorContainer.style.display = 'flex';
        
        const feedName = document.getElementById('feed-source-name');
        if(feedName) feedName.textContent = 'PYTHON CLI: output.jpg';
        
        const monitorImage = document.getElementById('monitor-image');
        const monitorVideo = document.getElementById('monitor-video');
        if(monitorVideo) monitorVideo.style.display = 'none';
        
        const btn = e.currentTarget;
        const imageUrl = btn.dataset.imageUrl || "assets/output.jpg";
        const confidence = parseFloat(btn.dataset.confidence) || 99.9;
        const severity = btn.dataset.severity || 'Severe';

        if(monitorImage) {
            monitorImage.style.display = 'block';
            monitorImage.src = imageUrl;
        }
        
        clearCanvas();
        updateResultsPanel(true, confidence, severity, 'Offline File');
    });

    // Fallback for grid videos
    document.querySelectorAll('.cctv-feed video').forEach(vid => {
        vid.play().catch(e => console.log('Grid autoplay blocked:', e));
    });

    setInterval(() => {
        const timestamps = document.querySelectorAll('.grid-timestamp');
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false });
        timestamps.forEach(el => {
            el.textContent = timeString;
        });
    }, 1000);

    // --- INCIDENT REPORT MODULE ---
    const generateReportBtn = document.getElementById('generate-report-btn');
    const reportIncidentSelect = document.getElementById('report-incident-select');
    const reportTrafficDensity = document.getElementById('report-traffic-density');
    const reportCasualties = document.getElementById('report-casualties');
    const reportOfficerNotes = document.getElementById('report-officer-notes');
    
    const reportEmptyState = document.getElementById('report-empty-state');
    const reportDocument = document.getElementById('report-document');
    
    const repDocId = document.getElementById('rep-doc-id');
    const repDocTime = document.getElementById('rep-doc-time');
    const repDocLoc = document.getElementById('rep-doc-loc');
    const repDocNode = document.getElementById('rep-doc-node');
    const repDocScore = document.getElementById('rep-doc-score');
    const repDocSeverity = document.getElementById('rep-doc-severity');
    const repDocCasualties = document.getElementById('rep-doc-casualties');
    const repDocVehicles = document.getElementById('rep-doc-vehicles');
    const repDocDispatches = document.getElementById('rep-doc-dispatches');
    const repDocNotes = document.getElementById('rep-doc-notes');
    
    const repDocPrintBtn = document.getElementById('rep-doc-print-btn');
    const repDocSaveBtn = document.getElementById('rep-doc-save-btn');
    const repDocDownloadBtn = document.getElementById('rep-doc-download-btn');

    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.addEventListener('click', () => {
            if (item.getAttribute('data-view') === 'reports-view') {
                updateReportIncidentSelect();
            }
        });
    });

    // Also populate it on load
    setTimeout(updateReportIncidentSelect, 500);

    function updateReportIncidentSelect() {
        if (!reportIncidentSelect) return;
        reportIncidentSelect.innerHTML = '<option value="">-- Choose verified incident --</option>';
        detectionsHistory.forEach(history => {
            const option = document.createElement('option');
            option.value = history.id;
            option.textContent = `[${history.timestamp}] ${history.id} - ${history.severity} Severity`;
            option.dataset.timestamp = history.timestamp;
            option.dataset.severity = history.severity;
            option.dataset.confidence = history.confidence;
            option.dataset.location = history.location;
            reportIncidentSelect.appendChild(option);
        });
    }

    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const selectedIncident = reportIncidentSelect.value;
            const trafficDensity = reportTrafficDensity.value;
            const casualtiesCount = reportCasualties.value;
            const officerNotes = reportOfficerNotes.value.trim();
            const selectedVehicles = Array.from(document.querySelectorAll('.report-vehicle-check:checked')).map(cb => cb.value);
            
            let hasError = false;

            if (!selectedIncident) {
                showToast("Validation Error: Please select an Accident Event.", "error");
                reportIncidentSelect.style.borderColor = "var(--color-danger)";
                hasError = true;
            } else {
                reportIncidentSelect.style.borderColor = "var(--border-color)";
            }
            
            if (!trafficDensity) {
                showToast("Validation Error: Please select Road Traffic Density.", "error");
                reportTrafficDensity.style.borderColor = "var(--color-danger)";
                hasError = true;
            } else {
                reportTrafficDensity.style.borderColor = "var(--border-color)";
            }
            
            if (selectedVehicles.length === 0) {
                showToast("Validation Error: Please select at least one Vehicle Type.", "error");
                hasError = true;
            }
            
            if (!casualtiesCount || parseInt(casualtiesCount) < 0) {
                showToast("Validation Error: Please enter a valid Casualty Count.", "error");
                reportCasualties.style.borderColor = "var(--color-danger)";
                hasError = true;
            } else {
                reportCasualties.style.borderColor = "var(--border-color)";
            }
            
            if (!officerNotes) {
                showToast("Validation Error: Please enter Officer Audit Notes.", "error");
                reportOfficerNotes.style.borderColor = "var(--color-danger)";
                hasError = true;
            } else {
                reportOfficerNotes.style.borderColor = "var(--border-color)";
            }

            if(hasError) return;
            
            const originalBtnText = generateReportBtn.innerHTML;
            generateReportBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
            generateReportBtn.disabled = true;
            
            setTimeout(() => {
                const selectedOption = reportIncidentSelect.options[reportIncidentSelect.selectedIndex];
                
                repDocId.textContent = selectedOption.value;
                repDocTime.textContent = selectedOption.dataset.timestamp;
                repDocLoc.textContent = selectedOption.dataset.location || "Unknown Location";
                repDocNode.textContent = "SURE-NODE-" + Math.floor(Math.random() * 900 + 100);
                repDocScore.textContent = selectedOption.dataset.confidence;
                repDocSeverity.textContent = selectedOption.dataset.severity;
                repDocCasualties.textContent = casualtiesCount;
                repDocVehicles.textContent = selectedVehicles.join(", ");
                repDocNotes.textContent = officerNotes;
                
                let dispatchesHTML = '';
                if (selectedOption.dataset.severity === 'High' || parseInt(casualtiesCount) > 0) {
                    dispatchesHTML += '<div style="margin-bottom:4px;"><i class="fa-solid fa-truck-medical text-danger"></i> Ambulance Dispatched immediately</div>';
                }
                dispatchesHTML += '<div style="margin-bottom:4px;"><i class="fa-solid fa-truck-pickup text-warning"></i> Police Notification sent</div>';
                if (trafficDensity === 'High Density') {
                    dispatchesHTML += '<div style="margin-bottom:4px;"><i class="fa-solid fa-traffic-cone text-accent"></i> Traffic Diversion protocols engaged</div>';
                }
                repDocDispatches.innerHTML = dispatchesHTML;
                
                reportEmptyState.style.display = 'none';
                reportDocument.style.display = 'block';
                
                generateReportBtn.innerHTML = originalBtnText;
                generateReportBtn.disabled = false;
                
                const newLog = {
                    id: "REP-" + Math.floor(Math.random() * 100000),
                    timestamp: new Date().toLocaleString(),
                    feed: "REPORT",
                    detected: "YES",
                    confidence: selectedOption.dataset.confidence,
                    severity: selectedOption.dataset.severity,
                    location: "Report: " + selectedOption.value,
                    dispatchStatus: "Report Generated",
                    dispatchedAgencies: []
                };
                saveLogToHistory(newLog);
                
                showToast("Official report generated successfully.", "success");
            }, 800);
        });
    }

    if (repDocPrintBtn) {
        repDocPrintBtn.addEventListener('click', () => {
            window.print();
        });
    }
    
    if (repDocSaveBtn) {
        repDocSaveBtn.addEventListener('click', () => {
            const reportData = {
                incidentId: repDocId.textContent,
                time: repDocTime.textContent,
                severity: repDocSeverity.textContent,
                confidence: repDocScore.textContent,
                content: reportDocument.innerHTML
            };
            
            const savedReports = JSON.parse(localStorage.getItem('sure-saved-reports') || '[]');
            savedReports.push(reportData);
            localStorage.setItem('sure-saved-reports', JSON.stringify(savedReports));
            showToast("Report saved to local storage successfully.", "success");
        });
    }

    if (repDocDownloadBtn) {
        repDocDownloadBtn.addEventListener('click', () => {
            showToast("Preparing PDF download...", "info");
            setTimeout(() => {
                window.print(); 
                showToast("PDF generation dialog opened.", "success");
            }, 500);
        });
    }
});
