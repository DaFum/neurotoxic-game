import sys

with open("src/ui/overworld/OverworldHeader.tsx", "r") as f:
    content = f.read()

content = content.replace("import { ToggleRadio } from '../../components/ToggleRadio'\n\n", "")

with open("src/ui/overworld/OverworldHeader.tsx", "w") as f:
    f.write(content)
