import sys

with open("src/components/overworld/OverworldMap.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "className='relative w-full h-full max-w-6xl max-h-[80vh] border-4 border-toxic-green bg-void-black/80 rounded-lg shadow-[0_0_50px_var(--color-toxic-green-20)] overflow-hidden'",
    "className='map-wrap relative w-full h-full max-w-6xl max-h-[80vh] border-4 border-toxic-green bg-void-black/80 rounded-lg shadow-[0_0_50px_var(--color-toxic-green-20)] overflow-hidden'"
)

with open("src/components/overworld/OverworldMap.tsx", "w") as f:
    f.write(content)
