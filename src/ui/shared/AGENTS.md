# src/ui/shared - Agent Instructions

## Scope

Applies to `src/ui/shared/**`.

## Rules

- Shared primitives must remain app-agnostic and presentation-oriented.
- Treat incoming props/events as boundary data; narrow before reading optional child props.
- Compose consumer handlers (`onFocus`, `onBlur`, pointer handlers) instead of replacing them.

## Gotchas

- Tooltip-like wrappers must preserve disabled-element accessibility behavior (`aria-describedby`, keyboard focusability).
- Use own-property checks when reading optional `aria-*`, `style`, or `className` props from unknown child objects.
