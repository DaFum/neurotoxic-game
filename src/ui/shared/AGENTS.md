# src/ui/shared - Agent Instructions

- Shared primitives must not import game state, domain data, or feature workflows; keep only generic UI presentation and generic UI event behavior.
- Tooltip-like wrappers must preserve disabled-element accessibility (`aria-describedby`, keyboard focusability).
- Use `Object.hasOwn()` when reading optional `aria-*`, `style`, or `className` from unknown child props. Ignore missing or non-string values instead of trusting inherited props.
- `Tooltip` disabled-child behavior: show on disabled children, keep hover/focus tracking on the wrapper, preserve `aria-describedby`, and do not invoke the child's own `onMouseEnter`/`onFocus`. Bubbling those events to the disabled child re-fires the consumer handler. Regression guard in `tests/ui/Tooltip.test.jsx`.
- Invalid `Tooltip` children or fragments warn and return the child unchanged; add/update `Tooltip` tests for accessibility regressions instead of hiding them with local fallbacks.
