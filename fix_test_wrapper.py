import sys

with open("tests/ui/Overworld.test.jsx", "r") as f:
    content = f.read()

import re

# replace expect(screen.getByText(/OPEN MENU/i)).toBeInTheDocument() with finding the button
content = content.replace("expect(screen.getByText(/OPEN MENU/i)).toBeInTheDocument()", "expect(screen.getByText(/\\[OPEN MENU\\]/i)).toBeInTheDocument()")
content = content.replace("const openMenuBtn = screen.getByText(/OPEN MENU/i)", "const openMenuBtn = screen.getByText(/\\[OPEN MENU\\]/i)")

with open("tests/ui/Overworld.test.jsx", "w") as f:
    f.write(content)
