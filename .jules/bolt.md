## 2025-05-20 - E2E Reliability vs Unit Tests for Rendering Logic

**Learning:** E2E tests (`playwright`) are unreliable for verifying rendering logic (like lane visibility) in this codebase due to frequent audio context crashes/timeouts in the headless environment.
**Action:** Prioritize mocking rendering libraries (PixiJS) in unit tests to verify optimization logic (e.g., ensuring `clear()` is not called) rather than relying on visual verification via E2E scripts.

## 2025-03-02 - React SVG Icons Optimization

**Learning:** Pure UI decoration components (like SVG icons) in heavily re-rendered environments like BrutalistUI.jsx should be wrapped in `React.memo()` to prevent unnecessary re-renders across the app, as their props typically consist only of simple string class names.
**Action:** Always use `React.memo` for static UI decorations, especially when creating custom UI component libraries.

## 2025-05-20 - Object.keys vs Object.entries
**Learning:** In hot loops, iterating over an array once is faster than using multiple `.find()` calls to retrieve distinct elements from the same array.
**Action:** Always favor a single `for` loop pass when looking up multiple distinct elements from the same array to reduce overhead.
