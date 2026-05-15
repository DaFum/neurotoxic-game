import re

# 1. Update `src/context/usePersistence.ts` to include `minigame`
with open('src/context/usePersistence.ts', 'r') as f:
    content = f.read()

replacement = r'''    setlist,
    unlocks,
    completedMilestones,
    minigame
  } = currentState'''
content = re.sub(r'    setlist,\n    unlocks,\n    completedMilestones\n  \} = currentState', replacement, content)

replacement2 = r'''    gigModifiers,
    unlocks,
    completedMilestones,
    minigame,
    setlist: normalizeSetlistForSave(setlist)
  }'''
content = re.sub(r'    gigModifiers,\n    unlocks,\n    completedMilestones,\n    setlist: normalizeSetlistForSave\(setlist\)\n  \}', replacement2, content)

with open('src/context/usePersistence.ts', 'w') as f:
    f.write(content)

# 2. Extract types from `src/types/game.d.ts` into multiple domain-specific files
GAME_TYPES_PATH = 'src/types/game.d.ts'

with open(GAME_TYPES_PATH, 'r') as f:
    content = f.read()

types_to_extract = {
    'player': ['PlayerState'],
    'band': ['BandMember', 'StashItem', 'ContrabandStashItem', 'BandState'],
    'quest': ['QuestState'],
    'events': ['EventOption', 'GameEvent'],
    'npc': ['CharacterProfile', 'CharacterTrait'],
    'map': ['MapNode', 'GameMap', 'Venue'],
    'gig': ['GigModifiers', 'PostGigSummary'],
    'actions': [
        'CompleteTravelMinigamePayload', 'ClinicActionPayload',
        'DarkWebLeakConfig', 'DarkWebLeakPayload', 'PirateBroadcastPayload',
        'BloodBankDonatePayload', 'TradeVoidItemPayload', 'MerchPressPayload',
        'UpdatePlayerPayload', 'UpdateBandPayload', 'ResetStatePayload', 'EventDeltaPayload'
    ]
}
social_types = ['BrandAlignment', 'RivalBandState', 'SocialState', 'PostResult']

def extract_block(content, name):
    pattern = re.compile(rf"export\s+(?:interface|type)\s+{name}\b.*?(?:={{|{{|=[^{{;\n]+(?:;|\n|$))", re.DOTALL)
    match = pattern.search(content)
    if not match:
        return None, content

    start_idx = match.start()

    if '=' in match.group() and '{' not in match.group():
        rest = content[start_idx:]
        next_export = re.search(r"\n\s*export\s+(?:interface|type|const|function|class)", rest[1:])
        if next_export:
            end_idx = start_idx + next_export.start() + 1
        else:
            end_idx = len(content)
        return content[start_idx:end_idx], content[:start_idx] + content[end_idx:]

    brace_start = content.find('{', start_idx)
    brace_level = 1

    for i, char in enumerate(content[brace_start+1:]):
        if char == '{':
            brace_level += 1
        elif char == '}':
            brace_level -= 1
            if brace_level == 0:
                end_idx = brace_start + 1 + i + 1
                return content[start_idx:end_idx], content[:start_idx] + content[end_idx:]

    return None, content

extracted_files = {}

for file_base, names in types_to_extract.items():
    extracted_blocks = []
    for name in names:
        block, content = extract_block(content, name)
        if block:
            extracted_blocks.append(block.strip())
    extracted_files[file_base] = extracted_blocks

social_blocks = []
for name in social_types:
    block, content = extract_block(content, name)
    if block:
        social_blocks.append(block.strip())

for file_base, blocks in extracted_files.items():
    if not blocks: continue
    with open(f"src/types/{file_base}.d.ts", 'w') as f:
        f.write('\n\n'.join(blocks) + '\n')

with open('src/types/social.d.ts', 'a') as f:
    f.write('\n\n' + '\n\n'.join(social_blocks) + '\n')

content = content.replace("import type { Platform } from './social'\n", "")
with open(GAME_TYPES_PATH, 'w') as f:
    f.write(content)

with open('src/types/index.ts', 'a') as f:
    for file_base in extracted_files.keys():
        f.write(f"export * from './{file_base}'\n")
