import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'document\.getElementById\("start-camera-btn"\)\.addEventListener\("click", \(\) => \{\s*startWebcam\(\);\s*\}\);',
    '',
    content
)

new_simulated_cctv = """    function startSimulatedCCTV() {
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
    }"""

content = re.sub(
    r'function startSimulatedCCTV\(\) \{.*?(?=function clearCanvas\(\))',
    new_simulated_cctv + r'\n\n    ',
    content,
    flags=re.DOTALL
)

updater_logic = """    // Real-time grid timestamp updater
    setInterval(() => {
        const timestamps = document.querySelectorAll('.grid-timestamp');
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false });
        timestamps.forEach(el => {
            el.textContent = timeString;
        });
    }, 1000);"""

content = re.sub(
    r'(?=\}\);\s*$)',
    updater_logic + r'\n',
    content
)

content = re.sub(r'window\.selectCCTV = function.*?};', '', content, flags=re.DOTALL)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('app.js patched successfully.')
