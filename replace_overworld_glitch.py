import sys

with open("src/scenes/Overworld.tsx", "r") as f:
    content = f.read()

# Add glitch state to Overworld
glitch_state = """
  const [glitch, setGlitch] = useState('')
  useEffect(() => {
    const TYPES = ['glitch-on', 'g-hue', 'g-pixel']
    const id = setInterval(() => {
      if (Math.random() < 0.22) {
        const t = TYPES[Math.floor(Math.random() * TYPES.length)]
        setGlitch(t)
        setTimeout(() => setGlitch(''), 160 + Math.random() * 120)
      }
    }, 4000)
    return () => clearInterval(id)
  }, [])
"""

import re
content = re.sub(
    r'(const \[hoveredNode, setHoveredNode\] = useState\(null\))',
    r'\1\n' + glitch_state,
    content
)

content = content.replace(
    "className={`scene w-full h-full bg-void-black relative overflow-hidden flex flex-col items-center justify-center p-8 ${isTraveling ? 'pointer-events-none' : ''}`}",
    "className={`scene ${glitch} w-full h-full bg-void-black relative overflow-hidden flex flex-col items-center justify-center p-8 ${isTraveling ? 'pointer-events-none' : ''}`}"
)

with open("src/scenes/Overworld.tsx", "w") as f:
    f.write(content)
