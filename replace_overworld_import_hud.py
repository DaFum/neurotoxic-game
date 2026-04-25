import sys

with open("src/scenes/Overworld.tsx", "r") as f:
    content = f.read()

content = content.replace("import { OverworldMenu } from '../ui/overworld/OverworldMenu'",
                          "import { OverworldMenu } from '../ui/overworld/OverworldMenu'\nimport { OverworldHUD } from '../ui/overworld/OverworldHUD'\nimport { ToggleRadio } from '../components/ToggleRadio'")

# add the HUD
import re
content = re.sub(
    r'(<OverworldHeader\s*t=\{t\}\s*locationName=\{locationName\}\s*isTraveling=\{isTraveling\}\s*/>)',
    r'\1\n      <OverworldHUD player={player} band={band} harmony={player.harmony} muted={false} onToggleMute={() => {}} />\n      <div className="radio">\n        <div className="radio-dot" />\n        <span className="radio-freq">FM 66.6</span>\n        <ToggleRadio />\n      </div>',
    content
)

with open("src/scenes/Overworld.tsx", "w") as f:
    f.write(content)
