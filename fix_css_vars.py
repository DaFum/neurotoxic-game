import sys

with open("src/overworld.css", "r") as f:
    content = f.read()

# According to AGENTS.md, we should replace --green, --yellow etc with var(--color-toxic-green)
# But wait, overworld.css ALREADY defines variables like --green: #00ff41, and uses them. It is perfectly self-contained.
# Wait, the user specifically requested "Integrate all new colors in to the style rules in Agents files". Ah! "Integrate all new colors in to the style rules in Agents files" means we should follow the rule `var(--color-...)` for colors and remove our custom `:root` color overrides!

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

for old, new in replacements.items():
    content = content.replace(old, new)

# Remove the custom root
import re
content = re.sub(r':root\{[^\}]+\}', '', content)

with open("src/overworld.css", "w") as f:
    f.write(content)
