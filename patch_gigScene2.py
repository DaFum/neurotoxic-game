import re

with open('tests/ui/Gig.scene.test.jsx', 'r') as f:
    content = f.read()

content = content.replace("})\n})", "})")

with open('tests/ui/Gig.scene.test.jsx', 'w') as f:
    f.write(content)
