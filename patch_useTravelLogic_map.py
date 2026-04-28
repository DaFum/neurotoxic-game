import re

with open('tests/node/useTravelLogic.test.js', 'r') as f:
    content = f.read()

# Add missing connections to gameMap
replacement = """      gameMap: {
        connections: [],
        nodes: {"""

content = content.replace("      gameMap: {\n        nodes: {", replacement)

with open('tests/node/useTravelLogic.test.js', 'w') as f:
    f.write(content)
