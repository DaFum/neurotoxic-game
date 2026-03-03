import re

with open('src/context/GameState.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the exact block in GameState.jsx
# We might have missed it if we searched for the wrong string.
if "addQuest" in content:
    print("Found addQuest")
    if "deadline" in content:
        print("Found deadline")
        if "relativeDeadline" in content:
            print("Found relativeDeadline")
        elif "deadlineOffset" in content:
            print("Found deadlineOffset")
        else:
            print("Did not find relativeDeadline or deadlineOffset")
else:
    print("Did not find addQuest")
