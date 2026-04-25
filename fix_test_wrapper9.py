import sys
with open("tests/ui/Overworld.test.jsx", "r") as f:
    content = f.read()

import re

# Timeout is because of our `await new Promise((r) => setTimeout(r, 50))` while fake timers are used!
# We just need to advance the fake timers instead of real waiting!

save_test_fixed = """
      const openMenuBtn = document.querySelector('.gbtn.p.w-full')
      if (openMenuBtn) fireEvent.click(openMenuBtn)

      // advance timers for React/Framer Motion
      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      const sysCats = document.querySelectorAll('.menu-cat-btn')
      if (sysCats.length > 3) fireEvent.click(sysCats[3])

      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      const saveButtons = document.querySelectorAll('.menu-sub-item')
      if (saveButtons.length > 0) fireEvent.click(saveButtons[0])
"""

content = re.sub(
    r"const openMenuBtn = document\.querySelector\('\.gbtn\.p\.w-full'\)\n\s*if \(openMenuBtn\) fireEvent\.click\(openMenuBtn\)\n\s*\/\/ advance timers for React\/Framer Motion\n\s*await act\(async \(\) => \{\n\s*vi\.advanceTimersByTime\(200\)\n\s*\}\)\n\s*const sysCats = document\.querySelectorAll\('\.menu-cat-btn'\)\n\s*if \(sysCats\.length > 3\) fireEvent\.click\(sysCats\[3\]\)\n\s*await act\(async \(\) => \{\n\s*vi\.advanceTimersByTime\(200\)\n\s*\}\)\n\s*const saveButtons = document\.querySelectorAll\('\.menu-sub-item'\)\n\s*if \(saveButtons\.length > 0\) fireEvent\.click\(saveButtons\[0\]\)",
    save_test_fixed,
    content
)

# wait, I need to match the previous string
save_test_old = """
      const openMenuBtn = document.querySelector('.gbtn.p.w-full')
      if (openMenuBtn) fireEvent.click(openMenuBtn)

      // we need to wait a tick since Framer Motion AnimatePresence is used
      await new Promise((r) => setTimeout(r, 50))

      const sysCats = document.querySelectorAll('.menu-cat-btn')
      if (sysCats.length > 3) fireEvent.click(sysCats[3])

      await new Promise((r) => setTimeout(r, 50))

      const saveButtons = document.querySelectorAll('.menu-sub-item')
      if (saveButtons.length > 0) fireEvent.click(saveButtons[0])
"""
content = content.replace(save_test_old, save_test_fixed)

with open("tests/ui/Overworld.test.jsx", "w") as f:
    f.write(content)
