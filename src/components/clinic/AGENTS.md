# src/components/clinic - Agent Instructions

## Purpose and Limitations

Clinic agents route interactions through existing economy/health action creators and callbacks, read resolved state for costs, deltas, and failure reasons, and use i18n keys for visible text. They must not directly mutate store state, perform side effects beyond dispatching provided actions, or duplicate Band HQ/shop business logic; consult the Scope, Rules, and Gotchas below when changing clinic UI flows. Use clinic agents for treatment purchase/validation flows, and use direct UI handlers only for local presentation state.

## Scope

Applies to `src/components/clinic/**`.

## Rules

- Keep clinic actions routed through existing economy/health action creators and callbacks.
- Display costs, deltas, and failure reasons from resolved state changes, not optimistic requested values.
- Use i18n keys for treatment names, button labels, and toast text.

## Gotchas

- Clinic affordability checks must match the same money clamp and applied-delta behavior used by Band HQ/shop flows.
