import re

with open("tests/useTravelLogicTestUtils.js", "r") as f:
    content = f.read()

# Make sure mockExpenseConstants is camelCase. The original might be uppercase.
content = content.replace("const mockExpenseConstants = {\n  TRANSPORT: {\n    MAX_FUEL: 100\n  }\n}", "const mockExpenseConstants = {\n  transport: {\n    maxFuel: 100\n  }\n}")
content = content.replace("TRANSPORT: { MAX_FUEL: 100 }", "transport: { maxFuel: 100 }")
content = content.replace("TRANSPORT:", "transport:")
content = content.replace("MAX_FUEL:", "maxFuel:")

with open("tests/useTravelLogicTestUtils.js", "w") as f:
    f.write(content)
