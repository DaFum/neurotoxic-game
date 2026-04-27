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

## Recent Findings (2026-04)

- Hook outputs consumed by tabs/modals should expose stable open/close semantics so scene-level menu refactors don’t require hook rewrites.
- Validate `item.id` inside lock-guarded try/catch paths so `finally` cleanup always runs; pre-try throws can leave `processingItemId` stale.
- Fame-currency ownership patches must use the resolved effect (`resolvedEffect`) rather than raw validation effect payloads to avoid mismatched upgrade tracking.
- Processing-lock state should avoid falsy coercion (`|| null`) for IDs; use nullish-safe assignment so ref/state mirrors stay consistent even on invalid-but-falsy values.
