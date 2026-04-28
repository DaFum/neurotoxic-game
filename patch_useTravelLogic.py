import re

with open('tests/node/useTravelLogic.test.js', 'r') as f:
    content = f.read()

content = content.replace("  test('prevents playing a gig at the same location consecutively', async () => {\n    const defaults = createTravelLogicProps()",
                          "  test('prevents playing a gig at the same location consecutively', async () => {\n    setupJSDOM()\n    const defaults = createTravelLogicProps()")

with open('tests/node/useTravelLogic.test.js', 'w') as f:
    f.write(content)
