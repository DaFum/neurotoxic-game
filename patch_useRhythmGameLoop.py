import re

with open('tests/ui/useRhythmGameLoop.test.jsx', 'r') as f:
    content = f.read()

# Fix the placement of the added test
content = content.replace("  })\n})\n\n  it('initializes and calculates progress on update', () => {",
                          "  })\n\n  it('initializes and calculates progress on update', () => {")

# Move the final closing block
content += "\n})\n"

with open('tests/ui/useRhythmGameLoop.test.jsx', 'w') as f:
    f.write(content)
