import re

filepath = "src/context/reducers/bandReducer.ts"
with open(filepath, "r") as f:
    content = f.read()

search_pattern = """  if (item.duration != null) {
    const effectExists = (newBand.activeContrabandEffects || []).some(
      (e: any) => e.instanceId === item.instanceId
    )"""

replace_pattern = """  if (item.duration != null) {
    const effectExists = ((newBand.activeContrabandEffects as Array<Record<string, unknown>>) || []).some(
      e => e.instanceId === item.instanceId
    )"""

if search_pattern in content:
    content = content.replace(search_pattern, replace_pattern)
    with open(filepath, "w") as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Pattern not found")
