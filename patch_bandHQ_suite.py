import re

with open('tests/ui/BandHQ.test.jsx', 'r') as f:
    content = f.read()

content = content.replace("describe('BandHQ', () => {", "describe('BandHQ UI tests', () => {")

with open('tests/ui/BandHQ.test.jsx', 'w') as f:
    f.write(content)
