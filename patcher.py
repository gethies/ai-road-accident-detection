import sys

# Update app.js
with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add demo mode listener
old_theme_toggle = '''        // Theme Toggle slider
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
        });'''

new_theme_toggle = old_theme_toggle + '''

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
        }'''

content = content.replace(old_theme_toggle, new_theme_toggle)

# 2. Update uploadAndPredict
old_fetch = '''            const apiBase = window.location.protocol === 'file:' ? 'http://127.0.0.1:5000' : '';
            fetch(`${apiBase}/predict`, {
                method: "POST",
                body: formData
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error("HTTP error " + res.status);
                }
                return res.json();
            })
            .then(data => {'''

new_fetch = '''            const apiBase = window.location.protocol === 'file:' ? 'http://127.0.0.1:5000' : 'http://127.0.0.1:5000';
            
            // DEMO MODE MOCK RESPONSE
            if (isDemoMode) {
                setTimeout(() => {
                    clearInterval(progressInterval);
                    progressBarFill.style.width = "100%";
                    setTimeout(() => {
                        overlay.style.display = "none";
                        laser.style.display = "none";
                        const monitorImage = document.getElementById("monitor-image");
                        const monitorVideo = document.getElementById("monitor-video");
                        if (activeFileType === "video" || activeFileType === "camera") {
                            if (!monitorVideo.paused) {
                                monitorVideo.pause();
                            }
                            monitorVideo.style.display = "none";
                            monitorImage.style.display = "block";
                        }
                        monitorImage.src = SAMPLE_IMAGE_URL;
                        clearCanvas();
                        updateResultsPanel(true, 92, "Severe", CHENNAI_LOCATIONS[Math.floor(Math.random() * CHENNAI_LOCATIONS.length)]);
                        const timestamp = new Date().toLocaleString();
                        const logId = Date.now();
                        const newLog = {
                            id: logId,
                            timestamp: timestamp,
                            feed: activeFeedSource.toUpperCase(),
                            detected: "YES",
                            confidence: "92%",
                            severity: "Severe",
                            location: CHENNAI_LOCATIONS[Math.floor(Math.random() * CHENNAI_LOCATIONS.length)],
                            dispatchStatus: "Pending Dispatch",
                            dispatchedAgencies: []
                        };
                        saveLogToHistory(newLog);
                        activateAlertConsole("Severe", newLog.location, logId);
                        triggerNotificationAlert(newLog);
                        showToast("Accident Detected! Emergency alerts initialized (DEMO MODE).", "error");
                    }, 400);
                }, 2000);
                return;
            }
            
            fetch(`${apiBase}/predict`, {
                method: "POST",
                body: formData
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error("HTTP error " + res.status);
                }
                return res.json();
            })
            .then(data => {'''

content = content.replace(old_fetch, new_fetch)


with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Patched app.js')
