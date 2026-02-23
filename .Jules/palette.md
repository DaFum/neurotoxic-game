# Palette's Journal

## 2025-05-18 - Adding Weight to Instant Actions
**Learning:** Instant state changes (like purchasing items) can feel trivial or leave users unsure if the action registered. Adding a deliberate loading state with a micro-delay (500ms) provides necessary feedback, confirms the action's significance, and prevents accidental double-clicks.
**Action:** Implement `isLoading` states on primary transactional buttons, even if the underlying logic is synchronous, to enhance perceived value and user confidence.
