# Travel/Arrival Consolidation Note

## Goal
Reduce overlap in travel completion behavior while preserving the existing two-hook orchestration model.

## Previous path

### Overworld travel path
- `useTravelLogic.onTravelComplete()`:
  - applied travel costs and node transition,
  - advanced day and autosaved,
  - manually triggered transport/band travel events,
  - delegated node-type handling to `handleNodeArrival()`.

### Minigame arrival path
- `useArrivalLogic.handleArrivalSequence()`:
  - advanced day and autosaved,
  - applied harmony-regen behavior,
  - triggered travel events via `processTravelEvents()`,
  - delegated routing to `handleNodeArrival()` and ensured OVERWORLD fallback.

## New canonical split

The repository keeps **two orchestration entry points** (Overworld click-travel and minigame completion), but now shares one event-trigger primitive:

- `arrivalUtils.processTravelEvents(node, triggerEvent)` is the canonical travel-event trigger helper.
- `useTravelLogic` and `useArrivalLogic` both rely on this helper instead of parallel inline trigger logic.

## Why this is canonical

- Same category ordering and fallback semantics in both arrival paths.
- Reduces drift risk when travel event policy changes.
- Keeps side-effects in hooks and node-type resolution in shared utils, preserving architecture boundaries.

## Deprecated/removed alt paths

- Removed duplicated inline transport/band travel event triggering from `useTravelLogic`.
- No runtime path deletion was performed beyond that consolidation.

## Agent guidance

### Canonical primitive agents may use
- Agents may call `arrivalUtils.processTravelEvents(node, triggerEvent)` as the canonical travel-event primitive.
- This primitive is an event trigger helper only; it does **not** replace human-reviewed orchestration in `useTravelLogic` or `useArrivalLogic`.

### Allowed actions for agents
- Read-only diagnostics and consistency checks around travel/arrival flow.
- Safe event triggering through `processTravelEvents` after validating node/context assumptions.
- Automated test execution and reporting for arrival/travel regressions.

### Disallowed actions for agents
- Performing stateful sequencing such as `advanceDay` or `saveGame`.
- Direct node-type routing decisions or bypassing `handleNodeArrival`.
- Altering harmony-regen behavior or introducing parallel arrival side-effect paths.

### When to use agents
- Diagnostics, automated tests, and constrained event-trigger checks.

### When not to use agents
- Authoritative game-state transitions and hook-owned sequencing responsibilities.

## Follow-up recommendation

If a larger refactor is approved, extract a single tested arrival orchestration service/hook for:
- `advanceDay` + `saveGame` sequencing,
- harmony regen,
- travel-event phase,
- routing fallback behavior.
