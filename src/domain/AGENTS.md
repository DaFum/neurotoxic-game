# src/domain - Agent Instructions

## Purity

- Domain modules return intent (`{ actions, sideEffects, ... }`); they never call `dispatch`, mutate state, or persist storage. Callers in `src/context/**` and `src/hooks/**` dispatch the returned actions and execute side effects.

## Side Effects

- Side effects must use the discriminated `SideEffect` union in `eventResolver.ts`. Add a typed union variant and handler case instead of returning loose objects through `sideEffects`.
- Domain modules must not import `gameReducer` or replay reducer state. The `saveGame` side effect carries no state; `useEventSystem` materializes the post-resolution snapshot by replaying the returned actions through the reducer. Quest `deadlineOffset` resolution computes the post-delta day purely (day deltas are additive in `applyEventDelta`).

## Payloads

- Treat raw event/quest payloads as `unknown`; narrow with `isLooseRecord` or explicit type guards before constructing actions. Use `logger.warn` and skip payloads that fail those guards instead of throwing from domain helpers.

## Gotchas

- `resolveEvent` honors `choice._precomputedResult` to keep replay deterministic; do not re-run `resolveEventChoice` when this field is present.
- Quest `deadlineOffset` is resolved to absolute `deadline` against the caller's `currentDay`; do not store the offset on the quest after conversion.
