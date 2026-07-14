import re
with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's fix the end of the file
# We will just find where window.triggerAccidentDemo = function() { starts and replace everything from there to the end of the file with a clean version.

clean_end = """    // Trigger Accident Demo implementation
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
        
        setTimeout(() => {
            if(terminalLog) terminalLog.style.display = 'block';
            setTimeout(() => {
                if(cliOutputItem) cliOutputItem.style.display = 'flex';
                showToast('Python script execution completed. Output generated.', 'success');
            }, 1500);
        }, 800);
    });

    document.getElementById('cli-view-output-btn')?.addEventListener('click', () => {
        const monitorContainer = document.getElementById('monitor-container');
        if(monitorContainer) monitorContainer.style.display = 'flex';
        
        const feedName = document.getElementById('feed-source-name');
        if(feedName) feedName.textContent = 'PYTHON CLI: output.jpg';
        
        const monitorImage = document.getElementById('monitor-image');
        const monitorVideo = document.getElementById('monitor-video');
        if(monitorVideo) monitorVideo.style.display = 'none';
        if(monitorImage) {
            monitorImage.style.display = 'block';
            monitorImage.src = "assets/output.jpg";
        }
        
        clearCanvas();
        updateResultsPanel(true, 99.9, 'Severe', 'Offline File');
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
});"""

content = re.sub(r'    // Trigger Accident Demo implementation\n    window\.triggerAccidentDemo = function\(\) \{.*', clean_end, content, flags=re.DOTALL)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed app.js syntax.')
