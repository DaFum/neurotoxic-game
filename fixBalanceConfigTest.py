import re

with open("tests/node/balanceConfig.test.js", "r") as f:
    content = f.read()

# I had already modified balanceConfig.test.js previously.
# But wait, why is it failing now with missing section expenses?
# "TypeError: Balance config is missing section "expenses"" from the boot guard (RAW_DEFAULT_BALANCE_CONFIG)

with open("src/config/balance.ts", "r") as f:
    balance_content = f.read()

print("expenses" in balance_content)
