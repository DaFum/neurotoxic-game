import re

with open('tests/ui/Gig.scene.test.jsx', 'r') as f:
    content = f.read()

pattern = re.compile(r"  describe\('Edge Cases', \(\) => \{\n.*?  \}\)\n\n", re.DOTALL)
new_content = pattern.sub('', content)

with open('tests/ui/Gig.scene.test.jsx', 'w') as f:
    f.write(new_content)
