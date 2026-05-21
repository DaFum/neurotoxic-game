import re

filepath = "src/context/reducers/bandReducer.ts"
with open(filepath, "r") as f:
    content = f.read()

search_pattern = """              ((m[key] as number) || 0) + (item.value as number),
              (m.staminaMax as number) || 100
            )"""

replace_pattern = """              ((m[key] as number) || 0) + (item.value as number),
              (m.staminaMax as number) ?? 100
            )"""

if search_pattern in content:
    content = content.replace(search_pattern, replace_pattern)
    with open(filepath, "w") as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Pattern not found")
