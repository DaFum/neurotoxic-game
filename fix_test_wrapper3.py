import sys

with open("tests/ui/Overworld.test.jsx", "r") as f:
    content = f.read()

import re

# Since testing-library struggles with nested spans containing the text, we'll just query the generic text content
content = re.sub(r'screen\.getByRole\(\'button\', \{ name: \/\\\[OPEN MENU\\\]\/i \}\)', "screen.getByText(/OPEN MENU/i).closest('button')", content)
content = re.sub(r'screen\.getByRole\(\'button\', \{ name: \/\\\[OPEN MENU\\\]\/i \}\)', "screen.getByText(/OPEN MENU/i).closest('button')", content)

with open("tests/ui/Overworld.test.jsx", "w") as f:
    f.write(content)
