import re

with open('audit_report.md', 'r') as f:
    content = f.read()

# Replace misleading descriptions in MISSING INTEGRATION section
# Currently it says "Component X looks fully built" for types/interfaces, which is what the reviewer complained about.

# Let's fix the text:
# State/reducer `PurchaseChassisInput` is not integrated into the game loop/store. -> Interface/Type `PurchaseChassisInput` is exported but not utilized in other modules.
# Component `GigViewProps` looks fully built but is never imported/rendered. -> Interface/Type `GigViewProps` is exported but not utilized in other modules.

lines = content.split('\n')
new_lines = []
for line in lines:
    if 'MISSING INTEGRATION' in line or new_lines and new_lines[-1] == '## MISSING INTEGRATION' or 'State/reducer' in line or 'Component' in line:
        if 'State/reducer' in line and 'Input' in line or 'Props' in line or 'Actions' in line or 'Store' in line or 'Result' in line:
            line = re.sub(r'State/reducer `(.*?)` is not integrated into the game loop/store\.', r'Interface/Type `\1` is exported but appears to be dead code (no imports found).', line)
        if 'Component' in line and ('Props' in line or 'Category' in line or 'Effect' in line or 'Balances' in line or 'Kind' in line):
            line = re.sub(r'Component `(.*?)` looks fully built but is never imported/rendered\.', r'Interface/Type `\1` is exported but appears to be dead code (no imports found).', line)
            line = line.replace('INTEGRATE or DELETE', 'DELETE or remove export')
        if 'State/reducer' in line and 'INTEGRATE or DELETE' in line:
            # Maybe they are functions?
            pass

        new_lines.append(line)
    else:
        new_lines.append(line)

with open('audit_report.md', 'w') as f:
    f.write('\n'.join(new_lines))
