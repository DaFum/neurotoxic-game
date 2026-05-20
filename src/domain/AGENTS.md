# src/domain - Agent Instructions

## Purity contract

- Domain modules return intent (`{ actions, sideEffects, ... }`); they never call `dispatch`, mutate state, or persist storage. Callers in `src/context/**` and `src/hooks/**` dispatch the returned actions and execute side effects.
- Side effects must use the discriminated `SideEffect` union in `eventResolver.ts`; extend the union rather than adding ad-hoc effect shapes.
- Treat raw event/quest payloads as `unknown`; narrow with `isPlainObject` or explicit type guards before constructing actions, and `logger.warn` rejected payloads instead of throwing.

## Gotchas

- `resolveEvent` honors `choice._precomputedResult` to keep replay deterministic; do not re-run `resolveEventChoice` when this field is present.
- Quest `deadlineOffset` is resolved to absolute `deadline` against the caller's `currentDay`; do not store the offset on the quest after conversion.
