import sys

with open("src/ui/overworld/OverworldMenu.tsx", "r") as f:
    content = f.read()

# Change it so `openBloodBank` maps to `changeScene(GAME_PHASES.CLINIC)` instead of using the modal
# Wait, the review said:
# "VOID CLINIC menu action changed from scene navigation to blood bank modal. The git diff reveals the previous code explicitly overrode openBloodBank to navigate to the Clinic scene: openBloodBank: () => changeScene(GAME_PHASES.CLINIC). The new code at line 60 maps it to the actual openBloodBank function... This is a behavioral regression—the "VOID CLINIC" menu item now opens a donation modal instead of the clinic healing screen."

import re
content = re.sub(
    r"openHQ, openQuests, openStash, openPirateRadio, openMerchPress, openDarkWebLeak, openBloodBank, handleRefuel, handleRepair, handleSaveWithDelay",
    r"openHQ, openQuests, openStash, openPirateRadio, openMerchPress, openDarkWebLeak, openBloodBank: () => changeScene(GAME_PHASES.CLINIC), handleRefuel, handleRepair, handleSaveWithDelay",
    content
)

with open("src/ui/overworld/OverworldMenu.tsx", "w") as f:
    f.write(content)
