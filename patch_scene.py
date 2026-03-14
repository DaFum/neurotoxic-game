import re

with open("src/scenes/ClinicScene.jsx", "r") as f:
    content = f.read()

content = re.sub(
    r"\{t\('ui:clinic\.heal_button', \{ defaultValue: 'HEAL' \}\)\} \(\{healCostMoney\}€\)",
    r"{t('ui:clinic.heal_button', { defaultValue: 'HEAL ({{cost}}€)', cost: healCostMoney })}",
    content
)

with open("src/scenes/ClinicScene.jsx", "w") as f:
    f.write(content)
