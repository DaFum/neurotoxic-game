import sys

with open("tests/ui/Overworld.test.jsx", "r") as f:
    content = f.read()

import re

# Looks like it didn't find the menu category button. The html structure we used has `menu-cat-btn`. Wait, do we wait for the state update after the first click?

save_test_fixed = """
      const openMenuBtn = document.querySelector('.gbtn.p.w-full')
      fireEvent.click(openMenuBtn)

      // we need to wait a tick maybe? Or we can just find it by text since it's just SYSTEM
      const sysCat = screen.getByText(/SYSTEM/i).closest('button')
      if (sysCat) fireEvent.click(sysCat)

      const saveButton = screen.getByText(/SAVE GAME/i).closest('button')
"""

content = re.sub(
    r"const openMenuBtn = document.querySelector\('\.gbtn\.p\.w-full'\)\n\s*fireEvent\.click\(openMenuBtn\)\n\s*const sysCat = document\.querySelectorAll\('\.menu-cat-btn'\)\[3\]\n\s*fireEvent\.click\(sysCat\)\n\s*const saveButton = screen\.getByText\(\/SAVE GAME\/i\)",
    save_test_fixed,
    content
)

with open("tests/ui/Overworld.test.jsx", "w") as f:
    f.write(content)
