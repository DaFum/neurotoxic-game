import re

with open('tests/ui/BandHQ.test.jsx', 'r') as f:
    content = f.read()

content = content.replace("  test('basic tab reachability check', () => {",
                          "  test('basic tab reachability check', async () => {")

with open('tests/ui/BandHQ.test.jsx', 'w') as f:
    f.write(content)
