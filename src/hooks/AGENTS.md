# src/hooks - Agent Instructions

## Scope

Applies to `src/hooks/**` unless a deeper `AGENTS.md` overrides it!

## Rules

- Hooks orchestrate callbacks and state reads; reducers/action creators own state transitions.
- Include complete dependency arrays, including `t` when used.
- Return stable, explicit APIs for hooks consumed by components or tests.
- Treat storage, event, API, and unknown callback payloads as `unknown` and narrow before use.

## Gotchas

- Derive UI toast values from pre-dispatch state; `useReducer` dispatch does not synchronously update refs.
- Travel confirmation/resource checks must include guaranteed daily upkeep when the route also advances the day.
- Lock state such as `processingItemId` must clean up in `finally`, including pre-effect validation failures.
- `useArrivalLogic` keys `isHandlingRef` on the arriving `nodeId` (sentinel: `undefined`, not `null` — `null` collides with valid empty `currentNodeId`). Do not reset the ref in the success path; the `useEffect` cleanup keyed on `player.currentNodeId` owns that lifecycle.
- Band harmony is clamped to a minimum of `1` (never `0`); `arrivalUtils` uses `harmony <= 1` as the deterministic gig-cancellation check, with probabilistic cancellation above that ("Chaos Tour Mechanic"). A `harmony <= 0` branch is unreachable — do not reintroduce one.
- `usePreGigLogic` "spend money to increase harmony" flows must refund and toast "maxed out" when `band.harmony >= 100` instead of charging the cost; clamps don't refund money.
