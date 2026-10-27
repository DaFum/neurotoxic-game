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

## Protected cash

- `getExpeditionProtectedCash`, `getExpeditionSpendableCash` and `withExpeditionSpendableCash` live in `spendableCash.ts`, free of heavy imports so the event engine and UI can use them; `loadout.ts` re-exports the first two.
- `APPLY_EVENT_DELTA` is not exempt from the cash floor: `enforceExpeditionCashFloor` keeps its non-cash effects and holds only the cash debit at the floor. Whether an optional cost may be chosen is decided earlier, by `isOptionAffordable` (see `src/utils/eventEngine/AGENTS.md`), so clipping normally never buys a full reward for a partial payment. The one exception is the lockout fallback: when no sibling option is choosable, `isOptionAffordable` allows a cost above spendable cash, the floor clips only the debit and the option's other effects still apply.
- `SET_TERMINAL_OUTCOME` is exempt from the floor like the other terminal actions, and `event_game_over` is a terminal-only failure reason: it is never derived as a pending crisis.
- `checkSoftlock` takes the effective `fuelMultiplier` so the stranded verdict prices a leg at the litres settlement burns.

## Composition

- Numeric rules (what a thing is worth) and route-pressure weights (how often it is offered) are separate axes with one owner each: `getEffectiveExpeditionRules` and `getExpeditionRoutePressureProfile`. Never branch on a Region or Tour id outside the registries.
- Contract evidence is run-scoped and re-derived on load: a failed or quit gig carries no accuracy evidence (`gigOutcomeByStep[step].failed`), gig outcomes are keyed by the node's canonical `routeStep` (never the visited-path index, which a Nemesis Key jump shifts), and double-down breaches are rebuilt from signals banked after `acceptedAtRouteStep`. Heat an event adds settles obligation invariants in the same commit through `applyObligationSignal`, and a breached tour-ending Contract makes `handleCompleteExpedition` finalize as `failed`. A resolved Crew Contact leaves a durable `<sourceId>:contact_resolved:<step>` marker in `resolvedCrewSourceIds`, independent of its optional intel grant. `START_EXPEDITION` seeds `bandInjuryByMemberId` from `career.bandConsequenceByMemberId`. Gig Crew stress is classified only through `classifyGigCrewStress` (failed gig = `poor_gig`).
