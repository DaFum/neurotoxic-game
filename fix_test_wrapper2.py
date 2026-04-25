import sys

with open("tests/ui/Overworld.test.jsx", "r") as f:
    content = f.read()

import re

# Since the span wraps the text, we might need a broader query or use getByRole
content = re.sub(r'screen.getByText\(\/\\\[OPEN MENU\\\]\/i\)', "screen.getByRole('button', { name: /\\[OPEN MENU\\]/i })", content)

with open("tests/ui/Overworld.test.jsx", "w") as f:
    f.write(content)
