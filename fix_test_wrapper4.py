import sys

with open("tests/ui/Overworld.test.jsx", "r") as f:
    content = f.read()

import re

# Use a generic document query selector for the open menu button since it contains nested spans and a weird text representation
content = re.sub(r"expect\(screen\.getByText\(\/OPEN MENU\/i\)\.closest\('button'\)\)\.toBeInTheDocument\(\)", "expect(document.querySelector('.gbtn.p.w-full')).toBeInTheDocument()", content)
content = re.sub(r"const openMenuBtn = screen\.getByText\(\/OPEN MENU\/i\)\.closest\('button'\)", "const openMenuBtn = document.querySelector('.gbtn.p.w-full')", content)

with open("tests/ui/Overworld.test.jsx", "w") as f:
    f.write(content)
