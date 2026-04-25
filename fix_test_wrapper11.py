import sys
with open("tests/ui/Overworld.test.jsx", "r") as f:
    content = f.read()

import re
content = re.sub(r"vi\.runAllTimers\(\)", "vi.advanceTimersByTime(1000)", content)

with open("tests/ui/Overworld.test.jsx", "w") as f:
    f.write(content)
