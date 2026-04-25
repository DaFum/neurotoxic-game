import sys

with open("src/components/ToggleRadio.tsx", "r") as f:
    content = f.read()

# I removed the span but forgot to wrap the square in a fragment or string literal! It needs to be inside JSX. So '■'
content = content.replace("          ■\n", "          '■'\n")

with open("src/components/ToggleRadio.tsx", "w") as f:
    f.write(content)
