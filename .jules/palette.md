# Palette's Journal

## 2024-05-14 - Initial Setup

**Learning:** Initializing journal to track critical UX and accessibility learnings.
**Action:** Ready to paint!

## 2024-05-14 - Semantic List Selection

**Learning:** Custom interactive lists (like track selectors or character choices) that simulate radio button behavior are often built using `div` or generic `button` tags. Without the `radiogroup` and `radio` roles, screen readers announce them as disconnected buttons, making the relationship and selection state unclear.
**Action:** Always apply `role="radiogroup"` to the container with a descriptive `aria-label`, and `role="radio"` with `aria-checked` to the selectable children items when building custom single-choice lists.
