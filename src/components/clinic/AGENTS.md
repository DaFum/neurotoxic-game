# src/components/clinic - Agent Instructions

## Scope

Applies to `src/components/clinic/**`.

## Rules

- Keep clinic actions routed through existing economy/health action creators and callbacks.
- Display costs, deltas, and failure reasons from resolved state changes, not optimistic requested values.
- Use i18n keys for treatment names, button labels, and toast text.

## Gotchas

- Clinic affordability checks must match the same money clamp and applied-delta behavior used by Band HQ/shop flows.
