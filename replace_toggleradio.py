import sys

with open("src/components/ToggleRadio.tsx", "r") as f:
    content = f.read()

content = content.replace("className='bg-void-black border border-toxic-green text-toxic-green w-8 h-8 flex items-center justify-center hover:bg-toxic-green/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green'", "className='radio-btn'")
content = content.replace("<RazorPlayIcon className='w-5 h-5 text-toxic-green' />", "<svg width=\"14\" height=\"14\" viewBox=\"0 0 14 14\"><polygon points=\"3,2 12,7 3,12\" fill=\"currentColor\"/></svg>")

with open("src/components/ToggleRadio.tsx", "w") as f:
    f.write(content)
