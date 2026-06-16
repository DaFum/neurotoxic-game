import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # run eslint --fix
    os.system(f"npx eslint --fix {filepath}")

    with open(filepath, 'r') as f:
        content = f.read()

    # We will just write a simple script to strip the unused variables output from eslint
    # Actually, eslint with --fix doesn't remove unused imports in standard configs unless there's an unused-imports plugin

    # We can parse the warnings and remove them
    return

for root, dirs, files in os.walk('src/utils/economy/gigLogic'):
    for file in files:
        if file.endswith('.ts'):
            fix_file(os.path.join(root, file))
