import re

with open("tests/useTravelLogicTestUtils.js", "r") as f:
    content = f.read()

content = content.replace("mockExpenseConstants.TRANSPORT.MAX_FUEL", "mockExpenseConstants.transport.maxFuel")
content = content.replace("mockExpenseConstants.TRANSPORT.FUEL_PRICE", "mockExpenseConstants.transport.fuelPrice")
content = content.replace("mockExpenseConstants.TRANSPORT.REPAIR_COST_PER_UNIT", "mockExpenseConstants.transport.repairCostPerUnit")
content = content.replace("mockExpenseConstants.TRANSPORT", "mockExpenseConstants.transport")

with open("tests/useTravelLogicTestUtils.js", "w") as f:
    f.write(content)
