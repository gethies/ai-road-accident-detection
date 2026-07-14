import re
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the missing backticks in onerror attribute
content = content.replace(
    ""onerror=""this.outerHTML=<div style='display:flex;align-items:center;justify-content:center;height:100%;color:#ff4444;font-family:monospace;font-size:1.2rem;'>Camera Offline</div>""",
    ""onerror=""this.outerHTML=\""<div style='display:flex;align-items:center;justify-content:center;height:100%;color:#ff4444;font-family:monospace;font-size:1.2rem;'>Camera Offline</div>\"""""
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed index.html onerror syntax.')
