## 2025-05-20 - E2E Reliability vs Unit Tests for Rendering Logic
**Learning:** E2E tests (`playwright`) are unreliable for verifying rendering logic (like lane visibility) in this codebase due to frequent audio context crashes/timeouts in the headless environment.
**Action:** Prioritize mocking rendering libraries (PixiJS) in unit tests to verify optimization logic (e.g., ensuring `clear()` is not called) rather than relying on visual verification via E2E scripts.
