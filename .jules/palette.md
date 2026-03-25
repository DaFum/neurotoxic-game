# Palette's Journal

## 2024-05-14 - Initial Setup

**Learning:** Initializing journal to track critical UX and accessibility learnings.
**Action:** Ready to paint!

## 2024-05-14 - Semantic List Selection

**Learning:** Custom interactive lists (like track selectors or character choices) that simulate radio button behavior are often built using `div` or generic `button` tags. Without the `radiogroup` and `radio` roles, screen readers announce them as disconnected buttons, making the relationship and selection state unclear.
**Action:** Always apply `role="radiogroup"` to the container with a descriptive `aria-label`, and `role="radio"` with `aria-checked` to the selectable children items when building custom single-choice lists.

## 2023-10-27 - MapNode Keyboard Accessibility

**Learning:** Adding focus-visible indicators to interactive divs used as buttons (like MapNode.jsx) is critical for keyboard accessibility. A `tabIndex` alone isn't enough; the user needs a clear visual cue when they tab to an element.
**Action:** Always ensure that any element acting as an interactive component has focus states, preferably using `focus-visible` styles like `focus-visible:ring-2 focus-visible:ring-toxic-green` to match this project's design language.

## 2024-05-14 - Keyboard Accessibility for Visually Hidden Inputs

**Learning:** When using visually hidden accessible `<input>` elements (via `.sr-only`) that should trigger focus states on sibling elements, using Tailwind's `has-[:focus-visible]` on the parent wrapper fails to capture keyboard focus from the sibling input.
**Action:** Use the `.peer` class on the hidden `<input>` and `.peer-focus-visible` classes on the custom visual sibling element to ensure keyboard focus indicators are correctly styled and displayed.
