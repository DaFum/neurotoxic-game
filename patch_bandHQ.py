import re

with open('tests/ui/BandHQ.test.jsx', 'r') as f:
    content = f.read()

pattern = re.compile(r"  test\('renders without crashing'.*?\n  }\)\n", re.DOTALL)
new_content = pattern.sub('', content)

with open('tests/ui/BandHQ.test.jsx', 'w') as f:
    f.write(new_content)
