# src/ui/bandhq/hooks — Agent Instructions

## Scope

Applies to `src/ui/bandhq/hooks/**`.

## Hook Responsibilities

- Hooks orchestrate Band HQ actions and toasts; reducers/action creators remain source of truth for state transitions.
- Keep hook APIs stable and explicit; avoid leaking transient internal helper state.

## TypeScript & React Notes

- Include complete dependency arrays (`social`, `t`, dispatch/update handlers, derived state slices) for every callback/effect.
- Type hook arguments/returns explicitly to prevent drift in public hook contracts.
- Use `unknown` + narrowing for untrusted payload fragments before constructing patches.

## Gotchas

- Ownership and affordability checks must match runtime effect handling paths.
- Success/failure toast content must align with sanitized, actually-applied changes.
