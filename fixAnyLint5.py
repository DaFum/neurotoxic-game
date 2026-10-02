import re

with open("src/config/balance.ts", "r") as f:
    content = f.read()

# Replace any with specific cast to appease eslint while allowing dynamic optional chaining

# type NestedUnknown = Record<string, Record<string, unknown> | undefined> | undefined
# and then (record.expenses as NestedUnknown)?.daily?.baseCost as number | undefined

content = content.replace("export interface BalanceConfig", "type NestedUnknown = Record<string, Record<string, unknown> | undefined> | undefined\n\nexport interface BalanceConfig")
content = content.replace("as any", "as NestedUnknown")

with open("src/config/balance.ts", "w") as f:
    f.write(content)
