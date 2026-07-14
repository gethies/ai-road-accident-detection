import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Auto-start simulated camera on switching to live-camera tab
tab_switch_logic = """                if (targetTab !== "live-camera") {
                    stopWebcam();
                } else {
                    const btn = document.getElementById('start-simulated-camera-btn');
                    if(btn) btn.click();
                }"""
                
content = re.sub(r'if \(targetTab \!== "live-camera"\) \{\s*stopWebcam\(\);\s*\}', tab_switch_logic, content)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('app.js updated with tab logic.')
