import re

filepath = "src/context/reducers/bandReducer.ts"
with open(filepath, "r") as f:
    content = f.read()

search_pattern = """    updatedMembers[targetIndex] = {
      ...m,
      [key]:
        key === 'stamina'
          ? clampMemberStamina(
              ((m[key] as number) || 0) + (item.value as number),
              (m.staminaMax as number) ?? 100
            )
          : clampMemberMood(((m[key] as number) || 0) + (item.value as number))
    } as BandMember

    newBand.members = updatedMembers
    return newBand
  } else if (item.effectType === 'harmony') {"""

replace_pattern = """    updatedMembers[targetIndex] = {
      ...m,
      [key]:
        key === 'stamina'
          ? clampMemberStamina(
              ((m[key] as number) || 0) + (item.value as number),
              typeof m.staminaMax === 'number' ? m.staminaMax : 100
            )
          : clampMemberMood(((m[key] as number) || 0) + (item.value as number))
    } as BandMember

    newBand.members = updatedMembers
  } else if (item.effectType === 'harmony') {"""

if search_pattern in content:
    content = content.replace(search_pattern, replace_pattern)
    with open(filepath, "w") as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Pattern not found")
