import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace cam1.mp4 with cctv1.mp4 etc, and add onerror fallback for the video tag
for i in range(1, 5):
    old_tag = f'<video src="public/cam{i}.mp4"'
    new_tag = f'<video src="public/cctv{i}.mp4" onerror="this.outerHTML=<div style=\'display:flex;align-items:center;justify-content:center;height:100%;color:#ff4444;font-family:monospace;font-size:1.2rem;\'>Camera Offline</div>"'
    content = content.replace(old_tag, new_tag)

# The user also asked for grid videos to be muted, loop, autoplay, playsInline, preload='auto'
# They already have loop muted autoplay playsinline. I just need to add preload="auto".
content = re.sub(r'playsinline style="width:100%;', 'playsinline preload="auto" style="width:100%;', content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('index.html patched.')
