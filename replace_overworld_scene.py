import sys

with open("src/scenes/Overworld.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "className={`w-full h-full bg-void-black relative overflow-hidden flex flex-col items-center justify-center p-8 ${isTraveling ? 'pointer-events-none' : ''}`}",
    "className={`scene w-full h-full bg-void-black relative overflow-hidden flex flex-col items-center justify-center p-8 ${isTraveling ? 'pointer-events-none' : ''}`}"
)

# add CRT divs
import re
content = re.sub(
    r'(<div\s+className={`scene[^>]*>\s*)',
    r'\1<div className="noise" /><div className="crt" /><div className="scan" />\n      ',
    content
)

with open("src/scenes/Overworld.tsx", "w") as f:
    f.write(content)
