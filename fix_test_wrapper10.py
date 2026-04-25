import sys
with open("tests/ui/Overworld.test.jsx", "r") as f:
    content = f.read()

import re
content = re.sub(
    r"(const saveButtons = document\.querySelectorAll\('\.menu-sub-item'\)\n\s*if \(saveButtons\.length > 0\) fireEvent\.click\(saveButtons\[0\]\))(\n\s*await act\(async \(\) => \{\n\s*fireEvent\.click\(saveButton\)\n\s*\}\))",
    r"\1",
    content
)

with open("tests/ui/Overworld.test.jsx", "w") as f:
    f.write(content)
