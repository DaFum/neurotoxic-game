# Palette's Journal

## 2025-05-18 - Adding Weight to Instant Actions

**Learning:** Instant state changes (like purchasing items) can feel trivial or leave users unsure if the action registered. Adding a deliberate loading state with a micro-delay (500ms) provides necessary feedback, confirms the action's significance, and prevents accidental double-clicks.
**Action:** Implement `isLoading` states on primary transactional buttons, even if the underlying logic is synchronous, to enhance perceived value and user confidence.

## 2026-06-03 - Semantics of Custom Tabs

**Learning:** When using buttons for navigation within a single view (like tabs), visual styling isn't enough for screen readers. Without `role="tab"`, `role="tablist"`, and `aria-selected`, users relying on assistive technology lose context of their location and the relationship between the controls and the content.
**Action:** Always wrap custom tab-like navigation in `role="tablist"` and link tabs to their content panels using `aria-controls` and `aria-labelledby` to create a robust, navigable structure.

## 2026-06-03 - D-Pad Accessibility on Mobile Devices

**Learning:** Icon-only navigation buttons like the Mobile D-Pad (▲, ▼, ◄, ►) must have `aria-label` attributes to be accessible to screen readers, which might misinterpret or ignore the visual text symbols.
**Action:** Add descriptive `aria-label`s such as 'Move Up', 'Move Left', 'Move Down', and 'Move Right' to these buttons.
