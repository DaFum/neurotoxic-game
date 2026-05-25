# src/ui/shared - Agent Instructions

- Shared primitives must not import game state, domain data, or feature workflows; keep only generic UI presentation and generic UI event behavior.
- Tooltip-like wrappers must preserve disabled-element accessibility (`aria-describedby`, keyboard focusability).
- Use `Object.hasOwn()` when reading optional `aria-*`, `style`, or `className` from unknown child props. Ignore missing or non-string values instead of trusting inherited props.
- `Tooltip` disabled-child behavior: show on disabled children, keep hover/focus tracking on the wrapper, preserve `aria-describedby`, and do not invoke the child's own `onMouseEnter`/`onFocus`. Bubbling those events to the disabled child re-fires the consumer handler. Regression guard in `tests/ui/Tooltip.test.jsx`.
- Invalid `Tooltip` children or fragments warn and return the child unchanged; add/update `Tooltip` tests for accessibility regressions instead of hiding them with local fallbacks.

## Long-Term Assets

- `GeneratedImagePanel` is the only component that loads Pollinations URLs. UI consumers pass `prompt` and optional `sizeHint`; URL resolution, offline fallback, and the `onError` recursion guard are encapsulated. Don't bypass it with raw `<img src={resolveGenImageUrl(...)}>` — the panel handles cleanup and the `--section-accent`-aware border.
- Section views (registered in `src/components/assets/sectionRegistry.ts`) set `--section-accent` once on the scene root; downstream components in `src/components/assets/` read it via `var(--section-accent, var(--color-toxic-green))`. No prop drilling.
