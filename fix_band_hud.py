import sys

with open("src/ui/overworld/OverworldHUD.tsx", "r") as f:
    content = f.read()

content = content.replace("{(band || []).map((m: any)=>{", "{Object.values(band || {}).map((m: any)=>{")

with open("src/ui/overworld/OverworldHUD.tsx", "w") as f:
    f.write(content)
