import re

with open('tests/ui/BandHQ.test.jsx', 'r') as f:
    content = f.read()

# Need to await the dynamic import inside the test block
content = content.replace("    const { container } = render(React.createElement(BandHQ, props))",
                          "    const { BandHQ: AsyncBandHQ } = await import('../../src/ui/BandHQ.tsx')\n    const { container } = render(React.createElement(AsyncBandHQ, props))")

with open('tests/ui/BandHQ.test.jsx', 'w') as f:
    f.write(content)
