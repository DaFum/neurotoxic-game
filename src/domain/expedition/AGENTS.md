# src/domain/expedition - Agent Instructions

## Committed vs. candidate state

- At `START_EXPEDITION` the loadout is **not committed yet**: the transaction is still building the next state, so `state.expedition.loadout` is stale. Every `(state)` reader — `getEffectiveExpeditionRules`, `getExpeditionRoutePressureProfile`, `selectExpeditionRivalForRun` — therefore resolves the **baseline** Region/Tour profile there. Resolve against the validated candidate instead: `{ ...state, expedition: { ...state.expedition, loadout: normalized } }`. Reading `state` silently disabled starting Heat, starting spare parts, `forcedRival` and route-specific Sponsor staging while tests that injected a loadout kept passing.
- `PREPARE_EXPEDITION_RUN` runs on Tour Prep entry, before the player has picked a Region or Tour, so nothing derived from those two may be staged there. Derive it from the prepared route, which carries `regionId` and `tourTypeId`.

## Route determinism

- `buildExpeditionMap` stays pure in `(runSeed, tourTypeId, regionId)`. Tour Prep preview and the played route are compared by `mapHash`, so no value a build edit can change may reach it — that is why registry-only composers such as `getExpeditionRegistryRareRewardChanceMultiplier` exist, and why chassis, modules and Crew cannot contribute to route content.
- Adding or removing an `rng()` call in the builder shifts the seeded stream and changes every route on every seed. Expect fixture churn; see `tests/node/AGENTS.md`.

## Reward proof

- A seeded gate proves an event _could_ occur at a route step, never that it did. `sourceId`, `resolvedEventSourceIds`, `materialized` and the ledger entries themselves are all save-authored and cannot authenticate a reward. Every `event_rare` entry is dropped on load for that reason; do not re-admit them without reducer-authored evidence a save cannot construct.
- A settlement bonus needs run-scoped evidence. `completedQuestIds` only ever grows, so it proves history, not that a milestone happened in the run being settled.

## Composition

- Numeric rules (what a thing is worth) and route-pressure weights (how often it is offered) are separate axes with one owner each: `getEffectiveExpeditionRules` and `getExpeditionRoutePressureProfile`. Never branch on a Region or Tour id outside the registries.
