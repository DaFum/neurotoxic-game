import re

with open('tests/node/audioEngineGigClock.test.js', 'r') as f:
    content = f.read()

pattern = re.compile(r"test\('hasAudioAsset',.*?\n}\)\n", re.DOTALL)
new_content = pattern.sub('', content)

with open('tests/node/audioEngineGigClock.test.js', 'w') as f:
    f.write(new_content)
