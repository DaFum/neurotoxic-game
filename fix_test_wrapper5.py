import sys

with open("tests/ui/Overworld.test.jsx", "r") as f:
    content = f.read()

import re

# Since testing-library struggles, I will fix the selector
content = re.sub(r"const sysCat = screen\.getByText\(\/SYSTEM\/i\)", "const sysCat = screen.getByText(/⚙SYSTEM/i)", content)

with open("tests/ui/Overworld.test.jsx", "w") as f:
    f.write(content)
