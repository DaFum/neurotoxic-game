# src/domain - Agent Instructions

## Scope

Applies to `src/domain/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Domain modules are pure: return intent (`{ actions, sideEffects, ... }`), never call `dispatch`, mutate state, or persist storage directly. Callers in `src/context/**` and `src/hooks/**` dispatch the returned actions and execute side effects.
- Build actions only through `createXAction` helpers from `src/context/actionCreators`; do not hand-write action object shapes.
- Treat raw event/quest payloads as `unknown`; narrow with `isPlainObject` / explicit type guards before constructing actions, and `logger.warn` the rejected payload instead of throwing.
- Side effects must use the discriminated `SideEffect` union in `eventResolver.ts`; extend the union rather than adding ad-hoc effect shapes.

## Gotchas

- `resolveEvent` honors `choice._precomputedResult` to keep replay deterministic; do not re-run `resolveEventChoice` when this field is present.
- Quest `deadlineOffset` is resolved to absolute `deadline` against the caller's `currentDay`; do not store the offset on the quest after conversion.
