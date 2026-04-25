import sys

with open("src/components/ToggleRadio.tsx", "r") as f:
    content = f.read()

# the stop state in toggleRadio uses a span text-xl font-bold font-mono. It should just use ■ like the html
content = content.replace("<span className='text-xl font-bold font-mono'>■</span>", "■")

with open("src/components/ToggleRadio.tsx", "w") as f:
    f.write(content)
