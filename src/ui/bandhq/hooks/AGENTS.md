# src/ui/bandhq/hooks - Agent Instructions

## Scope

Applies to `src/ui/bandhq/hooks/**`.

## Rules

- Hooks orchestrate Band HQ actions and toasts; reducers/action creators own state transitions.
- Export explicit named return interfaces (`useX(...): XResult`) for public hooks.
- Include full dependencies (`social`, `t`, dispatch/update handlers, derived state slices).
- Clean up processing locks in `finally`, including validation failures before effects run.

## Gotchas

- Fame-currency ownership patches must use the resolved effect, not raw validation payloads.
- Processing lock IDs must use nullish-safe assignment; do not collapse falsy IDs with `|| null`.
- Toast content must reflect sanitized, actually applied changes.
