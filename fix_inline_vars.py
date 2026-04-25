import os
import glob

replacements = {
    "var(--void)": "var(--color-void-black)",
    "var(--green)": "var(--color-toxic-green)",
    "var(--red)": "var(--color-blood-red)",
    "var(--yellow)": "var(--color-warning-yellow)",
    "var(--ash)": "var(--color-ash-gray)",
    "var(--white)": "var(--color-star-white)",
    "var(--pink)": "var(--color-neon-pink)",
    "var(--blue)": "var(--color-holographic-blue)",
    "var(--fuel)": "var(--color-warning-yellow)",
    "var(--purple)": "var(--color-cosmic-purple)",
    "var(--hotpink)": "var(--color-blood-red)",
    "var(--cyan)": "var(--color-neon-cyan)"
}

files = glob.glob("src/ui/overworld/*.tsx")
files.extend(glob.glob("src/scenes/*.tsx"))

for file in files:
    with open(file, "r") as f:
        content = f.read()

    original = content
    for old, new in replacements.items():
        content = content.replace(old, new)

    if content != original:
        with open(file, "w") as f:
            f.write(content)
