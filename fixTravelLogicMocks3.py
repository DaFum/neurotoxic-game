import re

with open("tests/useTravelLogicTestUtils.js", "r") as f:
    content = f.read()

content = content.replace("FUEL_PRICE: 2,", "fuelPrice: 2,")
content = content.replace("REPAIR_COST_PER_UNIT: 5", "repairCostPerUnit: 5")

with open("tests/useTravelLogicTestUtils.js", "w") as f:
    f.write(content)
