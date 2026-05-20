# src/ui/shared - Agent Instructions

- Shared primitives must stay app-agnostic and presentation-only.
- Tooltip-like wrappers must preserve disabled-element accessibility (`aria-describedby`, keyboard focusability).
- Use `Object.hasOwn()` when reading optional `aria-*`, `style`, or `className` from unknown child props.
- `Tooltip` must show on disabled children WITHOUT invoking the child's own `onMouseEnter`/`onFocus`. The wrapper owns hover/focus tracking; bubbling those events to the disabled child re-fires the consumer handler. Regression guard in `tests/ui/Tooltip.test.jsx`.
