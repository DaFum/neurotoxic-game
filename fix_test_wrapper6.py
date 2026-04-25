import sys

with open("tests/ui/Overworld.test.jsx", "r") as f:
    content = f.read()

import re

# Testing-library text matching with fragmented spans is notoriously annoying. Let's just fix it by updating the regex to match strictly how we see it in DOM or use container query.
content = re.sub(r"const sysCat = screen\.getByText\(\/⚙SYSTEM\/i\)", "const sysCat = document.querySelectorAll('.menu-cat-btn')[3]", content)

with open("tests/ui/Overworld.test.jsx", "w") as f:
    f.write(content)
