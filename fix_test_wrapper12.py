import sys
with open("tests/ui/Overworld.test.jsx", "r") as f:
    content = f.read()

import re
# Testing interaction in tests can be flaky, specially since `handleSaveWithDelay` uses `setTimeout` internally!
# And fake timers are active. Wait! In the code, `handleSaveWithDelay` uses `setTimeout(..., 500)`. So we need to wait 500ms for it to actually save!
content = re.sub(r"vi\.advanceTimersByTime\(1000\)", "vi.advanceTimersByTime(1000)", content)
content = re.sub(r"const saveButtons = document\.querySelectorAll\('\.menu-sub-item'\)\n\s*if \(saveButtons\.length > 0\) fireEvent\.click\(saveButtons\[0\]\)", "const saveButtons = document.querySelectorAll('.menu-sub-item')\n      if (saveButtons.length > 0) fireEvent.click(saveButtons[0])\n\n      await act(async () => {\n        vi.advanceTimersByTime(600)\n      })", content)

with open("tests/ui/Overworld.test.jsx", "w") as f:
    f.write(content)
