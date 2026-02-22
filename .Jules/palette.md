# Palette's Journal

## 2026-02-23 - Standardized Async Button Feedback

**Learning:** `GlitchButton` is the primary interactive element. Adding a unified `isLoading` state (with spinner and aria-busy) prevents user confusion during async operations like audio initialization and game loading, which can be slow.
**Action:** Use the `isLoading` prop on `GlitchButton` for any async action that might take >300ms.
