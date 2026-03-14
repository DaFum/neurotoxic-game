import re

with open("src/hooks/useClinicLogic.js", "r") as f:
    content = f.read()

content = re.sub(
    r"createClinicHealAction\(\{[\s\S]*?\}\)",
    r"createClinicHealAction({\n          memberId,\n          type: 'heal',\n          staminaGain: CLINIC_CONFIG.HEAL_STAMINA_GAIN,\n          moodGain: CLINIC_CONFIG.HEAL_MOOD_GAIN\n        })",
    content
)

content = re.sub(
    r"createClinicEnhanceAction\(\{[\s\S]*?\}\)",
    r"createClinicEnhanceAction({\n          memberId,\n          type: 'enhance',\n          trait\n        })",
    content
)

with open("src/hooks/useClinicLogic.js", "w") as f:
    f.write(content)
