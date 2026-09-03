# Neurotoxic Roguelite Expedition – Implementation Plan Bundle

This bundle was derived from the attached `neurotoxic-game-main (4).zip` repository snapshot and the approved Roguelite Expedition design specification.

Execution order:

1. `2026-09-03-roguelite-expedition-master-plan.md`
2. `roguelite-expedition/01-expedition-core-extraction.md`
3. `roguelite-expedition/02-condition-repairs-cargo.md`
4. `roguelite-expedition/03-crew-stress-relationships.md`
5. `roguelite-expedition/04-pressure-rivals-contracts.md`
6. `roguelite-expedition/05-meta-regions-ascension.md`
7. `roguelite-expedition/06-balance-simulator-recalibration.md`

The master plan contains the dependency graph, merge gates, repository-impact map, spec coverage matrix, simulator measurement strategy, and final acceptance gates. Each child plan is TDD-oriented and contains exact files, focused commands, expected outcomes, and commit checkpoints.


## PR #2884 plan-review corrections

This bundle incorporates the review findings against commit `9ec062c1e5a5c19026f3f94d22e39795c67939c0`:

- crash-safe unlock-set debit/marker ordering with recovery journal,
- deterministic 1-of-3 draft fallback across all source types,
- registered `standard` tour type for the Festival simulation profile,
- stable persisted `runId` created at `START_EXPEDITION`,
- one canonical Node-Intel contract with Level-2 exact values,
- reducer finalization separated from `RUN_SUMMARY` navigation,
- `Object.hasOwn` crew-registry boundary checks,
- reducer-side finite-number validation for Career progression.

The correction pass also removes a forward dependency from G1 Node Intel to the G2 Condition formula: G1 declares the projection fields, and G2 fills them once deterministic wear exists.

---

# Roguelite Expedition Tour Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Neurotoxic's current 10-hop touring loop into a 20–30 minute roguelite expedition with loadout commitment, hybrid fog of war, extraction, condition/cargo/insurance, crew stress, pressure/rivals/contracts, targeted run drafts, starter/legendary perks, meta progression, and simulator-backed balance gates while reusing the existing map, gig, minigame, social, quest, event, asset, and persistence architecture.

**Architecture:** Add two explicit state domains: `expedition` for the currently active/saved run and `career` for progression that survives between tours. Preserve current canonical owners for cash/fame (`player`), fuel and the legacy van bridge (`player.van`), stamina/harmony (`band`), social controversy (`social`), and long-term chassis/modules (`assets`); new systems reference or adapt these rather than duplicating them. Implement the feature in six gated increments so every stage is playable, save-compatible, deterministic, and measurable before the next layer is added.

**Tech Stack:** React 19.2.8, TypeScript 6, Vite 8, Vitest 4, Node test runner, Playwright, i18next, Motion, existing reducer/action-creator state architecture, deterministic seeded simulation in `scripts/game-balance-simulation.mjs`.

---

## Design Reference

- Approved design: `docs/superpowers/specs/2026-09-03-roguelite-expedition-tour-design.md` in the GitHub repository.
- Repository rules: root `AGENTS.md`, `CLAUDE.md`, and nested `AGENTS.md` files under `src/context`, `src/context/reducers`, `src/domain`, `src/hooks`, `src/components/overworld`, `src/components/assets`, `src/ui/overworld`, `scripts`, `tests/node`, and `tests/ui`.
- This plan was derived from the attached repository ZIP, not from an abstract architecture sketch.

## Architecture Decisions Locked By This Plan

### A. Two new top-level state slices, not many unrelated fields

`GameState` gains:

```ts
expedition: ExpeditionState
career: CareerState
```

`expedition` is persisted because the player can save mid-run. `career` is persisted because it survives between runs. Capability unlock ownership stays with the existing `state.unlocks`/`src/utils/unlockManager.ts`; `career` stores progression counters, relationships, archive/discovery state, HQ facility levels, and rival history, not a second unlock registry.

### B. Existing canonical resources stay canonical

Do **not** create duplicate `expedition.cash`, `expedition.fuel`, `expedition.stamina`, or `expedition.harmony` fields.

| Gameplay concept | Canonical owner |
|---|---|
| Cash | `state.player.money` |
| Fame | `state.player.fame` |
| Fuel | `state.player.van.fuel` |
| Current travel-van condition bridge | `state.player.van.condition` |
| Stamina / Mood | `state.band.members[]` |
| Harmony | `state.band.harmony` |
| Social controversy | `state.social.controversyLevel` |
| Long-term tourbus chassis/modules | `state.assets` |
| Heat / Exposure / Obligations | `state.expedition` |

Heat is **not** an alias for controversy. Controversy remains public/social backlash; Heat models illegal/authority pressure.

### C. Do not create a third vehicle system

The existing code has two vehicle-related layers already:

1. `player.van` — actual travel fuel, travel minigame damage, breakdown chance, and current repair UI.
2. `tourbus_chassis` long-term assets — persistent chassis condition, modules, slots, upkeep, loans, risk events, and asset UI.

The Expedition system therefore adds `activeTourbusAssetId` to the loadout and a pure adapter that combines:

- live travel fuel/condition from `player.van`,
- chassis/module bonuses from the selected `tourbus_chassis`,
- expedition-only cargo/repair modifiers.

Do not immediately rewrite every travel caller to make `LongTermAsset.condition` the only van condition. That would couple expedition delivery to a risky save/data migration and foreclosure behavior. A later dedicated normalization can remove the compatibility bridge after Expedition is stable.

### D. `RESET_STATE` remains a full new-career reset

Do not overload `RESET_STATE` with “next tour” behavior. Introduce expedition lifecycle actions that reset run-only fields while preserving `career`, accumulated cash/fame, assets, long-term relationships, and unlocks.

### E. Map visibility and expedition intelligence are separate concepts

Existing `getNodeVisibility()` answers **structural visibility** (`visible` / `dimmed` / `hidden`) by layer. Expedition Fog of War answers **how much detail is revealed** for a structurally visible node.

Do not mutate generated map nodes to persist reveal state. Store reveal/intel level in `expedition.intelByNodeId` and derive the tooltip through a pure selector.

### F. Contracts are not quests and existing Brand Deals keep ownership of their current payouts

The new obligation engine is for run constraints and evaluation. Existing `social.activeDeals` remain the canonical economic lifecycle for legacy Brand Deals. A linked obligation record may reference a Brand Deal, but it must not duplicate its current upfront/per-gig payout.

### G. Pressure Director biases event selection; it never rubber-bands outcomes

The director may choose/queue an eligible event using deterministic weights. It must never secretly grant/withdraw money, modify player success probability to normalize runs, or bypass the event resolver.


### H. Existing unlock ownership remains authoritative

The repository already has a dedicated unlock boundary: `src/utils/unlockManager.ts` persists unlock ids and `src/utils/unlockCheck.ts` owns eligibility evaluation. New Expedition options therefore use namespaced unlock ids such as `expedition.region.industrial`, `expedition.tour.blitz`, and `expedition.crew.mika_tech` in the existing `state.unlocks` flow. `career` may record discovery/progress, but must not duplicate unlocked-region, unlocked-tour-type, or unlocked-crew arrays.

Baseline `home` + `standard` remain always-available defaults and do not require stored unlock markers.

### I. Cross-gate invariants fixed by the plan review

The following contracts are non-negotiable across the child plans:

- `START_EXPEDITION` creates one stable `expedition.runId` in the action creator; that id survives finalization/save/reload and is the idempotency key for the later career settlement. `RunSummary` never generates a replacement id.
- `FINALIZE_EXPEDITION` settles state only. It never changes `currentScene`; the owning continuation/extraction/arrival callback routes to `RUN_SUMMARY` after requesting the post-commit save.
- Node intelligence uses one stable result shape. Level 1 exposes ranges/qualitative risk only; exact payout/difficulty remain Level 2. G2 fills the already-declared projected-wear fields after the Condition formula exists.
- Run-draft source tags are preference weights, not hard candidate pools. The global unowned pool deterministically backfills a source and a draft is skipped cleanly when fewer than three global candidates remain.
- Unlock-set purchases use a persisted debit + pending journal as the durability barrier **before** `unlockManager` writes the separate set marker. Recovery handles pending-without-marker and pending-with-marker states without a free unlock or double charge.
- Crew registry ids from actions/persistence are checked with `Object.hasOwn`, and Career reducers independently reject non-finite deltas plus normalize persisted numeric addends with `finiteNumberOr`.
- `festival` is a region id, never a tour type id; the six tour ids are `standard`, `blitz`, `underground`, `corporate`, `rival_hunt`, and `survival`.

---

## Dependency Graph

```text
Preflight: freeze reviewed v14 balance artifacts
        |
        v
Foundation: state + saves + lifecycle primitives
        |
        v
1. Expedition Core + Loadout + Fog + Extraction
        |
        +--------------------+
        |                    |
        v                    v
2. Condition/Repairs/Cargo   3. Crew/Stress/Relationships
        |                    |
        +---------+----------+
                  |
                  v
4. Pressure/Rivals/Contracts/Social/Finales
                  |
                  v
5. Meta Hub/Regions/Tour Types/Ascension
                  |
                  v
6. Final Balance Recalibration + Regression Gates
```

Condition and Crew may be developed on separate branches **after Core is merged**, but Pressure should not merge until both are present because its event weighting and failure model uses their state.

---

## Implementation Order and Merge Gates

### Preflight baseline rule

Before the first production or simulator edit, execute Task 0 of `01-expedition-core-extraction.md` and copy the currently reviewed v14 JSON/Markdown reports to the immutable `game-balance-simulation-pre-expedition-v14.*` filenames. G2-G5 already extend the live simulator, so waiting until G6 would destroy the evidentiary baseline. G6 only validates that the frozen snapshot is still intact.

| Gate | Deliverable | Depends on | Merge condition |
|---|---|---|---|
| G0 | Historical baseline + state/save foundation | none | reviewed v14 balance artifacts frozen before feature changes; old v2 save loads; new state round-trips; screenshot fixture/type gates pass |
| G1 | Expedition Core | G0 | new game enters Tour Prep; standard run uses 8-hop map; fog/extraction/finale summary work |
| G2 | Condition/Cargo/Insurance | G1 | cargo capacity, grouped condition, repairs, hidden defects, optional insurance, supply decisions, minigame effects work |
| G3 | Crew | G1 | 3-slot crew loadout, stress/injury/relationship state, rest/gig/travel deltas and crisis events work |
| G4 | Pressure/Rivals/Contracts + targeted run drafts | G2+G3 | Heat/Exposure/Obligations, event director, linked sponsor contracts, persistent rivals, contextual finale and deterministic 1-of-3 key-moment drafts work |
| G5 | Meta progression | G4 | next-tour loop, HQ/meta facilities, regions, tour archetypes, pressure modifiers, crash-safe journaled unlock-set purchases, starter/legendary perks and archive work |
| G6 | Balance release gate | G5 | 2,000-run calibration+holdout reports updated; no hard safety breach; no single strategy dominates both safety and reward |

---

## Repository Areas Affected

### State and persistence

- `src/types/game.d.ts`
- `src/types/actions.d.ts`
- `src/types/index.ts`
- **Create:** `src/types/expedition.d.ts`
- **Create:** `src/types/career.d.ts`
- `src/context/initialState.ts:244-352`
- `src/context/actionTypes.ts`
- `src/context/actionCreators.ts`
- **Create:** `src/context/expeditionActionCreators.ts`
- **Create:** `src/context/careerActionCreators.ts`
- `src/context/gameReducer.ts`
- **Create:** `src/context/reducers/expeditionReducer.ts`
- **Create:** `src/context/reducers/careerReducer.ts`
- **Create:** `src/context/reducers/expeditionSanitizers.ts`
- **Create:** `src/context/reducers/careerSanitizers.ts`
- `src/context/reducers/systemReducer.ts:147-340, 520-650`
- `src/context/useGameDispatchActions.ts`
- **Create:** `src/context/useExpeditionDispatchActions.ts`
- **Create:** `src/context/useCareerDispatchActions.ts`
- `src/context/usePersistence.ts:65-101, 300-350`
- `src/context/reducers/migrations/index.ts`
- **Create:** `src/context/reducers/migrations/v2_to_v3.ts`
- `.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js`

### Expedition/map/scenes

- `src/context/gameConstants.ts:9-32`
- `src/components/SceneRouter.tsx`
- `src/scenes/mainmenu/hooks/useMainMenuStart.ts:45-75`
- **Create:** `src/scenes/TourPrep.tsx`
- **Create:** `src/scenes/RunSummary.tsx`
- **Create:** `src/ui/expedition/*`
- `src/context/useMapGeneration.ts:48-180`
- `src/utils/mapGenerator.ts`
- `src/utils/mapUtils.ts:49-60`
- `src/components/overworld/OverworldMap.tsx:118-195`
- `src/components/MapNodeView.tsx:152-269, 275-511`
- `src/ui/overworld/OverworldHUD.tsx`
- `src/scenes/Overworld.tsx`
- `src/hooks/useArrivalLogic.ts:153-246`
- `src/hooks/postGig/handlers/useContinueHandler.ts:78-190`
- `src/hooks/postGig/handlers/continueHandlerUtils.ts:160-195`

### Domain/data

- **Create:** `src/data/expedition/`
- **Create:** `src/domain/expedition/`
- `src/types/events.d.ts`
- `src/utils/gameState/delta.ts`
- `src/data/events/index.ts`
- **Create:** `src/data/events/crew.ts`
- **Create:** `src/data/events/pressure.ts`
- **Create:** `src/data/events/rival.ts`
- `src/utils/eventEngine/*`
- `src/domain/eventResolver.ts`

### Assets/travel/minigames

- `src/types/assets.d.ts`
- `src/utils/assetSelectors.ts`
- `src/utils/assetSections/tourbusModules.ts`
- `src/utils/assetConfig.ts`
- `src/hooks/travel/*`
- `src/context/reducers/minigameReducer.ts:90-340`
- `src/utils/dailyTickLogic.ts:82-125`
- `src/components/assets/*`
- `src/hooks/overworld/useSupplyStopModal.ts`
- existing pre-gig/minigame scenes and completion tests

### Crew/social/rivals/contracts

- `src/types/social.d.ts`
- `src/utils/rivalEngine.ts`
- `src/context/reducers/rivalReducer.ts`
- `src/context/useRivalBandDispatchActions.ts`
- `src/hooks/overworld/useRivalEscalation.ts`
- `src/data/brandDeals.ts`
- `src/utils/brandDealLogic.ts`
- `src/context/reducers/socialReducer.ts`
- `src/hooks/postGig/handlers/useDealHandlers.ts`
- `src/utils/postGig/socialResolution.ts`
- `src/data/postOptions.ts`
- `src/hooks/postGig/handlers/socialPostHandlerUtils.ts`

### Meta/HQ

- existing `src/components/assets/AssetsScene.tsx` and tourbus section UI
- existing BandHQ/UI surfaces rather than a duplicate management scene
- `src/utils/unlockManager.ts`
- `src/utils/unlockCheck.ts`
- `src/data/milestones/*` only where an existing milestone mechanism is the correct owner

### Localization

Use existing namespaces to avoid an unnecessary i18n bootstrap change:

- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `public/locales/en/events.json`
- `public/locales/de/events.json`
- `public/locales/en/assets.json`
- `public/locales/de/assets.json`

### Simulator/reports

- `scripts/game-balance-simulation.mjs`
- `scripts/game-balance-experiments.mjs`
- `scripts/game-balance-experiment-config.mjs`
- `scripts/game-balance-tension-report.mjs`
- `scripts/utils/balance-report-metadata.mjs`
- `reports/game-balance-simulation*.json|md`
- relevant `tests/node/game-balance-*.test.js`
- `tests/node/balanceSourceFiles.test.js`

---

## Test Strategy by Layer

### Reducer/domain tests

Use `node:test`/existing node-tier patterns for pure reducers, sanitizers, migrations, balance helpers, and deterministic domain functions.

Expected command pattern:

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/<file>.test.js
```

### React/UI tests

Use Vitest for scenes, HUD, map tooltip, dialogs and lifecycle hooks:

```bash
pnpm exec vitest run tests/ui/<file>.test.jsx
```

### Golden-path integration

Add reducer/action-creator sequences that cover:

```text
new career -> Tour Prep -> start expedition -> travel -> gig -> extraction -> Run Summary -> next Tour Prep
```

and later:

```text
loadout -> wear -> crew stress -> contract -> pressure event -> rival finale -> successful completion -> meta unlock
```

### Full gates after each merged stage

```bash
pnpm run typecheck:core
pnpm run typecheck
pnpm run test:dot
pnpm run deadcode:check
pnpm run deadcode:budget
pnpm run symbols:update
pnpm run symbols:check
```

Do **not** commit ignored `symbols.json` output.

### Release gate

```bash
pnpm run test:all
pnpm run test:e2e
pnpm run simulate:balance
pnpm run simulate:balance:tension
pnpm run validate:balance:tension-report
```

---

## Balance-Simulator Evolution by Gate

The simulator must evolve together with the feature; do not wait until all gameplay exists and then approximate it from scratch.

### G1 metrics — Expedition Core

Add per-run fields:

```js
{
  routeNodesVisited,
  extractionOffered,
  extractionTaken,
  extractionStep,
  finaleReached,
  finaleCompleted,
  outcome: 'extracted' | 'completed' | 'failed',
  retainedCash,
  retainedFame
}
```

New report sections:

- Run length / route depth
- Extraction curve by route step
- Finale completion vs voluntary extraction
- retained reward distribution

### G2 metrics — Condition/Cargo/Insurance

Add:

```js
{
  conditionMinByGroup,
  defectsCreated,
  hiddenDefectsDiscovered,
  repairCountsByType,
  repairSpend,
  sparePartsUsed,
  supplySpend,
  insuranceSpend,
  insuranceClaims,
  disabledAssetGroups,
  cargoUtilizationPct
}
```

Report:

- condition by route depth,
- repair choice share,
- optional safety spend vs skipped repair,
- run failures attributable to technical condition,
- insurance take rate, premium spend, claim rate, and whether one policy dominates safety/reward.

### G3 metrics — Crew

Add:

```js
{
  crewPickIds,
  maxStressByCrew,
  crisisCount,
  injuryEscalations,
  crewRecoveryActions,
  relationshipEvents
}
```

Report:

- crew pick rates,
- stress/crisis distribution,
- injury severity,
- whether one crew role is mandatory for survival.

### G4 metrics — Pressure/Rivals/Contracts/Run Drafts

Add:

```js
{
  heatTimeline,
  exposureTimeline,
  obligationsAccepted,
  obligationsCompleted,
  obligationsFailed,
  pressureEventsByType,
  rivalEncounters,
  nemesisFinales,
  sponsorContractValue,
  draftsOffered,
  draftsAccepted,
  runTraitPickCounts
}
```

Report:

- Heat/Exposure trajectories,
- contract acceptance/completion/failure,
- pressure event frequency and repeat protection,
- clean vs high-Heat build outcomes.

### G5 metrics — Strategy diversity/meta

Scenario definitions become explicit loadout archetypes rather than only behavior knobs. Add at least:

- `clean_sponsor`
- `underground_heat`
- `diy_repair`
- `scout_intel`
- `high_exposure_performance`
- `rival_hunter`

Each scenario must define a canonical loadout/region/tour type/pressure modifier set, optional insurance policy, and starter perk where appropriate, then use the same production helper functions as the app.

Report:

- success/extraction/reward by archetype,
- safety vs reward Pareto comparison,
- chassis/module/crew pick dominance,
- whether any build dominates both safety and expected reward,
- starter-perk pick/success distribution and legendary-unlock incidence.

### Holdout requirements

Keep the existing disjoint calibration/selection/validation streams. Do not tune on the holdout stream. For new hard safety gates, calibration and holdout must both pass.

---

## Proposed Initial Hard and Soft Gates

Do **not** hard-code these until G1–G5 data exists. The plan uses staged measurement-first gates:

### Immediately hard-gated

- no invalid/unreachable map route,
- no extraction double-award,
- no negative/non-finite resources from Expedition reducers,
- no lost career state on next-tour reset,
- no stale run traits after reset,
- no contract double payout,
- no severe event repeat-protection breach,
- no save-load schema failure.

### Measured first, then converted to design corridors

- extraction rate,
- finale completion rate,
- technical failure rate,
- average repair spend,
- average crew crisis count,
- high-Heat failure rate,
- contract completion rate,
- per-archetype reward,
- route length / real-time run duration proxy.

This preserves the existing report philosophy: hard safety ceilings are blocking; design corridors remain non-blocking until enough data exists.

---

## Approved Spec Coverage Matrix

Every approved design requirement has an explicit implementation owner. This is the self-review map used to prevent a large subsystem from disappearing between child plans.

| Approved design area | Primary implementation owner | Verification owner |
|---|---|---|
| 20–30 minute / ~7–9 node short run | G1 Tasks 5–11; G5 tour profiles | G6 route-depth/run-duration proxy sections |
| Branching map + local event chains | G1 map lifecycle; G4 pressure events | G1 map tests + G4 event tests + G6 visitation |
| Hybrid Fog of War / scouting information | G1 node intel; G3 Scout crew; G4 run trait `backchannel` | G1/G3/G4 tests + G6 revealed-intel metrics |
| Hybrid Extraction + multiple fail states | G1 extraction/finalization; G2/G3/G4 failure contributors | G1 extraction tests + G6 paired extraction probe |
| Hybrid targeted 1-of-3 drafting | G4 Task 13 | G4 draft tests + G6 draft pick metrics |
| Cash/Fuel/Stamina/Harmony/Condition/Heat resource pressure | existing owners + G2/G3/G4 adapters | reducer/domain tests + G6 timelines/sinks |
| Vehicle/equipment condition, cargo, field repairs, hidden defects | G2 | G2 domain/integration tests + G6 condition metrics |
| Optional insurance risk sink | G2 insurance task | G2 insurance tests + G6 spend/claim metrics |
| Crew slots, stress, crises, relationships, staged injuries | G3 | G3 domain/UI/event tests + G6 crew metrics |
| Heat, Exposure, Obligations and authority encounters | G4 | G4 pressure/director tests + G6 pressure metrics |
| Persistent rivals / Nemesis and rival finales | G4 | G4 rival/finale tests + G6 encounter/finale shares |
| Sponsors/contracts as conditional risk deals | G4; legacy Brand Deals keep payout ownership | G4 obligation/idempotence tests + G6 contract metrics |
| Social as intel/Exposure/Heat lever | G4 | social integration tests + G6 pressure/intel metrics |
| Context-sensitive finales | G4 | finale priority tests + G5/G6 legendary/finale metrics |
| Starter perks with trade-offs | G5 Task 4 | G5 loadout/profile tests + G6 perk outcome metrics |
| Legendary finale rewards | G5 Task 4 | G5 storage/idempotence tests + G6 unlock incidence |
| HQ as meta hub, regions, tour archetypes | G5 Tasks 5–12 | UI/golden-path tests + G6 profile matrix |
| Unlock sets and bounded meta currencies | G5 Tasks 1–4 | journal ordering/recovery tests + save round-trip |
| Tour Archive / discovery | G5 | archive tests; explicitly not unlock ownership |
| Ascension / modular Tour Pressure | G5 | pressure tests + G6 representative profile matrix |
| Anti-snowball / strategy diversity | G5 design constraints | G5 diagnostic + final G6 calibration/holdout dominance gate |
| Telemetry and balance validation | G1–G5 incremental counters | G6 report v15, holdout, paired extraction, provenance |

---

## Detailed Subplans

Execute in this order:

1. `docs/superpowers/plans/roguelite-expedition/01-expedition-core-extraction.md`
2. `docs/superpowers/plans/roguelite-expedition/02-condition-repairs-cargo.md`
3. `docs/superpowers/plans/roguelite-expedition/03-crew-stress-relationships.md`
4. `docs/superpowers/plans/roguelite-expedition/04-pressure-rivals-contracts.md`
5. `docs/superpowers/plans/roguelite-expedition/05-meta-regions-ascension.md`
6. `docs/superpowers/plans/roguelite-expedition/06-balance-simulator-recalibration.md`

Each subplan produces a separately testable checkpoint; do not start a dependent subplan while its required gate is red.

---

## Cross-Plan Commit Policy

Keep commits small and conventional. Recommended prefixes:

```text
feat(expedition): ...
feat(condition): ...
feat(crew): ...
feat(pressure): ...
feat(meta): ...
test(expedition): ...
chore(balance): ...
```

Never combine unrelated cleanup with these changes. If an existing large file must be split to make one touched responsibility understandable, make that split in the same task that needs the boundary and keep behavior unchanged under tests.

---

## Master Completion Checklist

- [ ] G0 state/save foundation merged and old saves load.
- [ ] G1 Expedition Core is playable end-to-end.
- [ ] G2 Condition/Cargo/Insurance produces meaningful optional spending and technical risk without making insurance mandatory.
- [ ] G3 Crew creates distinct loadout trade-offs without becoming a micromanagement dashboard.
- [ ] G4 Pressure/Rival/Contract layer reacts to success without rubber-banding.
- [ ] G5 Meta layer unlocks options rather than runaway permanent stats; starter and legendary perks have explicit trade-offs and idempotent unlock settlement.
- [ ] Six build archetypes are represented in the simulator.
- [ ] Balance report includes extraction, condition, crew, pressure and strategy-diversity sections.
- [ ] Calibration and holdout remain disjoint and reproducible.
- [ ] Full type/test/dead-code/e2e gates pass.
- [ ] Final generated balance artifacts have matching source/generator fingerprints and no unexplained hard-gate failures.

---

# Expedition Core + Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add save-compatible Expedition/Career state, Tour Prep, an 8-hop standard expedition map, hybrid node intelligence, deterministic extraction windows, Run Summary, and a next-tour lifecycle without changing cash/fuel/stamina/harmony ownership.

**Architecture:** `expedition` owns run lifecycle, loadout references, fog/intel, reward settlement metadata and future run subsystems; `career` owns cross-tour progression. Main-menu new-game still performs a full reset, then routes to Tour Prep. Subsequent tours use a dedicated lifecycle action that preserves career/player/assets and rotates `runSeed`.

**Tech Stack:** TypeScript, React 19, reducer/action creators, Vitest, Node test runner, i18next, seeded `MapGenerator`.

---

## File Structure

**Create:**

- `reports/game-balance-simulation-pre-expedition-v14.json`
- `reports/game-balance-simulation-pre-expedition-v14.md`
- `tests/node/preExpeditionBalanceBaseline.test.js`
- `src/types/expedition.d.ts`
- `src/types/career.d.ts`
- `src/domain/expedition/defaults.ts`
- `src/domain/expedition/extraction.ts`
- `src/domain/expedition/loadout.ts`
- `src/domain/expedition/nodeIntel.ts`
- `src/data/expedition/tourTypes.ts`
- `src/data/expedition/regions.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/reducers/careerSanitizers.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/scenes/TourPrep.tsx`
- `src/scenes/RunSummary.tsx`
- `src/ui/expedition/TourPrepLoadout.tsx`
- `src/ui/expedition/ExpeditionStatusStrip.tsx`
- `src/ui/expedition/ExtractionDialog.tsx`
- `src/ui/expedition/RunSummaryCard.tsx`
- `src/context/reducers/migrations/v2_to_v3.ts`
- `tests/node/expeditionDefaults.test.js`
- `tests/node/expeditionSanitizers.test.js`
- `tests/node/expeditionReducer.test.js`
- `tests/node/expeditionExtraction.test.js`
- `tests/node/expeditionNodeIntel.test.js`
- `tests/ui/TourPrep.test.tsx`
- `tests/ui/ExtractionDialog.test.tsx`
- `tests/ui/RunSummary.test.tsx`
- `tests/golden-path/expeditionCore.test.js`

**Modify:**

- `src/types/index.ts`
- `src/types/game.d.ts:109-162`
- `src/types/actions.d.ts`
- `src/context/initialState.ts:244-352`
- `src/context/actionTypes.ts`
- `src/context/gameReducer.ts`
- `src/context/useGameDispatchActions.ts`
- `src/context/GameState.tsx:250-280`
- `src/context/usePersistence.ts:65-101`
- `src/context/reducers/systemReducer.ts:147-340, 520-650`
- `src/context/reducers/migrations/index.ts`
- `.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js`
- `src/context/gameConstants.ts:9-32`
- `src/components/SceneRouter.tsx`
- `src/scenes/mainmenu/hooks/useMainMenuStart.ts:45-75`
- `src/context/useMapGeneration.ts:48-180`
- `src/utils/fallbackMap.ts`
- `src/scenes/Overworld.tsx`
- `src/components/overworld/OverworldMap.tsx:118-195`
- `src/components/MapNodeView.tsx:152-269, 275-511`
- `src/ui/overworld/OverworldHUD.tsx`
- `src/hooks/useArrivalLogic.ts:153-246`
- `src/hooks/postGig/handlers/useContinueHandler.ts:78-190`
- `src/hooks/postGig/handlers/continueHandlerUtils.ts:160-195`
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `tests/node/saveMigrations.test.js`
- `tests/node/saveSliceRoundTrip.test.js`
- `tests/node/playwright-screenshot-fixture-validation.test.js`
- `tests/node/fallbackMap.test.js`
- `tests/node/mapGenerator.test.js`
- `tests/ui/MapNode.test.jsx`
- `tests/ui/OverworldHUD.test.jsx`
- `tests/ui/SceneRouter.test.jsx`
- `tests/ui/MainMenu.test.jsx`
- `tests/ui/useArrivalLogic.test.jsx`
- `tests/ui/postGigHandlerLogic.test.jsx`

---


### Task 0: Freeze the Reviewed Pre-Expedition Balance Baseline

**Files:**
- Read/Copy: `reports/game-balance-simulation-results.json`
- Read/Copy: `reports/game-balance-simulation-analysis.md`
- Create: `reports/game-balance-simulation-pre-expedition-v14.json`
- Create: `reports/game-balance-simulation-pre-expedition-v14.md`
- Create: `tests/node/preExpeditionBalanceBaseline.test.js`

This task runs before any production or simulator change in G0/G1. Later plans may add metrics to the live report, so copying the "current" report at G6 would no longer prove what the pre-Expedition game did.

- [ ] **Step 1: Write the failing immutable-baseline test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const BASELINE = 'reports/game-balance-simulation-pre-expedition-v14.json'

test('frozen pre-expedition balance baseline preserves the v14 horizon', () => {
  assert.equal(fs.existsSync(BASELINE), true)
  const payload = JSON.parse(fs.readFileSync(BASELINE, 'utf8'))
  assert.equal(payload.constants.reportVersion, 14)
  assert.equal(payload.constants.seedNamespace, '#first-income-full-reports-v1')
  assert.equal(payload.constants.daysPerRun, 10)
  assert.equal(payload.metadata.runsPerScenario, 2000)
})
```

- [ ] **Step 2: Run the test and verify it fails because the frozen artifact does not exist**

```bash
node --test tests/node/preExpeditionBalanceBaseline.test.js
```

Expected: FAIL on `fs.existsSync(BASELINE) === false`.

- [ ] **Step 3: Copy the reviewed v14 artifacts byte-for-byte**

```bash
cp reports/game-balance-simulation-results.json reports/game-balance-simulation-pre-expedition-v14.json
cp reports/game-balance-simulation-analysis.md reports/game-balance-simulation-pre-expedition-v14.md
```

Do not regenerate the source report first. These files capture the exact reviewed pre-Expedition simulator state.

- [ ] **Step 4: Re-run the test**

```bash
node --test tests/node/preExpeditionBalanceBaseline.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit the historical evidence before all feature work**

```bash
git add reports/game-balance-simulation-pre-expedition-v14.json reports/game-balance-simulation-pre-expedition-v14.md tests/node/preExpeditionBalanceBaseline.test.js
git commit -m "chore(balance): freeze pre-expedition v14 baseline"
```

---

### Task 1: Define Stable Expedition and Career State Shapes

**Files:**
- Create: `src/types/expedition.d.ts`
- Create: `src/types/career.d.ts`
- Modify: `src/types/index.ts`
- Modify: `src/types/game.d.ts:109-162`
- Create: `src/domain/expedition/defaults.ts`
- Test: `tests/node/expeditionDefaults.test.js`

- [ ] **Step 1: Write the failing defaults test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createDefaultCareerState,
  createDefaultExpeditionState
} from '../../src/domain/expedition/defaults.ts'

test('expedition defaults are fresh and start in preparation-safe idle state', () => {
  const a = createDefaultExpeditionState()
  const b = createDefaultExpeditionState()
  assert.equal(a.status, 'idle')
  assert.equal(a.routeStep, 0)
  assert.deepEqual(a.visitedNodeIds, [])
  assert.notStrictEqual(a.visitedNodeIds, b.visitedNodeIds)
  assert.deepEqual(a.pressure, { heat: 0, exposure: 0 })
})

test('career defaults start with no duplicated unlock state', () => {
  const career = createDefaultCareerState()
  assert.equal(career.rankId, 'unknown')
  assert.equal(career.tourTokens, 0)
  assert.deepEqual(career.crewProgressById, {})
  assert.deepEqual(career.archive.regionIds, ['home'])
})
```

- [ ] **Step 2: Run the test and verify it fails because the module does not exist**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionDefaults.test.js
```

Expected: FAIL with module-not-found for `src/domain/expedition/defaults.ts`.

- [ ] **Step 3: Add the exact state types**

`src/types/expedition.d.ts`:

```ts
export type ExpeditionStatus =
  | 'idle'
  | 'preparing'
  | 'active'
  | 'extracted'
  | 'completed'
  | 'failed'

export type ConditionGroup = 'pa' | 'instruments' | 'stageGear'
export type CrewStressStatus = 'calm' | 'strained' | 'critical' | 'breaking'
export type InjuryStage = 'none' | 'strain' | 'light' | 'serious' | 'critical'
export type ObligationStatus = 'active' | 'completed' | 'failed'
export type NodeIntelLevel = 0 | 1 | 2

export interface ExpeditionCargoLoadout {
  spareParts: number
  supplies: number
  merchSlots: number
  contrabandSlots: number
}

export interface ExpeditionLoadout {
  tourTypeId: string
  regionId: string
  activeTourbusAssetId: string | null
  crewIds: string[]
  cargo: ExpeditionCargoLoadout
  starterPerkId: string | null
  contractIds: string[]
  pressureModifierIds: string[]
}

export interface HiddenDefectState {
  id: string
  group: ConditionGroup
  severity: 'minor' | 'major'
  discovered: boolean
}

export interface ExpeditionConditionState {
  pa: number
  instruments: number
  stageGear: number
  hiddenDefects: HiddenDefectState[]
}

export interface ExpeditionCrewRunState {
  stress: number
  stressStatus: CrewStressStatus
  injuryStage: InjuryStage
  runTraitIds: string[]
}

export interface ActiveObligationState {
  id: string
  templateId: string
  sourceType: 'brandDeal' | 'expedition' | 'crew' | 'rival'
  sourceId: string | null
  status: ObligationStatus
  progress: number
  target: number
}

export interface ExpeditionOutcome {
  kind: 'extracted' | 'completed' | 'failed'
  reason: string
  retentionRate: number
  finalMoney: number
  finalFame: number
}

export interface ExpeditionState {
  status: ExpeditionStatus
  runId: string | null
  routeStep: number
  visitedNodeIds: string[]
  intelByNodeId: Record<string, NodeIntelLevel>
  loadout: ExpeditionLoadout
  startingMoney: number
  startingFame: number
  unsecuredRewardIds: string[]
  securedRewardIds: string[]
  pressure: { heat: number; exposure: number }
  condition: ExpeditionConditionState
  crewRunById: Record<string, ExpeditionCrewRunState>
  activeObligations: ActiveObligationState[]
  draftTraitIds: string[]
  extractionWindowsSeen: number[]
  outcome: ExpeditionOutcome | null
}
```

`src/types/career.d.ts`:

```ts
import type { InjuryStage } from './expedition'

export type CrewRelationshipTier = 'bonded' | 'neutral' | 'tense' | 'hostile'

export interface CareerCrewProgress {
  loyalty: number
  storyStep: number
  signatureTraitIds: string[]
}

export interface CareerRivalHistory {
  relationship: 'unknown' | 'competitive' | 'rival' | 'nemesis' | 'respect' | 'alliance'
  nemesisLevel: number
  encounterCount: number
  lastOutcome: string | null
}

export interface CareerArchive {
  crewIds: string[]
  moduleIds: string[]
  chassisIds: string[]
  rivalIds: string[]
  sponsorIds: string[]
  regionIds: string[]
  finaleIds: string[]
  eventIds: string[]
  contrabandIds: string[]
}

export interface CareerState {
  rankId: string
  tourTokens: number
  crewProgressById: Record<string, CareerCrewProgress>
  crewRelationshipByPair: Record<string, CrewRelationshipTier>
  persistentInjuriesByMemberId: Record<string, InjuryStage>
  rivalHistoryById: Record<string, CareerRivalHistory>
  archive: CareerArchive
  hqFacilityLevels: Record<string, number>
  ascensionUnlocked: boolean
}
```

- [ ] **Step 4: Add fresh default factories**

`src/domain/expedition/defaults.ts`:

```ts
import type { CareerState, ExpeditionState } from '../../types'

export const createDefaultExpeditionState = (): ExpeditionState => ({
  status: 'idle',
  runId: null,
  routeStep: 0,
  visitedNodeIds: [],
  intelByNodeId: {},
  loadout: {
    tourTypeId: 'standard',
    regionId: 'home',
    activeTourbusAssetId: null,
    crewIds: [],
    cargo: { spareParts: 0, supplies: 0, merchSlots: 0, contrabandSlots: 0 },
    starterPerkId: null,
    contractIds: [],
    pressureModifierIds: []
  },
  startingMoney: 0,
  startingFame: 0,
  unsecuredRewardIds: [],
  securedRewardIds: [],
  pressure: { heat: 0, exposure: 0 },
  condition: { pa: 100, instruments: 100, stageGear: 100, hiddenDefects: [] },
  crewRunById: {},
  activeObligations: [],
  draftTraitIds: [],
  extractionWindowsSeen: [],
  outcome: null
})

export const createDefaultCareerState = (): CareerState => ({
  rankId: 'unknown',
  tourTokens: 0,
  crewProgressById: {},
  crewRelationshipByPair: {},
  persistentInjuriesByMemberId: {},
  rivalHistoryById: {},
  archive: {
    crewIds: [], moduleIds: [], chassisIds: [], rivalIds: [], sponsorIds: [],
    regionIds: ['home'], finaleIds: [], eventIds: [], contrabandIds: []
  },
  hqFacilityLevels: {},
  ascensionUnlocked: false
})
```

Export both type files from `src/types/index.ts` and add required `expedition`/`career` fields to `GameState`.

- [ ] **Step 5: Run the test and typecheck**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionDefaults.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types src/domain/expedition/defaults.ts tests/node/expeditionDefaults.test.js
git commit -m "feat(expedition): define run and career state"
```

---

### Task 2: Sanitize Expedition and Career Save Boundaries

**Files:**
- Create: `src/context/reducers/expeditionSanitizers.ts`
- Create: `src/context/reducers/careerSanitizers.ts`
- Test: `tests/node/expeditionSanitizers.test.js`

- [ ] **Step 1: Write hostile-input tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeExpeditionState } from '../../src/context/reducers/expeditionSanitizers.ts'
import { sanitizeCareerState } from '../../src/context/reducers/careerSanitizers.ts'

test('expedition sanitizer rejects non-finite pressure and unknown status', () => {
  const value = sanitizeExpeditionState({
    status: 'hacked',
    pressure: { heat: Infinity, exposure: -50 },
    routeStep: -12
  })
  assert.equal(value.status, 'idle')
  assert.deepEqual(value.pressure, { heat: 0, exposure: 0 })
  assert.equal(value.routeStep, 0)
})

test('career sanitizer blocks prototype keys and clamps negative tokens', () => {
  const value = sanitizeCareerState({
    tourTokens: -99,
    rivalHistoryById: { __proto__: { nemesisLevel: 99 } }
  })
  assert.equal(value.tourTokens, 0)
  assert.deepEqual(value.rivalHistoryById, {})
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionSanitizers.test.js
```

Expected: FAIL because sanitizer modules are missing.

- [ ] **Step 3: Implement strict sanitizers using project guards**

Use `isLooseRecord`, `isFiniteNumber`, `isForbiddenKey`, `finiteNumberOr`, and the default factories. Clamp Heat/Exposure/Condition/Stress to `0..100`, route steps and counters to non-negative integers, array ids to safe strings, and unknown enum values back to defaults. Do not use `Number(value)` coercion.

The public surface must be exactly:

```ts
export const sanitizeExpeditionState = (value: unknown): ExpeditionState
export const sanitizeCareerState = (value: unknown): CareerState
```

- [ ] **Step 4: Run sanitizer tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionSanitizers.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context/reducers/*Sanitizers.ts tests/node/expeditionSanitizers.test.js
git commit -m "feat(expedition): sanitize persistent run state"
```

---

### Task 3: Add Save Version 3 and Round-Trip Both New Slices

**Files:**
- Modify: `src/context/initialState.ts:244-352`
- Modify: `src/context/usePersistence.ts:65-101`
- Modify: `src/context/reducers/systemReducer.ts:147-262`
- Modify: `src/context/reducers/migrations/index.ts`
- Create: `src/context/reducers/migrations/v2_to_v3.ts`
- Modify: `.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js`
- Modify tests: `tests/node/saveMigrations.test.js`, `tests/node/saveSliceRoundTrip.test.js`, `tests/node/playwright-screenshot-fixture-validation.test.js`

- [ ] **Step 1: Add failing save round-trip assertions**

Extend `saveSliceRoundTrip.test.js` so a save containing:

```js
expedition: {
  ...createDefaultExpeditionState(),
  status: 'active',
  routeStep: 4,
  pressure: { heat: 33, exposure: 61 }
},
career: {
  ...createDefaultCareerState(),
  tourTokens: 7,
  archive: {
    ...createDefaultCareerState().archive,
    regionIds: ['home', 'industrial']
  }
}
```

loads with those values intact while malformed values sanitize back to defaults. Expedition capability unlocks themselves remain owned by `state.unlocks`/`unlockManager`; `career` stores progress and discovery history only.

- [ ] **Step 2: Add a failing v2-to-v3 migration test**

```js
assert.deepEqual(migrateV2ToV3({ version: 2, player: { money: 500 } }), {
  version: 3,
  player: { money: 500 },
  expedition: createDefaultExpeditionState(),
  career: createDefaultCareerState()
})
```

- [ ] **Step 3: Implement migration and persistence wiring**

`v2_to_v3.ts` must be pure:

```ts
import { isLooseRecord } from '../../../utils/gameState'
import {
  createDefaultCareerState,
  createDefaultExpeditionState
} from '../../../domain/expedition/defaults'

export const migrateV2ToV3 = (value: unknown): unknown => {
  if (!isLooseRecord(value)) return value
  return {
    ...value,
    version: 3,
    expedition: Object.hasOwn(value, 'expedition')
      ? value.expedition
      : createDefaultExpeditionState(),
    career: Object.hasOwn(value, 'career')
      ? value.career
      : createDefaultCareerState()
  }
}
```

Update `CURRENT_SAVE_VERSION` to `3`, append `{ to: 3, migrate: migrateV2ToV3 }`, add `expedition` and `career` to `PERSISTED_FIELDS`, add sanitized fields in `handleLoadGame`, and create fresh defaults in both `initialState` and `createInitialState`.

- [ ] **Step 4: Update screenshot fixture with fresh default objects**

Add the exact default state fields to `BASE_STATE`; do not share mutable arrays between fixture invocations. Use literal fresh structures in the fixture factory:

```js
const createFixtureExpedition = () => ({
  status: 'idle', routeStep: 0,
  visitedNodeIds: [], intelByNodeId: {},
  loadout: {
    tourTypeId: 'standard', regionId: 'home', activeTourbusAssetId: null,
    crewIds: [], cargo: { spareParts: 0, supplies: 0, merchSlots: 0, contrabandSlots: 0 },
    starterPerkId: null, contractIds: [], pressureModifierIds: []
  },
  startingMoney: 0, startingFame: 0, unsecuredRewardIds: [], securedRewardIds: [],
  pressure: { heat: 0, exposure: 0 },
  condition: { pa: 100, instruments: 100, stageGear: 100, hiddenDefects: [] },
  crewRunById: {}, activeObligations: [], draftTraitIds: [], extractionWindowsSeen: [], outcome: null
})
const createFixtureCareer = () => ({
  rankId: 'unknown', tourTokens: 0, crewProgressById: {}, crewRelationshipByPair: {},
  persistentInjuriesByMemberId: {}, rivalHistoryById: {},
  archive: { crewIds: [], moduleIds: [], chassisIds: [], rivalIds: [], sponsorIds: [], regionIds: ['home'], finaleIds: [], eventIds: [], contrabandIds: [] },
  hqFacilityLevels: {}, ascensionUnlocked: false
})

export const BASE_STATE = {
  // existing fields...
  expedition: createFixtureExpedition(),
  career: createFixtureCareer()
}
```

- [ ] **Step 5: Run save/fixture gates**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/saveMigrations.test.js tests/node/saveSliceRoundTrip.test.js tests/node/playwright-screenshot-fixture-validation.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/context .claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js tests/node/saveMigrations.test.js tests/node/saveSliceRoundTrip.test.js tests/node/playwright-screenshot-fixture-validation.test.js
git commit -m "feat(expedition): persist run and career state"
```

---

### Task 4: Add Expedition Reducer and Typed Lifecycle Actions

**Files:**
- Modify: `src/context/actionTypes.ts`
- Create: `src/context/expeditionActionCreators.ts`
- Create: `src/context/reducers/expeditionReducer.ts`
- Create: `src/context/useExpeditionDispatchActions.ts`
- Modify: `src/context/gameReducer.ts`
- Modify: `src/context/useGameDispatchActions.ts`
- Modify: `src/types/game.d.ts`
- Modify: `src/types/actions.d.ts`
- Test: `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Write reducer tests for preparation, start and replay guards**

Pin these behaviors:

```js
const preparing = gameReducer(initial, createPrepareExpeditionAction())
assert.equal(preparing.expedition.status, 'preparing')

const started = gameReducer(
  preparing,
  createStartExpeditionAction(preparing, validLoadout)
)
assert.equal(started.expedition.status, 'active')
assert.match(started.expedition.runId, /^[0-9a-f-]{36}$/i)
assert.equal(started.expedition.startingMoney, preparing.player.money)
assert.equal(started.expedition.startingFame, preparing.player.fame)

const replay = gameReducer(started, createStartExpeditionAction(started, validLoadout))
assert.strictEqual(replay, started)
```

- [ ] **Step 2: Add action discriminants**

```ts
PREPARE_EXPEDITION: 'PREPARE_EXPEDITION',
START_EXPEDITION: 'START_EXPEDITION',
RECORD_EXPEDITION_ARRIVAL: 'RECORD_EXPEDITION_ARRIVAL',
REVEAL_NODE_INTEL: 'REVEAL_NODE_INTEL',
FINALIZE_EXPEDITION: 'FINALIZE_EXPEDITION',
PREPARE_NEXT_EXPEDITION: 'PREPARE_NEXT_EXPEDITION'
```

- [ ] **Step 3: Implement narrow action creators**

`createStartExpeditionAction(state, loadout)` must call the pure loadout validator before constructing the action; invalid ids, duplicate crew ids, and non-integer cargo counts are rejected before dispatch. The action creator also stamps a stable `runId` with the existing `getSafeUUID()` helper; reducers never generate IDs. `createPrepareNextExpeditionAction()` stamps the fresh seed in the creator. Every new creator stays coupled to the canonical action union with `Extract<GameAction, ...>`:

```ts
export const createStartExpeditionAction = (
  state: GameState,
  candidate: unknown
): Extract<GameAction, { type: typeof ActionTypes.START_EXPEDITION }> => {
  const result = validateExpeditionLoadout(state, candidate)
  if (!result.valid) throw new TypeError(result.reason)
  return {
    type: ActionTypes.START_EXPEDITION,
    payload: { loadout: result.loadout, runId: getSafeUUID() }
  }
}

export const createRecordExpeditionArrivalAction = (
  nodeId: unknown
): Extract<GameAction, { type: typeof ActionTypes.RECORD_EXPEDITION_ARRIVAL }> => {
  if (typeof nodeId !== 'string' || nodeId.length === 0) {
    throw new TypeError('nodeId must be a non-empty string')
  }
  return { type: ActionTypes.RECORD_EXPEDITION_ARRIVAL, payload: { nodeId } }
}

export const createFinalizeExpeditionAction = (
  kind: 'extracted' | 'completed' | 'failed',
  reason: unknown
): Extract<GameAction, { type: typeof ActionTypes.FINALIZE_EXPEDITION }> => {
  if (typeof reason !== 'string' || reason.length === 0) {
    throw new TypeError('finalize reason must be a non-empty string')
  }
  return { type: ActionTypes.FINALIZE_EXPEDITION, payload: { kind, reason } }
}

export const createPrepareNextExpeditionAction = (): Extract<
  GameAction,
  { type: typeof ActionTypes.PREPARE_NEXT_EXPEDITION }
> => ({
  type: ActionTypes.PREPARE_NEXT_EXPEDITION,
  payload: { runSeed: getSecureRandomUint32() }
})
```

- [ ] **Step 4: Implement pure reducer handlers**

`START_EXPEDITION` must:

```ts
return {
  ...state,
  gameMap: null,
  currentGig: null,
  lastGigStats: null,
  activeEvent: null,
  pendingEvents: [],
  eventCooldowns: [],
  rivalBand: null,
  expedition: {
    ...createDefaultExpeditionState(),
    status: 'active',
    runId: payload.runId,
    loadout: payload.loadout,
    startingMoney: finiteNumberOr(state.player.money, 0),
    startingFame: finiteNumberOr(state.player.fame, 0)
  }
}
```

`PREPARE_NEXT_EXPEDITION` clears only run-scoped data, including `runId`, rotates `runSeed`, and preserves `player`, `band`, `assets`, `liabilities`, `career`, `unlocks`, and settings. A new `runId` is created only when the next `START_EXPEDITION` action is dispatched. The Expedition sanitizer accepts `runId` only as `null` or a bounded non-empty string, so the identifier survives save/reload for the whole finalized run.

- [ ] **Step 5: Wire stable dispatch wrappers**

Compose `useExpeditionDispatchActions` inside `useGameDispatchActions` instead of recreating callbacks in scenes:

```ts
const expeditionActions = useExpeditionDispatchActions(dispatch, state)
return useMemo(() => ({
  ...baseActions,
  ...expeditionActions
}), [baseActions, expeditionActions])
```

- [ ] **Step 6: Run reducer/type tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js
pnpm run typecheck:core
pnpm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/context src/types tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): add typed run lifecycle actions"
```

---

### Task 5: Add Standard Tour Definition and Validate Loadouts

**Files:**
- Create: `src/data/expedition/tourTypes.ts`
- Create: `src/data/expedition/regions.ts`
- Create: `src/domain/expedition/loadout.ts`
- Test: `tests/node/expeditionDefaults.test.js`

- [ ] **Step 1: Pin the standard tour contract in tests**

```js
const standard = getTourTypeDefinition('standard')
assert.equal(standard.mapDepth, 8)
assert.deepEqual(standard.extractionSteps, [3, 6])
assert.equal(standard.voluntaryRetentionRate, 0.7)
assert.equal(standard.failureRetentionRate, 0.5)
```

- [ ] **Step 2: Add canonical definitions**

```ts
export interface TourTypeDefinition {
  id: string
  mapDepth: number
  extractionSteps: readonly number[]
  voluntaryRetentionRate: number
  failureRetentionRate: number
  completionMultiplier: number
}

export const TOUR_TYPES = Object.freeze({
  standard: Object.freeze({
    id: 'standard',
    mapDepth: 8,
    extractionSteps: Object.freeze([3, 6]),
    voluntaryRetentionRate: 0.7,
    failureRetentionRate: 0.5,
    completionMultiplier: 1.35
  })
})
```

`regions.ts` begins with one canonical region:

```ts
export const REGIONS = Object.freeze({
  home: Object.freeze({ id: 'home', labelKey: 'ui:expedition.region.home' })
})
```

- [ ] **Step 3: Implement `validateExpeditionLoadout`**

It must verify `standard`/`home` as baseline defaults and otherwise check namespaced capability ids through the existing `state.unlocks`/`unlockManager` boundary, verify the selected tourbus asset exists and has kind `tourbus_chassis`, require unique crew ids, and require finite non-negative integer cargo values. Return:

```ts
{ valid: true, loadout: ExpeditionLoadout }
// or
{ valid: false, reason: string }
```

- [ ] **Step 4: Run tests and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionDefaults.test.js tests/node/expeditionReducer.test.js
git add src/data/expedition src/domain/expedition/loadout.ts tests/node
git commit -m "feat(expedition): define standard tour loadout"
```

---

### Task 6: Add Tour Prep and Run Summary Scenes

**Files:**
- Modify: `src/context/gameConstants.ts:9-32`
- Modify: `src/components/SceneRouter.tsx`
- Modify: `src/scenes/mainmenu/hooks/useMainMenuStart.ts:45-75`
- Create: `src/scenes/TourPrep.tsx`
- Create: `src/scenes/RunSummary.tsx`
- Create: `src/ui/expedition/TourPrepLoadout.tsx`
- Create: `src/ui/expedition/RunSummaryCard.tsx`
- Modify: `public/locales/en/ui.json`
- Modify: `public/locales/de/ui.json`
- Test: `tests/ui/TourPrep.test.tsx`, `tests/ui/RunSummary.test.tsx`, `tests/ui/SceneRouter.test.jsx`, `tests/ui/MainMenu.test.jsx`

- [ ] **Step 1: Write scene-routing tests**

Assert `TOUR_PREP` renders TourPrep and `RUN_SUMMARY` renders RunSummary.

- [ ] **Step 2: Add phases**

```ts
TOUR_PREP: 'TOUR_PREP',
RUN_SUMMARY: 'RUN_SUMMARY',
```

- [ ] **Step 3: Change new-game flow to Tour Prep**

In `proceedToTour`, retain the existing full reset/identity restore but replace:

```ts
changeScene(GAME_PHASES.OVERWORLD)
```

with:

```ts
prepareExpedition()
changeScene(GAME_PHASES.TOUR_PREP)
```

Pass `prepareExpedition` through the hook interface rather than importing context inside the hook.

- [ ] **Step 4: Build Tour Prep minimum viable screen**

The first implementation exposes Standard tour, Home region, optional selected owned tourbus, and default empty crew/cargo. Drive validation from the domain helper:

```tsx
const validation = validateExpeditionLoadout(state, loadout)
const onStart = () => {
  if (!validation.valid) return
  startExpedition(validation.loadout)
  changeScene(GAME_PHASES.OVERWORLD)
}

return (
  <TourPrepLoadout loadout={loadout} onChange={setLoadout}>
    <button type="button" disabled={!validation.valid} onClick={onStart}>
      {t('ui:expedition.startTour')}
    </button>
  </TourPrepLoadout>
)
```

- [ ] **Step 5: Build Run Summary screen**

Show outcome kind/reason, retained money/fame, route step, and a `Next Tour` action:

```tsx
const onNextTour = () => {
  prepareNextExpedition()
  changeScene(GAME_PHASES.TOUR_PREP)
}
return <RunSummaryCard outcome={state.expedition.outcome} routeStep={state.expedition.routeStep} onNextTour={onNextTour} />
```

- [ ] **Step 6: Add EN/DE keys with 1:1 structure under `ui:expedition.*`**

No user-facing fallback-only copy in production JSX. Add matching objects:

```json
// public/locales/en/ui.json
{ "expedition": { "startTour": "Start tour", "nextTour": "Next tour", "extract": "Extract", "runSummary": "Tour summary" } }
```

```json
// public/locales/de/ui.json
{ "expedition": { "startTour": "Tour starten", "nextTour": "Nächste Tour", "extract": "Extrahieren", "runSummary": "Tour-Zusammenfassung" } }
```

- [ ] **Step 7: Run UI tests**

```bash
pnpm exec vitest run tests/ui/TourPrep.test.tsx tests/ui/RunSummary.test.tsx tests/ui/SceneRouter.test.jsx tests/ui/MainMenu.test.jsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/context/gameConstants.ts src/components/SceneRouter.tsx src/scenes src/ui/expedition public/locales src/scenes/mainmenu/hooks/useMainMenuStart.ts tests/ui
git commit -m "feat(expedition): add tour prep and run summary scenes"
```

---

### Task 7: Make Map Generation Expedition-Aware Without Rewriting MapGenerator

**Files:**
- Modify: `src/context/GameState.tsx:250-280`
- Modify: `src/context/useMapGeneration.ts:48-180`
- Modify: `src/utils/fallbackMap.ts`
- Test: `tests/ui/context/useMapGeneration.test.tsx`, `tests/node/fallbackMap.test.js`, `tests/node/mapGenerator.test.js`

- [ ] **Step 1: Write a failing 8-hop generation test**

For a standard active expedition, assert the generated finale is layer `8` and map generation does **not** run while scene is `TOUR_PREP`.

- [ ] **Step 2: Pass expedition inputs into `useMapGeneration`**

Add:

```ts
currentScene: GameState['currentScene']
expedition: Pick<GameState['expedition'], 'status' | 'loadout'>
```

Generate only when:

```ts
currentScene === GAME_PHASES.OVERWORLD &&
expedition.status === 'active' &&
!gameMap
```

Resolve depth through `getTourTypeDefinition(expedition.loadout.tourTypeId).mapDepth` and call existing `new MapGenerator(seed).generateMap(depth)`.

- [ ] **Step 3: Make fallback depth-safe**

Add `loadFallbackMap(depth)` that returns a validated fallback whose finale layer matches `depth`. Reuse the static fallback and rebuild the final connection:

```ts
export const loadFallbackMap = (depth: number): GameMap => {
  const safeDepth = Math.max(1, Math.trunc(depth))
  const base = structuredClone(FALLBACK_MAP)
  const kept = Object.values(base.nodes).filter(node => node.layer < safeDepth)
  const previous = kept.filter(node => node.layer === safeDepth - 1)
  const finale = { ...base.nodes.finale, id: `node_${safeDepth}_0`, layer: safeDepth, type: 'FINALE' }
  for (const node of previous) node.connections = [finale.id]
  return validateMap({ ...base, nodes: Object.fromEntries([...kept, finale].map(node => [node.id, node])) })
}
```

- [ ] **Step 4: Run map tests**

```bash
pnpm exec vitest run tests/ui/context/useMapGeneration.test.tsx
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/fallbackMap.test.js tests/node/mapGenerator.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context/GameState.tsx src/context/useMapGeneration.ts src/utils/fallbackMap.ts tests
git commit -m "feat(expedition): generate profile-sized tour maps"
```

---

### Task 8: Implement Hybrid Fog-of-War Node Intelligence

**Files:**
- Create: `src/domain/expedition/nodeIntel.ts`
- Modify: `src/types/expedition.d.ts`
- Modify: `src/scenes/Overworld.tsx:29-45, 155-174`
- Modify: `src/components/overworld/OverworldMap.tsx:18-43, 105-190`
- Modify: `src/components/MapNodeView.tsx:152-269, 275-511`
- Test: `tests/node/expeditionNodeIntel.test.js`
- Test: `tests/ui/MapNode.test.jsx`
- Modify/Test: `tests/ui/OverworldMap.cityStates.test.jsx`

- [ ] **Step 1: Write selector tests for one canonical three-level contract**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { getExpeditionNodeIntel } from '../../src/domain/expedition/nodeIntel.ts'

const node = {
  id: 'n1',
  layer: 3,
  x: 0,
  y: 0,
  type: 'FESTIVAL',
  venue: { id: 'festival_a', name: 'Festival A', pay: 6000, diff: 5, price: 25 }
}
const rivalContext = {
  activeRivalId: 'rival_dead_circuits',
  activeRivalLocationId: 'n1'
}

test('level zero exposes only structural type and rough tiers', () => {
  assert.deepEqual(getExpeditionNodeIntel(node, 0, rivalContext), {
    nodeType: 'FESTIVAL',
    dangerTier: 'high',
    rewardTier: 'high',
    payoutRange: null,
    wearTier: null,
    rivalRisk: null,
    exactPayout: null,
    exactDifficulty: null,
    projectedWear: null,
    rivalId: null
  })
})

test('level one reveals ranges and rival presence but no exact numeric values', () => {
  const intel = getExpeditionNodeIntel(node, 1, rivalContext)
  assert.deepEqual(intel.payoutRange, { min: 5100, max: 6900 })
  assert.equal(intel.rivalRisk, 'high')
  assert.equal(intel.exactPayout, null)
  assert.equal(intel.exactDifficulty, null)
  assert.equal(intel.projectedWear, null)
  assert.equal(intel.rivalId, null)
})

test('level two reveals exact canonical venue values and rival identity', () => {
  const intel = getExpeditionNodeIntel(node, 2, rivalContext)
  assert.equal(intel.exactPayout, 6000)
  assert.equal(intel.exactDifficulty, 5)
  assert.equal(intel.rivalId, 'rival_dead_circuits')
})
```

`projectedWear` intentionally remains `null` in G1 because the Condition formula does not exist until G2. G2 Task 5 extends this same contract instead of inventing a second intel shape.

- [ ] **Step 2: Add the canonical intel result type and deterministic G1 selector**

Extend `src/types/expedition.d.ts`:

```ts
import type { MapNodeType } from '../utils/mapNodeTypes'

export type NodeIntelBand = 'low' | 'medium' | 'high'

export interface ExpeditionNodeIntelContext {
  activeRivalId: string | null
  activeRivalLocationId: string | null
}

export interface ExpeditionNodeIntel {
  nodeType: MapNodeType
  dangerTier: NodeIntelBand
  rewardTier: NodeIntelBand
  payoutRange: { min: number; max: number } | null
  wearTier: NodeIntelBand | null
  rivalRisk: NodeIntelBand | null
  exactPayout: number | null
  exactDifficulty: number | null
  projectedWear: Record<ConditionGroup, number> | null
  rivalId: string | null
}
```

`src/domain/expedition/nodeIntel.ts` uses only data that exists at this gate. No RNG is allowed in tooltip derivation:

```ts
import type {
  ExpeditionNodeIntel,
  ExpeditionNodeIntelContext,
  MapNode,
  NodeIntelBand,
  NodeIntelLevel
} from '../../types'
import { isFiniteNumber } from '../../utils/gameState'

const EMPTY_CONTEXT: ExpeditionNodeIntelContext = {
  activeRivalId: null,
  activeRivalLocationId: null
}

export const getCanonicalNodePayout = (node: MapNode): number | null => {
  const value = node.venue?.pay
  return isFiniteNumber(value) ? Math.max(0, value) : null
}

export const getCanonicalNodeDifficulty = (node: MapNode): number | null => {
  const explicit = node.venue?.difficulty
  const legacy = node.venue?.diff
  const value = isFiniteNumber(explicit)
    ? explicit
    : isFiniteNumber(legacy)
      ? legacy
      : null
  return value === null
    ? null
    : Math.max(1, Math.min(5, Math.trunc(value)))
}

const toDangerTier = (difficulty: number | null): NodeIntelBand =>
  difficulty === null || difficulty <= 2
    ? 'low'
    : difficulty <= 3
      ? 'medium'
      : 'high'

const toRewardTier = (payout: number | null): NodeIntelBand =>
  payout === null || payout < 800
    ? 'low'
    : payout < 3000
      ? 'medium'
      : 'high'

const toPayoutRange = (
  value: number | null
): { min: number; max: number } | null => {
  if (value === null) return null
  return {
    min: Math.max(0, Math.floor((value * 0.85) / 100) * 100),
    max: Math.ceil((value * 1.15) / 100) * 100
  }
}

export const getExpeditionNodeIntel = (
  node: MapNode,
  level: NodeIntelLevel,
  context: ExpeditionNodeIntelContext = EMPTY_CONTEXT
): ExpeditionNodeIntel => {
  const exactPayout = getCanonicalNodePayout(node)
  const exactDifficulty = getCanonicalNodeDifficulty(node)
  const rivalHere =
    context.activeRivalLocationId === node.id &&
    typeof context.activeRivalId === 'string'

  return {
    nodeType: node.type,
    dangerTier: toDangerTier(exactDifficulty),
    rewardTier: toRewardTier(exactPayout),
    payoutRange: level >= 1 ? toPayoutRange(exactPayout) : null,
    wearTier: null,
    rivalRisk: level >= 1 && rivalHere ? 'high' : null,
    exactPayout: level >= 2 ? exactPayout : null,
    exactDifficulty: level >= 2 ? exactDifficulty : null,
    projectedWear: null,
    rivalId: level >= 2 && rivalHere ? context.activeRivalId : null
  }
}
```

This resolves one stable contract up front: the same field names are used by tests, UI, G2 wear projection, and later Pressure/Rival work. Exact payout/difficulty remain hidden through Level 1.

- [ ] **Step 3: Pass Expedition intel and existing rival state into `OverworldMap`**

`src/scenes/Overworld.tsx` adds one focused selector and passes only the fields the map needs:

```tsx
const expedition = useGameSelector(state => state.expedition)

<OverworldMap
  {...existingMapProps}
  expeditionActive={expedition.status === 'active'}
  intelByNodeId={expedition.intelByNodeId}
/>
```

Extend `OverworldMapProps`:

```ts
expeditionActive: boolean
intelByNodeId: Record<string, NodeIntelLevel>
```

Inside the existing node loop:

```tsx
const intelLevel = expeditionActive ? (intelByNodeId[node.id] ?? 0) : 2
const intel = getExpeditionNodeIntel(node, intelLevel, {
  activeRivalId: rivalBand?.id ?? null,
  activeRivalLocationId: rivalBand?.currentLocationId ?? null
})

<MapNodeView
  {...existingNodeProps}
  visibility={visibility}
  intelLevel={intelLevel}
  expeditionIntel={intel}
/>
```

Legacy/non-Expedition maps use Level 2 so this feature does not remove information from the existing mode.

- [ ] **Step 4: Gate the existing rival marker and tooltip details by Expedition intel**

`MapNodeView` renders from the passed `expeditionIntel`; it must not recompute intelligence from structural visibility. In `OverworldMap`, keep the existing rival marker unchanged for legacy play, but require Level 1 in an Expedition:

```tsx
const shouldShowRivalMarker =
  hasRival &&
  visibility !== 'hidden' &&
  (!expeditionActive || intelLevel >= 1)
```

At Level 0 show node type + `dangerTier`/`rewardTier`. At Level 1 add `payoutRange`, `wearTier` when G2 populates it, and `rivalRisk`. At Level 2 add exact payout/difficulty, projected wear when available, and rival identity. Add UI assertions that a Level-1 Festival never contains the exact `6000` payout or exact difficulty value.

- [ ] **Step 5: Run selector/UI tests and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionNodeIntel.test.js
pnpm exec vitest run tests/ui/MapNode.test.jsx tests/ui/OverworldMap.cityStates.test.jsx
pnpm run typecheck:core
git add src/domain/expedition/nodeIntel.ts src/types/expedition.d.ts src/scenes/Overworld.tsx src/components/overworld/OverworldMap.tsx src/components/MapNodeView.tsx tests/node/expeditionNodeIntel.test.js tests/ui/MapNode.test.jsx tests/ui/OverworldMap.cityStates.test.jsx
git commit -m "feat(expedition): add hybrid map intelligence"
```

---

### Task 9: Record Arrivals Exactly Once and Expose Extraction Windows

**Files:**
- Modify: `src/hooks/useArrivalLogic.ts:153-246`
- Modify: `src/scenes/Overworld.tsx`
- Create: `src/ui/expedition/ExpeditionStatusStrip.tsx`
- Modify: `src/ui/overworld/OverworldHUD.tsx`
- Test: `tests/ui/useArrivalLogic.test.jsx`, `tests/ui/OverworldHUD.test.jsx`, `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Add a failing arrival replay test**

One completed journey to `node_3_1` increments `routeStep` once and appends the node id once; re-rendering the arrival effect must not increment again:

```js
const first = gameReducer(active, createRecordExpeditionArrivalAction('node_3_1'))
const replay = gameReducer(first, createRecordExpeditionArrivalAction('node_3_1'))
assert.equal(first.expedition.routeStep, 1)
assert.deepEqual(first.expedition.visitedNodeIds, ['node_3_1'])
assert.deepEqual(replay.expedition, first.expedition)
```

- [ ] **Step 2: Record arrival through the typed action surface**

Inside the real travel-arrival sequence, after the travel commit is known and before node-specific routing, call:

```ts
recordExpeditionArrival(node.id)
```

The reducer rejects duplicate `visitedNodeIds` and only increments `routeStep` for a new arrival while status is `active`.

- [ ] **Step 3: Derive extraction availability from tour definition**

```ts
export const canExtractAtCurrentStep = (state: GameState): boolean =>
  state.expedition.status === 'active' &&
  getTourTypeDefinition(state.expedition.loadout.tourTypeId)
    .extractionSteps.includes(state.expedition.routeStep)
```

Do not store a second boolean that can become stale.

- [ ] **Step 4: Add compact Expedition status to Overworld HUD**

Show route step, Heat/Exposure placeholders, and enable extraction only at legal windows:

```tsx
const canExtract = canExtractAtStep(state.expedition, tourType)
return <ExpeditionStatusStrip
  routeStep={state.expedition.routeStep}
  heat={state.expedition.pressure.heat}
  exposure={state.expedition.pressure.exposure}
  canExtract={canExtract}
  onExtract={() => setExtractionOpen(true)}
/>
```

- [ ] **Step 5: Run tests and commit**

```bash
pnpm exec vitest run tests/ui/useArrivalLogic.test.jsx tests/ui/OverworldHUD.test.jsx
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js
git add src/hooks/useArrivalLogic.ts src/scenes/Overworld.tsx src/ui tests
git commit -m "feat(expedition): track route progress and extraction windows"
```

---

### Task 10: Implement Idempotent Hybrid Extraction Settlement

**Files:**
- Create: `src/domain/expedition/extraction.ts`
- Create: `src/ui/expedition/ExtractionDialog.tsx`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Test: `tests/node/expeditionExtraction.test.js`, `tests/ui/ExtractionDialog.test.tsx`

- [ ] **Step 1: Write settlement math tests**

```js
assert.deepEqual(
  calculateRetainedProgress({ startingMoney: 500, currentMoney: 10500, startingFame: 100, currentFame: 2100, retentionRate: 0.7 }),
  { money: 7500, fame: 1500 }
)

assert.deepEqual(
  calculateRetainedProgress({ startingMoney: 5000, currentMoney: 3000, startingFame: 1000, currentFame: 800, retentionRate: 0.5 }),
  { money: 3000, fame: 800 }
)
```

Positive net gains are discounted; losses are never refunded.

- [ ] **Step 2: Implement pure settlement**

```ts
const retain = (start: number, current: number, rate: number): number => {
  const safeStart = Math.max(0, finiteNumberOr(start, 0))
  const safeCurrent = Math.max(0, finiteNumberOr(current, 0))
  if (safeCurrent <= safeStart) return safeCurrent
  return Math.floor(safeStart + (safeCurrent - safeStart) * clampUnit(rate))
}
```

Return both money/fame; never mutate state.

- [ ] **Step 3: Implement one pure settlement transition and keep navigation outside reducers**

`FINALIZE_EXPEDITION` is a no-op unless status is exactly `active`. Put the shared state transition in `src/domain/expedition/extraction.ts` so both the Expedition reducer and the daily-bankruptcy reducer path can use the exact same pure logic without importing one reducer from another:

```ts
export const finalizeExpeditionState = (
  state: GameState,
  payload: FinalizeExpeditionPayload
): GameState => {
  if (state.expedition.status !== 'active') return state
  const settlement = calculateExpeditionSettlement(state, payload.kind)
  return {
    ...state,
    player: {
      ...state.player,
      money: settlement.finalMoney,
      fame: settlement.finalFame
    },
    expedition: {
      ...state.expedition,
      status: payload.kind,
      outcome: settlement.outcome
    }
  }
}
```

The reducer handler is deliberately thin:

```ts
export const handleFinalizeExpedition = (
  state: GameState,
  payload: FinalizeExpeditionPayload
): GameState => finalizeExpeditionState(state, payload)
```

Neither function writes `currentScene`. Add a focused reducer assertion that `currentScene` is unchanged after `FINALIZE_EXPEDITION`, plus a replay assertion that a second finalize returns the exact same state reference.

- [ ] **Step 4: Build confirmation dialog with exact preview and route from the owning callback**

The dialog uses the same domain calculation as reducer settlement. The UI callback performs settlement first, requests a save after the following scene commit, then routes to Run Summary; the reducer itself never changes scene:

```tsx
const preview = calculateExpeditionSettlement(state, 'extracted')
const onConfirmExtraction = () => {
  finalizeExpedition('extracted', 'voluntary')
  saveGameAfterStateCommit()
  changeScene(GAME_PHASES.RUN_SUMMARY)
}

return <ExtractionDialog
  currentMoney={state.player.money}
  currentFame={state.player.fame}
  retainedMoney={preview.finalMoney}
  retainedFame={preview.finalFame}
  lostRewardIds={preview.lostRewardIds}
  onConfirm={onConfirmExtraction}
/>
```

- [ ] **Step 5: Run tests and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionExtraction.test.js
pnpm exec vitest run tests/ui/ExtractionDialog.test.tsx
git add src/domain/expedition/extraction.ts src/context src/ui/expedition tests
git commit -m "feat(expedition): add hybrid extraction settlement"
```

---

### Task 11: Route Finale and Bankruptcy Through Run Summary

**Files:**
- Modify: `src/hooks/postGig/handlers/useContinueHandler.ts:78-190`
- Modify: `src/hooks/postGig/handlers/continueHandlerUtils.ts:160-195`
- Modify: `src/context/reducers/systemReducer.ts:520-650`
- Modify: `src/hooks/useArrivalLogic.ts:80-160`
- Test: `tests/ui/postGigHandlerLogic.test.jsx`, `tests/node/expeditionExtraction.test.js`, `tests/node/advanceDayAssetIntegration.test.js`, `tests/ui/useArrivalLogic.test.jsx`

- [ ] **Step 1: Add failing finale, bankruptcy, and navigation-ownership tests**

Pin:

```text
FINALIZE_EXPEDITION alone changes settlement/status but preserves currentScene
active expedition + successful FINALE -> continuation finalizes -> continuation routes RUN_SUMMARY
active expedition + post-gig bankruptcy -> continuation finalizes -> continuation routes RUN_SUMMARY
active expedition + daily bankruptcy -> ADVANCE_DAY marks expedition failed without scene change -> arrival post-commit effect routes RUN_SUMMARY
legacy/non-expedition bankruptcy -> GAMEOVER unchanged
```

- [ ] **Step 2: Finalize, then navigate from the post-gig continuation callback**

Dispatch order in `handleContinue` must be:

```text
updatePlayer(new money/fame)
quest/band side effects
finalizeExpedition(completed|failed)
saveGameAfterStateCommit()
changeScene(RUN_SUMMARY)
return
```

Sequential reducer dispatches let finalization see the committed post-gig totals, while the owning continuation callback — not the completion reducer — owns navigation. `saveGameAfterStateCommit()` is set before `changeScene` so the existing persistence effect saves the finalized state after the scene commit.

- [ ] **Step 3: Preserve legacy transitions**

Call the Expedition branch before `handleContinueSceneTransition`; only non-Expedition continuations reach the existing helper:

```ts
if (isExpeditionActive && shouldFinalizeExpedition) {
  finalizeExpedition(expeditionOutcome, expeditionReason)
  saveGameAfterStateCommit()
  changeScene(GAME_PHASES.RUN_SUMMARY)
  return
}

handleContinueSceneTransition(legacyArgs)
```

Keep `handleContinueSceneTransition` as the existing `GAMEOVER`/`OVERWORLD` decision body without changing its legacy conditions. Add tests for Expedition and non-Expedition paths so normal continuation remains unchanged.

- [ ] **Step 4: Make daily bankruptcy settlement pure and route after the day commit**

`applyDailyBankruptcyCheck` stays a pure reducer helper. For an active Expedition, call the same pure settlement helper used by `FINALIZE_EXPEDITION` and preserve `currentScene`; legacy bankruptcy keeps the existing `GAMEOVER` transition:

```ts
const applyDailyBankruptcyCheck = (state: GameState): GameState => {
  const total = getTotalDailyObligations(state)
  if (!shouldTriggerBankruptcy(state.player.money, 0, total)) return state
  if (state.expedition.status === 'active') {
    return finalizeExpeditionState(state, { kind: 'failed', reason: 'bankruptcy' })
  }
  return { ...state, currentScene: GAME_PHASES.GAMEOVER }
}
```

Extend `useArrivalLogic`'s existing post-commit routing effect. When the committed day tick leaves `expedition.status === 'failed'`, consume `pendingRouteRef`, call `saveGameAfterStateCommit()`, route to `RUN_SUMMARY`, and return before any queued gig/overworld routing. This mirrors the existing `GAMEOVER` short-circuit without moving navigation into the reducer.

- [ ] **Step 5: Run tests and commit**

```bash
pnpm exec vitest run tests/ui/postGigHandlerLogic.test.jsx tests/ui/useArrivalLogic.test.jsx
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionExtraction.test.js tests/node/advanceDayAssetIntegration.test.js
git add src/hooks/postGig src/hooks/useArrivalLogic.ts src/context/reducers/systemReducer.ts tests
git commit -m "feat(expedition): finalize tours through run summary"
```

---

### Task 12: Add Core Golden Path and Stage Gate

**Files:**
- Create: `tests/golden-path/expeditionCore.test.js`
- Test: `tests/locale/full.test.js`, `tests/locale/smoke.test.js`, `tests/node/localeIntegrity.test.js`

- [ ] **Step 1: Add a real action/reducer golden path**

Test this exact sequence without mocked reducers:

```text
createInitialState
-> PREPARE_EXPEDITION
-> START_EXPEDITION
-> SET_MAP (8-hop deterministic map)
-> RECORD_EXPEDITION_ARRIVAL x3
-> FINALIZE_EXPEDITION(extracted)
-> CHANGE_SCENE(RUN_SUMMARY) from the owning callback
-> PREPARE_NEXT_EXPEDITION(new runSeed)
```

Assert career/assets/unlocks persist, the finalized `runId` remains stable across a save/reload, `PREPARE_NEXT_EXPEDITION` clears that id, the next `START_EXPEDITION` creates a different id, run state resets, `runSeed` changes, settlement is not double-applied, and next scene is Tour Prep.

- [ ] **Step 2: Run Core stage tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/golden-path/expeditionCore.test.js
pnpm run typecheck:core
pnpm run typecheck
pnpm run test:dot
pnpm run deadcode:check
pnpm run deadcode:budget
```

Expected: all PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/golden-path/expeditionCore.test.js
git commit -m "test(expedition): cover core tour lifecycle"
```

**Gate G1 is complete only after this task passes.**

---

# Condition, Repairs, and Cargo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing van, long-term tourbus modules, pre-gig minigames, and Supply Stops into a coherent expedition risk layer with cargo limits, grouped technical condition, hidden defects, repair choices, and simulator-visible economic sinks without introducing a third vehicle state model.

**Architecture:** Keep `player.van.fuel` and `player.van.condition` authoritative for live travel because the travel minigame already settles those values. Select one existing `tourbus_chassis` asset in the Expedition loadout for chassis/module identity and derive expedition bonuses through a pure adapter. Store only non-vehicle technical condition (`pa`, `instruments`, `stageGear`), cargo consumables, setup protection, and hidden defects in `expedition`; all wear/repair mutations go through typed action creators and the Expedition reducer.

**Tech Stack:** TypeScript 6, React 19, existing long-term asset registry/selectors, existing travel/minigame reducers, deterministic action creators, Vitest/Node tests, i18next, balance simulator.

---

## Depends On

- `01-expedition-core-extraction.md` merged through G1.
- `GameState.expedition` exists and saves round-trip.
- `TourPrep` can choose `activeTourbusAssetId`.
- Standard Expedition can reach Overworld and complete gigs.

## File Structure

**Create:**

- `src/domain/expedition/vehicle.ts`
- `src/domain/expedition/cargo.ts`
- `src/domain/expedition/condition.ts`
- `src/domain/expedition/repairs.ts`
- `src/data/expedition/insurance.ts`
- `src/domain/expedition/insurance.ts`
- `src/data/expedition/repairCatalog.ts`
- `src/ui/expedition/ConditionPanel.tsx`
- `src/ui/expedition/RepairChoices.tsx`
- `tests/node/expeditionVehicleAdapter.test.js`
- `tests/node/expeditionCargo.test.js`
- `tests/node/expeditionCondition.test.js`
- `tests/node/expeditionRepairs.test.js`
- `tests/node/expeditionInsurance.test.js`
- `tests/ui/ExpeditionConditionPanel.test.tsx`
- `tests/ui/SupplyStopExpedition.test.tsx`

**Modify:**

- `src/types/assets.d.ts`
- `src/types/expedition.d.ts`
- `src/types/events.d.ts`
- `src/utils/assetSelectors/assetFinancials.ts`
- `src/utils/assetSections/tourbusModules.ts`
- `src/context/actionTypes.ts`
- `src/types/actions.d.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/context/reducers/minigameReducer.ts`
- `src/utils/gameState/delta.ts`
- `src/hooks/postGig/handlers/useContinueHandler.ts`
- `src/ui/SupplyStopModal.tsx`
- `src/hooks/overworld/useSupplyStopModal.ts`
- `src/components/overworld/OverworldModals.tsx`
- `src/ui/expedition/TourPrepLoadout.tsx`
- `src/ui/expedition/ExpeditionStatusStrip.tsx`
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `scripts/game-balance-simulation.mjs`
- relevant source list in `scripts/game-balance-simulation.mjs`
- `tests/ui/SupplyStopModal.test.jsx`
- `tests/node/eventReducer.test.js`
- existing minigame reducer tests for Roadie/Kabelsalat/Amp Calibration

---

### Task 1: Extend Expedition State With Cargo and Setup Protection

**Files:**
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/defaults.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Test: `tests/node/expeditionDefaults.test.js`
- Test: `tests/node/expeditionSanitizers.test.js`

- [ ] **Step 1: Write failing state-shape tests**

Add:

```js
test('expedition defaults include empty consumable cargo and zero setup protection', () => {
  const state = createDefaultExpeditionState()
  assert.deepEqual(state.cargo, {
    spareParts: 0,
    supplies: 0,
    merchSlotsUsed: 0,
    contrabandSlotsUsed: 0
  })
  assert.deepEqual(state.setupProtection, {
    pa: 0,
    instruments: 0,
    stageGear: 0
  })
})

test('expedition sanitizer clamps cargo and setup protection', () => {
  const state = sanitizeExpeditionState({
    cargo: { spareParts: Infinity, supplies: -4, merchSlotsUsed: 3.9 },
    setupProtection: { pa: 140, instruments: -1, stageGear: 22 }
  })
  assert.deepEqual(state.cargo, {
    spareParts: 0,
    supplies: 0,
    merchSlotsUsed: 3,
    contrabandSlotsUsed: 0
  })
  assert.deepEqual(state.setupProtection, {
    pa: 100,
    instruments: 0,
    stageGear: 22
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionDefaults.test.js tests/node/expeditionSanitizers.test.js
```

Expected: FAIL because `cargo` and `setupProtection` are absent.

- [ ] **Step 3: Add exact state fields**

Add to `src/types/expedition.d.ts`:

```ts
export interface ExpeditionCargoState {
  spareParts: number
  supplies: number
  merchSlotsUsed: number
  contrabandSlotsUsed: number
}

export interface ExpeditionSetupProtection {
  pa: number
  instruments: number
  stageGear: number
}
```

Add to `ExpeditionState`:

```ts
cargo: ExpeditionCargoState
setupProtection: ExpeditionSetupProtection
```

In `createDefaultExpeditionState()` add:

```ts
cargo: {
  spareParts: 0,
  supplies: 0,
  merchSlotsUsed: 0,
  contrabandSlotsUsed: 0
},
setupProtection: {
  pa: 0,
  instruments: 0,
  stageGear: 0
},
```

Sanitize cargo counters as bounded non-negative integers and setup protection with the existing `0..100` clamp. Do not coerce strings/booleans.

- [ ] **Step 4: Re-run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionDefaults.test.js tests/node/expeditionSanitizers.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/expedition.d.ts src/domain/expedition/defaults.ts src/context/reducers/expeditionSanitizers.ts tests/node/expeditionDefaults.test.js tests/node/expeditionSanitizers.test.js
git commit -m "feat(expedition): add cargo and setup protection state"
```

---

### Task 2: Add a Pure Vehicle/Asset Adapter Instead of Duplicating Van State

**Files:**
- Create: `src/domain/expedition/vehicle.ts`
- Modify: `src/types/assets.d.ts`
- Modify: `src/utils/assetSelectors/assetFinancials.ts`
- Test: `tests/node/expeditionVehicleAdapter.test.js`

- [ ] **Step 1: Write failing adapter tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { getExpeditionVehicleState } from '../../src/domain/expedition/vehicle.ts'

const baseState = {
  player: { van: { fuel: 77, condition: 64 } },
  expedition: { loadout: { activeTourbusAssetId: 'bus_1' } },
  assets: [
    {
      id: 'bus_1',
      kind: 'tourbus_chassis',
      condition: 12,
      slots: [
        { installedModuleId: 'tb_roof_rack' },
        { installedModuleId: 'tb_sleeping_bunks' }
      ]
    }
  ]
}

test('vehicle adapter keeps live fuel and condition on player.van', () => {
  const result = getExpeditionVehicleState(baseState)
  assert.equal(result.fuel, 77)
  assert.equal(result.condition, 64)
  assert.equal(result.assetId, 'bus_1')
})

test('vehicle adapter falls back safely when selected asset is missing', () => {
  const result = getExpeditionVehicleState({
    ...baseState,
    expedition: { loadout: { activeTourbusAssetId: 'missing' } }
  })
  assert.equal(result.assetId, null)
  assert.deepEqual(result.moduleIds, [])
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionVehicleAdapter.test.js
```

Expected: FAIL because the adapter is missing.

- [ ] **Step 3: Add Expedition-specific module bonus fields**

Extend `AssetBoni` with:

```ts
cargoCapacityBonus?: number
roadWearMultiplier?: number
technicalWearMultiplier?: number
fieldRepairEfficiency?: number
inspectionLevel?: number
hiddenContrabandSlots?: number
```

All multipliers default to `1`, integer/additive bonuses default to `0`.

- [ ] **Step 4: Implement the adapter**

`src/domain/expedition/vehicle.ts` public contract:

```ts
import type { GameState } from '../../types'
import { finiteNumberOr } from '../../utils/finiteNumber'
import { getAssetAggregateBoni } from '../../utils/assetSelectors'

export interface ExpeditionVehicleState {
  assetId: string | null
  fuel: number
  condition: number
  moduleIds: string[]
  cargoCapacityBonus: number
  roadWearMultiplier: number
  technicalWearMultiplier: number
  fieldRepairEfficiency: number
  inspectionLevel: number
  hiddenContrabandSlots: number
}

export const getExpeditionVehicleState = (
  state: Pick<GameState, 'player' | 'assets' | 'expedition'>
): ExpeditionVehicleState => {
  const selectedId = state.expedition.loadout.activeTourbusAssetId
  const asset =
    selectedId === null
      ? null
      : state.assets.find(
          candidate =>
            candidate.id === selectedId && candidate.kind === 'tourbus_chassis'
        ) ?? null
  const boni = asset ? getAssetAggregateBoni(asset) : {}
  const moduleIds = asset
    ? asset.slots.flatMap(slot =>
        typeof slot.installedModuleId === 'string' ? [slot.installedModuleId] : []
      )
    : []
  return {
    assetId: asset?.id ?? null,
    fuel: Math.max(0, finiteNumberOr(state.player.van?.fuel, 0)),
    condition: Math.max(0, Math.min(100, finiteNumberOr(state.player.van?.condition, 100))),
    moduleIds,
    cargoCapacityBonus: finiteNumberOr(boni.cargoCapacityBonus, 0),
    roadWearMultiplier: finiteNumberOr(boni.roadWearMultiplier, 1),
    technicalWearMultiplier: finiteNumberOr(boni.technicalWearMultiplier, 1),
    fieldRepairEfficiency: finiteNumberOr(boni.fieldRepairEfficiency, 0),
    inspectionLevel: finiteNumberOr(boni.inspectionLevel, 0),
    hiddenContrabandSlots: finiteNumberOr(boni.hiddenContrabandSlots, 0)
  }
}
```

Update `src/utils/assetSelectors/assetFinancials.ts` so the new keys are included in the existing aggregation lists:

```ts
const ADDITIVE_BONI_KEYS = [
  // existing keys...
  'cargoCapacityBonus',
  'fieldRepairEfficiency',
  'inspectionLevel',
  'hiddenContrabandSlots'
] as const satisfies readonly (keyof AssetBoni)[]

const MULTIPLICATIVE_BONI_KEYS = [
  // existing keys...
  'roadWearMultiplier',
  'technicalWearMultiplier'
] as const satisfies readonly (keyof AssetBoni)[]
```

- [ ] **Step 5: Run adapter and selector tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionVehicleAdapter.test.js tests/node/assetSelectors.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/assets.d.ts src/utils/assetSelectors/assetFinancials.ts src/domain/expedition/vehicle.ts tests/node/expeditionVehicleAdapter.test.js
git commit -m "feat(expedition): adapt existing tourbus state"
```

---

### Task 3: Give Existing Tourbus Modules Expedition Rule Effects

**Files:**
- Modify: `src/utils/assetSections/tourbusModules.ts`
- Test: `tests/node/assetConfig.test.js`, `tests/node/assetModuleRegistry.test.js`, `tests/node/tourbusModules.test.js`, `tests/node/tourbusAntiStacking.test.js`
- Test: `tests/node/expeditionVehicleAdapter.test.js`

- [ ] **Step 1: Add failing assertions for selected existing module ids**

```js
test('roof rack and trailer hitch expand expedition cargo capacity', () => {
  assert.equal(MODULE_REGISTRY.get('tb_roof_rack')?.boni.cargoCapacityBonus, 2)
  assert.equal(MODULE_REGISTRY.get('tb_trailer_hitch')?.boni.cargoCapacityBonus, 4)
})

test('sleeping bunks trade cargo capacity for travel recovery', () => {
  assert.equal(MODULE_REGISTRY.get('tb_sleeping_bunks')?.boni.cargoCapacityBonus, -2)
})

test('gps jammer exposes an expedition inspection/evasion affordance', () => {
  assert.equal(MODULE_REGISTRY.get('tb_gps_jammer')?.boni.hiddenContrabandSlots, 1)
})
```

- [ ] **Step 2: Run and verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionVehicleAdapter.test.js
```

Expected: FAIL because the new boni are undefined.

- [ ] **Step 3: Add these exact additive effects without removing existing boni**

Update the current objects:

```ts
// tb_roof_rack
boni: { merchCapacityBonus: 30, cargoCapacityBonus: 2 }

// tb_sleeping_bunks
boni: { travelStaminaRegen: 5, cargoCapacityBonus: -2 }

// tb_trailer_hitch
boni: { merchCapacityBonus: 50, cargoCapacityBonus: 4 }

// tb_gps_jammer
boni: { diyRiskMultiplier: 0.5, hiddenContrabandSlots: 1, inspectionLevel: 1 }

// tb_smoke_screen
boni: { reducesTheftRiskTravel: true, roadWearMultiplier: 0.9 }

// tb_racing_seats
boni: { staminaRegenBonusPerDay: 3, roadWearMultiplier: 0.95 }
```

Do not change module price/unlock data in this delivery. Balance simulator data will show whether module costs need later recalibration.

- [ ] **Step 4: Run module validation**

```bash
pnpm run test:node -- tests/node/expeditionVehicleAdapter.test.js
pnpm run typecheck:core
```

Expected: PASS; existing module registry validation remains green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/assetSections/tourbusModules.ts tests/node/expeditionVehicleAdapter.test.js
git commit -m "feat(expedition): add tourbus expedition bonuses"
```

---

### Task 4: Implement Cargo Capacity and Loadout Validation

**Files:**
- Create: `src/domain/expedition/cargo.ts`
- Modify: `src/domain/expedition/loadout.ts`
- Modify: `src/ui/expedition/TourPrepLoadout.tsx`
- Test: `tests/node/expeditionCargo.test.js`
- Test: `tests/ui/TourPrep.test.tsx`

- [ ] **Step 1: Write failing cargo tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BASE_EXPEDITION_CARGO_CAPACITY,
  getExpeditionCargoCapacity,
  getExpeditionCargoUsed,
  canFitExpeditionCargo
} from '../../src/domain/expedition/cargo.ts'

const cargo = {
  spareParts: 2,
  supplies: 1,
  merchSlotsUsed: 3,
  contrabandSlotsUsed: 1
}

test('base cargo capacity is twelve slots', () => {
  assert.equal(BASE_EXPEDITION_CARGO_CAPACITY, 12)
  assert.equal(getExpeditionCargoUsed(cargo), 7)
})

test('vehicle bonus changes capacity but never below four', () => {
  assert.equal(getExpeditionCargoCapacity(4), 16)
  assert.equal(getExpeditionCargoCapacity(-20), 4)
})

test('cargo cannot exceed derived capacity', () => {
  assert.equal(canFitExpeditionCargo(cargo, 7), true)
  assert.equal(canFitExpeditionCargo(cargo, 6), false)
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCargo.test.js
```

Expected: FAIL because cargo domain is missing.

- [ ] **Step 3: Implement exact cargo arithmetic**

`src/domain/expedition/cargo.ts`:

```ts
import type { ExpeditionCargoState } from '../../types'

export const BASE_EXPEDITION_CARGO_CAPACITY = 12
export const MIN_EXPEDITION_CARGO_CAPACITY = 4

export const getExpeditionCargoUsed = (cargo: ExpeditionCargoState): number =>
  cargo.spareParts +
  cargo.supplies +
  cargo.merchSlotsUsed +
  cargo.contrabandSlotsUsed

export const getExpeditionCargoCapacity = (capacityBonus: number): number =>
  Math.max(
    MIN_EXPEDITION_CARGO_CAPACITY,
    BASE_EXPEDITION_CARGO_CAPACITY + Math.trunc(capacityBonus)
  )

export const canFitExpeditionCargo = (
  cargo: ExpeditionCargoState,
  capacity: number
): boolean => getExpeditionCargoUsed(cargo) <= capacity
```

Update loadout validation to derive vehicle bonus via `getExpeditionVehicleState` and reject start when selected cargo does not fit.

- [ ] **Step 4: Render capacity in Tour Prep**

The UI must display one bounded line such as `Cargo 7 / 12` and disable `Start Tour` when over capacity. Do not add a new permanent HUD bar:

```tsx
const capacity = getExpeditionCargoCapacity(state, loadout)
const used = getExpeditionCargoUsed(loadout.cargo)
return <p aria-live="polite">{t('ui:expedition.cargo.summary', { used, capacity })}</p>
```

Tour Prep folds `used <= capacity` into its existing `validateExpeditionLoadout` result.

- [ ] **Step 5: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCargo.test.js
pnpm exec vitest run tests/ui/TourPrep.test.tsx
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/expedition/cargo.ts src/domain/expedition/loadout.ts src/ui/expedition/TourPrepLoadout.tsx tests/node/expeditionCargo.test.js tests/ui/TourPrep.test.tsx
git commit -m "feat(expedition): enforce cargo capacity"
```

---

### Task 5: Implement Deterministic Grouped Wear

**Files:**
- Create: `src/domain/expedition/condition.ts`
- Modify: `src/domain/expedition/nodeIntel.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionCondition.test.js`
- Modify: `tests/node/expeditionNodeIntel.test.js`
- Test: `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Write failing domain tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateGigConditionWear,
  getConditionBand
} from '../../src/domain/expedition/condition.ts'

test('condition bands match the design thresholds', () => {
  assert.equal(getConditionBand(100), 'good')
  assert.equal(getConditionBand(69), 'worn')
  assert.equal(getConditionBand(39), 'critical')
  assert.equal(getConditionBand(19), 'breaking')
})

test('hard high-performance gigs wear more gear than easy gigs', () => {
  assert.deepEqual(
    calculateGigConditionWear({
      venueDifficulty: 4,
      accuracy: 80,
      technicalWearMultiplier: 1,
      protection: { pa: 0, instruments: 0, stageGear: 0 }
    }),
    { pa: 8, instruments: 4, stageGear: 5 }
  )
})

test('setup protection reduces but never reverses wear', () => {
  const wear = calculateGigConditionWear({
    venueDifficulty: 4,
    accuracy: 80,
    technicalWearMultiplier: 1,
    protection: { pa: 50, instruments: 100, stageGear: 0 }
  })
  assert.deepEqual(wear, { pa: 4, instruments: 0, stageGear: 5 })
})
```

Extend `tests/node/expeditionNodeIntel.test.js` to pin the staged G1 contract once Condition exists:

```js
import { getExpeditionNodeIntel } from '../../src/domain/expedition/nodeIntel.ts'

const wearNode = {
  id: 'wear-node',
  layer: 3,
  x: 0,
  y: 0,
  type: 'FESTIVAL',
  venue: { id: 'wear-venue', name: 'Wear Venue', pay: 4000, diff: 4 }
}

const level1 = getExpeditionNodeIntel(wearNode, 1)
assert.equal(level1.wearTier, 'high')
assert.equal(level1.projectedWear, null)

const level2 = getExpeditionNodeIntel(wearNode, 2)
assert.deepEqual(level2.projectedWear, {
  pa: 8,
  instruments: 4,
  stageGear: 5
})
```

The projection is a forecast at reference **70% accuracy**, multiplier `1`, and zero setup protection. It is not the guaranteed post-gig wear because the player's actual performance remains skill-dependent.

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCondition.test.js
```

Expected: FAIL because condition helpers are missing.

- [ ] **Step 3: Implement exact initial wear formula**

```ts
import type { ConditionGroup, ExpeditionSetupProtection } from '../../types'

export type ConditionBand = 'good' | 'worn' | 'critical' | 'breaking'

export const getConditionBand = (condition: number): ConditionBand => {
  if (condition >= 70) return 'good'
  if (condition >= 40) return 'worn'
  if (condition >= 20) return 'critical'
  return 'breaking'
}

const protectedWear = (raw: number, protectionPct: number): number =>
  Math.max(0, Math.round(raw * (1 - Math.max(0, Math.min(100, protectionPct)) / 100)))

export const calculateGigConditionWear = ({
  venueDifficulty,
  accuracy,
  technicalWearMultiplier,
  protection
}: {
  venueDifficulty: number
  accuracy: number
  technicalWearMultiplier: number
  protection: ExpeditionSetupProtection
}): Record<ConditionGroup, number> => {
  const difficulty = Math.max(1, Math.min(5, Math.trunc(venueDifficulty)))
  const performanceIntensity = accuracy >= 70 ? 2 : accuracy < 50 ? -1 : 0
  const intensity = Math.max(1, difficulty + performanceIntensity)
  const multiplier = Math.max(0, technicalWearMultiplier)
  const raw = {
    pa: Math.round((2 + intensity) * multiplier),
    instruments: Math.round((1 + Math.ceil(intensity / 2)) * multiplier),
    stageGear: Math.round((2 + Math.ceil(intensity / 2)) * multiplier)
  }
  return {
    pa: protectedWear(raw.pa, protection.pa),
    instruments: protectedWear(raw.instruments, protection.instruments),
    stageGear: protectedWear(raw.stageGear, protection.stageGear)
  }
}
```

- [ ] **Step 4: Populate the existing node-intel wear fields from the canonical formula**

Extend `src/domain/expedition/nodeIntel.ts`; do not rename the G1 fields:

```ts
import type { ConditionGroup, NodeIntelBand } from '../../types'
import { calculateGigConditionWear } from './condition'

export const projectNodeTechnicalWear = (
  node: MapNode
): Record<ConditionGroup, number> =>
  calculateGigConditionWear({
    venueDifficulty: getCanonicalNodeDifficulty(node) ?? 1,
    accuracy: 70,
    technicalWearMultiplier: 1,
    protection: { pa: 0, instruments: 0, stageGear: 0 }
  })

const toWearTier = (
  wear: Record<ConditionGroup, number>
): NodeIntelBand => {
  const total = wear.pa + wear.instruments + wear.stageGear
  if (total >= 12) return 'high'
  if (total >= 6) return 'medium'
  return 'low'
}
```

In `getExpeditionNodeIntel`, derive the projection once and expose only its qualitative band at Level 1:

```ts
const projectedWear = level >= 1 ? projectNodeTechnicalWear(node) : null

// inside the existing returned object
wearTier: projectedWear ? toWearTier(projectedWear) : null,
projectedWear: level >= 2 ? projectedWear : null,
```

This preserves the G1 result shape and keeps actual run wear in post-gig settlement, where real accuracy and setup protection are known.

- [ ] **Step 5: Add reducer action**

Add `APPLY_EXPEDITION_WEAR` with payload:

```ts
export interface ApplyExpeditionWearPayload {
  pa: number
  instruments: number
  stageGear: number
}
```

Action creator sanitizes each field to finite non-negative `0..100`. Reducer only applies when `expedition.status === 'active'`, subtracts each wear value with clamp `0..100`, and clears `setupProtection` after applying the gig wear once.

- [ ] **Step 6: Run domain/reducer/intel tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCondition.test.js tests/node/expeditionNodeIntel.test.js tests/node/expeditionReducer.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/expedition/condition.ts src/domain/expedition/nodeIntel.ts src/context/actionTypes.ts src/types/actions.d.ts src/context/expeditionActionCreators.ts src/context/reducers/expeditionReducer.ts tests/node/expeditionCondition.test.js tests/node/expeditionNodeIntel.test.js tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): apply grouped technical wear"
```

---

### Task 6: Convert Existing Pre-Gig Minigames Into Technical Protection

**Files:**
- Modify: `src/context/reducers/minigameReducer.ts`
- Modify: `src/domain/expedition/condition.ts`
- Test: `tests/ui/useRoadieLogic.test.jsx`, `tests/ui/useKabelsalatGameEnd.test.jsx`, `tests/logic/ampCalibrationReducer.test.js`
- Test: `tests/node/expeditionCondition.test.js`

- [ ] **Step 1: Write failing protection assertions**

Add integration expectations:

```js
assert.deepEqual(stateAfterPerfectAmp.expedition.setupProtection, {
  pa: 60,
  instruments: 0,
  stageGear: 0
})

assert.deepEqual(stateAfterPerfectKabelsalat.expedition.setupProtection, {
  pa: 0,
  instruments: 50,
  stageGear: 0
})

assert.deepEqual(stateAfterZeroDamageRoadie.expedition.setupProtection, {
  pa: 0,
  instruments: 0,
  stageGear: 60
})
```

Only assert these bonuses when an Expedition is active; legacy runs remain behaviorally unchanged.

- [ ] **Step 2: Verify failure**

```bash
pnpm exec vitest run tests/ui/ampCalibration.test.jsx tests/ui/kabelsalatMinigame.test.jsx tests/ui/roadieMinigame.test.jsx
```

Expected: Expedition protection assertions FAIL.

- [ ] **Step 3: Add pure conversion helpers**

```ts
export const ampScoreToProtection = (score: number): number =>
  score >= 90 ? 60 : score >= 70 ? 40 : score >= 50 ? 20 : 0

export const kabelsalatResultToProtection = (success: boolean, stress: number): number =>
  success && stress === 0 ? 50 : success ? 30 : 0

export const roadieDamageToProtection = (damage: number): number =>
  damage <= 0 ? 60 : damage <= 25 ? 40 : damage <= 50 ? 20 : 0
```

- [ ] **Step 4: Update completion reducers without changing scene ownership**

At the point each reducer already computes its sanitized final result, if `state.expedition.status === 'active'`, merge only the associated protection field using `Math.max`:

```ts
const withProtection = (
  nextState: GameState,
  key: keyof ExpeditionSetupProtection,
  value: number
): GameState => nextState.expedition.status !== 'active'
  ? nextState
  : {
      ...nextState,
      expedition: {
        ...nextState.expedition,
        setupProtection: {
          ...nextState.expedition.setupProtection,
          [key]: Math.max(nextState.expedition.setupProtection[key], value)
        }
      }
    }
```

Do not change `currentScene`; continuation callbacks still own navigation.

- [ ] **Step 5: Run minigame and type gates**

```bash
pnpm run test:ui
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/context/reducers/minigameReducer.ts src/domain/expedition/condition.ts tests
git commit -m "feat(expedition): convert setup minigames to wear protection"
```

---

### Task 7: Apply Gig Wear Exactly Once During Post-Gig Settlement

**Files:**
- Modify: `src/hooks/postGig/handlers/useContinueHandler.ts`
- Modify: `src/domain/expedition/condition.ts`
- Test: `tests/ui/postGigHandlerLogic.test.jsx`

- [ ] **Step 1: Add failing post-gig test**

Create an active Expedition state with PA 100, difficulty-4 venue, accuracy 80, no protection, invoke `handleContinue`, and assert one wear dispatch:

```jsx
const applyExpeditionWear = vi.fn()
const props = createPostGigProps({
  expedition: { status: 'active', setupProtection: { pa: 0, instruments: 0, stageGear: 0 } },
  currentGig: { difficulty: 4 },
  lastGigStats: { accuracy: 80, failed: false },
  applyExpeditionWear
})
const { result } = renderHook(() => useContinueHandler(props))
act(() => result.current.handleContinue())
act(() => result.current.handleContinue())
expect(applyExpeditionWear).toHaveBeenCalledTimes(1)
expect(applyExpeditionWear).toHaveBeenCalledWith({ pa: 8, instruments: 4, stageGear: 5 })
```

- [ ] **Step 2: Verify failure**

```bash
pnpm exec vitest run tests/ui/postGigHandlerLogic.test.jsx
```

Expected: FAIL because wear is not dispatched.

- [ ] **Step 3: Derive wear from canonical gig data**

Inside the existing guarded continuation block, after `lastGigStats` is available and before run routing, derive:

```ts
const wear = calculateGigConditionWear({
  venueDifficulty: finiteNumberOr(currentGig?.diff, 1),
  accuracy: finiteNumberOr(lastGigStats?.accuracy, 0),
  technicalWearMultiplier: getExpeditionVehicleState(gameState).technicalWearMultiplier,
  protection: gameState.expedition.setupProtection
})
applyExpeditionWear(wear)
```

Do not use `lastGigStats.score` as percentage; the repo's `accuracy` field is the `0..100` outcome metric.

- [ ] **Step 4: Run post-gig regression tests**

```bash
pnpm exec vitest run tests/ui/postGigHandlerLogic.test.jsx
pnpm run typecheck:core
```

Expected: PASS; wear dispatch occurs once.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/postGig/handlers/useContinueHandler.ts tests/ui/postGigHandlerLogic.test.jsx
git commit -m "feat(expedition): settle technical wear after gigs"
```

---

### Task 8: Implement Repair Options and Hidden Defects

**Files:**
- Create: `src/data/expedition/repairCatalog.ts`
- Create: `src/domain/expedition/repairs.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionRepairs.test.js`
- Test: `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Write failing repair tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getProfessionalRepairCost,
  resolveFieldRepair,
  resolveImprovisedRepair,
  resolveCannibalizeRepair
} from '../../src/domain/expedition/repairs.ts'

test('professional repair targets ninety and costs by missing points', () => {
  assert.equal(getProfessionalRepairCost(50), 800)
})

test('field repair consumes one spare and gains thirty-five plus efficiency', () => {
  assert.deepEqual(resolveFieldRepair(35, 0.2), {
    nextCondition: 77,
    sparePartsConsumed: 1
  })
})

test('improvised repair creates a deterministic hidden-defect request', () => {
  assert.deepEqual(resolveImprovisedRepair(30), {
    nextCondition: 50,
    shouldCreateHiddenDefect: true
  })
})

test('cannibalize transfers forty condition with forty-five restored', () => {
  assert.deepEqual(resolveCannibalizeRepair(70, 20), {
    sourceCondition: 30,
    targetCondition: 65
  })
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionRepairs.test.js
```

Expected: FAIL because repair domain is missing.

- [ ] **Step 3: Implement exact initial repair tuning**

`src/domain/expedition/repairs.ts`:

```ts
export const PROFESSIONAL_REPAIR_TARGET = 90
export const PROFESSIONAL_REPAIR_COST_PER_POINT = 20

export const getProfessionalRepairCost = (condition: number): number =>
  Math.max(0, PROFESSIONAL_REPAIR_TARGET - Math.max(0, Math.min(100, condition))) *
  PROFESSIONAL_REPAIR_COST_PER_POINT

export const resolveFieldRepair = (
  condition: number,
  efficiencyBonus: number
): { nextCondition: number; sparePartsConsumed: number } => ({
  nextCondition: Math.min(100, condition + Math.round(35 * (1 + Math.max(0, efficiencyBonus)))),
  sparePartsConsumed: 1
})

export const resolveImprovisedRepair = (
  condition: number
): { nextCondition: number; shouldCreateHiddenDefect: boolean } => ({
  nextCondition: Math.min(100, condition + 20),
  shouldCreateHiddenDefect: true
})

export const resolveCannibalizeRepair = (
  sourceCondition: number,
  targetCondition: number
): { sourceCondition: number; targetCondition: number } => ({
  sourceCondition: Math.max(0, sourceCondition - 40),
  targetCondition: Math.min(100, targetCondition + 45)
})
```

- [ ] **Step 4: Add typed repair action**

Use one action payload representing a fully resolved deterministic mutation:

```ts
export interface RepairExpeditionConditionPayload {
  target: ConditionGroup
  nextTargetCondition: number
  source: ConditionGroup | null
  nextSourceCondition: number | null
  moneyCost: number
  sparePartsConsumed: number
  hiddenDefect: HiddenDefectState | null
}
```

Action creator accepts a repair intent plus current state, validates availability/cost, and if improvisation creates a hidden defect, generates its deterministic id and severity using an action-creator RNG derived from the current `rngSeed`. Reducer performs no randomness, rechecks current money/spares/source group, applies the resolved mutation, and refuses replay if resources no longer match.

- [ ] **Step 5: Hidden defect ids are stable and bounded**

Use canonical ids:

```ts
const DEFECT_BY_GROUP = {
  pa: 'loose_power_connector',
  instruments: 'unstable_signal_chain',
  stageGear: 'damaged_mount'
} as const
```

Improvised repair creates at most one undiscovered defect with the same `id + group`; repeated improvisation updates severity to `major` instead of duplicating the entry.

- [ ] **Step 6: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionRepairs.test.js tests/node/expeditionReducer.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/data/expedition/repairCatalog.ts src/domain/expedition/repairs.ts src/context/actionTypes.ts src/types/actions.d.ts src/context/expeditionActionCreators.ts src/context/reducers/expeditionReducer.ts tests/node/expeditionRepairs.test.js tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): add repair and hidden defect choices"
```

---

### Task 9: Add Optional Expedition Insurance as a Risk Sink

**Files:**
- Create: `src/data/expedition/insurance.ts`
- Create: `src/domain/expedition/insurance.ts`
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/defaults.ts`
- Modify: `src/domain/expedition/loadout.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/hooks/travel/handleCompleteTravelMinigame.ts`
- Modify: `src/domain/expedition/condition.ts`
- Modify: `src/ui/expedition/TourPrepLoadout.tsx`
- Modify: `public/locales/en/ui.json`
- Modify: `public/locales/de/ui.json`
- Test: `tests/node/expeditionInsurance.test.js`
- Test: `tests/node/expeditionReducer.test.js`
- Test: `tests/node/useTravelLogic.test.js`
- Test: `tests/ui/TourPrep.test.tsx`

Insurance is optional pre-tour risk management. It must never become mandatory daily upkeep and it must not insure Fuel, Heat, crew stress, contract failure, or ordinary lost profits.

- [ ] **Step 1: Write failing policy and one-claim tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getInsurancePremium,
  resolveInsuranceProtection
} from '../../src/domain/expedition/insurance.ts'

test('fixed v1 premiums are deterministic', () => {
  assert.equal(getInsurancePremium(null), 0)
  assert.equal(getInsurancePremium('roadside'), 350)
  assert.equal(getInsurancePremium('equipment'), 450)
  assert.equal(getInsurancePremium('touring'), 750)
})

test('roadside insurance rescues vehicle once but not equipment', () => {
  assert.deepEqual(resolveInsuranceProtection({
    policyId: 'roadside', claimUsed: false, target: 'vehicle', conditionAfterWear: 0
  }), { condition: 25, claimUsed: true })
  assert.deepEqual(resolveInsuranceProtection({
    policyId: 'roadside', claimUsed: false, target: 'pa', conditionAfterWear: 0
  }), { condition: 0, claimUsed: false })
})

test('a used policy cannot trigger a second claim', () => {
  assert.deepEqual(resolveInsuranceProtection({
    policyId: 'touring', claimUsed: true, target: 'pa', conditionAfterWear: 0
  }), { condition: 0, claimUsed: true })
})
```

- [ ] **Step 2: Define three policies plus no-policy**

```ts
export type ExpeditionInsurancePolicyId =
  | 'roadside'
  | 'equipment'
  | 'touring'

export const EXPEDITION_INSURANCE_POLICIES = Object.freeze({
  roadside: { premium: 350, coveredTargets: ['vehicle'], rescueCondition: 25 },
  equipment: { premium: 450, coveredTargets: ['pa', 'instruments', 'stageGear'], rescueCondition: 25 },
  touring: { premium: 750, coveredTargets: ['vehicle', 'pa', 'instruments', 'stageGear'], rescueCondition: 30 }
} as const)
```

`null` means uninsured and has premium `0`.

- [ ] **Step 3: Extend loadout/run state without duplicating Condition**

Add to `ExpeditionLoadout`:

```ts
insurancePolicyId: ExpeditionInsurancePolicyId | null
```

Add to `ExpeditionState`:

```ts
insuranceClaimUsed: boolean
insurancePremiumPaid: number
```

Defaults are `null`, `false`, and `0`. The sanitizer accepts only the three policy ids. `validateExpeditionLoadout` rejects a policy when `state.player.money < getInsurancePremium(policyId)`.

- [ ] **Step 4: Charge the premium exactly once when the Expedition starts**

Extend the existing `START_EXPEDITION` reducer branch:

```ts
const premium = getInsurancePremium(payload.loadout.insurancePolicyId)
if (finiteNumberOr(state.player.money, 0) < premium) return state

return {
  ...state,
  player: { ...state.player, money: state.player.money - premium },
  expedition: {
    ...createDefaultExpeditionState(),
    status: 'active',
    loadout: payload.loadout,
    insurancePremiumPaid: premium,
    startingMoney: finiteNumberOr(state.player.money, 0) - premium,
    startingFame: finiteNumberOr(state.player.fame, 0)
  }
}
```

The premium is part of pre-tour spend; extraction never refunds it. A replayed `START_EXPEDITION` while already active remains rejected by the lifecycle reducer.

- [ ] **Step 5: Apply claims only at the two canonical Condition seams**

Pure resolver:

```ts
export const resolveInsuranceProtection = (input: InsuranceProtectionInput) => {
  if (input.claimUsed || input.conditionAfterWear > 0 || input.policyId === null) {
    return { condition: input.conditionAfterWear, claimUsed: input.claimUsed }
  }
  const policy = EXPEDITION_INSURANCE_POLICIES[input.policyId]
  if (!policy.coveredTargets.includes(input.target)) {
    return { condition: input.conditionAfterWear, claimUsed: false }
  }
  return { condition: policy.rescueCondition, claimUsed: true }
}
```

For non-vehicle groups, call it in the Expedition wear reducer after canonical wear is computed but before the group is committed. For vehicle condition, call the same resolver immediately after `handleCompleteTravelMinigame` has committed the canonical `player.van.condition` and before arrival/failure routing; if a claim fires, dispatch the existing typed player/van update plus an Expedition action that marks `insuranceClaimUsed:true`. Never pre-emptively claim above condition `0`.

- [ ] **Step 6: Add insurance to Tour Prep as an optional trade-off**

```tsx
<InsurancePicker
  selectedPolicyId={draft.insurancePolicyId}
  money={player.money}
  policies={EXPEDITION_INSURANCE_POLICIES}
  onSelect={insurancePolicyId => updateDraft({ insurancePolicyId })}
/>
```

Show premium, covered groups, and the one-claim rescue condition. Do not display actuarial percentages or imply the policy covers failures outside Condition.

- [ ] **Step 7: Run insurance/travel/save/UI gates**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionInsurance.test.js \
  tests/node/expeditionReducer.test.js \
  tests/node/useTravelLogic.test.js
pnpm exec vitest run tests/ui/TourPrep.test.tsx
pnpm run typecheck:core
```

Expected: PASS; premiums charge once, a covered zero-condition event is rescued once, and uninsured/used/unsupported targets remain unchanged.

- [ ] **Step 8: Commit**

```bash
git add src/data/expedition/insurance.ts src/domain/expedition/insurance.ts src/types/expedition.d.ts src/domain/expedition/defaults.ts src/domain/expedition/loadout.ts src/context src/hooks/travel src/ui/expedition/TourPrepLoadout.tsx public/locales tests
git commit -m "feat(expedition): add optional run insurance"
```


### Task 10: Extend Event Delta With an Expedition Subdelta

**Files:**
- Modify: `src/types/events.d.ts`
- Modify: `src/utils/gameState/delta.ts`
- Test: `tests/node/eventReducer.test.js`

- [ ] **Step 1: Add failing event-delta test**

```js
test('event delta can change expedition pressure, condition, cargo, and crew stress', () => {
  const next = applyEventDelta(baseActiveExpeditionState, {
    expedition: {
      heat: 10,
      exposure: -5,
      condition: { pa: -8 },
      cargo: { spareParts: 1 },
      crewStress: { crew_mika_tech: 12 }
    }
  })
  assert.equal(next.expedition.pressure.heat, 10)
  assert.equal(next.expedition.pressure.exposure, 0)
  assert.equal(next.expedition.condition.pa, 92)
  assert.equal(next.expedition.cargo.spareParts, 1)
  assert.equal(next.expedition.crewRunById.crew_mika_tech.stress, 12)
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/eventReducer.test.js
```

Expected: FAIL because `EventDelta` has no Expedition branch.

- [ ] **Step 3: Add strict type**

```ts
export interface ExpeditionEventDelta {
  heat?: number
  exposure?: number
  condition?: Partial<Record<ConditionGroup, number>>
  cargo?: Partial<Pick<ExpeditionCargoState, 'spareParts' | 'supplies'>>
  crewStress?: Record<string, number>
}
```

Add `expedition?: ExpeditionEventDelta` to `EventDelta`.

- [ ] **Step 4: Apply through the same pure delta pipeline**

Extend `calculateAppliedDelta` / `applyEventDelta` using the same strict guards. Keep the writable Expedition subset explicit:

```ts
if (delta.expedition && next.expedition.status === 'active') {
  const effect = sanitizeExpeditionEventDelta(delta.expedition, next.expedition)
  next = {
    ...next,
    expedition: {
      ...next.expedition,
      condition: applyConditionDelta(next.expedition.condition, effect.condition),
      pressure: applyPressureDelta(next.expedition.pressure, {
        heat: effect.heat,
        exposure: effect.exposure
      }),
      cargo: applyCargoDelta(next.expedition.cargo, effect.cargo),
      crewRunById: applyKnownCrewStressDeltas(next.expedition.crewRunById, effect.crewStress)
    }
  }
}
```

`sanitizeExpeditionEventDelta` has no fields for `outcome`, `loadout`, `routeStep`, or `career`, so raw events cannot mutate them.

- [ ] **Step 5: Run event regression**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/eventReducer.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/events.d.ts src/utils/gameState/delta.ts tests/node/eventReducer.test.js
git commit -m "feat(expedition): support event-driven run deltas"
```

---

### Task 11: Add Expedition Repair/Supply Actions to Supply Stop UI

**Files:**
- Create: `src/ui/expedition/RepairChoices.tsx`
- Modify: `src/ui/SupplyStopModal.tsx`
- Modify: `src/hooks/overworld/useSupplyStopModal.ts`
- Modify: `src/components/overworld/OverworldModals.tsx`
- Modify: `src/context/useExpeditionDispatchActions.ts`
- Test: `tests/ui/SupplyStopModal.test.jsx`
- Test: `tests/ui/SupplyStopExpedition.test.tsx`

- [ ] **Step 1: Add failing UI tests**

Test an active Expedition Supply Stop and assert tabs/buttons for:

```text
Inventory
Repairs
Supplies
```

Assert:

- `Buy Spare Part` costs `€250` and adds one cargo unit when capacity permits.
- `Buy Supply` costs `€150` and adds one cargo unit.
- professional repair shows exact computed cost and disables when money is insufficient.
- field repair disables with zero spare parts.
- double-clicking a purchase/repair dispatches once via the existing purchase lock pattern.

- [ ] **Step 2: Verify failure**

```bash
pnpm exec vitest run tests/ui/SupplyStopModal.test.jsx tests/ui/SupplyStopExpedition.test.tsx
```

Expected: FAIL because Expedition tabs are absent.

- [ ] **Step 3: Add exact consumable prices**

`src/data/expedition/repairCatalog.ts`:

```ts
export const EXPEDITION_SUPPLY_PRICES = Object.freeze({
  sparePart: 250,
  supply: 150
})
```

- [ ] **Step 4: Reuse existing purchase-lock behavior**

`SupplyStopModal` keeps its existing inventory flow intact. When `expedition.status === 'active'`, render tabs and pass repair/cargo actions through the same `processingItemId` + ref guard used for normal purchases. Do not call a raw mutation twice during the same click cycle.

- [ ] **Step 5: Add cargo purchase actions**

Add `ADD_EXPEDITION_CARGO` payload:

```ts
export interface AddExpeditionCargoPayload {
  kind: 'spareParts' | 'supplies'
  quantity: number
  moneyCost: number
  expectedUsedSlots: number
  capacity: number
}
```

The action creator derives and stamps `capacity`; reducer rechecks money and current used slots, subtracts money using the canonical player clamp, and increments only the requested cargo field. Replay after the first purchase fails because `expectedUsedSlots` no longer matches.

- [ ] **Step 6: Run UI/reducer tests**

```bash
pnpm exec vitest run tests/ui/SupplyStopModal.test.jsx tests/ui/SupplyStopExpedition.test.tsx
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/ui/SupplyStopModal.tsx src/ui/expedition/RepairChoices.tsx src/hooks/overworld/useSupplyStopModal.ts src/components/overworld/OverworldModals.tsx src/context src/data/expedition/repairCatalog.ts tests/ui/SupplyStopModal.test.jsx tests/ui/SupplyStopExpedition.test.tsx
git commit -m "feat(expedition): add supply stop repairs and consumables"
```

---

### Task 12: Surface Condition Without Creating HUD Clutter

**Files:**
- Create: `src/ui/expedition/ConditionPanel.tsx`
- Modify: `src/ui/expedition/ExpeditionStatusStrip.tsx`
- Modify: `public/locales/en/ui.json`
- Modify: `public/locales/de/ui.json`
- Test: `tests/ui/ExpeditionConditionPanel.test.tsx`

- [ ] **Step 1: Write failing UI test**

Assert the persistent status strip shows a single aggregate `Equipment` indicator. Opening it shows PA/Instruments/Stage Gear bands and only discovered defects. Undiscovered defects must not appear in text/ARIA output.

- [ ] **Step 2: Verify failure**

```bash
pnpm exec vitest run tests/ui/ExpeditionConditionPanel.test.tsx
```

Expected: FAIL because panel is missing.

- [ ] **Step 3: Implement aggregate selector**

Use:

```ts
export const getAggregateTechnicalCondition = (
  condition: ExpeditionConditionState
): number =>
  Math.round((condition.pa + condition.instruments + condition.stageGear) / 3)
```

Status strip renders only the aggregate. The panel renders individual groups with translated semantic bands and discovered defects.

- [ ] **Step 4: Add EN/DE keys together**

Add matching namespaced keys in both locales:

```json
{
  "expedition": {
    "condition": { "good": "Good", "worn": "Worn", "critical": "Critical", "breaking": "Breaking", "hiddenDefect": "Hidden defect" },
    "cargo": { "summary": "Cargo {{used}} / {{capacity}}", "spareParts": "Spare parts", "supplies": "Supplies" },
    "repair": { "professional": "Professional repair", "field": "Field repair", "improvise": "Improvise", "cannibalize": "Cannibalize" }
  }
}
```

```json
{
  "expedition": {
    "condition": { "good": "Gut", "worn": "Abgenutzt", "critical": "Kritisch", "breaking": "Kurz vor Ausfall", "hiddenDefect": "Verdeckter Defekt" },
    "cargo": { "summary": "Ladung {{used}} / {{capacity}}", "spareParts": "Ersatzteile", "supplies": "Vorräte" },
    "repair": { "professional": "Professionell reparieren", "field": "Feldreparatur", "improvise": "Improvisieren", "cannibalize": "Ausschlachten" }
  }
}
```

- [ ] **Step 5: Run UI/i18n gates**

```bash
pnpm exec vitest run tests/ui/ExpeditionConditionPanel.test.tsx
pnpm run test:additional
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/expedition/ConditionPanel.tsx src/ui/expedition/ExpeditionStatusStrip.tsx public/locales/en/ui.json public/locales/de/ui.json tests/ui/ExpeditionConditionPanel.test.tsx
git commit -m "feat(expedition): surface technical condition"
```

---

### Task 13: Add G2 Condition/Cargo Coverage to the Balance Simulator

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `scripts/utils/balance-report-metadata.mjs`
- Test: `tests/node/game-balance-simulation.test.js`, `tests/node/balanceSourceFiles.test.js`

- [ ] **Step 1: Add failing report-contract assertions**

Extend the simulator report test to require these per-scenario fields:

```js
[
  'avgConditionAtFinale',
  'p10ConditionAtFinale',
  'avgProfessionalRepairs',
  'avgFieldRepairs',
  'avgImprovisedRepairs',
  'avgSparePartsConsumed',
  'avgSupplySpend',
  'avgRepairSpend',
  'avgInsuranceSpend',
  'insuranceClaimRunsPct',
  'hiddenDefectRunsPct',
  'disabledAssetRunsPct',
  'avgCargoUsedPct'
]
```

- [ ] **Step 2: Verify report contract fails**

```bash
pnpm run test:node
```

Expected: FAIL only on missing new G2 report fields/source entries.

- [ ] **Step 3: Import production helpers**

The simulator must import and use:

```js
import {
  calculateGigConditionWear,
  getAggregateTechnicalCondition
} from '../src/domain/expedition/condition.ts'
import {
  getProfessionalRepairCost,
  resolveFieldRepair,
  resolveImprovisedRepair
} from '../src/domain/expedition/repairs.ts'
import {
  getExpeditionCargoCapacity,
  getExpeditionCargoUsed
} from '../src/domain/expedition/cargo.ts'
import {
  getInsurancePremium,
  resolveInsuranceProtection
} from '../src/domain/expedition/insurance.ts'
```

Add `src/data/expedition/insurance.ts`, `src/domain/expedition/insurance.ts`, and every other new production file that materially affects simulation output to `BALANCE_SOURCE_FILES`.

- [ ] **Step 4: Add deterministic simulator policy**

For G2 only, use one explicit baseline expedition policy:

```text
- start with 2 spare parts and 1 supply
- if aggregate technical condition < 35 and a Supply Stop is available: professional repair when affordable
- else if any group < 30 and spare parts remain: field repair the lowest group
- else if any group < 20: improvised repair the lowest group
- never cannibalize in baseline policy
```

This is a simulator policy, not player AI truth; label it as such in the Markdown report.

- [ ] **Step 5: Add report section `Condition, Repairs & Cargo`**

Report mean/P10 condition, repair mix, Cash sinks, defects, disabled equipment, and cargo utilization. Add a deterministic row builder:

```js
const buildConditionReportRow = summary => ({
  avgMinCondition: summary.condition.avgMinimum,
  p10MinCondition: summary.condition.p10Minimum,
  professionalRepairPct: summary.repairs.professionalPct,
  fieldRepairPct: summary.repairs.fieldPct,
  repairSpend: summary.spendByCategory.repair,
  supplySpend: summary.spendByCategory.supply,
  hiddenDefectRunsPct: summary.condition.hiddenDefectRunsPct,
  disabledEquipmentRunsPct: summary.condition.disabledRunsPct,
  avgCargoUtilizationPct: summary.cargo.avgUtilizationPct
})
```

These remain descriptive until G6.

- [ ] **Step 6: Run one smoke simulation then full 2,000-run report**

```bash
pnpm run simulate:balance -- --runs 20
pnpm run simulate:balance
```

Expected: smoke completes; full report keeps 2,000 runs per scenario and existing holdout logic.

- [ ] **Step 7: Run G2 gate**

```bash
pnpm run test:node
pnpm run test:ui
pnpm run typecheck:core
pnpm run deadcode:check
pnpm run simulate:balance
```

Expected: all code gates PASS; simulator reports G2 metrics with no missing source fingerprint inputs.

- [ ] **Step 8: Commit**

```bash
git add scripts/game-balance-simulation.mjs reports tests
git commit -m "test(balance): measure expedition condition and cargo"
```

---

## G2 Exit Criteria

- No new vehicle state exists besides the explicit adapter bridge.
- Travel still settles fuel/vehicle condition only once through the existing travel minigame reducer.
- Technical wear is deterministic and applied exactly once after gigs.
- Cargo has a meaningful capacity trade-off.
- Supply Stops can buy safety through parts/supplies/repairs.
- Improvisation can create hidden defects; undiscovered defects never leak into UI.
- Existing minigames reduce future technical wear instead of becoming detached side activities.
- Simulator records repair/cargo/condition economic pressure before balance tuning starts.

---

# Crew, Stress, Relationships, and Injuries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-slot Expedition crew loadout whose roles change route information, repairs, travel, sponsors, and safety while run stress/crises and persistent loyalty/relationships create meaningful consequences without turning the game into a payroll simulator.

**Architecture:** Crew definitions are static content in `src/data/expedition/crew.ts`; availability uses the existing unlock system, run stress/temporary traits live in `expedition.crewRunById`, and loyalty/relationships/story progress live in `career`. The first delivery deliberately keeps one active crew actor per selected slot and one compact semantic stress model. Stress/injury changes are deterministic deltas dispatched from existing travel/gig/rest seams; crisis events reuse the current event engine through an explicit Expedition event-effect adapter.

**Tech Stack:** TypeScript 6, React 19, existing event engine/resolver, typed reducers/actions, i18next, deterministic RNG/action creators, Node/Vitest tests, balance simulator.

---

## Depends On

- `01-expedition-core-extraction.md` merged.
- `02-condition-repairs-cargo.md` may develop in parallel, but G4 cannot start until both G2 and G3 are merged.
- Existing `state.unlocks`/`unlockManager` remains the capability-unlock owner.

## File Structure

**Create:**

- `src/types/crew.d.ts`
- `src/data/expedition/crew.ts`
- `src/domain/expedition/crew.ts`
- `src/domain/expedition/crewStress.ts`
- `src/domain/expedition/relationships.ts`
- `src/domain/expedition/injuries.ts`
- `src/data/events/crew.ts`
- `src/ui/expedition/CrewPicker.tsx`
- `src/ui/expedition/CrewStatusPanel.tsx`
- `tests/node/expeditionCrewRegistry.test.js`
- `tests/node/expeditionCrewStress.test.js`
- `tests/node/expeditionRelationships.test.js`
- `tests/node/expeditionInjuries.test.js`
- `tests/ui/ExpeditionCrewPicker.test.tsx`
- `tests/ui/ExpeditionCrewStatus.test.tsx`
- `src/context/careerActionCreators.ts`
- `src/context/reducers/careerReducer.ts`
- `src/context/useCareerDispatchActions.ts`

**Modify:**

- `src/types/index.ts`
- `src/types/career.d.ts`
- `src/types/expedition.d.ts`
- `src/domain/expedition/defaults.ts`
- `src/domain/expedition/loadout.ts`
- `src/context/reducers/careerSanitizers.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/actionTypes.ts`
- `src/types/actions.d.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/domain/eventResolver.ts`
- `src/data/events/index.ts`
- `src/hooks/travel/actions/useHandleNodeArrivalCallback.ts`
- `src/hooks/travel/useVanMaintenance.ts`
- `src/hooks/postGig/handlers/useContinueHandler.ts`
- `src/utils/arrivalUtils.ts`
- `src/ui/expedition/TourPrepLoadout.tsx`
- `src/ui/expedition/ExpeditionStatusStrip.tsx`
- `src/utils/unlockManager.ts` only through existing API usage; do not change storage format
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `public/locales/en/events.json`
- `public/locales/de/events.json`
- `scripts/game-balance-simulation.mjs`
- balance source fingerprint list
- relevant event resolver/registry tests

---

### Task 1: Define the Initial Six Crew Actors and Roles

**Files:**
- Create: `src/types/crew.d.ts`
- Create: `src/data/expedition/crew.ts`
- Modify: `src/types/index.ts`
- Test: `tests/node/expeditionCrewRegistry.test.js`

- [ ] **Step 1: Write the failing registry test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXPEDITION_CREW,
  EXPEDITION_CREW_BY_ID,
  STARTER_CREW_IDS
} from '../../src/data/expedition/crew.ts'

test('crew registry has six unique stable actors and four baseline options', () => {
  assert.equal(EXPEDITION_CREW.length, 6)
  assert.equal(new Set(EXPEDITION_CREW.map(actor => actor.id)).size, 6)
  assert.deepEqual(STARTER_CREW_IDS, [
    'crew_mika_tech',
    'crew_anja_roadie',
    'crew_tom_driver',
    'crew_nico_scout'
  ])
  for (const id of STARTER_CREW_IDS) assert.ok(EXPEDITION_CREW_BY_ID[id])
})

test('crew roles are deliberately non-overlapping', () => {
  assert.deepEqual(
    EXPEDITION_CREW.map(actor => actor.role),
    ['technician', 'roadie', 'driver', 'manager', 'scout', 'security']
  )
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCrewRegistry.test.js
```

Expected: FAIL because registry is missing.

- [ ] **Step 3: Add exact type contract**

`src/types/crew.d.ts`:

```ts
export type ExpeditionCrewRole =
  | 'technician'
  | 'roadie'
  | 'driver'
  | 'manager'
  | 'scout'
  | 'security'

export interface ExpeditionCrewDefinition {
  id: string
  role: ExpeditionCrewRole
  nameKey: string
  talentKey: string
  traitKey: string
  viceKey: string | null
  baseEffects: {
    fieldRepairEfficiency?: number
    technicalWearMultiplier?: number
    roadWearMultiplier?: number
    scoutIntelBonus?: 1
    contractRewardMultiplier?: number
    heatGainMultiplier?: number
  }
}
```

- [ ] **Step 4: Add exact initial registry**

`src/data/expedition/crew.ts`:

```ts
import type { ExpeditionCrewDefinition } from '../../types'

export const EXPEDITION_CREW = Object.freeze([
  {
    id: 'crew_mika_tech',
    role: 'technician',
    nameKey: 'ui:expedition.crew.mika.name',
    talentKey: 'ui:expedition.crew.mika.talent',
    traitKey: 'ui:expedition.crew.mika.trait',
    viceKey: 'ui:expedition.crew.mika.vice',
    baseEffects: { fieldRepairEfficiency: 0.2, technicalWearMultiplier: 0.9 }
  },
  {
    id: 'crew_anja_roadie',
    role: 'roadie',
    nameKey: 'ui:expedition.crew.anja.name',
    talentKey: 'ui:expedition.crew.anja.talent',
    traitKey: 'ui:expedition.crew.anja.trait',
    viceKey: null,
    baseEffects: { technicalWearMultiplier: 0.92 }
  },
  {
    id: 'crew_tom_driver',
    role: 'driver',
    nameKey: 'ui:expedition.crew.tom.name',
    talentKey: 'ui:expedition.crew.tom.talent',
    traitKey: 'ui:expedition.crew.tom.trait',
    viceKey: null,
    baseEffects: { roadWearMultiplier: 0.85 }
  },
  {
    id: 'crew_leyla_manager',
    role: 'manager',
    nameKey: 'ui:expedition.crew.leyla.name',
    talentKey: 'ui:expedition.crew.leyla.talent',
    traitKey: 'ui:expedition.crew.leyla.trait',
    viceKey: 'ui:expedition.crew.leyla.vice',
    baseEffects: { contractRewardMultiplier: 1.1 }
  },
  {
    id: 'crew_nico_scout',
    role: 'scout',
    nameKey: 'ui:expedition.crew.nico.name',
    talentKey: 'ui:expedition.crew.nico.talent',
    traitKey: 'ui:expedition.crew.nico.trait',
    viceKey: null,
    baseEffects: { scoutIntelBonus: 1 }
  },
  {
    id: 'crew_saskia_security',
    role: 'security',
    nameKey: 'ui:expedition.crew.saskia.name',
    talentKey: 'ui:expedition.crew.saskia.talent',
    traitKey: 'ui:expedition.crew.saskia.trait',
    viceKey: null,
    baseEffects: { heatGainMultiplier: 0.8 }
  }
] as const satisfies readonly ExpeditionCrewDefinition[])

export const EXPEDITION_CREW_BY_ID = Object.freeze(
  Object.fromEntries(EXPEDITION_CREW.map(actor => [actor.id, actor]))
) as Readonly<Record<string, ExpeditionCrewDefinition>>

export const STARTER_CREW_IDS = Object.freeze([
  'crew_mika_tech',
  'crew_anja_roadie',
  'crew_tom_driver',
  'crew_nico_scout'
] as const)
```

Manager and Security are later unlocks; starter actors are always available and do not need stored unlock markers. Later actors use `expedition.crew.<id>` unlock ids.

- [ ] **Step 5: Run registry/type tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCrewRegistry.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/crew.d.ts src/types/index.ts src/data/expedition/crew.ts tests/node/expeditionCrewRegistry.test.js
git commit -m "feat(expedition): add crew registry"
```

---

### Task 2: Enforce Three Crew Slots and Existing Unlock Ownership

**Files:**
- Create: `src/domain/expedition/crew.ts`
- Modify: `src/domain/expedition/loadout.ts`
- Test: `tests/node/expeditionCrewRegistry.test.js`
- Test: `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Add failing loadout tests**

```js
import {
  MAX_EXPEDITION_CREW_SLOTS,
  isCrewAvailable,
  validateCrewSelection
} from '../../src/domain/expedition/crew.ts'

test('crew selection is limited to three unique actors', () => {
  assert.equal(MAX_EXPEDITION_CREW_SLOTS, 3)
  assert.equal(validateCrewSelection([
    'crew_mika_tech', 'crew_anja_roadie', 'crew_tom_driver'
  ], []), true)
  assert.equal(validateCrewSelection([
    'crew_mika_tech', 'crew_anja_roadie', 'crew_tom_driver', 'crew_nico_scout'
  ], []), false)
  assert.equal(validateCrewSelection(['crew_mika_tech', 'crew_mika_tech'], []), false)
})

test('manager requires the existing unlock registry', () => {
  assert.equal(isCrewAvailable('crew_leyla_manager', []), false)
  assert.equal(
    isCrewAvailable('crew_leyla_manager', ['expedition.crew.crew_leyla_manager']),
    true
  )
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCrewRegistry.test.js
```

Expected: FAIL because crew domain is missing.

- [ ] **Step 3: Implement exact availability rules**

```ts
import { EXPEDITION_CREW_BY_ID, STARTER_CREW_IDS } from '../../data/expedition/crew'

export const MAX_EXPEDITION_CREW_SLOTS = 3
const STARTER_SET = new Set<string>(STARTER_CREW_IDS)

export const crewUnlockId = (crewId: string): string =>
  `expedition.crew.${crewId}`

export const isCrewAvailable = (
  crewId: string,
  unlocks: readonly string[]
): boolean =>
  Object.hasOwn(EXPEDITION_CREW_BY_ID, crewId) &&
  (STARTER_SET.has(crewId) || unlocks.includes(crewUnlockId(crewId)))

export const validateCrewSelection = (
  crewIds: readonly string[],
  unlocks: readonly string[]
): boolean =>
  crewIds.length <= MAX_EXPEDITION_CREW_SLOTS &&
  new Set(crewIds).size === crewIds.length &&
  crewIds.every(id => isCrewAvailable(id, unlocks))
```

`validateExpeditionLoadout()` receives the current `state.unlocks`; do not read localStorage directly and do not add unlock arrays to `career`.

- [ ] **Step 4: Run loadout tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCrewRegistry.test.js tests/node/expeditionReducer.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/expedition/crew.ts src/domain/expedition/loadout.ts tests/node/expeditionCrewRegistry.test.js tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): enforce crew slots and unlocks"
```

---

### Task 3: Initialize Run Stress From the Selected Crew

**Files:**
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Test: `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Add failing start test**

```js
test('starting an expedition initializes exactly the selected crew run state', () => {
  const next = handleStartExpedition(stateWithCrewSelection, payload)
  assert.deepEqual(next.expedition.crewRunById, {
    crew_mika_tech: {
      stress: 0,
      stressStatus: 'calm',
      injuryStage: 'none',
      runTraitIds: []
    },
    crew_nico_scout: {
      stress: 0,
      stressStatus: 'calm',
      injuryStage: 'none',
      runTraitIds: []
    }
  })
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js
```

Expected: FAIL because selected crew is not initialized.

- [ ] **Step 3: Add pure factory**

```ts
import type { ExpeditionCrewRunState } from '../../types'

export const createCrewRunState = (): ExpeditionCrewRunState => ({
  stress: 0,
  stressStatus: 'calm',
  injuryStage: 'none',
  runTraitIds: []
})
```

`START_EXPEDITION` payload carries validated crew ids. Reducer constructs a null-prototype-safe record containing only those ids.

- [ ] **Step 4: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js tests/node/expeditionSanitizers.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context/expeditionActionCreators.ts src/context/reducers/expeditionReducer.ts src/context/reducers/expeditionSanitizers.ts tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): initialize run crew state"
```

---

### Task 4: Implement Semantic Stress and Role-Aggregate Helpers

**Files:**
- Create: `src/domain/expedition/crewStress.ts`
- Modify: `src/domain/expedition/crew.ts`
- Test: `tests/node/expeditionCrewStress.test.js`

- [ ] **Step 1: Write failing stress tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getCrewStressStatus,
  calculateCrewStressDelta
} from '../../src/domain/expedition/crewStress.ts'

test('stress thresholds use semantic states', () => {
  assert.equal(getCrewStressStatus(0), 'calm')
  assert.equal(getCrewStressStatus(40), 'strained')
  assert.equal(getCrewStressStatus(70), 'critical')
  assert.equal(getCrewStressStatus(90), 'breaking')
})

test('gig stress rises with technical danger', () => {
  assert.equal(calculateCrewStressDelta({ kind: 'gig', technicalCondition: 80 }), 6)
  assert.equal(calculateCrewStressDelta({ kind: 'gig', technicalCondition: 35 }), 10)
})

test('rest strongly reduces stress', () => {
  assert.equal(calculateCrewStressDelta({ kind: 'rest', technicalCondition: 100 }), -25)
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCrewStress.test.js
```

Expected: FAIL because stress domain is missing.

- [ ] **Step 3: Implement initial stress rules**

```ts
import type { CrewStressStatus } from '../../types'

export const getCrewStressStatus = (stress: number): CrewStressStatus => {
  if (stress >= 90) return 'breaking'
  if (stress >= 70) return 'critical'
  if (stress >= 40) return 'strained'
  return 'calm'
}

export const calculateCrewStressDelta = ({
  kind,
  technicalCondition
}: {
  kind: 'travel' | 'gig' | 'rest' | 'restStop' | 'crisisWin'
  technicalCondition: number
}): number => {
  if (kind === 'rest') return -25
  if (kind === 'restStop') return -15
  if (kind === 'crisisWin') return -10
  const technicalPenalty = technicalCondition < 40 ? 4 : technicalCondition < 70 ? 2 : 0
  return (kind === 'gig' ? 6 : 4) + technicalPenalty
}
```

Add role aggregation helper:

```ts
export const getCrewAggregateEffects = (
  crewIds: readonly string[]
): Required<Pick<ExpeditionCrewDefinition['baseEffects'],
  'fieldRepairEfficiency' | 'technicalWearMultiplier' | 'roadWearMultiplier' |
  'contractRewardMultiplier' | 'heatGainMultiplier'>> & { scoutIntelBonus: number } => {
  let technicalWearMultiplier = 1
  let roadWearMultiplier = 1
  let contractRewardMultiplier = 1
  let heatGainMultiplier = 1
  let fieldRepairEfficiency = 0
  let scoutIntelBonus = 0
  for (const id of crewIds) {
    const actor = EXPEDITION_CREW_BY_ID[id]
    if (!actor) continue
    const e = actor.baseEffects
    fieldRepairEfficiency += e.fieldRepairEfficiency ?? 0
    technicalWearMultiplier *= e.technicalWearMultiplier ?? 1
    roadWearMultiplier *= e.roadWearMultiplier ?? 1
    contractRewardMultiplier *= e.contractRewardMultiplier ?? 1
    heatGainMultiplier *= e.heatGainMultiplier ?? 1
    scoutIntelBonus = Math.max(scoutIntelBonus, e.scoutIntelBonus ?? 0)
  }
  return {
    fieldRepairEfficiency,
    technicalWearMultiplier,
    roadWearMultiplier,
    contractRewardMultiplier,
    heatGainMultiplier,
    scoutIntelBonus
  }
}
```

- [ ] **Step 4: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCrewStress.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/expedition/crew.ts src/domain/expedition/crewStress.ts tests/node/expeditionCrewStress.test.js
git commit -m "feat(expedition): define crew stress and role effects"
```

---

### Task 5: Add Typed Run-Crew Stress Mutations

**Files:**
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/useExpeditionDispatchActions.ts`
- Test: `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Add failing hostile/replay tests**

Assert hostile payloads cannot update run state and valid stress clamps:

```js
const initial = { ...createInitialState(), expedition: makeActiveExpedition({ crewRunById: { crew_mika_tech: { stress: 92, stressStatus: 'critical', injuryStage: 'none', runTraitIds: [] } } }) }
assert.throws(() => createAdjustCrewStressAction(initial, '__proto__', Infinity), /crew|finite/i)
const next = gameReducer(initial, createAdjustCrewStressAction(initial, 'crew_mika_tech', 20))
assert.equal(next.expedition.crewRunById.crew_mika_tech.stress, 100)
assert.equal(next.expedition.crewRunById.crew_mika_tech.stressStatus, 'breaking')
```

- [ ] **Step 2: Add exact action payload**

```ts
export interface ApplyCrewStressPayload {
  deltasByCrewId: Record<string, number>
  reason: 'travel' | 'gig' | 'rest' | 'restStop' | 'event' | 'crisis'
}
```

Action creator filters ids to selected `crewRunById` and finite integer deltas in `-100..100`.

- [ ] **Step 3: Implement reducer**

For each own key in the sanitized payload:

```ts
const stress = Math.max(0, Math.min(100, finiteNumberOr(current.stress, 0) + delta))
nextCrew[id] = {
  ...current,
  stress,
  stressStatus: getCrewStressStatus(stress)
}
```

Ignore the action if the Expedition is not active.

- [ ] **Step 4: Run reducer/action serialization gates**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js tests/node/actionCreatorSerialization.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context/actionTypes.ts src/types/actions.d.ts src/context/expeditionActionCreators.ts src/context/reducers/expeditionReducer.ts src/context/useExpeditionDispatchActions.ts tests/node/expeditionReducer.test.js tests/node/actionCreatorSerialization.test.js
git commit -m "feat(expedition): add crew stress actions"
```

---

### Task 6: Wire Stress Into Travel, Gigs, Rest Stops, and Voluntary Rest

**Files:**
- Modify: `src/hooks/travel/actions/useHandleNodeArrivalCallback.ts`
- Modify: `src/hooks/travel/useVanMaintenance.ts`
- Modify: `src/hooks/postGig/handlers/useContinueHandler.ts`
- Modify: `src/utils/arrivalUtils.ts`
- Test: `tests/node/useTravelLogic.test.js`, `tests/ui/useArrivalLogic.test.jsx`, `tests/node/postGig.test.js`, `tests/ui/usePostGigLogic.test.jsx`

- [ ] **Step 1: Add failing integration tests**

For an active Expedition with two selected crew, pin each canonical seam:

```jsx
const adjustCrewStress = vi.fn()
const active = makeExpeditionState({ crewIds: ['crew_mika_tech', 'crew_tom_driver'] })
await completeTravel({ state: active, adjustCrewStress })
expect(adjustCrewStress).toHaveBeenCalledWith({ crew_mika_tech: 4, crew_tom_driver: 4 })

await handleArrival({ ...active, node: { type: 'REST_STOP' }, adjustCrewStress })
expect(adjustCrewStress).toHaveBeenCalledWith({ crew_mika_tech: -15, crew_tom_driver: -15 })

await handleRestInVan({ state: active, adjustCrewStress })
expect(adjustCrewStress).toHaveBeenCalledWith({ crew_mika_tech: -25, crew_tom_driver: -25 })

await continuePostGig({ state: active, technicalCondition: 55, adjustCrewStress })
expect(adjustCrewStress).toHaveBeenCalledWith({ crew_mika_tech: 6, crew_tom_driver: 6 })

adjustCrewStress.mockClear()
await continuePostGig({ state: active, technicalCondition: 35, adjustCrewStress })
expect(adjustCrewStress).toHaveBeenCalledWith({ crew_mika_tech: 10, crew_tom_driver: 10 })
```

Add one legacy/inactive case asserting zero calls.

- [ ] **Step 2: Verify failures**

```bash
pnpm exec vitest run tests/ui/useArrivalLogic.test.jsx tests/ui/postGigHandlerLogic.test.jsx
pnpm run test:node -- tests/node/travelActions.test.js
```

Expected: new stress assertions FAIL.

- [ ] **Step 3: Add one helper to build same-delta maps**

```ts
export const buildCrewStressDeltas = (
  crewIds: readonly string[],
  delta: number
): Record<string, number> =>
  Object.fromEntries(crewIds.map(id => [id, delta]))
```

- [ ] **Step 4: Dispatch at canonical existing seams**

Use the `adjustCrewStress` dispatcher already added to the hook interfaces and the shared `buildCrewStressDeltas` helper:

```ts
// accepted travel, before arrival recovery
adjustCrewStress(buildCrewStressDeltas(activeCrewIds, 4))

// successful REST/REST_STOP arrival
adjustCrewStress(buildCrewStressDeltas(activeCrewIds, -15))

// confirmed Rest in Van
adjustCrewStress(buildCrewStressDeltas(activeCrewIds, -25))

// guarded post-gig continuation after technical condition is settled
const gigStress = technicalCondition < 40 ? 10 : 6
adjustCrewStress(buildCrewStressDeltas(activeCrewIds, gigStress))
```

Call these only when `state.expedition.status === 'active'`; do not add stress changes to daily tick, which would double-count action-driven stress and make non-action days ambiguous.

- [ ] **Step 5: Run regression gates**

```bash
pnpm run test:ui
pnpm run test:node
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/travel src/hooks/postGig/handlers/useContinueHandler.ts src/utils/arrivalUtils.ts src/domain/expedition/crewStress.ts tests
git commit -m "feat(expedition): apply crew stress from tour actions"
```

---

### Task 7: Implement Persistent Loyalty and Canonical Relationship Pair Keys

**Files:**
- Create: `src/domain/expedition/relationships.ts`
- Create: `src/context/careerActionCreators.ts`
- Create: `src/context/reducers/careerReducer.ts`
- Create: `src/context/useCareerDispatchActions.ts`
- Modify: `src/types/career.d.ts`
- Modify: `src/context/reducers/careerSanitizers.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/gameReducer.ts`
- Test: `tests/node/expeditionRelationships.test.js`
- Test: `tests/node/saveSliceRoundTrip.test.js`

- [ ] **Step 1: Write failing relationship tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  toCrewRelationshipKey,
  shiftRelationshipTier
} from '../../src/domain/expedition/relationships.ts'

test('pair key is order independent', () => {
  assert.equal(
    toCrewRelationshipKey('crew_mika_tech', 'crew_tom_driver'),
    toCrewRelationshipKey('crew_tom_driver', 'crew_mika_tech')
  )
})

test('relationship tier changes one step and clamps', () => {
  assert.equal(shiftRelationshipTier('neutral', -1), 'tense')
  assert.equal(shiftRelationshipTier('hostile', -1), 'hostile')
  assert.equal(shiftRelationshipTier('tense', 2), 'bonded')
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionRelationships.test.js
```

Expected: FAIL because relationship domain is missing.

- [ ] **Step 3: Implement exact helper**

```ts
import type { CrewRelationshipTier } from '../../types'

const RELATIONSHIP_ORDER: CrewRelationshipTier[] = [
  'hostile', 'tense', 'neutral', 'bonded'
]

export const toCrewRelationshipKey = (a: string, b: string): string =>
  [a, b].sort().join('::')

export const shiftRelationshipTier = (
  current: CrewRelationshipTier,
  delta: number
): CrewRelationshipTier => {
  const index = RELATIONSHIP_ORDER.indexOf(current)
  const safeIndex = index < 0 ? 2 : index
  return RELATIONSHIP_ORDER[Math.max(0, Math.min(3, safeIndex + Math.trunc(delta)))] ?? 'neutral'
}
```

- [ ] **Step 4: Add the first explicit Career action boundary**

Add to `ActionTypes`:

```ts
UPDATE_CREW_CAREER: 'UPDATE_CREW_CAREER',
SHIFT_CREW_RELATIONSHIP: 'SHIFT_CREW_RELATIONSHIP',
```

Add payloads to `src/types/actions.d.ts`:

```ts
export interface UpdateCrewCareerPayload {
  crewId: string
  loyaltyDelta: number
  storyStepDelta: number
  signatureTraitId: string | null
}

export interface ShiftCrewRelationshipPayload {
  pairKey: string
  tierDelta: number
}
```

`src/context/careerActionCreators.ts` owns boundary validation:

```ts
import { ActionTypes } from './actionTypes'
import type { GameAction } from '../types'
import { isFiniteNumber } from '../utils/gameState'
import { EXPEDITION_CREW_BY_ID } from '../data/expedition/crew'
import { toCrewRelationshipKey } from '../domain/expedition/relationships'

export const updateCrewCareer = (
  crewId: unknown,
  loyaltyDelta: unknown,
  storyStepDelta: unknown,
  signatureTraitId: unknown
): Extract<GameAction, { type: typeof ActionTypes.UPDATE_CREW_CAREER }> => {
  if (
    typeof crewId !== 'string' ||
    !Object.hasOwn(EXPEDITION_CREW_BY_ID, crewId)
  ) {
    throw new TypeError('Unknown expedition crew id')
  }
  if (!isFiniteNumber(loyaltyDelta) || !isFiniteNumber(storyStepDelta)) {
    throw new TypeError('Crew career deltas must be finite numbers')
  }
  return {
    type: ActionTypes.UPDATE_CREW_CAREER,
    payload: {
      crewId,
      loyaltyDelta,
      storyStepDelta,
      signatureTraitId:
        typeof signatureTraitId === 'string' ? signatureTraitId : null
    }
  }
}

export const shiftCrewRelationship = (
  firstCrewId: unknown,
  secondCrewId: unknown,
  tierDelta: unknown
): Extract<GameAction, { type: typeof ActionTypes.SHIFT_CREW_RELATIONSHIP }> => {
  if (
    typeof firstCrewId !== 'string' ||
    typeof secondCrewId !== 'string' ||
    !Object.hasOwn(EXPEDITION_CREW_BY_ID, firstCrewId) ||
    !Object.hasOwn(EXPEDITION_CREW_BY_ID, secondCrewId) ||
    firstCrewId === secondCrewId
  ) {
    throw new TypeError('Relationship action requires two distinct known crew ids')
  }
  if (!isFiniteNumber(tierDelta)) {
    throw new TypeError('Relationship tier delta must be finite')
  }
  return {
    type: ActionTypes.SHIFT_CREW_RELATIONSHIP,
    payload: {
      pairKey: toCrewRelationshipKey(firstCrewId, secondCrewId),
      tierDelta: Math.trunc(tierDelta)
    }
  }
}
```

Relationship pair keys are therefore never accepted raw from UI/event input. Add hostile-boundary tests for `crewId: 'constructor'`, `crewId: '__proto__'`, direct reducer payloads containing `NaN`/`Infinity`, and corrupted stored `loyalty`/`storyStep`; action creators must reject hostile IDs and reducers must return the original state or normalize stored addends without persisting non-finite values.

- [ ] **Step 5: Implement and route `careerReducer`**

`src/context/reducers/careerReducer.ts` imports the strict numeric helpers and forbidden-key guard explicitly, then exports two handlers compatible with the root reducer map:

```ts
import { finiteNumberOr, isFiniteNumber } from '../../utils/gameState'
import { isForbiddenKey } from '../../utils/objectUtils'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import { shiftRelationshipTier } from '../../domain/expedition/relationships'

export const handleUpdateCrewCareer = (state, payload) => {
  if (
    typeof payload.crewId !== 'string' ||
    !Object.hasOwn(EXPEDITION_CREW_BY_ID, payload.crewId) ||
    !isFiniteNumber(payload.loyaltyDelta) ||
    !isFiniteNumber(payload.storyStepDelta)
  ) {
    return state
  }

  const stored = state.career.crewProgressById[payload.crewId] ?? {
    loyalty: 0,
    storyStep: 0,
    signatureTraitIds: []
  }
  const previous = {
    ...stored,
    loyalty: Math.max(0, Math.min(100, finiteNumberOr(stored.loyalty, 0))),
    storyStep: Math.max(0, Math.trunc(finiteNumberOr(stored.storyStep, 0))),
    signatureTraitIds: Array.isArray(stored.signatureTraitIds)
      ? stored.signatureTraitIds.filter((id): id is string => typeof id === 'string')
      : []
  }
  const safeSignatureTraitId =
    typeof payload.signatureTraitId === 'string' ? payload.signatureTraitId : null
  const nextTraitIds = safeSignatureTraitId
    ? [...new Set([...previous.signatureTraitIds, safeSignatureTraitId])]
    : previous.signatureTraitIds

  return {
    ...state,
    career: {
      ...state.career,
      crewProgressById: {
        ...state.career.crewProgressById,
        [payload.crewId]: {
          ...previous,
          loyalty: Math.max(
            0,
            Math.min(100, previous.loyalty + payload.loyaltyDelta)
          ),
          storyStep: Math.max(
            0,
            previous.storyStep + Math.trunc(payload.storyStepDelta)
          ),
          signatureTraitIds: nextTraitIds
        }
      }
    }
  }
}

export const handleShiftCrewRelationship = (state, payload) => {
  if (
    typeof payload.pairKey !== 'string' ||
    payload.pairKey.length === 0 ||
    isForbiddenKey(payload.pairKey) ||
    !isFiniteNumber(payload.tierDelta)
  ) {
    return state
  }
  return {
    ...state,
    career: {
      ...state.career,
      crewRelationshipByPair: {
        ...state.career.crewRelationshipByPair,
        [payload.pairKey]: shiftRelationshipTier(
          state.career.crewRelationshipByPair[payload.pairKey] ?? 'neutral',
          Math.trunc(payload.tierDelta)
        )
      }
    }
  }
}
```

Import both handlers into `gameReducer.ts` and add the two entries to `reducerMap`. Add both action variants to `GameAction`.

`src/context/useCareerDispatchActions.ts` exposes memoized callbacks that dispatch only `updateCrewCareer(...)` and `shiftCrewRelationship(...)`; later plans extend this hook rather than creating another career dispatch surface.

- [ ] **Step 6: Extend the failing relationship test through the root reducer**

Add assertions through the root reducer:

```js
let state = createInitialState()
state = gameReducer(state, shiftCrewRelationship('crew_mika_tech', 'crew_tom_driver', -1))
assert.equal(state.career.crewRelationshipByPair['crew_mika_tech::crew_tom_driver'], 'tense')
state = gameReducer(state, updateCrewCareer('crew_mika_tech', 5, 1, 'signature_macgyver'))
state = gameReducer(state, updateCrewCareer('crew_mika_tech', 0, 0, 'signature_macgyver'))
assert.deepEqual(state.career.crewProgressById.crew_mika_tech.signatureTraitIds, ['signature_macgyver'])
```

- [ ] **Step 7: Run persistence/reducer tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionRelationships.test.js tests/node/saveSliceRoundTrip.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/domain/expedition/relationships.ts src/types/career.d.ts src/types/actions.d.ts src/context/actionTypes.ts src/context/careerActionCreators.ts src/context/reducers/careerReducer.ts src/context/reducers/careerSanitizers.ts src/context/useCareerDispatchActions.ts src/context/gameReducer.ts tests/node/expeditionRelationships.test.js tests/node/saveSliceRoundTrip.test.js
git commit -m "feat(expedition): persist crew loyalty and relationships"
```

---

### Task 8: Add Band-Member Injury Escalation Without Random Instant Failure

**Files:**
- Create: `src/domain/expedition/injuries.ts`
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/defaults.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionInjuries.test.js`

- [ ] **Step 1: Add failing injury tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getInjuryRiskBand,
  advanceInjuryStage
} from '../../src/domain/expedition/injuries.ts'

test('stamina risk is telegraphed before critical injury', () => {
  assert.equal(getInjuryRiskBand(60), 'safe')
  assert.equal(getInjuryRiskBand(34), 'strained')
  assert.equal(getInjuryRiskBand(19), 'danger')
})

test('injury advances one stage per accepted injury event', () => {
  assert.equal(advanceInjuryStage('none'), 'strain')
  assert.equal(advanceInjuryStage('strain'), 'light')
  assert.equal(advanceInjuryStage('light'), 'serious')
  assert.equal(advanceInjuryStage('serious'), 'critical')
  assert.equal(advanceInjuryStage('critical'), 'critical')
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionInjuries.test.js
```

Expected: FAIL because injury domain is missing.

- [ ] **Step 3: Add run injury state by existing band member id**

Add:

```ts
memberInjuriesById: Record<string, InjuryStage>
```

Default `{}`; sanitizer accepts only known injury enums and safe own keys.

- [ ] **Step 4: Implement pure injury rules**

```ts
import type { InjuryStage } from '../../types'

const ORDER: InjuryStage[] = ['none', 'strain', 'light', 'serious', 'critical']

export const getInjuryRiskBand = (
  stamina: number
): 'safe' | 'strained' | 'danger' =>
  stamina < 20 ? 'danger' : stamina < 35 ? 'strained' : 'safe'

export const advanceInjuryStage = (stage: InjuryStage): InjuryStage => {
  const i = ORDER.indexOf(stage)
  return ORDER[Math.min(ORDER.length - 1, Math.max(0, i) + 1)] ?? 'strain'
}
```

- [ ] **Step 5: Add deterministic injury action intent**

`createResolvePostGigInjuryAction(state, memberId, roll)` remains deterministic and can advance only one stage:

```ts
export const createResolvePostGigInjuryAction = (
  state: GameState,
  memberId: string,
  roll: number
): Extract<GameAction, { type: typeof ActionTypes.ADVANCE_EXPEDITION_INJURY }> | null => {
  const member = state.band.members.find(item => item.id === memberId)
  if (!member) throw new TypeError('Unknown band member')
  const risk = member.stamina >= 35 ? 0 : member.stamina >= 20 ? 0.1 : 0.25
  if (risk === 0 || roll >= risk) return null
  const current = state.expedition.memberInjuriesById[memberId] ?? 'none'
  return {
    type: ActionTypes.ADVANCE_EXPEDITION_INJURY,
    payload: { memberId, expectedStage: current, nextStage: advanceInjuryStage(current) }
  }
}
```

Reducer rejects stale `expectedStage` replays, so one roll cannot skip stages.

- [ ] **Step 6: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionInjuries.test.js tests/node/expeditionReducer.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/expedition/injuries.ts src/types/expedition.d.ts src/domain/expedition/defaults.ts src/context/reducers/expeditionSanitizers.ts src/context/expeditionActionCreators.ts src/context/reducers/expeditionReducer.ts tests/node/expeditionInjuries.test.js tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): add staged band injuries"
```

---

### Task 9: Add an Expedition Effect to the Existing Event Resolver

**Files:**
- Modify: `src/domain/eventResolver.ts`
- Test: `tests/node/domain/eventResolver.test.js`, `tests/node/eventEngine_resolver.test.js`
- Test: `tests/node/eventReducer.test.js`

- [ ] **Step 1: Add failing resolver test**

Resolve:

```js
{
  type: 'expedition',
  delta: {
    crewStress: { crew_mika_tech: 15 },
    heat: 4,
    condition: { pa: -5 }
  }
}
```

and assert it produces an `EventDelta.expedition` with those values rather than mutating state directly.

- [ ] **Step 2: Verify failure**

```bash
pnpm run test:node
```

Expected: only the new Expedition effect assertion FAILS.

- [ ] **Step 3: Add strict resolver branch**

The resolver branch must accept only an object under `effect.delta`, copy only finite supported fields, ignore unknown keys, and return:

```ts
{
  player: {},
  band: {},
  social: {},
  flags: {},
  expedition: sanitizedExpeditionDelta
}
```

The resolver never modifies `career` and never calls dispatch.

- [ ] **Step 4: Run resolver/event tests**

```bash
pnpm run test:node
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/eventResolver.ts tests
git commit -m "feat(events): resolve expedition event effects"
```

---

### Task 10: Add Three Initial Crew Crisis Events

**Files:**
- Create: `src/data/events/crew.ts`
- Modify: `src/data/events/index.ts`
- Modify: `public/locales/en/events.json`
- Modify: `public/locales/de/events.json`
- Test: `tests/data/events/validation.test.js`, `tests/node/eventValidator.test.js`, `tests/ui/events.data.test.jsx`

- [ ] **Step 1: Add failing registry test**

Assert `KNOWN_EVENT_IDS` includes:

```js
[
  'expedition_crew_tech_breakdown',
  'expedition_crew_driver_exhausted',
  'expedition_crew_conflict'
]
```

- [ ] **Step 2: Verify failure**

```bash
pnpm run test:node
```

Expected: missing event ids.

- [ ] **Step 3: Add exact event definitions under existing `band` category**

Use existing validator-compatible fields. The first definition establishes the exact shape; the other two follow the same typed event schema:

```ts
export const EXPEDITION_CREW_EVENTS = [
  {
    id: 'expedition_crew_tech_breakdown',
    category: 'band', trigger: 'random', chance: 0.08,
    condition: state =>
      state.expedition.status === 'active' &&
      state.expedition.loadout.crewIds.includes('crew_mika_tech') &&
      (state.expedition.crewRunById.crew_mika_tech?.stress ?? 0) >= 70,
    options: [
      { id: 'pay_repair', label: 'events:expedition_crew_tech_breakdown.pay', effect: { type: 'composite', effects: [
        { type: 'resource', resource: 'money', value: -850 },
        { type: 'expedition', delta: { crewStress: { crew_mika_tech: -20 }, condition: { pa: 20 } } }
      ] } },
      { id: 'use_spare', label: 'events:expedition_crew_tech_breakdown.spare', condition: state => state.expedition.cargo.spareParts > 0, effect: { type: 'expedition', delta: { cargo: { spareParts: -1 }, crewStress: { crew_mika_tech: -10 }, condition: { pa: 12 } } } },
      { id: 'play_smaller', label: 'events:expedition_crew_tech_breakdown.smaller', effect: { type: 'composite', effects: [
        { type: 'resource', resource: 'fame', value: -300 },
        { type: 'expedition', delta: { condition: { pa: 5 } } }
      ] } }
    ]
  },
  {
    id: 'expedition_crew_driver_exhausted', category: 'band', trigger: 'travel', chance: 0.08,
    condition: state =>
      state.expedition.status === 'active' &&
      state.expedition.loadout.crewIds.includes('crew_tom_driver') &&
      (state.expedition.crewRunById.crew_tom_driver?.stress ?? 0) >= 70,
    options: [
      { id: 'rest', label: 'events:expedition_crew_driver_exhausted.rest', effect: { type: 'composite', effects: [
        { type: 'stat', stat: 'stamina', value: 10 },
        { type: 'expedition', delta: { crewStress: { crew_tom_driver: -25 } } }
      ] } },
      { id: 'push_on', label: 'events:expedition_crew_driver_exhausted.push', effect: { type: 'expedition', delta: { crewStress: { crew_tom_driver: 15 }, heat: 3 } } }
    ]
  },
  {
    id: 'expedition_crew_conflict_mika_tom', category: 'band', trigger: 'random', chance: 0.06,
    condition: state =>
      state.expedition.status === 'active' &&
      state.expedition.loadout.crewIds.includes('crew_mika_tech') &&
      state.expedition.loadout.crewIds.includes('crew_tom_driver'),
    options: [
      { id: 'mediate', label: 'events:expedition_crew_conflict_mika_tom.mediate', condition: state => state.expedition.loadout.crewIds.includes('crew_leyla_manager'), effect: { type: 'composite', effects: [
        { type: 'stat', stat: 'harmony', value: 5 },
        { type: 'expedition', delta: { crewStress: { crew_mika_tech: -10, crew_tom_driver: -10 } } }
      ] } },
      { id: 'side_with_mika', label: 'events:expedition_crew_conflict_mika_tom.side', effect: { type: 'composite', effects: [
        { type: 'stat', stat: 'harmony', value: -5 },
        { type: 'expedition', delta: { crewStress: { crew_mika_tech: -15, crew_tom_driver: 10 } } }
      ] } }
    ]
  }
]
```

For v1 the conflict event is deliberately an explicit Mika/Tom pair so raw event deltas can stay keyed by known crew ids. Additional pair events can reuse the same pattern later. Permanent relationship/loyalty changes remain typed career actions dispatched once from the resolution callback for the selected option id.

- [ ] **Step 4: Register and localize**

Register the new array in the existing validated registry:

```ts
// src/data/events/index.ts
import { CREW_EVENTS } from './crew'

export const ALL_RAW_EVENTS = [
  ...TRANSPORT_EVENTS,
  ...BAND_EVENTS,
  ...GIG_EVENTS,
  ...FINANCIAL_EVENTS,
  ...SPECIAL_EVENTS,
  ...CRISIS_EVENTS,
  ...CONSEQUENCE_EVENTS,
  ...RELATIONSHIP_EVENTS,
  ...QUEST_EVENTS,
  ...CREW_EVENTS
]
```

Add the exact `expedition_crew_tech_breakdown`, `expedition_crew_driver_exhausted`, and `expedition_crew_conflict_mika_tom` title/description/option/outcome keys to both `public/locales/en/events.json` and `public/locales/de/events.json`.

- [ ] **Step 5: Run event/i18n gates**

```bash
pnpm run test:node
pnpm run test:additional
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/events/crew.ts src/data/events/index.ts public/locales/en/events.json public/locales/de/events.json tests
git commit -m "feat(events): add expedition crew crises"
```

---

### Task 11: Surface Crew in Tour Prep and Contextually During Runs

**Files:**
- Create: `src/ui/expedition/CrewPicker.tsx`
- Create: `src/ui/expedition/CrewStatusPanel.tsx`
- Modify: `src/ui/expedition/TourPrepLoadout.tsx`
- Modify: `src/ui/expedition/ExpeditionStatusStrip.tsx`
- Modify: `public/locales/en/ui.json`
- Modify: `public/locales/de/ui.json`
- Test: `tests/ui/ExpeditionCrewPicker.test.tsx`
- Test: `tests/ui/ExpeditionCrewStatus.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Assert:

- four starter crew cards render before unlocks;
- locked Manager/Security render only when their unlock ids exist;
- selecting a fourth actor is prevented;
- status strip shows no six extra stress bars;
- opening `Crew` shows semantic status (`calm`, `strained`, `critical`, `breaking`) plus injury/loyalty when relevant.

- [ ] **Step 2: Verify failure**

```bash
pnpm exec vitest run tests/ui/ExpeditionCrewPicker.test.tsx tests/ui/ExpeditionCrewStatus.test.tsx
```

Expected: FAIL because UI is missing.

- [ ] **Step 3: Implement picker/status components**

Implement the picker/status components from canonical selectors:

```tsx
export const CrewPicker = ({ crewIds, unlocks, onChange }: Props) => {
  const available = EXPEDITION_CREW.filter(actor => isCrewAvailable(actor.id, unlocks))
  const toggle = (id: string) => {
    const next = crewIds.includes(id) ? crewIds.filter(value => value !== id) : [...crewIds, id]
    if (next.length <= MAX_EXPEDITION_CREW_SLOTS) onChange(next)
  }
  return <CrewChoiceList actors={available} selectedIds={crewIds} onToggle={toggle} />
}

export const CrewStatusPanel = ({ state }: { state: GameState }) => (
  <CrewStatusList rows={state.expedition.loadout.crewIds.map(id => buildCrewStatusRow(state, id))} />
)
```

- [ ] **Step 4: Add EN/DE crew copy**

Add matching locale structure. Example keys:

```json
{ "expedition": { "crew": { "roles": { "technician": "Technician", "roadie": "Roadie", "driver": "Driver", "manager": "Manager", "scout": "Scout", "security": "Security" }, "stress": { "calm": "Calm", "strained": "Strained", "critical": "Critical", "breaking": "Breaking" }, "loyalty": "Loyalty", "slots": "Crew {{used}} / {{max}}" } } }
```

```json
{ "expedition": { "crew": { "roles": { "technician": "Techniker", "roadie": "Roadie", "driver": "Fahrer", "manager": "Manager", "scout": "Scout", "security": "Security" }, "stress": { "calm": "Ruhig", "strained": "Angespannt", "critical": "Kritisch", "breaking": "Kurz vor dem Ausstieg" }, "loyalty": "Loyalität", "slots": "Crew {{used}} / {{max}}" } } }
```

Add the six actor-specific name/talent/trait/vice keys beside this shared structure in both languages.

- [ ] **Step 5: Run UI/a11y/i18n**

```bash
pnpm exec vitest run tests/ui/ExpeditionCrewPicker.test.tsx tests/ui/ExpeditionCrewStatus.test.tsx
pnpm run test:additional
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/expedition public/locales/en/ui.json public/locales/de/ui.json tests/ui/ExpeditionCrewPicker.test.tsx tests/ui/ExpeditionCrewStatus.test.tsx
git commit -m "feat(expedition): add crew loadout and status UI"
```

---

### Task 12: Add G3 Crew/Stress/Injury Metrics to Balance Simulation

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `scripts/utils/balance-report-metadata.mjs`
- Test: `tests/node/game-balance-simulation.test.js`, `tests/node/balanceSourceFiles.test.js`

- [ ] **Step 1: Add failing report-contract fields**

Require:

```js
[
  'avgCrewStressAtExtraction',
  'p90CrewStressAtExtraction',
  'crewCrisisRunsPct',
  'breakingCrewRunsPct',
  'injuryRunsPct',
  'seriousInjuryRunsPct',
  'avgRestStressRelief',
  'crewRolePickRates'
]
```

- [ ] **Step 2: Verify failure**

```bash
pnpm run test:node
```

Expected: report contract FAILS on new fields.

- [ ] **Step 3: Import production crew helpers and add source fingerprints**

Import production helpers directly into the simulator and fingerprint them:

```js
import { getCrewStressStatus, calculateCrewStressDelta, getCrewAggregateEffects } from '../src/domain/expedition/crewStress.ts'
import { getInjuryRiskBand, advanceInjuryStage } from '../src/domain/expedition/injuries.ts'
```

```js
for (const source of [
  'src/data/expedition/crew.ts',
  'src/domain/expedition/crew.ts',
  'src/domain/expedition/crewStress.ts',
  'src/domain/expedition/injuries.ts'
]) {
  assert.ok(BALANCE_SOURCE_FILES.includes(source))
}
```

- [ ] **Step 4: Add deterministic crew policies to scenario variants**

At minimum simulate these four selections in addition to scenario economics:

```text
Technical: Mika + Anja + Tom
Intel: Nico + Tom + Mika
Sponsor: Leyla + Nico + Tom (only in a branch with Manager unlocked)
Chaos Safety: Saskia + Mika + Tom (only in a branch with Security unlocked)
```

Use separate scenario ids/seed streams for strategy comparison rather than swapping crew inside the same seeded run.

- [ ] **Step 5: Report, but do not hard-gate, initial crew design bands**

First report only measured distributions. Suggested soft review warnings:

- `breakingCrewRunsPct > 25%` on Standard baseline;
- `seriousInjuryRunsPct > 15%` on Standard baseline;
- any one crew actor picked in `>80%` of simulated strategies with both higher reward and lower failure than alternatives.

These remain design warnings until playtest/simulator data establishes stable targets.

- [ ] **Step 6: Run G3 gate**

```bash
pnpm run test:node
pnpm run test:ui
pnpm run typecheck:core
pnpm run deadcode:check
pnpm run simulate:balance
```

Expected: PASS; new crew metrics appear in calibration and holdout artifacts.

- [ ] **Step 7: Commit**

```bash
git add scripts/game-balance-simulation.mjs reports tests
git commit -m "test(balance): measure expedition crew pressure"
```

---

## G3 Exit Criteria

- Exactly three crew slots; no payroll/timesheet system.
- Starter crew and unlock-gated crew use the existing unlock boundary.
- Stress is event/action-driven, semantic in UI, and saved safely.
- Rest actually reduces crew pressure, making it a strategically valuable option.
- Injury escalation is staged and telegraphed; one RNG roll cannot instantly destroy a run.
- Loyalty/relationships persist, run stress does not.
- Crew crises are normal validated events and cannot mutate persistent career state through raw event data.
- Simulator can compare crew strategies and expose dominant picks before Pressure/Contracts are added.

---

# Pressure, Rivals, Contracts, Social, and Contextual Finales Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make successful Expedition runs create escalating strategic pressure through Heat, Exposure, voluntary Obligations, persistent rival history, sponsor-linked contracts, Social choices, and context-sensitive finales while preserving the current event, Brand Deal, and rival ownership boundaries.

**Architecture:** `expedition.pressure` continues to own Heat/Exposure and `expedition.activeObligations` owns run contracts. New contract templates and pressure helpers are pure domain/data modules. Existing Brand Deals retain their current upfront/per-gig payouts; accepting a deal may attach a zero-payout obligation that evaluates behavior but never duplicates economic settlement. The existing event selection engine receives a deterministic pressure multiplier based on explicit `pressureTags`, and the existing single active `rivalBand` remains the current-run actor while `career.rivalHistoryById` records persistent rivalry.

**Tech Stack:** TypeScript 6, React 19, existing event engine and post-gig social/deal flow, current RivalBand reducer/hooks, typed reducers/action creators, i18next, deterministic RNG, Node/Vitest tests, balance simulator.

---

## Depends On

- G2 Condition/Cargo merged.
- G3 Crew/Stress/Relationships merged.
- EventDelta Expedition branch exists.
- `career.rivalHistoryById` persists safely.

## File Structure

**Create:**

- `src/types/contracts.d.ts`
- `src/data/expedition/contracts.ts`
- `src/domain/expedition/pressure.ts`
- `src/domain/expedition/contracts.ts`
- `src/domain/expedition/pressureDirector.ts`
- `src/domain/expedition/rivals.ts`
- `src/domain/expedition/finale.ts`
- `src/data/expedition/runTraits.ts`
- `src/domain/expedition/runDrafts.ts`
- `src/data/events/pressure.ts`
- `src/data/events/rival.ts`
- `src/ui/expedition/PressurePanel.tsx`
- `src/ui/expedition/ObligationsPanel.tsx`
- `src/ui/expedition/RivalEncounterCard.tsx`
- `src/ui/expedition/RunDraftModal.tsx`
- `tests/node/expeditionPressure.test.js`
- `tests/node/expeditionContracts.test.js`
- `tests/node/pressureDirector.test.js`
- `tests/node/expeditionRivals.test.js`
- `tests/node/expeditionFinale.test.js`
- `tests/node/expeditionRunDrafts.test.js`
- `tests/ui/ExpeditionPressurePanel.test.tsx`
- `tests/ui/ExpeditionObligations.test.tsx`
- `tests/ui/RunDraftModal.test.tsx`

**Modify:**

- `src/types/index.ts`
- `src/types/expedition.d.ts`
- `src/types/social.d.ts`
- `src/utils/eventEngine/types.ts`
- `src/utils/eventEngine/eventSelection.ts`
- `src/context/actionTypes.ts`
- `src/types/actions.d.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/careerActionCreators.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/reducers/careerReducer.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/reducers/careerSanitizers.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/context/useCareerDispatchActions.ts`
- `src/utils/rivalEngine.ts`
- `src/context/reducers/rivalReducer.ts`
- `src/hooks/overworld/useRivalEscalation.ts`
- `src/hooks/postGig/handlers/types.ts`
- `src/hooks/postGig/handlers/useDealHandlers.ts`
- `src/hooks/postGig/handlers/socialPostHandlerUtils.ts`
- `src/hooks/postGig/handlers/useSocialPostHandler.ts`
- `src/hooks/postGig/handlers/useContinueHandler.ts`
- `src/utils/postGig/socialResolution.ts`
- `src/data/postOptions.ts`
- `src/data/events/index.ts`
- `src/hooks/useArrivalLogic.ts`
- `src/ui/expedition/ExpeditionStatusStrip.tsx`
- `src/ui/expedition/RunSummaryCard.tsx`
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `public/locales/en/events.json`
- `public/locales/de/events.json`
- `scripts/game-balance-simulation.mjs`
- balance source fingerprint list
- relevant social/rival/event/post-gig tests

---

### Task 1: Define Heat and Exposure Semantics and Typed Pressure Actions

**Files:**
- Create: `src/domain/expedition/pressure.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionPressure.test.js`

- [ ] **Step 1: Write failing pressure tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getHeatBand,
  getExposureBand,
  applyPressureDelta
} from '../../src/domain/expedition/pressure.ts'

test('heat bands match the approved pressure model', () => {
  assert.equal(getHeatBand(0), 'low_profile')
  assert.equal(getHeatBand(25), 'noticed')
  assert.equal(getHeatBand(50), 'wanted_attention')
  assert.equal(getHeatBand(75), 'critical')
  assert.equal(getHeatBand(100), 'crisis')
})

test('pressure clamps independently to zero through one hundred', () => {
  assert.deepEqual(
    applyPressureDelta({ heat: 95, exposure: 4 }, { heat: 20, exposure: -9 }),
    { heat: 100, exposure: 0 }
  )
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionPressure.test.js
```

Expected: FAIL because pressure domain is missing.

- [ ] **Step 3: Implement exact helpers**

```ts
export type HeatBand =
  | 'low_profile'
  | 'noticed'
  | 'wanted_attention'
  | 'critical'
  | 'crisis'

export type ExposureBand = 'local' | 'regional' | 'national' | 'headline'

const clampPressure = (value: number): number => Math.max(0, Math.min(100, value))

export const getHeatBand = (heat: number): HeatBand => {
  if (heat >= 100) return 'crisis'
  if (heat >= 75) return 'critical'
  if (heat >= 50) return 'wanted_attention'
  if (heat >= 25) return 'noticed'
  return 'low_profile'
}

export const getExposureBand = (exposure: number): ExposureBand => {
  if (exposure >= 75) return 'headline'
  if (exposure >= 50) return 'national'
  if (exposure >= 25) return 'regional'
  return 'local'
}

export const applyPressureDelta = (
  current: { heat: number; exposure: number },
  delta: { heat: number; exposure: number }
): { heat: number; exposure: number } => ({
  heat: clampPressure(current.heat + delta.heat),
  exposure: clampPressure(current.exposure + delta.exposure)
})
```

- [ ] **Step 4: Add `APPLY_EXPEDITION_PRESSURE`**

```ts
export interface ApplyExpeditionPressurePayload {
  heat: number
  exposure: number
  reason: 'gig' | 'social' | 'event' | 'contract' | 'rival' | 'authority'
}
```

Action creator accepts only finite deltas in `-100..100`. Reducer applies only during active Expedition and clamps through `applyPressureDelta`.

- [ ] **Step 5: Run action/reducer tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionPressure.test.js tests/node/expeditionReducer.test.js tests/node/actionCreatorSerialization.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/expedition/pressure.ts src/context/actionTypes.ts src/types/actions.d.ts src/context/expeditionActionCreators.ts src/context/reducers/expeditionReducer.ts tests/node/expeditionPressure.test.js tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): add heat and exposure pressure"
```

---

### Task 2: Derive Gig-Driven Exposure and Heat Without Replacing Controversy

**Files:**
- Modify: `src/domain/expedition/pressure.ts`
- Modify: `src/hooks/postGig/handlers/useContinueHandler.ts`
- Test: `tests/ui/postGigHandlerLogic.test.jsx`

- [ ] **Step 1: Add failing calculation tests**

```js
test('successful difficult gigs raise exposure', () => {
  assert.deepEqual(
    calculateGigPressureDelta({ difficulty: 4, accuracy: 82, controversy: 10 }),
    { heat: 0, exposure: 8 }
  )
})

test('controversial poor gigs can raise heat without increasing exposure much', () => {
  assert.deepEqual(
    calculateGigPressureDelta({ difficulty: 3, accuracy: 45, controversy: 70 }),
    { heat: 4, exposure: 1 }
  )
})
```

- [ ] **Step 2: Implement exact initial formula**

```ts
export const calculateGigPressureDelta = ({
  difficulty,
  accuracy,
  controversy
}: {
  difficulty: number
  accuracy: number
  controversy: number
}): { heat: number; exposure: number } => {
  const diff = Math.max(1, Math.min(5, Math.trunc(difficulty)))
  const exposure = Math.max(0, diff + (accuracy >= 70 ? 4 : accuracy >= 50 ? 2 : -2))
  const heat = controversy >= 60 ? (accuracy < 50 ? 4 : 2) : controversy >= 40 ? 1 : 0
  return { heat, exposure }
}
```

- [ ] **Step 3: Dispatch inside the existing continuation guard**

After the canonical gig result exists:

```ts
applyExpeditionPressure({
  ...calculateGigPressureDelta({
    difficulty: finiteNumberOr(currentGig?.diff, 1),
    accuracy: finiteNumberOr(lastGigStats?.accuracy, 0),
    controversy: finiteNumberOr(social.controversyLevel, 0)
  }),
  reason: 'gig'
})
```

Do not write to `social.controversyLevel`; Heat and controversy remain distinct.

- [ ] **Step 4: Run post-gig tests**

```bash
pnpm exec vitest run tests/ui/postGigHandlerLogic.test.jsx
pnpm run typecheck:core
```

Expected: PASS; pressure applies once.

- [ ] **Step 5: Commit**

```bash
git add src/domain/expedition/pressure.ts src/hooks/postGig/handlers/useContinueHandler.ts tests/ui/postGigHandlerLogic.test.jsx
git commit -m "feat(expedition): raise pressure from gigs"
```

---

### Task 3: Define Obligation Templates and Runtime Contract State

**Files:**
- Create: `src/types/contracts.d.ts`
- Create: `src/data/expedition/contracts.ts`
- Create: `src/domain/expedition/contracts.ts`
- Modify: `src/types/index.ts`
- Modify: `src/types/expedition.d.ts`
- Test: `tests/node/expeditionContracts.test.js`

- [ ] **Step 1: Write failing template tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXPEDITION_CONTRACTS,
  EXPEDITION_CONTRACT_BY_ID
} from '../../src/data/expedition/contracts.ts'

test('initial native contracts cover performance, behavior, route and high-risk families', () => {
  assert.deepEqual(
    EXPEDITION_CONTRACTS.map(c => c.kind),
    ['performance', 'behavior', 'route', 'high_risk']
  )
  assert.ok(EXPEDITION_CONTRACT_BY_ID.contract_three_good_gigs)
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionContracts.test.js
```

Expected: FAIL because contracts are missing.

- [ ] **Step 3: Add exact contract type**

```ts
export type ExpeditionContractKind =
  | 'performance'
  | 'behavior'
  | 'route'
  | 'high_risk'

export type ExpeditionContractMetric =
  | 'goodGigCount'
  | 'maxHeat'
  | 'visitedNode'
  | 'restCount'
  | 'finaleCompleted'

export interface ExpeditionContractTemplate {
  id: string
  kind: ExpeditionContractKind
  titleKey: string
  descriptionKey: string
  metric: ExpeditionContractMetric
  target: number
  reward: { money: number; fame: number; rewardMultiplier: number }
  failure: { heat: number; controversy: number }
}
```

- [ ] **Step 4: Add exact initial templates**

```ts
export const EXPEDITION_CONTRACTS = Object.freeze([
  {
    id: 'contract_three_good_gigs',
    kind: 'performance',
    titleKey: 'ui:expedition.contracts.threeGoodGigs.title',
    descriptionKey: 'ui:expedition.contracts.threeGoodGigs.description',
    metric: 'goodGigCount',
    target: 3,
    reward: { money: 1500, fame: 500, rewardMultiplier: 1 },
    failure: { heat: 0, controversy: 3 }
  },
  {
    id: 'contract_keep_it_clean',
    kind: 'behavior',
    titleKey: 'ui:expedition.contracts.keepItClean.title',
    descriptionKey: 'ui:expedition.contracts.keepItClean.description',
    metric: 'maxHeat',
    target: 40,
    reward: { money: 1800, fame: 300, rewardMultiplier: 1 },
    failure: { heat: 5, controversy: 5 }
  },
  {
    id: 'contract_route_target',
    kind: 'route',
    titleKey: 'ui:expedition.contracts.routeTarget.title',
    descriptionKey: 'ui:expedition.contracts.routeTarget.description',
    metric: 'visitedNode',
    target: 1,
    reward: { money: 1200, fame: 400, rewardMultiplier: 1 },
    failure: { heat: 0, controversy: 2 }
  },
  {
    id: 'contract_no_rest_finale',
    kind: 'high_risk',
    titleKey: 'ui:expedition.contracts.noRestFinale.title',
    descriptionKey: 'ui:expedition.contracts.noRestFinale.description',
    metric: 'restCount',
    target: 0,
    reward: { money: 0, fame: 1000, rewardMultiplier: 1.2 },
    failure: { heat: 3, controversy: 4 }
  }
] as const satisfies readonly ExpeditionContractTemplate[])
```

Route contract runtime state must also carry `targetNodeId: string | null`; the action creator chooses a reachable future node from the already-generated map. Never offer a route contract without a concrete reachable target.

- [ ] **Step 5: Add pure evaluators**

Public contract:

```ts
export const createObligationFromTemplate = (
  template: ExpeditionContractTemplate,
  targetNodeId: string | null
): ActiveObligationState

export const recordObligationGig = (
  obligation: ActiveObligationState,
  accuracy: number
): ActiveObligationState

export const recordObligationArrival = (
  obligation: ActiveObligationState,
  nodeId: string
): ActiveObligationState

export const evaluateObligationAtFinale = (
  obligation: ActiveObligationState,
  context: { heat: number; restCount: number; finaleCompleted: boolean }
): ActiveObligationState
```

`goodGigCount` increments only at accuracy `>=65`. `maxHeat` fails immediately if Heat exceeds target. `visitedNode` completes on exact target id. `restCount` fails if count becomes `>0`.

- [ ] **Step 6: Run contract tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionContracts.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/types/contracts.d.ts src/types/index.ts src/types/expedition.d.ts src/data/expedition/contracts.ts src/domain/expedition/contracts.ts tests/node/expeditionContracts.test.js
git commit -m "feat(expedition): define run obligations"
```

---

### Task 4: Add Accept/Progress/Resolve Obligation Actions With Idempotent Rewards

**Files:**
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/useExpeditionDispatchActions.ts`
- Test: `tests/node/expeditionReducer.test.js`
- Test: `tests/node/expeditionContracts.test.js`

- [ ] **Step 1: Add failing idempotence tests**

Assert idempotence and canonical reward ownership with concrete reducer calls:

```js
const accepted = gameReducer(active, createAcceptExpeditionObligationAction(active, 'contract_three_good_gigs'))
const acceptedReplay = gameReducer(accepted, createAcceptExpeditionObligationAction(accepted, 'contract_three_good_gigs'))
assert.equal(accepted.expedition.activeObligations.length, 1)
assert.deepEqual(acceptedReplay.expedition.activeObligations, accepted.expedition.activeObligations)

const completed = withObligationStatus(accepted, 'contract_three_good_gigs', 'completed')
const paid = gameReducer(completed, createResolveExpeditionObligationAction(completed, 'contract_three_good_gigs'))
const replay = gameReducer(paid, createResolveExpeditionObligationAction(paid, 'contract_three_good_gigs'))
assert.equal(paid.player.money - completed.player.money, 1500)
assert.equal(replay.player.money, paid.player.money)
assert.equal(replay.expedition.activeObligations[0].settled, true)
```

Add a failed-obligation case asserting no positive money/fame delta and an action-creator hostile-input case asserting non-finite reward values are never caller-controlled.

- [ ] **Step 2: Add exact actions**

```ts
ACCEPT_EXPEDITION_OBLIGATION
UPDATE_EXPEDITION_OBLIGATION
RESOLVE_EXPEDITION_OBLIGATION
```

Payloads:

```ts
export interface AcceptExpeditionObligationPayload {
  obligation: ActiveObligationState
}

export interface UpdateExpeditionObligationPayload {
  id: string
  expectedStatus: ObligationStatus
  next: ActiveObligationState
}

export interface ResolveExpeditionObligationPayload {
  id: string
  expectedStatus: 'completed' | 'failed'
  moneyDelta: number
  fameDelta: number
  heatDelta: number
  controversyDelta: number
}
```

`createResolveExpeditionObligationAction(state,id)` derives deltas from the canonical template or linked Brand Deal metadata; UI cannot supply reward amounts.

- [ ] **Step 3: Reducer settles canonical resources once**

Completed native obligation:

```ts
player.money += moneyDelta
player.fame += fameDelta
```

Failure:

```ts
expedition.pressure.heat += heatDelta
social.controversyLevel += controversyDelta
```

Mark obligation with a new terminal flag `settled: true`; sanitizer defaults it to false for old saves. A settled obligation cannot be processed again.

- [ ] **Step 4: Run reducer/security tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js tests/node/expeditionContracts.test.js tests/node/actionCreatorSerialization.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context src/types/actions.d.ts src/types/expedition.d.ts src/domain/expedition/contracts.ts tests/node/expeditionReducer.test.js tests/node/expeditionContracts.test.js
git commit -m "feat(expedition): settle run obligations safely"
```

---

### Task 5: Progress Obligations From Existing Gig, Arrival, Rest, and Finale Seams

**Files:**
- Modify: `src/hooks/postGig/handlers/useContinueHandler.ts`
- Modify: `src/hooks/useArrivalLogic.ts`
- Modify: `src/hooks/travel/useVanMaintenance.ts`
- Modify: `src/domain/expedition/contracts.ts`
- Test: `tests/ui/postGigHandlerLogic.test.jsx`
- Test: `tests/ui/useArrivalLogic.test.jsx`
- relevant rest tests

- [ ] **Step 1: Add failing integration tests**

Assert exactly one progress dispatch at each accepted seam:

```jsx
const updateObligation = vi.fn()
await continuePostGig({ accuracy: 70, updateObligation })
expect(updateObligation).toHaveBeenCalledTimes(1)
expect(updateObligation.mock.calls[0][0].next.progress).toBe(1)

updateObligation.mockClear()
await handleArrival({ nodeId: 'node_4_1', targetNodeId: 'node_4_1', updateObligation })
expect(updateObligation.mock.calls[0][0].next.status).toBe('completed')

updateObligation.mockClear()
await handleRestInVan({ updateObligation })
expect(updateObligation.mock.calls[0][0].next.status).toBe('failed')
```

Add corresponding Heat-threshold and Finale cases; replay the same callback once and assert the existing one-shot guard keeps each update at one dispatch.

- [ ] **Step 2: Verify failures**

```bash
pnpm exec vitest run tests/ui/postGigHandlerLogic.test.jsx tests/ui/useArrivalLogic.test.jsx
```

Expected: new obligation assertions FAIL.

- [ ] **Step 3: Add one orchestration helper**

```ts
export const progressObligations = (
  obligations: readonly ActiveObligationState[],
  signal:
    | { type: 'gig'; accuracy: number }
    | { type: 'arrival'; nodeId: string }
    | { type: 'rest' }
    | { type: 'heat'; heat: number }
    | { type: 'finale'; heat: number; finaleCompleted: boolean }
): ActiveObligationState[]
```

The helper returns updated records; caller dispatches only records that changed.

- [ ] **Step 4: Integrate only inside existing replay guards**

Do not add a global watcher. Inside each existing one-shot seam, derive changed records and dispatch only those:

```ts
const nextObligations = progressObligations(state.expedition.activeObligations, signal)
for (let i = 0; i < nextObligations.length; i += 1) {
  const previous = state.expedition.activeObligations[i]
  const next = nextObligations[i]
  if (previous && next && next !== previous) updateExpeditionObligation(previous, next)
}
```

Settlement stays in the same guarded completion flow, so React re-renders cannot advance progress twice.

- [ ] **Step 5: Run integration tests**

```bash
pnpm run test:ui
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/hooks src/domain/expedition/contracts.ts tests
git commit -m "feat(expedition): progress obligations from tour actions"
```

---

### Task 6: Link Accepted Brand Deals to Obligations Without Duplicating Payouts

**Files:**
- Modify: `src/hooks/postGig/handlers/types.ts`
- Modify: `src/hooks/postGig/handlers/useDealHandlers.ts`
- Modify: `src/domain/expedition/contracts.ts`
- Modify: `src/types/social.d.ts`
- Test: `tests/ui/useDealHandlers.test.jsx`
- Test: `tests/ui/postGigHandlerLogic.test.jsx`
- Test: `tests/node/expeditionContracts.test.js`

- [ ] **Step 1: Add failing linked-deal test**

Accept `energy_drink_cx` during active Expedition and pin the existing payout plus zero-payout linked obligation:

```jsx
const acceptObligation = vi.fn()
const { result } = renderHook(() => useDealHandlers(makeProps({ expeditionActive: true, acceptObligation })))
act(() => result.current.handleAcceptDeal(BRAND_DEALS.energy_drink_cx))
expect(updatePlayer).toHaveBeenCalledTimes(1)
expect(updateSocial).toHaveBeenCalledWith(expect.objectContaining({ activeDeals: expect.any(Array) }))
expect(acceptObligation).toHaveBeenCalledWith(expect.objectContaining({
  sourceType: 'brandDeal',
  sourceId: 'energy_drink_cx'
}))
const linked = acceptObligation.mock.calls[0][0]
expect(getObligationSettlement(linked, 'completed').moneyDelta).toBe(0)
```

- [ ] **Step 2: Add optional obligation metadata to BrandDeal**

```ts
expeditionObligation?: {
  metric: 'goodGigCount' | 'maxHeat' | 'restCount'
  target: number
  failureHeat: number
}
```

Add metadata only to selected existing templates in the first release:

```ts
// energy_drink_cx
expeditionObligation: { metric: 'goodGigCount', target: 3, failureHeat: 5 }

// corp_fast_food
expeditionObligation: { metric: 'maxHeat', target: 40, failureHeat: 3 }

// indie_label_void
expeditionObligation: { metric: 'restCount', target: 0, failureHeat: 2 }
```

- [ ] **Step 3: Add dispatcher to deal handlers**

Extend `HandlerDispatchers` with:

```ts
acceptExpeditionObligation: (obligation: ActiveObligationState) => void
```

Only after existing deal updates succeed, if Expedition active and metadata exists, build the linked obligation and dispatch it. The economic reward fields for this obligation are zero.

- [ ] **Step 4: Run deal/post-gig tests**

```bash
pnpm exec vitest run tests/ui/useDealHandlers.test.jsx tests/ui/postGigHandlerLogic.test.jsx
pnpm run typecheck:core
```


Expected: PASS; no payout duplication.

- [ ] **Step 5: Commit**

```bash
git add src/types/social.d.ts src/data/brandDeals.ts src/domain/expedition/contracts.ts src/hooks/postGig/handlers tests
git commit -m "feat(expedition): link brand deals to obligations"
```

---

### Task 7: Make Social Posts Drive Exposure/Heat Strategically

**Files:**
- Modify: `src/types/social.d.ts`
- Modify: `src/data/postOptions.ts`
- Modify: `src/hooks/postGig/handlers/types.ts`
- Modify: `src/hooks/postGig/handlers/socialPostHandlerUtils.ts`
- Modify: `src/hooks/postGig/handlers/useSocialPostHandler.ts`
- Test: `tests/ui/useSocialPostHandler.test.jsx`, `tests/node/socialEngine.test.js`

- [ ] **Step 1: Add failing social-pressure test**

For an active Expedition, resolve a post result containing:

```js
expeditionEffect: { heat: 5, exposure: 12 }
```

and assert the social result applies its existing follower/controversy update and dispatches one pressure action. In legacy mode, pressure dispatcher is not called.

- [ ] **Step 2: Extend shared PostResult contract**

```ts
export interface PostResult {
  // existing fields
  expeditionEffect?: { heat?: number; exposure?: number }
}
```

- [ ] **Step 3: Add explicit effects to a small initial subset**

Add to resolved results, not conditions:

```text
radicalize_fans -> heat +8, exposure +10
recovery_apology_tour_promo -> heat -8, exposure +6
recovery_leaked_good_deed success -> heat -5, exposure +12
recovery_leaked_good_deed fail -> heat +6, exposure +8
comm_loyalty_merch_drive -> heat 0, exposure +3
```

- [ ] **Step 4: Extend dispatcher plumbing**

`HandlerDispatchers` receives:

```ts
applyExpeditionPressure: (payload: ApplyExpeditionPressurePayload) => void
```

`applySocialPostResult` sanitizes finite fields from `finalResult.expeditionEffect` and dispatches reason `social` only when Expedition is active in the injected context.

- [ ] **Step 5: Run social tests**

```bash
pnpm run test:ui
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/social.d.ts src/data/postOptions.ts src/hooks/postGig/handlers tests
git commit -m "feat(expedition): connect social choices to pressure"
```

---

### Task 8: Add Pressure-Tagged Event Weighting to Existing Event Selection

**Files:**
- Create: `src/domain/expedition/pressureDirector.ts`
- Modify: `src/utils/eventEngine/types.ts`
- Modify: `src/utils/eventEngine/eventSelection.ts`
- Test: `tests/node/pressureDirector.test.js`
- Test: `tests/node/eventEngine.test.js`, `tests/node/eventEngine_resolver.test.js`

- [ ] **Step 1: Write failing multiplier tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { getPressureEventChanceMultiplier } from '../../src/domain/expedition/pressureDirector.ts'

test('high heat favors authority/underground events without forcing them', () => {
  assert.equal(
    getPressureEventChanceMultiplier({ heat: 80, exposure: 30 }, ['authority']),
    1.8
  )
  assert.equal(
    getPressureEventChanceMultiplier({ heat: 80, exposure: 30 }, ['clean']),
    0.6
  )
})

test('high exposure favors sponsor/rival/media events', () => {
  assert.equal(
    getPressureEventChanceMultiplier({ heat: 10, exposure: 80 }, ['rival']),
    1.5
  )
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/pressureDirector.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement bounded multiplier**

```ts
export type PressureEventTag =
  | 'authority'
  | 'underground'
  | 'clean'
  | 'sponsor'
  | 'rival'
  | 'media'

export const getPressureEventChanceMultiplier = (
  pressure: { heat: number; exposure: number },
  tags: readonly string[]
): number => {
  let factor = 1
  if (pressure.heat >= 75 && (tags.includes('authority') || tags.includes('underground'))) factor *= 1.8
  if (pressure.heat >= 75 && tags.includes('clean')) factor *= 0.6
  if (pressure.exposure >= 75 && (tags.includes('sponsor') || tags.includes('rival') || tags.includes('media'))) factor *= 1.5
  if (pressure.exposure < 25 && tags.includes('media')) factor *= 0.75
  return Math.max(0.4, Math.min(2, factor))
}
```

- [ ] **Step 4: Extend event engine type and weighted chance only**

Add:

```ts
pressureTags?: string[]
```

to `EngineEvent`. In `eventSelection.ts`, after existing flag/harmony/module/breakdown modifiers and before chance clamp:

```ts
if (gameState.expedition?.status === 'active' && event.pressureTags?.length) {
  chance *= getPressureEventChanceMultiplier(
    gameState.expedition.pressure,
    event.pressureTags
  )
}
```

The Director never creates an event, bypasses conditions/cooldowns, or changes outcomes.

- [ ] **Step 5: Run event-selection statistical/determinism tests**

```bash
pnpm run test:node
pnpm run typecheck:core
```

Expected: existing event selection semantics remain green; new pressure factors are covered.

- [ ] **Step 6: Commit**

```bash
git add src/domain/expedition/pressureDirector.ts src/utils/eventEngine/types.ts src/utils/eventEngine/eventSelection.ts tests/node/pressureDirector.test.js tests
git commit -m "feat(events): bias eligible events by expedition pressure"
```

---

### Task 9: Add Authority and Pressure Events With Telegraphing and Safe Escape

**Files:**
- Create: `src/data/events/pressure.ts`
- Modify: `src/data/events/index.ts`
- Modify: `public/locales/en/events.json`
- Modify: `public/locales/de/events.json`
- Test: `tests/data/events/validation.test.js`, `tests/node/eventValidator.test.js`, `tests/ui/events.data.test.jsx`

- [ ] **Step 1: Add failing event id assertions**

Require:

```js
[
  'expedition_authority_roadblock',
  'expedition_media_frenzy',
  'expedition_underground_invite'
]
```

- [ ] **Step 2: Add exact events**

Define the events using the existing `effect` schema plus the Expedition resolver added in G3. The roadblock demonstrates the complete shape:

```ts
export const PRESSURE_EVENTS = [
  {
    id: 'expedition_authority_roadblock', category: 'transport', trigger: 'travel', chance: 0.12, pressureTags: ['authority'],
    condition: state => state.expedition?.status === 'active' && (state.expedition.pressure?.heat ?? 0) >= 50,
    options: [
      { id: 'pay', label: 'events:expedition_authority_roadblock.pay', effect: { type: 'composite', effects: [
        { type: 'resource', resource: 'money', value: -1500 },
        { type: 'expedition', delta: { heat: -5 } },
        { type: 'cooldown', eventId: 'expedition_authority_roadblock', value: 2 }
      ] } },
      { id: 'security', label: 'events:expedition_authority_roadblock.security', condition: state => state.expedition.loadout.crewIds.includes('crew_saskia_security'), effect: { type: 'composite', effects: [
        { type: 'expedition', delta: { heat: -10 } },
        { type: 'cooldown', eventId: 'expedition_authority_roadblock', value: 2 }
      ] } },
      { id: 'hidden_compartment', label: 'events:expedition_authority_roadblock.hidden', condition: state => getExpeditionVehicleProfile(state).hiddenContrabandSlots > 0, effect: { type: 'composite', effects: [
        { type: 'expedition', delta: { heat: -3 } },
        { type: 'cooldown', eventId: 'expedition_authority_roadblock', value: 2 }
      ] } },
      { id: 'detour', label: 'events:expedition_authority_roadblock.detour', effect: { type: 'composite', effects: [
        { type: 'stat', stat: 'fuel', value: -15 },
        { type: 'expedition', delta: { heat: -8 } },
        { type: 'cooldown', eventId: 'expedition_authority_roadblock', value: 2 }
      ] } }
    ]
  },
  { id: 'expedition_media_frenzy', category: 'special', trigger: 'random', chance: 0.1, pressureTags: ['media'], condition: state => state.expedition?.status === 'active' && (state.expedition.pressure?.exposure ?? 0) >= 50, options: [
    { id: 'push', effect: { type: 'composite', effects: [{ type: 'resource', resource: 'fame', value: 500 }, { type: 'expedition', delta: { heat: 4, exposure: 10 } }] } },
    { id: 'monetize', effect: { type: 'composite', effects: [{ type: 'resource', resource: 'money', value: 800 }, { type: 'expedition', delta: { exposure: 5 } }] } },
    { id: 'quiet', effect: { type: 'expedition', delta: { exposure: -10 } } }
  ] },
  { id: 'expedition_underground_invite', category: 'special', trigger: 'random', chance: 0.08, pressureTags: ['underground'], condition: state => state.expedition?.status === 'active' && (state.expedition.pressure?.heat ?? 0) >= 60, options: [
    { id: 'accept', effect: { type: 'composite', effects: [{ type: 'resource', resource: 'fame', value: 700 }, { type: 'expedition', delta: { heat: 5 } }, { type: 'chain', eventId: 'expedition_underground_followup' }] } },
    { id: 'decline', effect: { type: 'expedition', delta: { heat: -3 } } }
  ] }
]
```

For the detour's vehicle damage, use the already-supported event stat key `{ type: 'stat', stat: 'van_condition', value: -5 }`. `src/utils/eventEngine/eventEffectHandlers.ts` maps `van_condition` into `delta.player.van.condition`, so this path reuses the canonical event delta instead of adding a second damage action.

- [ ] **Step 3: Add severe-event repeat protection**

Each roadblock branch includes the existing cooldown effect:

```ts
{ type: 'cooldown', eventId: 'expedition_authority_roadblock', value: 2 }
```

Add a resolver test asserting an event on day 5 writes `expedition_authority_roadblock:7` and event selection excludes it until expiry.

- [ ] **Step 4: Run event/i18n tests**

```bash
pnpm run test:node
pnpm run test:additional
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/events/pressure.ts src/data/events/index.ts public/locales/en/events.json public/locales/de/events.json tests
git commit -m "feat(events): add pressure and authority encounters"
```

---

### Task 10: Turn the Existing Active Rival Into a Persistent Nemesis Thread

**Files:**
- Create: `src/domain/expedition/rivals.ts`
- Modify: `src/utils/rivalEngine.ts`
- Modify: `src/hooks/overworld/useRivalEscalation.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Test: `tests/node/expeditionRivals.test.js`
- Test: `tests/node/rivalEngine.test.js`, `tests/node/rivalReducer.test.js`

- [ ] **Step 1: Write failing relationship progression tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { applyRivalOutcome } from '../../src/domain/expedition/rivals.ts'

test('repeated hostile outcomes escalate to rival then nemesis', () => {
  let history = { relationship: 'unknown', nemesisLevel: 0, encounterCount: 0, lastOutcome: null }
  history = applyRivalOutcome(history, 'hostile_win')
  assert.equal(history.relationship, 'competitive')
  history = applyRivalOutcome(history, 'hostile_win')
  assert.equal(history.relationship, 'rival')
  history = applyRivalOutcome(history, 'hostile_win')
  assert.equal(history.relationship, 'nemesis')
  assert.equal(history.nemesisLevel, 1)
})

test('respect choices can move competitive rival toward respect', () => {
  const next = applyRivalOutcome(
    { relationship: 'competitive', nemesisLevel: 0, encounterCount: 2, lastOutcome: null },
    'respect'
  )
  assert.equal(next.relationship, 'respect')
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionRivals.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement persistent history transition**

```ts
export type RivalOutcome = 'hostile_win' | 'hostile_loss' | 'respect' | 'alliance'

export const applyRivalOutcome = (
  history: CareerRivalHistory,
  outcome: RivalOutcome
): CareerRivalHistory => {
  const encounterCount = history.encounterCount + 1
  let relationship = history.relationship
  let nemesisLevel = history.nemesisLevel
  if (outcome === 'alliance') relationship = 'alliance'
  else if (outcome === 'respect') relationship = 'respect'
  else if (outcome === 'hostile_win' || outcome === 'hostile_loss') {
    if (relationship === 'unknown') relationship = 'competitive'
    else if (relationship === 'competitive') relationship = 'rival'
    else if (relationship === 'rival') {
      relationship = 'nemesis'
      nemesisLevel = Math.max(1, nemesisLevel)
    } else if (relationship === 'nemesis') {
      nemesisLevel = Math.min(4, nemesisLevel + 1)
    }
  }
  return { relationship, nemesisLevel, encounterCount, lastOutcome: outcome }
}
```

- [ ] **Step 4: Keep one active run rival**

Do not replace `state.rivalBand` with a collection. At Expedition start, `generateRivalBand` may reuse a known persistent rival identity when the tour type/region requests it; otherwise current generation continues. `useRivalEscalation` retains its replay guard but delegates persistent result updates to an explicit encounter resolution, not mere co-location.

- [ ] **Step 5: Run rival regression tests**

```bash
pnpm run test:node
pnpm run test:ui
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/expedition/rivals.ts src/utils/rivalEngine.ts src/hooks/overworld/useRivalEscalation.ts src/context/careerActionCreators.ts src/context/reducers/careerReducer.ts tests/node/expeditionRivals.test.js tests
git commit -m "feat(expedition): persist rival nemesis progression"
```

---

### Task 11: Replace the Rival Toast-Only Encounter With Explicit Choices

**Files:**
- Create: `src/data/events/rival.ts`
- Create: `src/ui/expedition/RivalEncounterCard.tsx`
- Modify: `src/data/events/index.ts`
- Modify: `src/context/reducers/rivalReducer.ts`
- Modify: `src/hooks/overworld/useRivalEscalation.ts`
- Modify: `public/locales/en/events.json`, `public/locales/de/events.json`
- Test: `tests/node/rivalEngine.test.js`, `tests/ui/EventModal.test.jsx`, `tests/ui/events.data.test.jsx`

- [ ] **Step 1: Add failing encounter test**

When active rival and player share a node, pin one queued encounter and replay protection:

```js
const first = handleCheckRivalEncounter(activeCoLocatedState)
assert.equal(first.pendingEvents.filter(id => id === 'expedition_rival_double_booked').length, 1)
const replay = handleCheckRivalEncounter(first)
assert.equal(replay.pendingEvents.filter(id => id === 'expedition_rival_double_booked').length, 1)
```

- [ ] **Step 2: Add `expedition_rival_double_booked` event**

Add one ordinary event and map only the battle choice into typed Expedition intent; the generic event engine still owns display/choice resolution:

```ts
export const RIVAL_EVENTS = [{
  id: 'expedition_rival_double_booked', category: 'band', trigger: 'random', chance: 0, pressureTags: ['rival'],
  options: [
    { id: 'battle', effect: { type: 'expedition', delta: { heat: 3 } } },
    { id: 'split_bill', effect: { type: 'resource', resource: 'money', value: -500 } },
    { id: 'sabotage', effect: { type: 'expedition', delta: { heat: 25, condition: { pa: 5 } } } },
    { id: 'withdraw', effect: { type: 'resource', resource: 'fame', value: -300 } }
  ]
}]
```

Add `rivalBattlePending: boolean` to run state (default/sanitizer included). The event-resolution callback dispatches `setRivalBattlePending(true)` only for choice `battle`. The existing pre-gig path consumes that flag into a rival gig modifier; guarded post-gig resolution records the rival outcome and clears the flag. Split/Sabotage/Withdraw dispatch the corresponding persistent rival outcome once. No second modal/event engine is introduced.

- [ ] **Step 3: Remove duplicate toast-only semantics for Expedition**

`handleCheckRivalEncounter` keeps existing toast behavior for legacy runs. For active Expedition it should not both queue a rival event and emit the old warning toast repeatedly.

- [ ] **Step 4: Run tests**

```bash
pnpm run test:node
pnpm run test:ui
pnpm run test:additional
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/events/rival.ts src/data/events/index.ts src/ui/expedition/RivalEncounterCard.tsx src/context/reducers/rivalReducer.ts src/hooks/overworld/useRivalEscalation.ts public/locales tests
git commit -m "feat(expedition): add rival encounter choices"
```

---

### Task 12: Resolve a Context-Sensitive Finale Without Rebuilding the Map

**Files:**
- Create: `src/domain/expedition/finale.ts`
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/defaults.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/hooks/useArrivalLogic.ts`
- Modify: `src/context/useGameDispatchActions.ts`, `src/context/reducers/gigReducer.ts`
- Test: `tests/node/expeditionFinale.test.js`
- Test: `tests/ui/useArrivalLogic.test.jsx`, `tests/hooks/preGig/usePreGigHandlers.test.tsx`, `tests/ui/PreGig.test.jsx`

- [ ] **Step 1: Write failing finale resolver tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveExpeditionFinaleType } from '../../src/domain/expedition/finale.ts'

test('nemesis state wins finale priority over general pressure', () => {
  assert.equal(resolveExpeditionFinaleType({
    heat: 90,
    exposure: 90,
    activeRivalRelationship: 'nemesis',
    activeSponsorObligations: 2,
    aggregateCondition: 80
  }), 'rival_battle')
})

test('high heat produces illegal show when no nemesis dominates', () => {
  assert.equal(resolveExpeditionFinaleType({
    heat: 90,
    exposure: 40,
    activeRivalRelationship: 'unknown',
    activeSponsorObligations: 0,
    aggregateCondition: 80
  }), 'illegal_show')
})
```

- [ ] **Step 2: Implement exact priority**

```ts
export type ExpeditionFinaleType =
  | 'regional_headliner'
  | 'corporate_showcase'
  | 'rival_battle'
  | 'illegal_show'
  | 'disaster_gig'

export const resolveExpeditionFinaleType = (ctx: {
  heat: number
  exposure: number
  activeRivalRelationship: string
  activeSponsorObligations: number
  aggregateCondition: number
}): ExpeditionFinaleType => {
  if (ctx.activeRivalRelationship === 'nemesis') return 'rival_battle'
  if (ctx.aggregateCondition < 25) return 'disaster_gig'
  if (ctx.heat >= 75) return 'illegal_show'
  if (ctx.exposure >= 60 && ctx.activeSponsorObligations > 0) return 'corporate_showcase'
  return 'regional_headliner'
}
```

- [ ] **Step 3: Persist only the resolved finale type in run state**

Add `finaleType: ExpeditionFinaleType | null` with replay-safe action/reducer:

```ts
export const createResolveExpeditionFinaleAction = (
  state: GameState
): Extract<GameAction, { type: typeof ActionTypes.RESOLVE_EXPEDITION_FINALE }> | null => {
  if (state.expedition.status !== 'active' || state.expedition.finaleType) return null
  return {
    type: ActionTypes.RESOLVE_EXPEDITION_FINALE,
    payload: { finaleType: resolveExpeditionFinaleType(buildFinaleContext(state)) }
  }
}

export const handleResolveExpeditionFinale = (state, payload) =>
  state.expedition.finaleType
    ? state
    : { ...state, expedition: { ...state.expedition, finaleType: payload.finaleType } }
```

- [ ] **Step 4: Translate finale type into existing gig modifiers**

Do not generate a second finale node. Apply a bounded modifier object before starting the existing Finale gig:

```text
regional_headliner: no extra modifier
corporate_showcase: higher minimum expectation, contract bonus
rival_battle: rival scoring context enabled
illegal_show: higher Heat consequence, higher Fame reward
 disaster_gig: technical hazard enabled, higher rare-reward chance if won
```

Use existing gig modifier/reset conventions; `START_GIG` remains the reset owner.

- [ ] **Step 5: Run finale/arrival tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionFinale.test.js
pnpm exec vitest run tests/ui/useArrivalLogic.test.jsx tests/ui/postGigHandlerLogic.test.jsx
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/expedition/finale.ts src/types/expedition.d.ts src/domain/expedition/defaults.ts src/context/reducers/expeditionSanitizers.ts src/context/expeditionActionCreators.ts src/context/reducers/expeditionReducer.ts src/hooks/useArrivalLogic.ts src tests
git commit -m "feat(expedition): add context-sensitive finales"
```

---

### Task 13: Implement Targeted Hybrid Run Drafts

**Files:**
- Create: `src/data/expedition/runTraits.ts`
- Create: `src/domain/expedition/runDrafts.ts`
- Create: `src/ui/expedition/RunDraftModal.tsx`
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/defaults.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/useExpeditionDispatchActions.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/hooks/postGig/handlers/useContinueHandler.ts`
- Modify: `src/hooks/useArrivalLogic.ts`
- Modify: `src/domain/expedition/rivals.ts`
- Modify: `src/domain/expedition/condition.ts`
- Modify: `src/domain/expedition/crewStress.ts`
- Modify: `src/domain/expedition/nodeIntel.ts`
- Modify: `src/domain/expedition/pressureDirector.ts`
- Modify: `src/domain/expedition/extraction.ts`
- Modify: `public/locales/en/ui.json`
- Modify: `public/locales/de/ui.json`
- Test: `tests/node/expeditionRunDrafts.test.js`
- Test: `tests/ui/RunDraftModal.test.tsx`
- Test: `tests/ui/postGigHandlerLogic.test.jsx`
- Test: `tests/ui/useArrivalLogic.test.jsx`

The approved design calls for a strong pre-tour build plus **occasional** 1-of-3 run drafts after meaningful moments. This task deliberately caps standard runs at two accepted drafts so the 20–30 minute loop is not interrupted constantly.

- [ ] **Step 1: Write failing deterministic draft tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { EXPEDITION_RUN_TRAITS } from '../../src/data/expedition/runTraits.ts'
import {
  buildRunDraft,
  getRunTraitProfile
} from '../../src/domain/expedition/runDrafts.ts'

test('same seed/source produces the same three unique candidates', () => {
  const a = buildRunDraft({
    runSeed: 12345,
    sourceKey: 'major_gig:node_3_1',
    sourceType: 'major_gig',
    ownedTraitIds: []
  })
  const b = buildRunDraft({
    runSeed: 12345,
    sourceKey: 'major_gig:node_3_1',
    sourceType: 'major_gig',
    ownedTraitIds: []
  })
  assert.ok(a)
  assert.deepEqual(a, b)
  assert.equal(new Set(a.candidateTraitIds).size, 3)
})

test('every approved source can produce three candidates in a fresh run', () => {
  for (const sourceType of ['major_gig', 'rival', 'supply', 'crew']) {
    const draft = buildRunDraft({
      runSeed: 12345,
      sourceKey: `${sourceType}:test`,
      sourceType,
      ownedTraitIds: []
    })
    assert.ok(draft, sourceType)
    assert.equal(new Set(draft.candidateTraitIds).size, 3, sourceType)
  }
})

test('source-local shortages fall back deterministically without offering owned traits', () => {
  const draft = buildRunDraft({
    runSeed: 12345,
    sourceKey: 'rival:rival_dead_circuits',
    sourceType: 'rival',
    ownedTraitIds: ['backchannel']
  })
  assert.ok(draft)
  assert.equal(draft.candidateTraitIds.includes('backchannel'), false)
  assert.equal(new Set(draft.candidateTraitIds).size, 3)
})

test('an exhausted global pool returns null instead of throwing', () => {
  const owned = Object.keys(EXPEDITION_RUN_TRAITS).slice(0, 4)
  assert.equal(buildRunDraft({
    runSeed: 12345,
    sourceKey: 'crew:exhausted',
    sourceType: 'crew',
    ownedTraitIds: owned
  }), null)
})

test('run trait profile composes the approved rule changes', () => {
  const profile = getRunTraitProfile(['road_warrior', 'backchannel'])
  assert.equal(profile.roadWearMultiplier, 0.7)
  assert.equal(profile.nodeIntelFloor, 1)
})
```

- [ ] **Step 2: Define six initial temporary run traits**

`src/data/expedition/runTraits.ts` owns the pool:

```ts
export type RunDraftSource = 'major_gig' | 'rival' | 'supply' | 'crew'

export interface ExpeditionRunTraitDefinition {
  id: string
  nameKey: string
  descriptionKey: string
  sources: readonly RunDraftSource[]
}

export const EXPEDITION_RUN_TRAITS = Object.freeze({
  road_warrior: {
    id: 'road_warrior',
    nameKey: 'ui:expedition.runTrait.roadWarrior.name',
    descriptionKey: 'ui:expedition.runTrait.roadWarrior.desc',
    sources: ['major_gig', 'supply']
  },
  field_engineer: {
    id: 'field_engineer',
    nameKey: 'ui:expedition.runTrait.fieldEngineer.name',
    descriptionKey: 'ui:expedition.runTrait.fieldEngineer.desc',
    sources: ['supply', 'crew']
  },
  crew_mediator: {
    id: 'crew_mediator',
    nameKey: 'ui:expedition.runTrait.crewMediator.name',
    descriptionKey: 'ui:expedition.runTrait.crewMediator.desc',
    sources: ['crew', 'major_gig']
  },
  backchannel: {
    id: 'backchannel',
    nameKey: 'ui:expedition.runTrait.backchannel.name',
    descriptionKey: 'ui:expedition.runTrait.backchannel.desc',
    sources: ['rival', 'major_gig']
  },
  cold_trail: {
    id: 'cold_trail',
    nameKey: 'ui:expedition.runTrait.coldTrail.name',
    descriptionKey: 'ui:expedition.runTrait.coldTrail.desc',
    sources: ['rival', 'supply']
  },
  reckless_encore: {
    id: 'reckless_encore',
    nameKey: 'ui:expedition.runTrait.recklessEncore.name',
    descriptionKey: 'ui:expedition.runTrait.recklessEncore.desc',
    sources: ['major_gig', 'rival']
  }
} satisfies Record<string, ExpeditionRunTraitDefinition>)
```

Semantics are fixed for v1:

```text
road_warrior: road travel wear x0.70
field_engineer: field repairs do not create a hidden defect and restore at least 55 condition
crew_mediator: positive crew-stress gains x0.70
backchannel: structurally visible nodes have intel floor 1
cold_trail: authority-tag event weight x0.50
reckless_encore: finale completion reward x1.20, voluntary extraction retention x0.85
```

These traits are run-only. They never write to `career` or `state.unlocks`.

- [ ] **Step 3: Add pending-draft state and deterministic candidate generation**

Extend `ExpeditionState`:

```ts
export interface PendingExpeditionDraft {
  sourceKey: string
  sourceType: RunDraftSource
  candidateTraitIds: string[]
}

pendingDraft: PendingExpeditionDraft | null
draftSourceKeysSeen: string[]
```

Default both to `null` / `[]`; sanitizer accepts only known source types, known trait ids, unique candidates, and at most 16 remembered source keys.

Use existing deterministic helpers outside reducers:

```ts
import { createRngStream } from '../../utils/seededRng'
import { hashString } from '../../utils/stringUtils'

export const buildRunDraft = (
  input: BuildRunDraftInput
): PendingExpeditionDraft | null => {
  const owned = new Set(input.ownedTraitIds)
  const eligible = Object.values(EXPEDITION_RUN_TRAITS)
    .filter(trait => !owned.has(trait.id))
    .sort((a, b) => a.id.localeCompare(b.id))

  if (eligible.length < 3) return null

  const seed = (input.runSeed ^ hashString(input.sourceKey)) >>> 0
  const rolls = createRngStream(seed, eligible.length)
  const ranked = eligible
    .map((trait, index) => ({
      trait,
      sourcePriority: trait.sources.includes(input.sourceType) ? 0 : 1,
      roll: rolls[index] ?? 0
    }))
    .sort(
      (a, b) =>
        a.sourcePriority - b.sourcePriority ||
        a.roll - b.roll ||
        a.trait.id.localeCompare(b.trait.id)
    )

  return {
    sourceKey: input.sourceKey,
    sourceType: input.sourceType,
    candidateTraitIds: ranked.slice(0, 3).map(item => item.trait.id)
  }
}
```

- [ ] **Step 4: Add replay-safe offer/select actions**

```ts
export const createOfferExpeditionDraftAction = (
  state: GameState,
  sourceType: RunDraftSource,
  sourceKey: string
): Extract<GameAction, { type: typeof ActionTypes.OFFER_EXPEDITION_DRAFT }> | null => {
  if (state.expedition.status !== 'active') return null
  if (state.expedition.pendingDraft) return null
  if (state.expedition.draftTraitIds.length >= 2) return null
  if (state.expedition.draftSourceKeysSeen.includes(sourceKey)) return null
  const draft = buildRunDraft({
    runSeed: state.runSeed,
    sourceType,
    sourceKey,
    ownedTraitIds: state.expedition.draftTraitIds
  })
  if (!draft) return null
  return { type: ActionTypes.OFFER_EXPEDITION_DRAFT, payload: draft }
}

export const createSelectExpeditionDraftAction = (
  traitId: unknown
): Extract<GameAction, { type: typeof ActionTypes.SELECT_EXPEDITION_DRAFT }> => {
  if (typeof traitId !== 'string' || !Object.hasOwn(EXPEDITION_RUN_TRAITS, traitId)) {
    throw new TypeError('unknown run trait')
  }
  return { type: ActionTypes.SELECT_EXPEDITION_DRAFT, payload: { traitId } }
}
```

The reducer accepts `OFFER` only when its `sourceKey` was not seen, records that source key immediately, and accepts `SELECT` only when the id is one of `pendingDraft.candidateTraitIds`; selection appends it once to `draftTraitIds` and clears `pendingDraft`. Because a standard run accepts at most two traits, the six-trait global pool always has at least four unowned entries when a second offer is eligible; source-local pools are preferences, not hard failure boundaries. If future content exhausts the global pool below three, the offer creator returns `null` rather than throwing or opening a broken draft UI.

- [ ] **Step 5: Trigger drafts only at approved high-value seams**

Use exact source keys so rerenders cannot offer twice:

```ts
// post-gig: successful, accuracy >= 70, route step >= 2
if (!failed && accuracy >= 70 && expedition.routeStep >= 2) {
  offerExpeditionDraft('major_gig', `major_gig:${currentGig.id}:${expedition.routeStep}`)
}

// rival resolution: only on a won rival encounter
offerExpeditionDraft('rival', `rival:${rivalBand.id}:${expedition.routeStep}`)

// Supply Stop: after the player completes one paid repair/supply interaction
offerExpeditionDraft('supply', `supply:${currentNode.id}`)

// crew crisis: only after a successful non-hostile resolution
offerExpeditionDraft('crew', `crew:${event.id}:${expedition.routeStep}`)
```

A standard run can therefore receive at most two accepted drafts. Do not offer a draft on every gig, travel hop, or random event.

- [ ] **Step 6: Apply trait effects through one pure profile**

```ts
export interface ExpeditionRunTraitProfile {
  roadWearMultiplier: number
  fieldRepairNoHiddenDefect: boolean
  fieldRepairMinimumCondition: number | null
  positiveCrewStressMultiplier: number
  nodeIntelFloor: NodeIntelLevel
  authorityEventWeightMultiplier: number
  finaleRewardMultiplier: number
  voluntaryRetentionMultiplier: number
}

export const getRunTraitProfile = (
  traitIds: readonly string[]
): ExpeditionRunTraitProfile => ({
  roadWearMultiplier: traitIds.includes('road_warrior') ? 0.7 : 1,
  fieldRepairNoHiddenDefect: traitIds.includes('field_engineer'),
  fieldRepairMinimumCondition: traitIds.includes('field_engineer') ? 55 : null,
  positiveCrewStressMultiplier: traitIds.includes('crew_mediator') ? 0.7 : 1,
  nodeIntelFloor: traitIds.includes('backchannel') ? 1 : 0,
  authorityEventWeightMultiplier: traitIds.includes('cold_trail') ? 0.5 : 1,
  finaleRewardMultiplier: traitIds.includes('reckless_encore') ? 1.2 : 1,
  voluntaryRetentionMultiplier: traitIds.includes('reckless_encore') ? 0.85 : 1
})
```

Compose this profile at the owning G2/G3/G4 helpers: condition wear, field repair result, positive crew stress, node intel selector, authority-tag director weight, finale reward, and voluntary extraction retention. Do not make reducers inspect trait ids directly.

- [ ] **Step 7: Build the 1-of-3 modal**

```tsx
export const RunDraftModal = ({ draft, onSelect }: Props) => (
  <section role='dialog' aria-labelledby='run-draft-title'>
    <h2 id='run-draft-title'>{t('ui:expedition.runDraft.title')}</h2>
    {draft.candidateTraitIds.map(id => {
      const trait = EXPEDITION_RUN_TRAITS[id]
      return (
        <button key={id} type='button' onClick={() => onSelect(id)}>
          <strong>{t(trait.nameKey)}</strong>
          <span>{t(trait.descriptionKey)}</span>
        </button>
      )
    })}
  </section>
)
```

Render it as a blocking run decision only while `pendingDraft !== null`; active game input behind the modal is disabled through the same modal/input-gating convention as existing events. Add exact EN/DE names/descriptions for all six traits.

- [ ] **Step 8: Run draft/domain/UI regression tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionRunDrafts.test.js \
  tests/node/expeditionExtraction.test.js \
  tests/node/expeditionPressure.test.js
pnpm exec vitest run \
  tests/ui/RunDraftModal.test.tsx \
  tests/ui/postGigHandlerLogic.test.jsx \
  tests/ui/useArrivalLogic.test.jsx
pnpm run typecheck:core
```

Expected: PASS; same seed/source yields the same candidates, duplicate offers/selects are no-ops, and no run holds more than two temporary draft traits under the standard policy.

- [ ] **Step 9: Commit**

```bash
git add src/data/expedition/runTraits.ts src/domain/expedition/runDrafts.ts src/ui/expedition/RunDraftModal.tsx src/types/expedition.d.ts src/domain/expedition/defaults.ts src/context src/hooks src/domain/expedition public/locales tests
git commit -m "feat(expedition): add targeted run trait drafts"
```

### Task 14: Build Compact Pressure and Obligations UI

**Files:**
- Create: `src/ui/expedition/PressurePanel.tsx`
- Create: `src/ui/expedition/ObligationsPanel.tsx`
- Modify: `src/ui/expedition/ExpeditionStatusStrip.tsx`
- Modify: `src/ui/expedition/RunSummaryCard.tsx`
- Modify: `public/locales/en/ui.json`, `public/locales/de/ui.json`
- Test: `tests/ui/ExpeditionPressurePanel.test.tsx`
- Test: `tests/ui/ExpeditionObligations.test.tsx`

- [ ] **Step 1: Add failing UI tests**

Pin the UI contract:

```tsx
render(<ExpeditionStatusStrip heat={67} routeStep={4} />)
expect(screen.getByText(/67/)).toBeInTheDocument()
expect(screen.queryByText(/Exposure 55/)).not.toBeInTheDocument()

render(<PressurePanel heat={67} exposure={55} />)
expect(screen.getByText(/55/)).toBeInTheDocument()
expect(screen.queryByText(/12%|0\.12/)).not.toBeInTheDocument()

render(<ObligationsPanel obligations={[activeObligation, completedObligation, failedObligation]} />)
expect(screen.getAllByTestId('expedition-obligation')).toHaveLength(3)
```

Add a Run Summary assertion that finale label is absent for `finaleType:null` and visible after resolution.

- [ ] **Step 2: Implement panels**

Implement panels from pure view-model selectors:

```tsx
export const PressurePanel = ({ heat, exposure }: Props) => {
  const view = buildPressureViewModel(heat, exposure)
  return <dl><dt>{t('ui:expedition.pressure.heat')}</dt><dd>{view.heatLabel}</dd><dt>{t('ui:expedition.pressure.exposure')}</dt><dd>{view.exposureLabel}</dd></dl>
}

export const ObligationsPanel = ({ obligations }: Props) => (
  <ul>{sortObligationsForDisplay(obligations).map(item => <ObligationRow key={item.id} obligation={item} />)}</ul>
)
```

- [ ] **Step 3: Add translations**

Add matching locale structures; for example:

```json
{ "expedition": { "pressure": { "heat": "Heat", "exposure": "Exposure" }, "obligation": { "active": "Active", "completed": "Completed", "failed": "Failed" }, "finale": { "rival_battle": "Rival battle", "illegal_show": "Illegal show" } } }
```

```json
{ "expedition": { "pressure": { "heat": "Heat", "exposure": "Aufmerksamkeit" }, "obligation": { "active": "Aktiv", "completed": "Erfüllt", "failed": "Gescheitert" }, "finale": { "rival_battle": "Rivalen-Duell", "illegal_show": "Illegale Show" } } }
```

Add every remaining band/contract/relationship/finale id to the same structures in both locale files.

- [ ] **Step 4: Run UI/i18n tests**

```bash
pnpm exec vitest run tests/ui/ExpeditionPressurePanel.test.tsx tests/ui/ExpeditionObligations.test.tsx
pnpm run test:additional
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/expedition public/locales tests/ui/ExpeditionPressurePanel.test.tsx tests/ui/ExpeditionObligations.test.tsx
git commit -m "feat(expedition): surface pressure and obligations"
```

---

### Task 15: Add G4 Pressure/Contract/Rival/Draft Metrics to the Balance Simulator

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `scripts/utils/balance-report-metadata.mjs`
- Test: `tests/node/game-balance-simulation.test.js`, `tests/node/balanceSourceFiles.test.js`

- [ ] **Step 1: Add failing report contract**

Require per scenario/strategy:

```js
[
  'avgHeatAtExtraction',
  'p90HeatAtExtraction',
  'avgExposureAtExtraction',
  'authorityEncounterRunsPct',
  'rivalEncounterRunsPct',
  'avgObligationsAccepted',
  'obligationCompletionPct',
  'obligationFailurePct',
  'avgMaxObligationStack',
  'finaleTypeShares',
  'heatRewardCorrelation',
  'avgDraftsOffered',
  'avgDraftsAccepted',
  'runTraitPickRates'
]
```

- [ ] **Step 2: Verify failure**

```bash
pnpm run test:node
```

Expected: new report assertions fail.

- [ ] **Step 3: Import production pressure/contract/director/finale helpers**

Import the canonical production helpers directly in `scripts/game-balance-simulation.mjs`:

```js
import {
  applyPressureDelta,
  getHeatBand,
  getExposureBand
} from '../src/domain/expedition/pressure.ts'
import {
  evaluateObligation,
  getObligationProgress
} from '../src/domain/expedition/contracts.ts'
import {
  getPressureEventChanceMultiplier
} from '../src/domain/expedition/pressureDirector.ts'
import {
  resolveExpeditionRivalOutcome
} from '../src/domain/expedition/rivals.ts'
import {
  resolveExpeditionFinaleType
} from '../src/domain/expedition/finale.ts'
```

Add those five domain files plus `src/data/expedition/contracts.ts`, `src/data/expedition/runTraits.ts`, `src/domain/expedition/runDrafts.ts`, `src/data/events/pressure.ts`, and `src/data/events/rival.ts` to the existing frozen `BALANCE_SOURCE_FILES` array in `scripts/utils/balance-report-metadata.mjs`. The simulator calls `getPressureEventChanceMultiplier`; it must not duplicate the director weighting formula.

- [ ] **Step 4: Add explicit strategy variants**

At minimum:

```text
Clean Sponsor: keep Heat <40, accept clean contracts, Manager/Nico/Tom
High Heat: accept Underground opportunities, Security/Mika/Tom
Rival Hunt: prefer rival path/events, performance-first
Baseline: neutral contract acceptance, extract based on safety threshold
```

Each is its own scenario id/seed stream.

- [ ] **Step 5: Add soft dominance diagnostics**

Warn when one strategy simultaneously has:

```text
- failure rate no worse than every comparator by >2 percentage points AND
- median secured reward at least 15% higher than every comparator
```

Do not make this a hard gate yet; first collect stable distributions.

- [ ] **Step 6: Run G4 gate**

```bash
pnpm run test:node
pnpm run test:ui
pnpm run typecheck:core
pnpm run deadcode:check
pnpm run simulate:balance
```

Expected: PASS; report contains calibration + holdout pressure/contract/rival metrics.

- [ ] **Step 7: Commit**

```bash
git add scripts/game-balance-simulation.mjs reports tests
git commit -m "test(balance): measure expedition pressure strategies"
```

---

## G4 Exit Criteria

- Heat and Exposure are distinct from controversy/fame and remain bounded.
- Obligations are voluntary run constraints and settle exactly once.
- Existing Brand Deal payouts still have one economic owner.
- Social posts can intentionally trade Heat/Exposure rather than only followers.
- Event Director only multiplies eligible event chance and respects conditions/cooldowns.
- Every severe authority event has a telegraphed and at least one expensive safe exit.
- Existing single active rival remains the run actor; history persists in `career`.
- Finale type is context-derived once and feeds the existing gig path.
- Simulator can compare Clean/High-Heat/Rival strategies and flag dominance.

---

# Meta Hub, Regions, Tour Types, Unlocks, and Ascension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Expedition career loop with short between-tour progression, mechanically distinct regions/tour archetypes, HQ facilities, discovery archive, persistent unlock sets, starter/legendary rule-changing perks, and modular Tour Pressure modifiers that broaden strategic options without turning permanent progression into runaway stat power.

**Architecture:** Capability unlocks remain in the existing unlock system (`unlockManager` + `state.unlocks`); `career` stores counters, rank, Tour Tokens, facility levels, archive/discovery, crew/rival progression, and Ascension state. Starter perks are selected through the existing `expedition.loadout.starterPerkId`; their effects are composed by the owning domain helpers rather than inspected inside reducers. Legendary finale rewards persist as direct namespaced unlock markers and never become large universal stat boosts. Band HQ gains one Expedition meta tab rather than a duplicate base-management scene. Region/tour definitions feed `TourPrep`, map generation, pressure/wear/reward profiles, and the simulator. `MapGenerator` gets optional node-type weights while preserving the current default branch exactly when no profile is supplied.

**Tech Stack:** React 19, TypeScript 6, existing Band HQ UI, current unlock manager/storage adapter, existing assets/map generator, reducer/action architecture, i18next, Node/Vitest/Playwright, balance simulator.

---

## Depends On

- G4 Pressure/Rivals/Contracts merged.
- Run Summary and `PREPARE_NEXT_EXPEDITION` lifecycle exist.
- Career save state exists.
- Existing unlock persistence and Band HQ remain stable.

## File Structure

**Create:**

- `src/types/meta.d.ts`
- `src/data/expedition/regions.ts` (extend baseline file from G1)
- `src/data/expedition/tourTypes.ts` (extend baseline file from G1)
- `src/data/expedition/pressureModifiers.ts`
- `src/data/expedition/unlockSets.ts`
- `src/data/expedition/starterPerks.ts`
- `src/domain/expedition/career.ts`
- `src/domain/expedition/regionProfile.ts`
- `src/domain/expedition/tourPressure.ts`
- `src/domain/expedition/archive.ts`
- `src/domain/expedition/starterPerks.ts`
- `src/ui/bandhq/ExpeditionMetaTab.tsx`
- `src/ui/expedition/CareerProgress.tsx`
- `src/ui/expedition/RegionPicker.tsx`
- `src/ui/expedition/TourTypePicker.tsx`
- `src/ui/expedition/PressureModifierPicker.tsx`
- `src/ui/expedition/TourArchive.tsx`
- `tests/node/expeditionCareer.test.js`
- `tests/node/expeditionRegionProfile.test.js`
- `tests/node/expeditionTourPressure.test.js`
- `tests/node/expeditionUnlockSets.test.js`
- `tests/node/expeditionStarterPerks.test.js`
- `tests/node/expeditionArchive.test.js`
- `tests/ui/ExpeditionMetaTab.test.tsx`
- `tests/ui/ExpeditionRegionPicker.test.tsx`
- `tests/ui/ExpeditionPressureModifierPicker.test.tsx`
- `tests/golden-path/expeditionMetaLoop.test.js`

**Modify:**

- `src/types/index.ts`
- `src/types/career.d.ts`
- `src/types/expedition.d.ts`
- `src/utils/mapGenerator.ts`
- `src/utils/mapGenerator/types.ts`
- `src/context/useMapGeneration.ts`
- `src/context/actionTypes.ts`
- `src/types/actions.d.ts`
- `src/context/careerActionCreators.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/reducers/careerReducer.ts`
- `src/context/reducers/careerSanitizers.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/useCareerDispatchActions.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/context/useGameDispatchActions.ts`
- `src/context/actionCreators.ts`
- `src/ui/bandhq/BandHQTabsList.tsx`
- `src/ui/bandhq/BandHQContentArea.tsx`
- `src/ui/expedition/TourPrepLoadout.tsx`
- `src/ui/expedition/RunSummaryCard.tsx`
- `src/scenes/RunSummary.tsx`
- `src/scenes/TourPrep.tsx`
- `src/hooks/postGig/handlers/continueHandlerUtils.ts`
- `src/utils/assetConfig.ts` only if HQ facility display needs existing chassis metadata; do not duplicate chassis prices
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `public/locales/en/unlocks.json`
- `public/locales/de/unlocks.json`
- `scripts/game-balance-simulation.mjs`
- `scripts/utils/balance-report-metadata.mjs`
- map/BandHQ/unlock/save tests

---

### Task 1: Add Career Counters and Explicit HQ Facility Levels

**Files:**
- Modify: `src/types/career.d.ts`
- Create: `src/types/meta.d.ts`
- Modify: `src/domain/expedition/defaults.ts`
- Modify: `src/context/reducers/careerSanitizers.ts`
- Test: `tests/node/expeditionCareer.test.js`
- Test: `tests/node/saveSliceRoundTrip.test.js`

- [ ] **Step 1: Write failing default/sanitizer tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { createDefaultCareerState } from '../../src/domain/expedition/defaults.ts'
import { sanitizeCareerState } from '../../src/context/reducers/careerSanitizers.ts'

test('career has bounded progression counters and six HQ facilities', () => {
  const career = createDefaultCareerState()
  assert.deepEqual(career.stats, {
    successfulExtractions: 0,
    finaleCompletions: 0,
    failedRuns: 0,
    regionsCompleted: {}
  })
  assert.deepEqual(career.hqFacilityLevels, {
    workshop: 0,
    rehearsal: 0,
    management: 0,
    garage: 0,
    blackMarket: 0,
    crewLounge: 0
  })
  assert.deepEqual(career.settledRunIds, [])
})

test('career sanitizer rejects hostile facility keys and negative counters', () => {
  const career = sanitizeCareerState({
    stats: { successfulExtractions: -5 },
    hqFacilityLevels: { workshop: 2, __proto__: 99 }
  })
  assert.equal(career.stats.successfulExtractions, 0)
  assert.equal(career.hqFacilityLevels.workshop, 2)
  assert.equal(Object.hasOwn(career.hqFacilityLevels, '__proto__'), false)
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCareer.test.js tests/node/saveSliceRoundTrip.test.js
```

Expected: FAIL because stats/facility schema is not complete.

- [ ] **Step 3: Add exact types**

`src/types/meta.d.ts`:

```ts
export type ExpeditionCareerRankId =
  | 'unknown'
  | 'local_noise'
  | 'underground_act'
  | 'rising_band'
  | 'touring_force'
  | 'headliner'
  | 'cult_legend'

export type HqFacilityId =
  | 'workshop'
  | 'rehearsal'
  | 'management'
  | 'garage'
  | 'blackMarket'
  | 'crewLounge'

export interface ExpeditionCareerStats {
  successfulExtractions: number
  finaleCompletions: number
  failedRuns: number
  regionsCompleted: Record<string, number>
}
```

Update `CareerState`:

```ts
rankId: ExpeditionCareerRankId
stats: ExpeditionCareerStats
hqFacilityLevels: Record<HqFacilityId, number>
settledRunIds: string[]
```

Default all counters/facilities to zero and `settledRunIds` to `[]`. Facility levels clamp to integer `0..3`; the sanitizer accepts only non-empty string run ids, deduplicates them, and keeps the newest 64.

- [ ] **Step 4: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCareer.test.js tests/node/saveSliceRoundTrip.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/meta.d.ts src/types/career.d.ts src/types/index.ts src/domain/expedition/defaults.ts src/context/reducers/careerSanitizers.ts tests/node/expeditionCareer.test.js tests/node/saveSliceRoundTrip.test.js
git commit -m "feat(expedition): add career stats and HQ facilities"
```

---

### Task 2: Define Rank Progression From Mixed Career Achievements

**Files:**
- Create: `src/domain/expedition/career.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Test: `tests/node/expeditionCareer.test.js`

- [ ] **Step 1: Add failing rank tests**

```js
import {
  calculateCareerRank,
  getRunCareerReward
} from '../../src/domain/expedition/career.ts'

test('rank cannot be farmed from fame alone', () => {
  assert.equal(calculateCareerRank({
    successfulExtractions: 0,
    finaleCompletions: 0,
    failedRuns: 0,
    regionsCompleted: {},
    rivalMilestones: 0
  }), 'unknown')
})

test('mixed accomplishments advance rank', () => {
  assert.equal(calculateCareerRank({
    successfulExtractions: 3,
    finaleCompletions: 1,
    failedRuns: 2,
    regionsCompleted: { home: 1 },
    rivalMilestones: 0
  }), 'local_noise')
  assert.equal(calculateCareerRank({
    successfulExtractions: 12,
    finaleCompletions: 6,
    failedRuns: 4,
    regionsCompleted: { home: 2, industrial: 2, festival: 2 },
    rivalMilestones: 2
  }), 'touring_force')
})

test('run career reward favors completion but gives extraction progress', () => {
  assert.deepEqual(getRunCareerReward('extracted'), { tourTokens: 1 })
  assert.deepEqual(getRunCareerReward('completed'), { tourTokens: 3 })
  assert.deepEqual(getRunCareerReward('failed'), { tourTokens: 0 })
})
```

- [ ] **Step 2: Implement exact rank thresholds**

Use ordered requirements:

```ts
const RANK_REQUIREMENTS = [
  { id: 'cult_legend', extractions: 30, finales: 20, regions: 4, rivals: 4 },
  { id: 'headliner', extractions: 24, finales: 14, regions: 4, rivals: 3 },
  { id: 'touring_force', extractions: 12, finales: 6, regions: 3, rivals: 2 },
  { id: 'rising_band', extractions: 8, finales: 3, regions: 2, rivals: 1 },
  { id: 'underground_act', extractions: 5, finales: 2, regions: 1, rivals: 0 },
  { id: 'local_noise', extractions: 3, finales: 1, regions: 1, rivals: 0 }
] as const
```

A region counts when `regionsCompleted[id] > 0`. Rival milestones count persistent rivals at `rival`/`nemesis`/`respect`/`alliance` with encounterCount `>=3`.

- [ ] **Step 3: Add `RECORD_EXPEDITION_CAREER_RESULT` action**

Payload is derived from `expedition.outcome` and current region:

```ts
export interface RecordExpeditionCareerResultPayload {
  outcome: 'extracted' | 'completed' | 'failed'
  regionId: string
  tourTokens: number
  nextRankId: ExpeditionCareerRankId
}
```

Reducer increments one matching counter, region completion only for `completed`, adds Tour Tokens, and sets calculated rank. Replay is prevented by adding `careerResultRecorded: boolean` to `ExpeditionOutcome` or a top-level settlement marker; reuse the same idempotence pattern as Extraction.

- [ ] **Step 4: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCareer.test.js tests/node/expeditionReducer.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/expedition/career.ts src/context/careerActionCreators.ts src/context/reducers/careerReducer.ts src/types/actions.d.ts src/types/expedition.d.ts tests/node/expeditionCareer.test.js tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): record career progression"
```

---

### Task 3: Persist Unlock Sets Crash-Safely Through One Journaled Marker

**Files:**
- Create: `src/data/expedition/unlockSets.ts`
- Modify: `src/types/career.d.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/useGameDispatchActions.ts`
- Modify: `src/context/actionCreators.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/useCareerDispatchActions.ts`
- Modify: `src/context/usePersistence.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Modify: `src/context/reducers/careerSanitizers.ts`
- Test: `tests/node/expeditionUnlockSets.test.js`
- Test: `tests/context/usePersistence.test.tsx`
- Test: `tests/node/unlockManager.test.js`, `tests/utils/unlockManager.test.ts`, `tests/security/unlocksValidation.test.js`

The existing unlock storage writes one marker at a time. Do **not** persist every capability in a set independently: a mid-loop storage failure would grant a partially free set. Persist exactly one `expedition.set.*` marker per purchased set and derive its capabilities in pure code.

- [ ] **Step 1: Add failing unlock-set and capability tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXPEDITION_UNLOCK_SETS,
  isExpeditionCapabilityUnlocked
} from '../../src/data/expedition/unlockSets.ts'

test('every unlock set owns one namespaced marker', () => {
  const markers = EXPEDITION_UNLOCK_SETS.map(set => set.unlockId)
  assert.ok(markers.every(id => id.startsWith('expedition.set.')))
  assert.equal(new Set(markers).size, markers.length)
})

test('a purchased set expands to its capabilities without extra storage markers', () => {
  assert.equal(
    isExpeditionCapabilityUnlocked(
      ['expedition.set.mechanic_network'],
      'expedition.region.industrial'
    ),
    true
  )
  assert.equal(
    isExpeditionCapabilityUnlocked([], 'expedition.region.industrial'),
    false
  )
})
```

- [ ] **Step 2: Define exact initial sets**

```ts
export const EXPEDITION_UNLOCK_SETS = Object.freeze([
  {
    id: 'mechanic_network',
    unlockId: 'expedition.set.mechanic_network',
    tokenCost: 4,
    requiredRank: 'local_noise',
    capabilityIds: [
      'expedition.region.industrial',
      'expedition.tour.survival',
      'expedition.perk.mechanic_kit'
    ]
  },
  {
    id: 'industry_network',
    unlockId: 'expedition.set.industry_network',
    tokenCost: 5,
    requiredRank: 'underground_act',
    capabilityIds: [
      'expedition.crew.crew_leyla_manager',
      'expedition.region.corporate',
      'expedition.tour.corporate',
      'expedition.perk.press_pass'
    ]
  },
  {
    id: 'underground_network',
    unlockId: 'expedition.set.underground_network',
    tokenCost: 5,
    requiredRank: 'underground_act',
    capabilityIds: [
      'expedition.crew.crew_saskia_security',
      'expedition.region.underground',
      'expedition.tour.underground',
      'expedition.perk.underground_contact'
    ]
  },
  {
    id: 'festival_network',
    unlockId: 'expedition.set.festival_network',
    tokenCost: 5,
    requiredRank: 'rising_band',
    capabilityIds: [
      'expedition.region.festival',
      'expedition.tour.blitz'
    ]
  },
  {
    id: 'rival_network',
    unlockId: 'expedition.set.rival_network',
    tokenCost: 6,
    requiredRank: 'touring_force',
    capabilityIds: ['expedition.tour.rival_hunt']
  }
] as const)
```

- [ ] **Step 3: Add one pure capability resolver**

```ts
export const isExpeditionCapabilityUnlocked = (
  unlocks: readonly string[],
  capabilityId: string
): boolean => {
  if (unlocks.includes(capabilityId)) return true
  return EXPEDITION_UNLOCK_SETS.some(
    set => unlocks.includes(set.unlockId) && set.capabilityIds.includes(capabilityId)
  )
}
```

G2/G3/G5 loadout availability uses this helper for Expedition capabilities. Baseline `home`, `standard`, and the four starter crew remain explicit always-available exceptions; do not add fake unlock markers for them.

- [ ] **Step 4: Add a recoverable Begin/Complete/Rollback purchase transaction**

Extend `CareerState`:

```ts
pendingUnlockSetPurchase: {
  setId: string
  unlockId: string
  tokenCost: number
} | null
```

Add typed actions:

```ts
BEGIN_EXPEDITION_UNLOCK_SET_PURCHASE
COMPLETE_EXPEDITION_UNLOCK_SET_PURCHASE
ROLLBACK_EXPEDITION_UNLOCK_SET_PURCHASE
```

The reducer behavior is:

```ts
// BEGIN: revalidate canonical set, rank, tokens, and not already unlocked;
// subtract exact canonical token cost and store pending transaction.
// COMPLETE: clear pending only when setId/unlockId match pending.
// ROLLBACK: restore pending.tokenCost exactly once, then clear pending.
```

The sanitizer validates `setId` against `EXPEDITION_UNLOCK_SETS`, recomputes `unlockId`/`tokenCost` from the registry, and never trusts persisted cost values. Direct reducer tests cover replayed BEGIN/COMPLETE/ROLLBACK and prove that only one transition changes the token balance.

- [ ] **Step 5: Persist the debited pending state before writing the unlock marker**

The transaction spans the main save key and `unlockManager`'s separate marker key, so ordering is part of correctness. Extend `usePersistence.saveGame` to return a synchronous result instead of `void`:

```ts
export type SaveWriteResult = 'persistent' | 'session' | 'failed'

const saveGame = useCallback(
  (
    showToast = true,
    stateSnapshot: GameState = stateRef.current
  ): SaveWriteResult => {
    const saveData = createPersistedState(stateSnapshot, clock)

    const success = safeStorageOperation(
      'saveGame',
      () => {
        let hadNonFinite = false
        const nonFiniteKeys = new Set<string>()
        const serialized = JSON.stringify(saveData, (key, value) => {
          if (typeof value === 'number' && !Number.isFinite(value)) {
            hadNonFinite = true
            if (key) nonFiniteKeys.add(key)
            return null
          }
          return value
        })
        if (hadNonFinite) {
          logger.warn(
            'Persistence',
            `Non-finite numeric value detected while saving (keys: ${Array.from(nonFiniteKeys).join(', ')}); coerced to null`
          )
        }
        return writeStorageItem(SAVE_KEY, serialized, storage)
      },
      false
    )

    if (success) {
      if (showToast) addToast(tRef.current('ui:toast.gameSaved'), 'success')
      logger.info('System', 'Game Saved Successfully', null)
      return 'persistent'
    }
    if (isStorageDegraded(storage)) {
      notifyStorageDegraded()
      logger.warn('System', 'Game saved to in-memory fallback store')
      return 'session'
    }
    handleError(new StorageError('Failed to save game'), { addToast })
    return 'failed'
  },
  [addToast, clock, notifyStorageDegraded, stateRef, storage, tRef]
)
```

The code above preserves the existing non-finite serialization guard, logging, success toast, degraded-storage notice, and error path; the only semantic change is the explicit return value. `session` is acceptable because the same storage adapter buffers both save and unlock marker for the current session. A hard `failed` result must not be followed by an unlock-marker write.

`useCareerDispatchActions` uses a post-commit effect, not same-tick dispatch chaining:

```ts
const settlementAfterPendingClearsRef = useRef<'complete' | 'rollback' | null>(null)

useEffect(() => {
  const pending = state.career.pendingUnlockSetPurchase

  if (!pending) {
    if (settlementAfterPendingClearsRef.current) {
      settlementAfterPendingClearsRef.current = null
      saveGame(false) // COMPLETE/ROLLBACK is now committed; persist final balance
    }
    return
  }

  // BEGIN has already committed here: persist the debited balance + pending journal first.
  const debitSave = saveGame(false)
  if (debitSave === 'failed') {
    settlementAfterPendingClearsRef.current = 'rollback'
    dispatch(createRollbackExpeditionUnlockSetPurchaseAction(pending.setId))
    return
  }

  const markerAlreadyExists = getUnlocks(storage).includes(pending.unlockId)
  const markerOk = markerAlreadyExists || addUnlock(pending.unlockId, storage)
  if (!markerOk) {
    settlementAfterPendingClearsRef.current = 'rollback'
    dispatch(createRollbackExpeditionUnlockSetPurchaseAction(pending.setId))
    return
  }

  if (!state.unlocks.includes(pending.unlockId)) {
    dispatch(createAddUnlockAction(pending.unlockId))
  }
  settlementAfterPendingClearsRef.current = 'complete'
  dispatch(createCompleteExpeditionUnlockSetPurchaseAction(pending.setId))
}, [dispatch, saveGame, state.career.pendingUnlockSetPurchase, state.unlocks, storage])
```

The UI purchase callback only dispatches `BEGIN`. The effect runs after that state is committed, creating a durable barrier before `addUnlock` can write its separate marker. Recovery rules are now explicit:

```text
crash before BEGIN save       -> old tokens, no marker
crash after BEGIN save        -> debited pending save; reload retries marker
crash after marker write      -> debited pending save + marker; reload detects marker and completes
marker write fails            -> rollback restores exact tokenCost; final rollback state is saved
COMPLETE/ROLLBACK rerender     -> final token balance is persisted once pending clears
```

This ordering prevents the previous free-unlock window where a marker could survive while the token debit existed only in React state.

- [ ] **Step 6: Run unlock/storage/failure tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionUnlockSets.test.js \
  tests/node/unlockManager.test.js \
  tests/security/unlocksValidation.test.js
pnpm exec vitest run tests/context/usePersistence.test.tsx
pnpm run typecheck:core
```

Test these failure cases explicitly: hard save failure before marker -> marker is never written and tokens are restored; reload with persisted pending but no marker -> marker is written then transaction completes; reload with pending + marker already written -> transaction completes without charging again; crash-model test proves the debited pending snapshot is written before `addUnlock`; duplicate click -> only one BEGIN changes tokens.

- [ ] **Step 7: Commit**

```bash
git add src/data/expedition/unlockSets.ts src/types/career.d.ts src/context/actionTypes.ts src/types/actions.d.ts src/context/useGameDispatchActions.ts src/context/usePersistence.ts src/context/actionCreators.ts src/context/careerActionCreators.ts src/context/useCareerDispatchActions.ts src/context/reducers/careerReducer.ts src/context/reducers/careerSanitizers.ts tests/context/usePersistence.test.tsx tests/node/expeditionUnlockSets.test.js tests/node/unlockManager.test.js tests/security/unlocksValidation.test.js
git commit -m "feat(expedition): journal unlock set purchases"
```

---

### Task 4: Add Starter Perks and Deterministic Legendary Finale Unlocks

**Files:**
- Create: `src/data/expedition/starterPerks.ts`
- Create: `src/domain/expedition/starterPerks.ts`
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/loadout.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/domain/expedition/condition.ts`
- Modify: `src/domain/expedition/repairs.ts`
- Modify: `src/domain/expedition/nodeIntel.ts`
- Modify: `src/domain/expedition/pressure.ts`
- Modify: `src/domain/expedition/contracts.ts`
- Modify: `src/domain/expedition/pressureDirector.ts`
- Modify: `src/domain/expedition/extraction.ts`
- Modify: `src/ui/expedition/TourPrepLoadout.tsx`
- Modify: `src/scenes/RunSummary.tsx`
- Modify: `public/locales/en/ui.json`
- Modify: `public/locales/de/ui.json`
- Modify: `public/locales/en/unlocks.json`
- Modify: `public/locales/de/unlocks.json`
- Test: `tests/node/expeditionStarterPerks.test.js`
- Test: `tests/node/expeditionLoadout.test.js`
- Test: `tests/node/expeditionExtraction.test.js`
- Test: `tests/ui/TourPrep.test.tsx`
- Test: `tests/ui/RunSummary.test.tsx`

Starter perks are optional build-defining rules selected before the run. They must not add another progression currency or a second perk-state store. Legendary perks are unlocked only by successful context-sensitive finales and are persisted through the existing `addPersistentUnlock` boundary.

- [ ] **Step 1: Write failing registry/profile tests**

`tests/node/expeditionStarterPerks.test.js`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  STARTER_PERKS,
  getStarterPerkDefinition,
  getLegendaryUnlockForFinale
} from '../../src/data/expedition/starterPerks.ts'
import { getStarterPerkProfile } from '../../src/domain/expedition/starterPerks.ts'

test('starter perks are rule-changing and namespaced', () => {
  for (const perk of Object.values(STARTER_PERKS)) {
    assert.ok(perk.unlockId.startsWith('expedition.'))
    assert.equal(getStarterPerkDefinition(perk.id), perk)
  }
  assert.equal(STARTER_PERKS.mechanic_kit.flatStatBonus, undefined)
})

test('mechanic kit trades an unlock for safer repair economy', () => {
  assert.deepEqual(getStarterPerkProfile('mechanic_kit'), {
    startingSpareParts: 1,
    startingHeat: 0,
    repairCostMultiplier: 0.9,
    nodeIntelFloor: 0,
    exposureGainMultiplier: 1,
    authorityEventWeightMultiplier: 1,
    contractPenaltyMultiplier: 1,
    contractRewardMultiplier: 1,
    rivalEventWeightMultiplier: 1,
    rivalRewardMultiplier: 1,
    technicalWearMultiplier: 1,
    rareRewardMultiplier: 1,
    finaleRewardMultiplier: 1
  })
})

test('every context-sensitive finale maps to exactly one legendary unlock', () => {
  assert.equal(getLegendaryUnlockForFinale('regional_headliner'), 'expedition.perk.legendary.headliner_pass')
  assert.equal(getLegendaryUnlockForFinale('corporate_showcase'), 'expedition.perk.legendary.the_fixer')
  assert.equal(getLegendaryUnlockForFinale('rival_battle'), 'expedition.perk.legendary.nemesis_dossier')
  assert.equal(getLegendaryUnlockForFinale('illegal_show'), 'expedition.perk.legendary.ghost_route')
  assert.equal(getLegendaryUnlockForFinale('disaster_gig'), 'expedition.perk.legendary.disaster_artist')
})
```

- [ ] **Step 2: Run the tests and verify the new modules are missing**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionStarterPerks.test.js
```

Expected: FAIL because the starter-perk registry/profile modules do not exist.

- [ ] **Step 3: Create the exact starter/legendary registry**

`src/data/expedition/starterPerks.ts`:

```ts
import type { ExpeditionFinaleType } from '../../types/expedition'

export const STARTER_PERKS = Object.freeze({
  mechanic_kit: Object.freeze({
    id: 'mechanic_kit',
    unlockId: 'expedition.perk.mechanic_kit',
    nameKey: 'unlocks:expedition.perks.mechanicKit.name',
    descriptionKey: 'unlocks:expedition.perks.mechanicKit.description'
  }),
  press_pass: Object.freeze({
    id: 'press_pass',
    unlockId: 'expedition.perk.press_pass',
    nameKey: 'unlocks:expedition.perks.pressPass.name',
    descriptionKey: 'unlocks:expedition.perks.pressPass.description'
  }),
  underground_contact: Object.freeze({
    id: 'underground_contact',
    unlockId: 'expedition.perk.underground_contact',
    nameKey: 'unlocks:expedition.perks.undergroundContact.name',
    descriptionKey: 'unlocks:expedition.perks.undergroundContact.description'
  }),
  headliner_pass: Object.freeze({
    id: 'headliner_pass',
    unlockId: 'expedition.perk.legendary.headliner_pass',
    nameKey: 'unlocks:expedition.perks.headlinerPass.name',
    descriptionKey: 'unlocks:expedition.perks.headlinerPass.description'
  }),
  the_fixer: Object.freeze({
    id: 'the_fixer',
    unlockId: 'expedition.perk.legendary.the_fixer',
    nameKey: 'unlocks:expedition.perks.theFixer.name',
    descriptionKey: 'unlocks:expedition.perks.theFixer.description'
  }),
  nemesis_dossier: Object.freeze({
    id: 'nemesis_dossier',
    unlockId: 'expedition.perk.legendary.nemesis_dossier',
    nameKey: 'unlocks:expedition.perks.nemesisDossier.name',
    descriptionKey: 'unlocks:expedition.perks.nemesisDossier.description'
  }),
  ghost_route: Object.freeze({
    id: 'ghost_route',
    unlockId: 'expedition.perk.legendary.ghost_route',
    nameKey: 'unlocks:expedition.perks.ghostRoute.name',
    descriptionKey: 'unlocks:expedition.perks.ghostRoute.description'
  }),
  disaster_artist: Object.freeze({
    id: 'disaster_artist',
    unlockId: 'expedition.perk.legendary.disaster_artist',
    nameKey: 'unlocks:expedition.perks.disasterArtist.name',
    descriptionKey: 'unlocks:expedition.perks.disasterArtist.description'
  })
} as const)

export type StarterPerkId = keyof typeof STARTER_PERKS

export const getStarterPerkDefinition = (id: string) =>
  Object.hasOwn(STARTER_PERKS, id) ? STARTER_PERKS[id as StarterPerkId] : null

const LEGENDARY_FINALE_UNLOCKS: Readonly<Record<ExpeditionFinaleType, string>> = Object.freeze({
  regional_headliner: STARTER_PERKS.headliner_pass.unlockId,
  corporate_showcase: STARTER_PERKS.the_fixer.unlockId,
  rival_battle: STARTER_PERKS.nemesis_dossier.unlockId,
  illegal_show: STARTER_PERKS.ghost_route.unlockId,
  disaster_gig: STARTER_PERKS.disaster_artist.unlockId
})

export const getLegendaryUnlockForFinale = (finaleType: ExpeditionFinaleType): string =>
  LEGENDARY_FINALE_UNLOCKS[finaleType]
```

- [ ] **Step 4: Add one pure composed perk profile**

`src/domain/expedition/starterPerks.ts`:

```ts
import { getStarterPerkDefinition } from '../../data/expedition/starterPerks'

export interface StarterPerkProfile {
  startingSpareParts: number
  startingHeat: number
  repairCostMultiplier: number
  nodeIntelFloor: 0 | 1 | 2
  exposureGainMultiplier: number
  authorityEventWeightMultiplier: number
  contractPenaltyMultiplier: number
  contractRewardMultiplier: number
  rivalEventWeightMultiplier: number
  rivalRewardMultiplier: number
  technicalWearMultiplier: number
  rareRewardMultiplier: number
  finaleRewardMultiplier: number
}

const BASE: StarterPerkProfile = Object.freeze({
  startingSpareParts: 0,
  startingHeat: 0,
  repairCostMultiplier: 1,
  nodeIntelFloor: 0,
  exposureGainMultiplier: 1,
  authorityEventWeightMultiplier: 1,
  contractPenaltyMultiplier: 1,
  contractRewardMultiplier: 1,
  rivalEventWeightMultiplier: 1,
  rivalRewardMultiplier: 1,
  technicalWearMultiplier: 1,
  rareRewardMultiplier: 1,
  finaleRewardMultiplier: 1
})

const PROFILES: Readonly<Record<string, Partial<StarterPerkProfile>>> = Object.freeze({
  mechanic_kit: { startingSpareParts: 1, repairCostMultiplier: 0.9 },
  press_pass: { nodeIntelFloor: 1, exposureGainMultiplier: 1.1 },
  underground_contact: { startingHeat: 15, rareRewardMultiplier: 1.15 },
  headliner_pass: { finaleRewardMultiplier: 1.15, exposureGainMultiplier: 1.15 },
  the_fixer: { contractPenaltyMultiplier: 0.5, contractRewardMultiplier: 0.9 },
  nemesis_dossier: { rivalEventWeightMultiplier: 1.25, rivalRewardMultiplier: 1.2 },
  ghost_route: { authorityEventWeightMultiplier: 0.5, startingHeat: 10 },
  disaster_artist: { technicalWearMultiplier: 1.15, rareRewardMultiplier: 1.25 }
})

export const getStarterPerkProfile = (id: string | null): StarterPerkProfile => {
  if (!id || !getStarterPerkDefinition(id)) return { ...BASE }
  return { ...BASE, ...PROFILES[id] }
}
```

The stronger profiles intentionally include a cost or pressure trade-off: `press_pass` and `headliner_pass` increase Exposure gain, `the_fixer` sacrifices contract payout, `ghost_route` starts hot, and `disaster_artist` increases technical wear. Do not turn these into permanent raw player-stat increases.

- [ ] **Step 5: Enforce unlock ownership in the canonical loadout validator**

In `validateExpeditionLoadout`:

```ts
const perk = candidate.starterPerkId
  ? getStarterPerkDefinition(candidate.starterPerkId)
  : null

if (candidate.starterPerkId && !perk) {
  return { valid: false, reason: 'invalid_starter_perk' }
}
if (perk && !isExpeditionCapabilityUnlocked(state.unlocks, perk.unlockId)) {
  return { valid: false, reason: 'locked_starter_perk' }
}
```

`null` stays valid for every player. Legendary perk markers are direct `state.unlocks` entries, so the same capability resolver handles both purchased-set capabilities and directly earned legendary markers.

Add sanitizer coverage so an unknown persisted `starterPerkId` becomes `null`; never coerce arbitrary values to strings.

- [ ] **Step 6: Materialize only one-time starting effects at `START_EXPEDITION`**

The reducer may materialize only stateful starting resources; multiplier effects stay pure and are recomputed by their owning helpers:

```ts
const perkProfile = getStarterPerkProfile(payload.loadout.starterPerkId)
const cargo = {
  ...payload.loadout.cargo,
  spareParts: payload.loadout.cargo.spareParts + perkProfile.startingSpareParts
}
const heat = clampExpeditionHeat(perkProfile.startingHeat)
```

Validate cargo capacity **after** starter perk expansion. If `mechanic_kit` would exceed the selected chassis capacity, `validateExpeditionLoadout` must reject the loadout instead of silently dropping the bonus part.

- [ ] **Step 7: Compose perk effects at the existing owning helpers**

Use `getStarterPerkProfile(state.expedition.loadout.starterPerkId)` at these seams only:

```text
repairs.ts              repairCost *= repairCostMultiplier
nodeIntel.ts             intel = max(intel, nodeIntelFloor)
pressure.ts              positive Exposure deltas *= exposureGainMultiplier
contracts.ts             rewards *= contractRewardMultiplier; penalties *= contractPenaltyMultiplier
pressureDirector.ts      authority/rival tag weights *= their corresponding multipliers
condition.ts             technical (not vehicle road) wear *= technicalWearMultiplier
extraction.ts/finale     finale secured reward *= finaleRewardMultiplier; rare roll weight *= rareRewardMultiplier
rival reward resolver    rival reward *= rivalRewardMultiplier
```

Do not put perk-id conditionals in reducers and do not apply the same multiplier in both the event producer and reducer.

- [ ] **Step 8: Unlock one deterministic legendary perk only after a successful finale**

Use the already-resolved `expedition.finaleType`; do not reroll the reward:

```ts
const legendaryUnlockId = outcome.kind === 'completed' && expedition.finaleType
  ? getLegendaryUnlockForFinale(expedition.finaleType)
  : null
```

In `RunSummary`, integrate this into the existing idempotent career-settlement path:

```ts
if (legendaryUnlockId && !state.unlocks.includes(legendaryUnlockId)) {
  const persisted = addPersistentUnlock(legendaryUnlockId)
  if (!persisted) return // surface retry; do not settle this run yet
}
recordExpeditionCareerResult(outcome)
```

Because `addPersistentUnlock` treats an already stored marker as success and the career settlement has its own bounded `settledRunIds`, rerender/reload cannot duplicate the legendary reward or double-award Tour Tokens. Failure and voluntary extraction never award a legendary finale marker.

- [ ] **Step 9: Add Tour Prep and Run Summary UX**

`TourPrepLoadout` renders only `null` plus starter perks whose `unlockId` passes `isExpeditionCapabilityUnlocked`. Each option displays its upside **and** its cost/pressure trade-off:

```tsx
const availableStarterPerks = Object.values(STARTER_PERKS).filter(perk =>
  isExpeditionCapabilityUnlocked(unlocks, perk.unlockId)
)

<StarterPerkPicker
  value={draft.starterPerkId}
  options={availableStarterPerks}
  onChange={starterPerkId => updateDraft({ starterPerkId })}
/>
```

`RunSummary` displays the newly earned legendary perk exactly once when the marker was not already owned; subsequent summaries may show it as already owned but must not present another unlock animation:

```tsx
{newLegendaryUnlockId ? (
  <LegendaryUnlockNotice unlockId={newLegendaryUnlockId} />
) : null}
```

Update matching English and German locale keys in the same commit.

- [ ] **Step 10: Run focused starter/legendary tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionStarterPerks.test.js \
  tests/node/expeditionLoadout.test.js \
  tests/node/expeditionExtraction.test.js
pnpm exec vitest run tests/ui/TourPrep.test.tsx tests/ui/RunSummary.test.tsx
pnpm run typecheck:core
```

Expected: PASS, including locked-perk rejection, cargo overflow rejection, deterministic finale mapping, storage-failure retry, and rerender idempotence.

- [ ] **Step 11: Commit**

```bash
git add src/data/expedition/starterPerks.ts src/domain/expedition/starterPerks.ts src/types/expedition.d.ts src/domain/expedition/loadout.ts src/context/reducers/expeditionReducer.ts src/context/reducers/expeditionSanitizers.ts src/domain/expedition/condition.ts src/domain/expedition/repairs.ts src/domain/expedition/nodeIntel.ts src/domain/expedition/pressure.ts src/domain/expedition/contracts.ts src/domain/expedition/pressureDirector.ts src/domain/expedition/extraction.ts src/ui/expedition/TourPrepLoadout.tsx src/scenes/RunSummary.tsx public/locales/en/ui.json public/locales/de/ui.json public/locales/en/unlocks.json public/locales/de/unlocks.json tests/node/expeditionStarterPerks.test.js tests/node/expeditionLoadout.test.js tests/node/expeditionExtraction.test.js tests/ui/TourPrep.test.tsx tests/ui/RunSummary.test.tsx
git commit -m "feat(expedition): add starter and legendary perks"
```

---

### Task 5: Define Mechanically Distinct Region Profiles

**Files:**
- Create/Modify: `src/data/expedition/regions.ts`
- Create: `src/domain/expedition/regionProfile.ts`
- Test: `tests/node/expeditionRegionProfile.test.js`

- [ ] **Step 1: Write failing profile tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { REGIONS } from '../../src/data/expedition/regions.ts'

test('regions differ mechanically, not only by labels', () => {
  assert.equal(REGIONS.home.roadWearMultiplier, 1)
  assert.equal(REGIONS.industrial.roadWearMultiplier, 1.25)
  assert.equal(REGIONS.festival.technicalWearMultiplier, 1.2)
  assert.equal(REGIONS.corporate.contractRewardMultiplier, 1.2)
  assert.equal(REGIONS.underground.heatGainMultiplier, 1.3)
})
```

- [ ] **Step 2: Add exact profiles**

```ts
export interface ExpeditionRegionDefinition {
  id: string
  nameKey: string
  unlockId: string | null
  nodeTypeWeights: { rest: number; supply: number; special: number }
  roadWearMultiplier: number
  technicalWearMultiplier: number
  repairCostMultiplier: number
  gigRewardMultiplier: number
  contractRewardMultiplier: number
  heatGainMultiplier: number
  rareRewardMultiplier: number
}
```

Definitions:

```ts
home: {
  nodeTypeWeights: { rest: 0.10, supply: 0.10, special: 0.10 },
  roadWearMultiplier: 1,
  technicalWearMultiplier: 1,
  repairCostMultiplier: 1,
  gigRewardMultiplier: 1,
  contractRewardMultiplier: 1,
  heatGainMultiplier: 1,
  rareRewardMultiplier: 1
}
industrial: {
  nodeTypeWeights: { rest: 0.10, supply: 0.20, special: 0.15 },
  roadWearMultiplier: 1.25,
  technicalWearMultiplier: 1,
  repairCostMultiplier: 0.8,
  gigRewardMultiplier: 1,
  contractRewardMultiplier: 1,
  heatGainMultiplier: 1,
  rareRewardMultiplier: 1.05
}
festival: {
  nodeTypeWeights: { rest: 0.08, supply: 0.07, special: 0.10 },
  roadWearMultiplier: 1,
  technicalWearMultiplier: 1.2,
  repairCostMultiplier: 1.1,
  gigRewardMultiplier: 1.15,
  contractRewardMultiplier: 1.05,
  heatGainMultiplier: 1.05,
  rareRewardMultiplier: 1.1
}
corporate: {
  nodeTypeWeights: { rest: 0.15, supply: 0.10, special: 0.10 },
  roadWearMultiplier: 1,
  technicalWearMultiplier: 0.95,
  repairCostMultiplier: 1.1,
  gigRewardMultiplier: 1.05,
  contractRewardMultiplier: 1.2,
  heatGainMultiplier: 1.25,
  rareRewardMultiplier: 1
}
underground: {
  nodeTypeWeights: { rest: 0.08, supply: 0.08, special: 0.24 },
  roadWearMultiplier: 1.1,
  technicalWearMultiplier: 1.1,
  repairCostMultiplier: 1.15,
  gigRewardMultiplier: 1.1,
  contractRewardMultiplier: 0.9,
  heatGainMultiplier: 1.3,
  rareRewardMultiplier: 1.25
}
```

`home` is always available; other regions require their `unlockId` in `state.unlocks`.

- [ ] **Step 3: Add pure combined-region helpers**

Implement the helper boundary in `src/domain/expedition/regionProfile.ts`; callers pass only the persisted region id plus the canonical `state.unlocks` string list. Persisted multiplier objects are never accepted:

```ts
import { REGIONS } from '../../data/expedition/regions'
import type { ExpeditionRegionDefinition } from '../../data/expedition/regions'

export const getRegionDefinition = (
  id: unknown
): ExpeditionRegionDefinition => {
  if (typeof id !== 'string' || !Object.hasOwn(REGIONS, id)) {
    return REGIONS.home
  }
  return REGIONS[id as keyof typeof REGIONS]
}

export const getAvailableRegions = (
  unlocks: readonly string[]
): ExpeditionRegionDefinition[] => {
  const owned = new Set(unlocks.filter((id): id is string => typeof id === 'string'))
  return Object.values(REGIONS).filter(
    region => region.unlockId === null || owned.has(region.unlockId)
  )
}
```

Add assertions that `getRegionDefinition('__proto__')` and an unknown id both return the exact `home` definition, and that a region appears only after its namespaced unlock id is present.

- [ ] **Step 4: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionRegionProfile.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/expedition/regions.ts src/domain/expedition/regionProfile.ts tests/node/expeditionRegionProfile.test.js
git commit -m "feat(expedition): add mechanical region profiles"
```

---

### Task 6: Extend MapGenerator With Optional Region Node Weights While Preserving Default Maps

**Files:**
- Modify: `src/utils/mapGenerator/types.ts`
- Modify: `src/utils/mapGenerator.ts`
- Modify: `src/context/useMapGeneration.ts`
- Test: `tests/node/mapGenerator.test.js`
- Test: `tests/node/expeditionRegionProfile.test.js`

- [ ] **Step 1: Add determinism/default-preservation tests**

Record one existing known seed/depth node-type snapshot before implementation. Add assertions:

```js
const legacy = new MapGenerator(12345).generateMap(8)
const explicitDefault = new MapGenerator(12345).generateMap(8, undefined)
assert.deepEqual(explicitDefault, legacy)

const industrialA = new MapGenerator(12345).generateMap(8, {
  nodeTypeWeights: { rest: 0.10, supply: 0.20, special: 0.15 }
})
const industrialB = new MapGenerator(12345).generateMap(8, {
  nodeTypeWeights: { rest: 0.10, supply: 0.20, special: 0.15 }
})
assert.deepEqual(industrialA, industrialB)
```

- [ ] **Step 2: Add exact generation option**

```ts
export interface MapGenerationOptions {
  nodeTypeWeights?: {
    rest: number
    supply: number
    special: number
  }
}
```

Change signature:

```ts
generateMap(depth: number = 10, options?: MapGenerationOptions): MapGeneratorState
```

Store/forward `options` only within this generation call; do not persist them on generator instance.

- [ ] **Step 3: Preserve the old `_rollNodeType` when options are absent**

```ts
_rollNodeType(venue: Venue, weights?: MapGenerationOptions['nodeTypeWeights']): GeneratedMapNode['type'] {
  const typeRoll = this.random()
  if (!weights) {
    let nodeType: GeneratedMapNode['type'] = 'GIG'
    if (typeRoll > 0.9) nodeType = 'SPECIAL'
    else if (typeRoll > 0.8) nodeType = 'SUPPLY_STOP'
    else if (typeRoll > 0.7) nodeType = 'REST_STOP'
    else if ((venue.capacity ?? 0) >= 1000) nodeType = 'FESTIVAL'
    return nodeType
  }
  const rest = Math.max(0, Math.min(0.5, weights.rest))
  const supply = Math.max(0, Math.min(0.5, weights.supply))
  const special = Math.max(0, Math.min(0.5, weights.special))
  const nonGig = rest + supply + special
  if (nonGig >= 0.8) throw new StateError('Expedition map node weights leave insufficient gig probability')
  if (typeRoll < special) return 'SPECIAL'
  if (typeRoll < special + supply) return 'SUPPLY_STOP'
  if (typeRoll < special + supply + rest) return 'REST_STOP'
  return (venue.capacity ?? 0) >= 1000 ? 'FESTIVAL' : 'GIG'
}
```

- [ ] **Step 4: Pass region profile from `useMapGeneration` only for active Expedition**

Resolve the canonical region definition only when the run is active, and preserve the existing generator call for `home`/legacy paths:

```ts
const isActiveExpedition = expedition.status === 'active'
const region = isActiveExpedition
  ? getRegionDefinition(expedition.loadout.regionId)
  : REGIONS.home

const generationOptions =
  isActiveExpedition && region.id !== 'home'
    ? { nodeTypeWeights: region.nodeTypeWeights }
    : undefined

const map = new MapGenerator(runSeed).generateMap(mapDepth, generationOptions)
```

The default branch therefore still calls `generateMap(depth, undefined)`, which Task 5's snapshot test pins to the pre-Expedition node mapping.

- [ ] **Step 5: Run map/fallback tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/mapGenerator.test.js tests/node/fallbackMap.test.js tests/node/expeditionRegionProfile.test.js
pnpm run typecheck:core
```

Expected: PASS; default snapshot unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/utils/mapGenerator src/context/useMapGeneration.ts tests/node/mapGenerator.test.js tests/node/expeditionRegionProfile.test.js
git commit -m "feat(expedition): vary map nodes by region"
```

---

### Task 7: Define Six Tour Archetypes With Explicit Run Profiles

**Files:**
- Modify: `src/data/expedition/tourTypes.ts`
- Modify: `src/domain/expedition/loadout.ts`
- Test: `tests/node/expeditionCareer.test.js`

- [ ] **Step 1: Add failing tour profile test**

```js
assert.deepEqual(
  Object.fromEntries(Object.entries(TOUR_TYPES).map(([id, v]) => [id, v.mapDepth])),
  {
    standard: 8,
    blitz: 6,
    underground: 8,
    corporate: 8,
    rival_hunt: 8,
    survival: 9
  }
)
```

- [ ] **Step 2: Define exact profile contract**

```ts
export interface TourTypeDefinition {
  id: string
  nameKey: string
  unlockId: string | null
  mapDepth: number
  extractionSteps: readonly number[]
  voluntaryRetentionRate: number
  failureRetentionRate: number
  completionMultiplier: number
  startingHeat: number
  allowedRegionIds: readonly string[] | null
  forcedRival: boolean
}
```

Exact initial values:

```text
standard: depth8, extraction[3,6], retention .70/.50, completion 1.35, heat0
blitz: depth6, extraction[2,4], retention .65/.45, completion 1.45, heat5
underground: depth8, extraction[3,6], retention .60/.40, completion 1.55, heat35, allowed underground
corporate: depth8, extraction[3,6], retention .75/.55, completion 1.35, heat0, allowed corporate
rival_hunt: depth8, extraction[3,6], retention .65/.45, completion 1.50, heat10, forcedRival true
survival: depth9, extraction[3,6], retention .60/.40, completion 1.60, heat0
```

- [ ] **Step 3: Availability uses `state.unlocks`**

Extend the G1 `TourTypeDefinition` in place and keep `TOUR_TYPES.standard` as the baseline object. Add pure availability/compatibility helpers to `src/domain/expedition/loadout.ts`:

```ts
export const getAvailableTourTypes = (
  unlocks: readonly string[]
): TourTypeDefinition[] => {
  const owned = new Set(unlocks.filter((id): id is string => typeof id === 'string'))
  return Object.values(TOUR_TYPES).filter(
    tour => tour.unlockId === null || owned.has(tour.unlockId)
  )
}

export const isTourRegionCompatible = (
  tour: TourTypeDefinition,
  regionId: string
): boolean =>
  tour.allowedRegionIds === null || tour.allowedRegionIds.includes(regionId)
```

`standard` uses `unlockId: null` and `allowedRegionIds: null`; every other tour uses a namespaced unlock id. `validateExpeditionLoadout` rejects a locked tour or a tour/region mismatch before `START_EXPEDITION`.

- [ ] **Step 4: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCareer.test.js tests/node/expeditionReducer.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/expedition/tourTypes.ts src/domain/expedition/loadout.ts tests/node/expeditionCareer.test.js tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): add tour archetypes"
```

---

### Task 8: Implement Modular Tour Pressure / Ascension Modifiers

**Files:**
- Create: `src/data/expedition/pressureModifiers.ts`
- Create: `src/domain/expedition/tourPressure.ts`
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/extraction.ts`
- Modify: `src/domain/expedition/condition.ts`
- Modify: `src/domain/expedition/crewStress.ts`
- Modify: `src/domain/expedition/pressure.ts`
- Modify: `src/domain/expedition/pressureDirector.ts`
- Test: `tests/node/expeditionTourPressure.test.js`
- Test: `tests/node/expeditionExtraction.test.js`
- Test: `tests/node/expeditionPressure.test.js`

- [ ] **Step 1: Write failing modifier tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { TOUR_PRESSURE_MODIFIERS } from '../../src/data/expedition/pressureModifiers.ts'
import { calculateTourPressureProfile } from '../../src/domain/expedition/tourPressure.ts'

test('three approved pressure modifiers add reward bonus linearly', () => {
  const result = calculateTourPressureProfile([
    'bad_roads', 'media_frenzy', 'hostile_territory'
  ])
  assert.equal(result.rewardMultiplier, 1.55)
  assert.equal(result.roadWearMultiplier, 1.3)
  assert.equal(result.exposureGainMultiplier, 2)
  assert.equal(result.rivalWeightMultiplier, 1.5)
})
```

- [ ] **Step 2: Add exact modifier definitions**

```ts
export const TOUR_PRESSURE_MODIFIERS = Object.freeze({
  bad_roads: {
    rewardBonus: 0.15,
    roadWearMultiplier: 1.3
  },
  media_frenzy: {
    rewardBonus: 0.20,
    exposureGainMultiplier: 2
  },
  no_safety_net: {
    rewardBonus: 0.25,
    extractionRetentionMultiplier: 0.75
  },
  union_trouble: {
    rewardBonus: 0.15,
    crewStressMultiplier: 1.25
  },
  hostile_territory: {
    rewardBonus: 0.20,
    rivalWeightMultiplier: 1.5
  }
} as const)
```

- [ ] **Step 3: Implement combined profile**

```ts
export interface TourPressureProfile {
  rewardMultiplier: number
  roadWearMultiplier: number
  exposureGainMultiplier: number
  extractionRetentionMultiplier: number
  crewStressMultiplier: number
  rivalWeightMultiplier: number
}

export const calculateTourPressureProfile = (
  ids: readonly string[]
): TourPressureProfile => {
  const unique = [...new Set(ids)]
  let rewardBonus = 0
  let roadWearMultiplier = 1
  let exposureGainMultiplier = 1
  let extractionRetentionMultiplier = 1
  let crewStressMultiplier = 1
  let rivalWeightMultiplier = 1
  for (const id of unique) {
    const mod = TOUR_PRESSURE_MODIFIERS[id as keyof typeof TOUR_PRESSURE_MODIFIERS]
    if (!mod) continue
    rewardBonus += mod.rewardBonus
    roadWearMultiplier *= mod.roadWearMultiplier ?? 1
    exposureGainMultiplier *= mod.exposureGainMultiplier ?? 1
    extractionRetentionMultiplier *= mod.extractionRetentionMultiplier ?? 1
    crewStressMultiplier *= mod.crewStressMultiplier ?? 1
    rivalWeightMultiplier *= mod.rivalWeightMultiplier ?? 1
  }
  return {
    rewardMultiplier: 1 + rewardBonus,
    roadWearMultiplier,
    exposureGainMultiplier,
    extractionRetentionMultiplier,
    crewStressMultiplier,
    rivalWeightMultiplier
  }
}
```

Limit selection to maximum three modifiers initially. Pressure modifiers are available only when `career.ascensionUnlocked === true`.

- [ ] **Step 4: Wire profile into existing helpers**

Add small composition helpers in `src/domain/expedition/tourPressure.ts` so the owning domains do not read modifier registries themselves:

```ts
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))

export const applyTourPressureRetention = (
  baseRate: number,
  profile: TourPressureProfile
): number => clamp01(baseRate * profile.extractionRetentionMultiplier)

export const applyTourPressureReward = (
  reward: number,
  profile: TourPressureProfile
): number => Math.max(0, reward) * profile.rewardMultiplier

export const applyTourPressureRoadWear = (
  wear: number,
  profile: TourPressureProfile
): number => Math.max(0, wear) * profile.roadWearMultiplier

export const applyTourPressureCrewStress = (
  delta: number,
  profile: TourPressureProfile
): number => delta > 0 ? delta * profile.crewStressMultiplier : delta

export const applyTourPressureExposureGain = (
  delta: number,
  profile: TourPressureProfile
): number => delta > 0 ? delta * profile.exposureGainMultiplier : delta
```

Then compose at the canonical owners:

```ts
// extraction.ts: apply before FINALIZE_EXPEDITION computes the secured amount.
const retention = applyTourPressureRetention(baseRetention, pressureProfile)

// condition.ts: compose after region/crew/vehicle base wear is known.
const roadWear = applyTourPressureRoadWear(baseRoadWear, pressureProfile)

// crewStress.ts: only positive stress gains are amplified.
const stressDelta = applyTourPressureCrewStress(baseStressDelta, pressureProfile)

// pressure.ts: only positive Exposure gain is amplified.
const exposureDelta = applyTourPressureExposureGain(baseExposureDelta, pressureProfile)
```

Pass `pressureProfile.rivalWeightMultiplier` into `getPressureEventChanceMultiplier` / the rival-tag branch in `pressureDirector.ts`. Apply `applyTourPressureReward` only to successful extraction/finale settlement; never multiply losses, refunds, failure retention, or already-paid Brand Deal payouts. Add one focused assertion for each composition seam.

- [ ] **Step 5: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionTourPressure.test.js tests/node/expeditionExtraction.test.js tests/node/expeditionPressure.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/expedition/pressureModifiers.ts src/domain/expedition/tourPressure.ts src/types/expedition.d.ts src/domain/expedition tests/node/expeditionTourPressure.test.js tests/node/expeditionExtraction.test.js tests/node/expeditionPressure.test.js
git commit -m "feat(expedition): add modular tour pressure"
```

---

### Task 9: Turn Band HQ Into the Expedition Meta Hub Without Removing Existing Tabs

**Files:**
- Create: `src/ui/bandhq/ExpeditionMetaTab.tsx`
- Create: `src/ui/expedition/CareerProgress.tsx`
- Create: `src/ui/expedition/TourArchive.tsx`
- Modify: `src/ui/bandhq/BandHQTabsList.tsx`
- Modify: `src/ui/bandhq/BandHQContentArea.tsx`
- Modify: `public/locales/en/ui.json`, `public/locales/de/ui.json`
- Test: `tests/ui/ExpeditionMetaTab.test.tsx`
- Test: `tests/ui/BandHQ.test.jsx`, `tests/node/useBandHQModal.test.js`, `tests/ui/bandhq/hooks/useBandHQLogic.test.jsx`

- [ ] **Step 1: Add failing Band HQ tests**

Assert a new tab id `EXPEDITION` exists, is never order-coupled to menu behavior, and renders:

```text
Career rank
Tour Tokens
HQ Facilities
Unlock Sets
Tour Archive
Rivals/Crew summary
```

Existing `SHOP`, `UPGRADES`, `SETLIST`, `BRAND_DEALS`, etc. remain functional.

- [ ] **Step 2: Add tab entry**

In `BandHQTabsList.tsx` add:

```ts
{ id: 'EXPEDITION', key: 'tabs.expedition' }
```

No index-based behavior; active tab remains string-id based.

- [ ] **Step 3: Add content branch**

Import the new tab into `src/ui/bandhq/BandHQContentArea.tsx`, select only the two required slices, and render by the existing string tab id:

```tsx
import { ExpeditionMetaTab } from './ExpeditionMetaTab.tsx'

const career = useGameSelector(state => state.career)
const unlocks = useGameSelector(state => state.unlocks)

// inside the existing Suspense panel
{currentTab === 'EXPEDITION' && (
  <ExpeditionMetaTab career={career} unlocks={unlocks} />
)}
```

`ExpeditionMetaTab` invokes the typed career/unlock dispatch hooks for facility purchases and unlock-set purchases; it must not write storage directly. Keep every existing `STATS`/`SHOP`/`UPGRADES`/`SETLIST`/`BRAND_DEALS`/`SETTINGS` branch untouched.

- [ ] **Step 4: Implement facility upgrades**

Facility levels 0..3 cost Tour Tokens:

```ts
export const HQ_FACILITY_TOKEN_COSTS = [2, 4, 7] as const
```

Facility effects are capability unlock gates, not big global stats:

```text
Workshop L1: mechanic unlock set available
Garage L1: chassis/tour type meta options visible
Management L1: industry unlock set available
Black Market L1: underground unlock set available
Crew Lounge L1: signature trait progression enabled
Rehearsal L1: future run-trait/song unlock set available
```

A facility purchase changes only `career.hqFacilityLevels` and eligibility; concrete capability ids still persist through `unlockManager`.

- [ ] **Step 5: Run Band HQ/i18n tests**

```bash
pnpm run test:ui
pnpm run test:additional
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/bandhq src/ui/expedition/CareerProgress.tsx src/ui/expedition/TourArchive.tsx public/locales tests/ui/ExpeditionMetaTab.test.tsx
git commit -m "feat(expedition): add Band HQ meta hub"
```

---

### Task 10: Implement Tour Archive as Discovery, Not Unlock Ownership

**Files:**
- Create: `src/domain/expedition/archive.ts`
- Modify: `src/types/career.d.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/useCareerDispatchActions.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Modify: `src/context/reducers/careerSanitizers.ts`
- Test: `tests/node/expeditionArchive.test.js`

- [ ] **Step 1: Add failing archive tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { addArchiveDiscovery } from '../../src/domain/expedition/archive.ts'

test('archive discovery deduplicates ids and does not imply unlock', () => {
  const archive = emptyArchive()
  const next = addArchiveDiscovery(archive, 'rivalIds', 'rival_123')
  const again = addArchiveDiscovery(next, 'rivalIds', 'rival_123')
  assert.deepEqual(again.rivalIds, ['rival_123'])
})
```

- [ ] **Step 2: Implement exact helper**

```ts
export const addArchiveDiscovery = <K extends keyof CareerArchive>(
  archive: CareerArchive,
  key: K,
  id: string
): CareerArchive => {
  if (typeof id !== 'string' || id.length === 0 || id === '__proto__') return archive
  const current = archive[key]
  if (current.includes(id)) return archive
  return { ...archive, [key]: [...current, id] }
}
```

- [ ] **Step 3: Add one typed discovery action and dispatch only from observation seams**

Add the action contract:

```ts
export const RECORD_EXPEDITION_ARCHIVE_DISCOVERY =
  'RECORD_EXPEDITION_ARCHIVE_DISCOVERY' as const

export interface RecordExpeditionArchiveDiscoveryPayload {
  key: keyof CareerArchive
  id: string
}

export const createRecordExpeditionArchiveDiscoveryAction = (
  payload: RecordExpeditionArchiveDiscoveryPayload
) => ({ type: RECORD_EXPEDITION_ARCHIVE_DISCOVERY, payload })
```

The reducer delegates to `addArchiveDiscovery`; the dispatcher exposes `recordArchiveDiscovery(key, id)`. Call it only when content was actually observed/used:

```ts
recordArchiveDiscovery('crewIds', selectedCrewId)       // run start
recordArchiveDiscovery('chassisIds', activeChassisId)  // run start
recordArchiveDiscovery('moduleIds', installedModuleId) // run start
recordArchiveDiscovery('rivalIds', rivalBand.id)       // encounter shown
recordArchiveDiscovery('sponsorIds', deal.id)          // offer shown
recordArchiveDiscovery('regionIds', region.id)         // Expedition start
recordArchiveDiscovery('finaleIds', finaleType)        // finale resolved
recordArchiveDiscovery('eventIds', event.id)           // special Expedition event shown
recordArchiveDiscovery('contrabandIds', item.id)       // item used/encountered
```

Use only keys that exist on the `CareerArchive` type defined in G1/G5; add the missing category there if one of the listed keys is not yet present. Do not populate the archive from registries on load.

- [ ] **Step 4: Run archive/save tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionArchive.test.js tests/node/saveSliceRoundTrip.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/expedition/archive.ts src/types/career.d.ts src/context/careerActionCreators.ts src/context/reducers/careerReducer.ts src/context/reducers/careerSanitizers.ts tests/node/expeditionArchive.test.js tests/node/saveSliceRoundTrip.test.js
git commit -m "feat(expedition): track Tour Archive discoveries"
```

---

### Task 11: Build Region, Tour Type, and Pressure Modifier Selection in Tour Prep

**Files:**
- Create: `src/ui/expedition/RegionPicker.tsx`
- Create: `src/ui/expedition/TourTypePicker.tsx`
- Create: `src/ui/expedition/PressureModifierPicker.tsx`
- Modify: `src/ui/expedition/TourPrepLoadout.tsx`
- Modify: `src/scenes/TourPrep.tsx`
- Modify: `public/locales/en/ui.json`, `public/locales/de/ui.json`, `public/locales/en/unlocks.json`, `public/locales/de/unlocks.json`
- Test: `tests/ui/ExpeditionRegionPicker.test.tsx`
- Test: `tests/ui/ExpeditionPressureModifierPicker.test.tsx`
- Test: `tests/ui/TourPrep.test.tsx`

- [ ] **Step 1: Add failing selection tests**

Pin the user-visible constraints instead of snapshotting markup:

```tsx
render(<TourPrepHarness unlocks={[]} ascensionUnlocked={false} />)
expect(screen.getByRole('button', { name: /home/i })).toBeEnabled()
expect(screen.getByRole('button', { name: /standard/i })).toBeEnabled()
expect(screen.queryByText(/reward multiplier/i)).not.toBeInTheDocument()

render(<TourPrepHarness
  unlocks={['expedition.region.corporate', 'expedition.tour.underground']}
  ascensionUnlocked={true}
/>)
fireEvent.click(screen.getByRole('button', { name: /corporate/i }))
fireEvent.click(screen.getByRole('button', { name: /underground/i }))
expect(screen.getByRole('button', { name: /start tour/i })).toBeDisabled()

for (const label of [/bad roads/i, /media frenzy/i, /hostile territory/i]) {
  fireEvent.click(screen.getByRole('checkbox', { name: label }))
}
expect(screen.getByText(/x1[.,]55/i)).toBeInTheDocument()
expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(3)
```

Also assert a fourth Pressure modifier cannot be selected and that locked region/tour cards use the same disabled-control convention as Band HQ.

- [ ] **Step 2: Implement pickers from canonical definitions**

Each picker receives canonical ids, not arbitrary definition objects, and resolves availability through domain helpers:

```ts
const regions = getAvailableRegions(unlocks)
const tours = getAvailableTourTypes(unlocks)
const pressure = career.ascensionUnlocked
  ? Object.values(TOUR_PRESSURE_MODIFIERS)
  : []

const startDecision = validateExpeditionLoadout({
  ...draftLoadout,
  regionId: selectedRegionId,
  tourTypeId: selectedTourTypeId,
  pressureModifierIds: selectedPressureIds
}, { unlocks, career })
```

The Start button is enabled only when `startDecision.ok === true`. Do not infer an unlock merely from career rank or discovery archive membership.

- [ ] **Step 3: Make Tour Prep display mechanical trade-offs**

For region/tour cards show only authored player-facing modifiers:

```text
Industrial: cheaper repairs, harsher roads, more Supply Stops
Festival: higher Gig payout, more technical wear, fewer Supply Stops
Corporate: better contract rewards, Heat escalates faster
Underground: more Special nodes, rare rewards, more Heat
```

Do not reveal exact hidden event odds.

- [ ] **Step 4: Run UI/i18n tests**

```bash
pnpm exec vitest run tests/ui/ExpeditionRegionPicker.test.tsx tests/ui/ExpeditionPressureModifierPicker.test.tsx tests/ui/TourPrep.test.tsx
pnpm run test:additional
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/expedition src/scenes/TourPrep.tsx public/locales tests/ui/ExpeditionRegionPicker.test.tsx tests/ui/ExpeditionPressureModifierPicker.test.tsx tests/ui/TourPrep.test.tsx
git commit -m "feat(expedition): select regions tours and pressure"
```

---

### Task 12: Make Run Summary the Short Between-Tour Progression Loop

**Files:**
- Modify: `src/scenes/RunSummary.tsx`
- Modify: `src/ui/expedition/RunSummaryCard.tsx`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Test: `tests/ui/RunSummary.test.tsx`
- Test: `tests/golden-path/expeditionMetaLoop.test.js`

- [ ] **Step 1: Add failing next-tour golden path**

Golden path:

```text
TourPrep -> active Expedition -> successful finale -> RunSummary
-> record career result once -> optional open Band HQ Expedition tab
-> PREPARE_NEXT_EXPEDITION -> new runSeed + idle/preparing Expedition
-> TourPrep with career/crew/rival/unlocks preserved and run-only state reset
```

Assert a repeated Render/Continue click cannot grant Tour Tokens twice.

- [ ] **Step 2: Record career result before presenting spendable progression**

Add an idempotent settlement action keyed by the finalized run id created in G1. `START_EXPEDITION` stamps `expedition.runId` with `getSafeUUID()`, the run slice persists it through save/reload, and `FINALIZE_EXPEDITION` preserves it. `RunSummary` must read that stored id; it must never generate a new id during settlement. Dispatch the career result once, then render the returned/persisted career delta. Add the explicit boundary imports to `careerActionCreators.ts` / `careerReducer.ts` rather than relying on ambient names:

```ts
import type { CareerState, GameAction, GameState } from '../types'
import { ActionTypes } from './actionTypes'
import { StateError } from '../utils/errors'
import { finiteNumberOr, isFiniteNumber } from '../utils/gameState'

export interface RecordExpeditionCareerResultPayload {
  runId: string
  outcome: 'extracted' | 'completed' | 'failed'
  regionId: string
  tourTokensEarned: number
}

export const createRecordExpeditionCareerResultAction = (
  state: GameState,
  tourTokensEarned: unknown
): Extract<GameAction, { type: typeof ActionTypes.RECORD_EXPEDITION_CAREER_RESULT }> => {
  const runId = state.expedition.runId
  const outcome = state.expedition.outcome?.kind
  if (
    typeof runId !== 'string' ||
    runId.length === 0 ||
    !isFiniteNumber(tourTokensEarned) ||
    !['extracted', 'completed', 'failed'].includes(outcome ?? '')
  ) {
    throw new StateError('Finalized expedition is missing a valid settlement identity')
  }
  return {
    type: ActionTypes.RECORD_EXPEDITION_CAREER_RESULT,
    payload: {
      runId,
      outcome: outcome as 'extracted' | 'completed' | 'failed',
      regionId: state.expedition.loadout.regionId,
      tourTokensEarned: Math.max(0, Math.trunc(tourTokensEarned))
    }
  }
}

export const recordExpeditionCareerResult = (
  state: CareerState,
  payload: RecordExpeditionCareerResultPayload
): CareerState => {
  if (
    typeof payload.runId !== 'string' ||
    payload.runId.length === 0 ||
    !isFiniteNumber(payload.tourTokensEarned) ||
    payload.tourTokensEarned < 0 ||
    state.settledRunIds.includes(payload.runId)
  ) {
    return state
  }
  const safeTokens = Math.max(0, Math.trunc(finiteNumberOr(state.tourTokens, 0)))
  return {
    ...state,
    settledRunIds: [...state.settledRunIds, payload.runId].slice(-64),
    tourTokens: safeTokens + Math.trunc(payload.tourTokensEarned),
    stats: applyCareerOutcome(state.stats, payload)
  }
}
```

`careerSanitizers.ts` independently validates and deduplicates `settledRunIds`, keeping only the most recent 64 ids. `RunSummary` calls `createRecordExpeditionCareerResultAction(state, earnedTokens)`; it never accepts or invents a `runId` from component input. If `expedition.runId` is missing/malformed, the creator refuses the award and the scene logs the invariant failure instead of minting a replacement id. Add direct-reducer tests for malformed `runId`, `NaN`/`Infinity` token values, and corrupted stored `career.tourTokens`, plus a reload-idempotence test: finalize a run, persist/reload it, render Run Summary twice, and assert exactly one token award for the same stored `runId`. The RunSummary shows secured Cash/Fame, Tour Tokens earned, rank change, discoveries, persistent injury/crew/rival consequences, plus `Band HQ` and `Next Tour`. No mandatory multi-screen sequence is inserted.

- [ ] **Step 3: Ascension unlock condition**

Set `career.ascensionUnlocked = true` when rank becomes `cult_legend`. The initial implementation deliberately avoids a parallel hidden story flag:

```ts
const nextRankId = calculateCareerRank(nextCareer)
return {
  ...nextCareer,
  rankId: nextRankId,
  ascensionUnlocked: nextCareer.ascensionUnlocked || nextRankId === 'cult_legend'
}
```

Do not clear an already unlocked Ascension state if future rank logic changes.

- [ ] **Step 4: Run golden path/UI tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/golden-path/expeditionMetaLoop.test.js
pnpm exec vitest run tests/ui/RunSummary.test.tsx tests/ui/TourPrep.test.tsx
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/RunSummary.tsx src/ui/expedition/RunSummaryCard.tsx src/context/careerActionCreators.ts src/context/reducers/careerReducer.ts tests/ui/RunSummary.test.tsx tests/golden-path/expeditionMetaLoop.test.js
git commit -m "feat(expedition): complete between-tour meta loop"
```

---

### Task 13: Add G5 Region/Tour/Pressure/Meta Metrics to Balance Simulation

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `scripts/utils/balance-report-metadata.mjs`
- Test: `tests/node/game-balance-simulation.test.js`, `tests/node/balanceSourceFiles.test.js`

- [ ] **Step 1: Add failing report fields**

Require comparison output for:

```js
[
  'regionId',
  'tourTypeId',
  'pressureModifierIds',
  'securedRewardMean',
  'securedRewardMedian',
  'completionRate',
  'voluntaryExtractionRate',
  'failureRate',
  'avgRouteDepth',
  'avgRewardMultiplier',
  'strategyDominanceStatus'
]
```

- [ ] **Step 2: Verify failure**

```bash
pnpm run test:node
```

Expected: new report contract fails.

- [ ] **Step 3: Import canonical region/tour/pressure definitions**

Use production definitions in the simulator instead of copying profile numbers:

```js
import { REGIONS } from '../src/data/expedition/regions.ts'
import { TOUR_TYPES } from '../src/data/expedition/tourTypes.ts'
import { TOUR_PRESSURE_MODIFIERS } from '../src/data/expedition/pressureModifiers.ts'
import { getRegionDefinition } from '../src/domain/expedition/regionProfile.ts'
import { calculateTourPressureProfile } from '../src/domain/expedition/tourPressure.ts'
```

When building each representative simulator profile, resolve `mapDepth`, extraction steps/retention, region multipliers/node weights, and Pressure multipliers from these imports. Add the five production files above to the frozen source list in `scripts/utils/balance-report-metadata.mjs` if they are not already present.

- [ ] **Step 4: Add a bounded scenario matrix**

Do not multiply every possible combination. Use these representative combinations:

```text
standard/home/no pressure
survival/industrial/bad_roads
blitz/festival/media_frenzy
corporate/corporate/no pressure
underground/underground/no_safety_net
rival_hunt/home/hostile_territory
standard/home/three modifiers (bad_roads + media_frenzy + hostile_territory)
```

Each keeps 2,000 calibration runs + 2,000 disjoint holdout runs.

- [ ] **Step 5: Add explicit strategy-dominance report**

Add a pure classifier to the simulator report builder and unit-test it with a clearly dominant fixture:

```js
const classifyMetaProfileDominance = (row, rows) => {
  const rewards = rows.map(r => r.securedRewardMean).sort((a, b) => a - b)
  const failures = rows.map(r => r.failureRate).sort((a, b) => a - b)
  const rewardCut = rewards[Math.max(0, Math.ceil(rewards.length * 0.9) - 1)]
  const safetyCut = failures[Math.max(0, Math.floor(failures.length * 0.1))]
  const hasCompensatingPressure =
    row.avgConditionAtFinale < 40 ||
    row.p90CrewStressAtExtraction >= 70 ||
    row.avgHeatAtExtraction >= 75
  return row.securedRewardMean >= rewardCut &&
    row.failureRate <= safetyCut &&
    !hasCompensatingPressure
      ? 'dominant_warning'
      : 'ok'
}
```

Render the classifier beside secured reward, completion/failure, condition/stress/Heat pressure, and route depth. This G5 classifier is diagnostic/non-blocking; G6 replaces it with the final calibration+holdout dominance gate.

- [ ] **Step 6: Run G5 gate**

```bash
pnpm run test:node
pnpm run test:ui
pnpm run typecheck:core
pnpm run deadcode:check
pnpm run simulate:balance
```

Expected: PASS; representative meta profiles appear in calibration and holdout report.

- [ ] **Step 7: Commit**

```bash
git add scripts/game-balance-simulation.mjs reports tests
git commit -m "test(balance): compare expedition meta profiles"
```

---

## G5 Exit Criteria

- Career progress is based on mixed accomplishments, not Fame alone.
- Tour Tokens are the only new spendable meta currency in this plan.
- `state.unlocks`/unlockManager is the only capability-unlock registry; purchased sets persist one marker and legendary finales persist one direct marker.
- Starter perks are optional, build-defining rule profiles with explicit trade-offs; no large permanent raw-stat perks are added.
- Every successful contextual finale maps deterministically to one legendary perk unlock, with idempotent storage/retry semantics.
- Band HQ gets one Expedition meta tab; existing management surfaces remain.
- Five regions differ mechanically.
- Six tour archetypes change run structure/risk rather than only labels.
- Default map generation remains byte-for-byte/deterministically equivalent when no profile is supplied.
- Ascension modifiers change rules and reward, with a maximum of three selected.
- Tour Archive tracks discovery only; it cannot unlock content by itself.
- Run Summary settles career once and returns quickly to Tour Prep/Band HQ.
- Simulator compares representative region/tour/pressure profiles before final recalibration.

---

# Expedition Balance Simulator Recalibration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebase Neurotoxic's production balance harness from the current depth-10/day-10 touring model onto the shipped Roguelite Expedition semantics, preserve a frozen pre-Expedition baseline, add calibration/holdout coverage for extraction/condition/crew/pressure/build diversity, and make the final release gate fail closed on structural safety errors and reproducible strategy dominance.

**Architecture:** Keep `scripts/game-balance-simulation.mjs` as the authoritative full-report runner so all existing report/provenance tooling still has one source of truth, but move Expedition-specific scenario/profile definitions and derived metrics into focused utility modules. Bump the report contract and seed namespace when the horizon semantics change; never compare v14's 10-day results as if they were paired v15 Expedition results. Add a separate deterministic `game-balance-expedition-probe.mjs` for paired push-your-luck experiments such as extract-now versus continue, because those counterfactual branches answer a different question than the main population report.

**Tech Stack:** Node.js ESM, TypeScript production helpers loaded via `--import tsx`, existing deterministic `MapGenerator`, production reducer/domain helpers, 2,000-run calibration and holdout cohorts, Node test runner, existing Markdown/JSON report pipeline.

---

## Depends On

This plan starts only after G5 is green:

1. Expedition Core/Extraction exists and is deterministic.
2. Condition/Cargo/Repairs exists.
3. Crew/Stress/Relationships exists.
4. Heat/Exposure/Obligations/Rivals/Contracts exists.
5. Regions/Tour Types/Pressure Modifiers/Meta loadouts exist.
6. The six canonical strategy archetypes can be constructed through production registries/helpers rather than simulator-only fake state.

Do not use this plan to hide missing production behavior inside the simulator. If a production helper is missing, fix the owning G1-G5 domain first and then import it here.

---

## File Structure

**Create:**

- `scripts/utils/expedition-balance-profiles.mjs`
- `scripts/utils/expedition-balance-metrics.mjs`
- `scripts/game-balance-expedition-probe.mjs`
- `tests/node/expedition-balance-profiles.test.js`
- `tests/node/expedition-balance-metrics.test.js`
- `tests/node/game-balance-expedition-probe.test.js`

**Modify:**

- `scripts/game-balance-simulation.mjs`
- `scripts/game-balance-experiments.mjs`
- `scripts/game-balance-experiment-config.mjs`
- `scripts/utils/balance-report-metadata.mjs`
- `package.json`
- `tests/node/game-balance-simulation.test.js`
- `tests/node/game-balance-experiments.test.js`
- `tests/node/balanceSourceFiles.test.js`
- `reports/game-balance-simulation-results.json`
- `reports/game-balance-simulation-analysis.md`
- `reports/game-balance-simulation-baseline.json`
- `reports/game-balance-experiments-results.json`
- `reports/game-balance-experiments-analysis.md`

**Verify as existing historical evidence created by G1 Task 0:**

- `reports/game-balance-simulation-pre-expedition-v14.json`
- `reports/game-balance-simulation-pre-expedition-v14.md`

The pre-Expedition files are immutable snapshots. Do not regenerate or overwrite them after Expedition work begins.

---

## Locked Simulator Decisions

### A. Report v14 and v15 are not paired populations

The current report defines a run as 10 map hops / 10 days. Expedition defines a run by tour type, route depth, extraction/failure/finale outcome, and may end before the maximum map depth. Therefore v15 must use:

```js
reportVersion: 15,
seedNamespace: '#roguelite-expedition-v1'
```

The old namespace `#first-income-full-reports-v1` remains attached only to the frozen v14 artifacts.

### B. Production profile config drives the horizon

Do not keep `daysPerRun: 10` as the controlling Expedition horizon. The main loop obtains `mapDepth` and extraction windows from the selected production tour type. Use a defensive simulation iteration ceiling only as an invariant guard, not as gameplay timing.

### C. Main report = population behavior; paired probe = counterfactual value

The main report answers: "What happens when canonical strategies play the shipped mode?"

The paired probe answers: "At the same extraction state, what is the measured trade-off between cashing out and continuing?"

Do not infer extraction decision value from two unrelated scenario populations.

### D. Hard gates and design hypotheses remain separate

Blocking G6 gates cover correctness/reproducibility/safety and clear dominance. Desired pacing/risk bands are reported as non-blocking hypotheses until playtest evidence confirms their final product targets.

---

### Task 1: Verify the Frozen v14 Baseline Before Changing Horizon Semantics

**Files:**
- Read: `reports/game-balance-simulation-pre-expedition-v14.json`
- Read: `reports/game-balance-simulation-pre-expedition-v14.md`
- Test: `tests/node/preExpeditionBalanceBaseline.test.js`
- Modify: `tests/node/game-balance-simulation.test.js`

The immutable snapshot is created by Task 0 of `01-expedition-core-extraction.md` **before any Expedition work starts**. G6 must verify it, never recreate it from the then-current live report.

- [ ] **Step 1: Run the historical-baseline test from G1**

```bash
node --test tests/node/preExpeditionBalanceBaseline.test.js
```

Expected: PASS with report version 14, namespace `#first-income-full-reports-v1`, 10-day horizon, and 2,000 runs per scenario.

- [ ] **Step 2: Add a guard that the live simulator is no longer allowed to overwrite the historical filenames**

Add to `tests/node/game-balance-simulation.test.js`:

```js
test('live report filenames do not target the frozen pre-expedition artifacts', () => {
  assert.notEqual(
    SIMULATION_CONSTANTS.outputJson,
    'game-balance-simulation-pre-expedition-v14.json'
  )
  assert.notEqual(
    SIMULATION_CONSTANTS.outputMarkdown,
    'game-balance-simulation-pre-expedition-v14.md'
  )
})
```

- [ ] **Step 3: Run the focused tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/preExpeditionBalanceBaseline.test.js \
  tests/node/game-balance-simulation.test.js
```

Expected: PASS.

- [ ] **Step 4: Commit only the guard test if it changed**

```bash
git add tests/node/game-balance-simulation.test.js
git commit -m "test(balance): protect frozen pre-expedition baseline"
```

---

### Task 2: Define Canonical Expedition Balance Profiles

**Files:**
- Create: `scripts/utils/expedition-balance-profiles.mjs`
- Create: `tests/node/expedition-balance-profiles.test.js`
- Modify: `scripts/game-balance-simulation.mjs`

The simulator must stop treating the six new strategy families as loose comments/behavior flags. Each profile pins a production-valid region/tour/loadout policy and a decision policy.

- [ ] **Step 1: Write the failing profile-contract test**

`tests/node/expedition-balance-profiles.test.js`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXPEDITION_BALANCE_PROFILES,
  getExpeditionBalanceProfile
} from '../../scripts/utils/expedition-balance-profiles.mjs'

const REQUIRED_IDS = [
  'clean_sponsor',
  'underground_heat',
  'diy_repair',
  'scout_intel',
  'high_exposure_performance',
  'rival_hunter'
]

test('expedition balance profiles cover every approved strategy family once', () => {
  assert.deepEqual(
    EXPEDITION_BALANCE_PROFILES.map(profile => profile.id).sort(),
    [...REQUIRED_IDS].sort()
  )
  assert.equal(new Set(EXPEDITION_BALANCE_PROFILES.map(p => p.id)).size, 6)
})

test('each profile has explicit loadout and deterministic decision policy', () => {
  for (const profile of EXPEDITION_BALANCE_PROFILES) {
    assert.equal(typeof profile.tourTypeId, 'string')
    assert.equal(typeof profile.regionId, 'string')
    assert.ok(profile.starterPerkId === null || typeof profile.starterPerkId === 'string')
    assert.ok(profile.insurancePolicyId === null || typeof profile.insurancePolicyId === 'string')
    assert.ok(Array.isArray(profile.crewRolePreference))
    assert.equal(typeof profile.decisionPolicy, 'object')
    assert.equal(typeof profile.decisionPolicy.extractionRiskTolerance, 'number')
    assert.ok(profile.decisionPolicy.extractionRiskTolerance >= 0)
    assert.ok(profile.decisionPolicy.extractionRiskTolerance <= 1)
    assert.strictEqual(getExpeditionBalanceProfile(profile.id), profile)
  }
})
```

- [ ] **Step 2: Run the test and verify module-not-found**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expedition-balance-profiles.test.js
```

Expected: FAIL because the profile module does not exist.

- [ ] **Step 3: Create the exact profile registry**

`scripts/utils/expedition-balance-profiles.mjs`:

```js
const freezeProfile = profile =>
  Object.freeze({
    ...profile,
    crewRolePreference: Object.freeze([...profile.crewRolePreference]),
    pressureModifierIds: Object.freeze([...profile.pressureModifierIds]),
    decisionPolicy: Object.freeze({ ...profile.decisionPolicy })
  })

export const EXPEDITION_BALANCE_PROFILES = Object.freeze([
  freezeProfile({
    id: 'clean_sponsor',
    name: 'Clean Sponsor',
    tourTypeId: 'corporate',
    regionId: 'corporate',
    starterPerkId: 'press_pass',
    insurancePolicyId: 'touring',
    crewRolePreference: ['manager', 'driver', 'technician'],
    pressureModifierIds: [],
    decisionPolicy: {
      heatPreference: 'low',
      repairPreference: 'safe',
      contractPreference: 'sponsor',
      intelPreference: 'medium',
      extractionRiskTolerance: 0.45
    }
  }),
  freezeProfile({
    id: 'underground_heat',
    name: 'Underground Heat',
    tourTypeId: 'underground',
    regionId: 'underground',
    starterPerkId: 'underground_contact',
    insurancePolicyId: null,
    crewRolePreference: ['security', 'driver', 'technician'],
    pressureModifierIds: ['media_frenzy'],
    decisionPolicy: {
      heatPreference: 'high',
      repairPreference: 'balanced',
      contractPreference: 'high_risk',
      intelPreference: 'low',
      extractionRiskTolerance: 0.75
    }
  }),
  freezeProfile({
    id: 'diy_repair',
    name: 'DIY Repair',
    tourTypeId: 'standard',
    regionId: 'industrial',
    starterPerkId: 'mechanic_kit',
    insurancePolicyId: 'equipment',
    crewRolePreference: ['technician', 'roadie', 'driver'],
    pressureModifierIds: ['bad_roads'],
    decisionPolicy: {
      heatPreference: 'medium',
      repairPreference: 'field',
      contractPreference: 'neutral',
      intelPreference: 'medium',
      extractionRiskTolerance: 0.6
    }
  }),
  freezeProfile({
    id: 'scout_intel',
    name: 'Scout Intel',
    tourTypeId: 'standard',
    regionId: 'home',
    starterPerkId: null,
    insurancePolicyId: 'roadside',
    crewRolePreference: ['scout', 'driver', 'technician'],
    pressureModifierIds: [],
    decisionPolicy: {
      heatPreference: 'medium',
      repairPreference: 'balanced',
      contractPreference: 'neutral',
      intelPreference: 'high',
      extractionRiskTolerance: 0.55
    }
  }),
  // `festival` is a region, not a tour type; this profile intentionally uses
  // the registered `standard` tour and lets the region provide festival behavior.
  freezeProfile({
    id: 'high_exposure_performance',
    name: 'High Exposure Performance',
    tourTypeId: 'standard',
    regionId: 'festival',
    starterPerkId: 'headliner_pass',
    insurancePolicyId: 'equipment',
    crewRolePreference: ['roadie', 'manager', 'technician'],
    pressureModifierIds: ['media_frenzy'],
    decisionPolicy: {
      heatPreference: 'medium',
      repairPreference: 'balanced',
      contractPreference: 'performance',
      intelPreference: 'medium',
      extractionRiskTolerance: 0.7
    }
  }),
  freezeProfile({
    id: 'rival_hunter',
    name: 'Rival Hunter',
    tourTypeId: 'rival_hunt',
    regionId: 'home',
    starterPerkId: 'nemesis_dossier',
    insurancePolicyId: null,
    crewRolePreference: ['scout', 'security', 'roadie'],
    pressureModifierIds: ['hostile_territory'],
    decisionPolicy: {
      heatPreference: 'medium',
      repairPreference: 'balanced',
      contractPreference: 'rival',
      intelPreference: 'high',
      extractionRiskTolerance: 0.8
    }
  })
])

export const getExpeditionBalanceProfile = id =>
  EXPEDITION_BALANCE_PROFILES.find(profile => profile.id === id) ?? null
```

These ids must match the G2/G5 production registries. Profiles using a legendary starter perk represent an explicitly seeded late-career loadout and must add that exact marker to the simulated `state.unlocks` before validating the loadout. Profiles must still pass the production `validateExpeditionLoadout`; never bypass unlock validation or add a simulator-only alias.

- [ ] **Step 4: Import profiles into the main simulator**

Add:

```js
import { EXPEDITION_BALANCE_PROFILES } from './utils/expedition-balance-profiles.mjs'
```

Do not yet replace `SCENARIOS`; Task 4 does the horizon cutover atomically.

- [ ] **Step 5: Run tests and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expedition-balance-profiles.test.js

git add scripts/utils/expedition-balance-profiles.mjs scripts/game-balance-simulation.mjs tests/node/expedition-balance-profiles.test.js
git commit -m "test(balance): define expedition strategy profiles"
```

---

### Task 3: Add Pure Expedition Metric Accumulators

**Files:**
- Create: `scripts/utils/expedition-balance-metrics.mjs`
- Create: `tests/node/expedition-balance-metrics.test.js`

The main simulator is already large. Keep new counters and summary math in a focused module instead of adding another several hundred inline arithmetic branches.

- [ ] **Step 1: Write failing metric tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createExpeditionMetrics,
  recordExpeditionSpend,
  summarizeExpeditionRuns
} from '../../scripts/utils/expedition-balance-metrics.mjs'

test('spend attribution preserves one canonical sink bucket', () => {
  const metrics = createExpeditionMetrics()
  recordExpeditionSpend(metrics, 'repair', 250)
  recordExpeditionSpend(metrics, 'supply', 100)
  assert.deepEqual(metrics.spendByCategory, {
    repair: 250,
    supply: 100,
    insurance: 0,
    crew: 0,
    contract: 0,
    fuel: 0,
    other: 0
  })
})

test('summary keeps extraction, completion and failure disjoint', () => {
  const summary = summarizeExpeditionRuns([
    { expeditionOutcome: 'extracted', securedReward: 500 },
    { expeditionOutcome: 'completed', securedReward: 900 },
    { expeditionOutcome: 'failed', securedReward: 200 }
  ])
  assert.equal(summary.extractedPct, 33.33)
  assert.equal(summary.completedPct, 33.33)
  assert.equal(summary.failedPct, 33.33)
  assert.equal(summary.avgSecuredReward, 533.33)
})
```

- [ ] **Step 2: Run and verify module-not-found**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expedition-balance-metrics.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement exact accumulator shape**

The module exports:

```js
export const EXPEDITION_SPEND_CATEGORIES = Object.freeze([
  'repair',
  'supply',
  'insurance',
  'crew',
  'contract',
  'fuel',
  'other'
])

export const createExpeditionMetrics = () => ({
  routeSteps: 0,
  expeditionOutcome: null,
  extractionStep: null,
  grossReward: 0,
  securedReward: 0,
  spendByCategory: Object.fromEntries(
    EXPEDITION_SPEND_CATEGORIES.map(key => [key, 0])
  ),
  conditionMinimums: {
    vehicle: 100,
    pa: 100,
    instruments: 100,
    stageGear: 100
  },
  defectsCreated: 0,
  assetsDisabled: 0,
  professionalRepairs: 0,
  fieldRepairs: 0,
  improvisedRepairs: 0,
  insuranceClaims: 0,
  starterPerkId: null,
  legendaryUnlocksEarned: 0,
  crewCrises: 0,
  seriousInjuries: 0,
  breakingCrewMembers: 0,
  obligationsAccepted: 0,
  obligationsCompleted: 0,
  obligationsFailed: 0,
  rivalEncounters: 0,
  authorityEncounters: 0,
  revealedIntelNodes: 0,
  routeChoicesUsingRevealedIntel: 0,
  draftsOffered: 0,
  draftsAccepted: 0,
  runTraitPickCounts: {},
  heatTimeline: [],
  exposureTimeline: []
})
```

`recordExpeditionSpend` rejects non-finite/negative values with `RangeError`. Increment `insuranceClaims` only on the canonical one-shot insurance-claim transition, set `starterPerkId` from the validated loadout once at run start, and increment `legendaryUnlocksEarned` only when a completed finale produces a previously unowned legendary marker. `summarizeExpeditionRuns` returns rates rounded to two decimals and never turns missing samples into a successful 0% result; for an empty array, rate fields are `null`.

- [ ] **Step 4: Add edge-case tests**

```js
assert.throws(
  () => recordExpeditionSpend(createExpeditionMetrics(), 'repair', -1),
  /non-negative finite/
)
assert.equal(summarizeExpeditionRuns([]).failedPct, null)
```

- [ ] **Step 5: Run and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expedition-balance-metrics.test.js

git add scripts/utils/expedition-balance-metrics.mjs tests/node/expedition-balance-metrics.test.js
git commit -m "test(balance): add expedition metric accumulators"
```

---

### Task 4: Cut the Main Simulator Over to Expedition Horizon Semantics

**Files:**
- Modify: `scripts/game-balance-simulation.mjs:229-260, 2519-3720, 3862-4940, 6032-7040, 7063-7268`
- Modify: `tests/node/game-balance-simulation.test.js`

- [ ] **Step 1: Add failing report-contract assertions**

Add:

```js
test('expedition report contract uses route semantics, not the legacy day horizon', () => {
  assert.equal(SIMULATION_CONSTANTS.reportVersion, 15)
  assert.equal(SIMULATION_CONSTANTS.seedNamespace, '#roguelite-expedition-v1')
  assert.deepEqual(SIMULATION_CONSTANTS.progressionCheckpointSteps, [2, 4, 6])
  assert.equal('daysPerRun' in SIMULATION_CONSTANTS, false)
})
```

And add a deterministic standard-profile test:

```js
test('same expedition profile and seed reproduces the same outcome', () => {
  const profile = EXPEDITION_BALANCE_PROFILES[0]
  const a = runSingleSimulation(profile, 123456)
  const b = runSingleSimulation(profile, 123456)
  assert.deepEqual(a, b)
})
```

- [ ] **Step 2: Run the focused simulation tests and verify they fail on v14 constants**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/game-balance-simulation.test.js
```

Expected: FAIL because report version/namespace/day contract are still v14.

- [ ] **Step 3: Replace the horizon constants atomically**

Use:

```js
export const SIMULATION_CONSTANTS = {
  reportVersion: 15,
  runsPerScenario: 2000,
  seedNamespace: '#roguelite-expedition-v1',
  progressionCheckpointSteps: [2, 4, 6],
  defensiveMaxIterations: 20,
  homeVenueId: 'stendal_proberaum',
  randomModifierChance: 0.22,
  fameLossBadGig: BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG,
  brandDealEvalChance: 0.14,
  postPulseChance: 0.18,
  trendShiftChance: 0.12,
  contrabandDropChance: 0.11,
  gigEventChance: 0.3,
  assetInvestChance: 0.12,
  moduleInstallChance: 0.15,
  crowdfundChance: 0.04,
  outputJson: REPORT_FILES.outputJson,
  outputMarkdown: REPORT_FILES.outputMarkdown
}
```

Remove code/comments whose correctness depends on `daysPerRun` or `baseGigGapDays`. Do not leave compatibility aliases that make an old test accidentally pass.

- [ ] **Step 4: Make `runSingleSimulation(profile, seed, tuning)` create the production Expedition loadout**

The runner must:

1. create state with `createInitialState()`;
2. grant only the unlock ids required by the profile setup in the simulation state;
3. call the same loadout validator/default builders as Tour Prep;
4. choose production tour/region definitions;
5. generate map depth from the production tour type;
6. start Expedition through the same reducer/action semantics used by production;
7. stop only on `extracted`, `completed`, or `failed`;
8. throw if `defensiveMaxIterations` is reached without a terminal outcome.

Use an invariant guard:

```js
if (iterations >= SIMULATION_CONSTANTS.defensiveMaxIterations) {
  throw new Error(
    `Expedition simulation exceeded ${SIMULATION_CONSTANTS.defensiveMaxIterations} iterations for ${profile.id}`
  )
}
```

Do not classify this as an ordinary run failure; it is a simulator/production logic error and must fail the report generation.

- [ ] **Step 5: Replace day checkpoints with route-step checkpoints**

Timeline checkpoints record the first state at or beyond route step 2, 4, and 6:

```js
for (const step of SIMULATION_CONSTANTS.progressionCheckpointSteps) {
  if (metrics.routeSteps >= step && !checkpointByStep.has(step)) {
    checkpointByStep.set(step, snapshotExpeditionCheckpoint(state, metrics))
  }
}
```

No report field may still label those values as "Tag 3/5/7".

- [ ] **Step 6: Use `EXPEDITION_BALANCE_PROFILES` as the authoritative top-level scenario set**

Replace the population loop with:

```js
for (const profile of EXPEDITION_BALANCE_PROFILES) {
  const runs = []
  for (let runIndex = 0; runIndex < SIMULATION_CONSTANTS.runsPerScenario; runIndex++) {
    const seed = createScenarioSeed(
      `${profile.id}${SIMULATION_CONSTANTS.seedNamespace}`,
      runIndex
    )
    runs.push(runSingleSimulation(profile, seed))
  }
  results.push(buildExpeditionProfileResult(profile, runs))
}
```

Keep the old exported name `SCENARIOS` only if external tests/scripts still import it; if retained, make it a direct alias:

```js
export const SCENARIOS = EXPEDITION_BALANCE_PROFILES
```

Do not keep both independent arrays.

- [ ] **Step 7: Run deterministic simulator tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expedition-balance-profiles.test.js \
  tests/node/expedition-balance-metrics.test.js \
  tests/node/game-balance-simulation.test.js
```

Expected: PASS.

- [ ] **Step 8: Commit the semantic cutover**

```bash
git add scripts/game-balance-simulation.mjs tests/node/game-balance-simulation.test.js
git commit -m "refactor(balance): simulate expedition route horizon"
```

---

### Task 5: Instrument Extraction, Condition, Crew and Pressure in Every Run

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `scripts/utils/expedition-balance-metrics.mjs`
- Modify: `tests/node/game-balance-simulation.test.js`

- [ ] **Step 1: Add a failing telemetry-shape test**

For one deterministic run, assert:

```js
const run = runSingleSimulation(EXPEDITION_BALANCE_PROFILES[0], 123)
assert.ok(['extracted', 'completed', 'failed'].includes(run.expeditionOutcome))
assert.equal(Number.isInteger(run.routeSteps), true)
assert.equal(Number.isFinite(run.securedReward), true)
assert.equal(typeof run.spendByCategory, 'object')
assert.equal(typeof run.conditionMinimums, 'object')
assert.equal(Number.isInteger(run.insuranceClaims), true)
assert.ok(run.starterPerkId === null || typeof run.starterPerkId === 'string')
assert.equal(Number.isInteger(run.legendaryUnlocksEarned), true)
assert.equal(Number.isInteger(run.crewCrises), true)
assert.ok(Array.isArray(run.heatTimeline))
assert.ok(Array.isArray(run.exposureTimeline))
```

- [ ] **Step 2: Record metrics at production ownership points**

Record only after the production action/reducer succeeds. Add these local simulator helpers next to `runSingleSimulation`; they observe settled state and never reimplement production math:

```js
const recordAppliedSpend = (metrics, category, beforeMoney, afterMoney) => {
  const spend = beforeMoney - afterMoney
  if (spend > 0) recordExpeditionSpend(metrics, category, spend)
}

const recordConditionMinimums = (metrics, expedition) => {
  for (const key of ['vehicle', 'pa', 'instruments', 'stageGear']) {
    const value = expedition.condition[key]
    if (Number.isFinite(value)) {
      metrics.conditionMinimums[key] = Math.min(
        metrics.conditionMinimums[key],
        value
      )
    }
  }
}

const recordPressureSnapshot = (metrics, expedition) => {
  metrics.heatTimeline.push(expedition.pressure.heat)
  metrics.exposureTimeline.push(expedition.pressure.exposure)
}
```

Use them only after the owning transition, e.g.:

```js
const beforeRepairMoney = state.player.money
state = gameReducer(state, createResolveExpeditionRepairAction(repairPayload))
recordAppliedSpend(metrics, 'repair', beforeRepairMoney, state.player.money)
recordConditionMinimums(metrics, state.expedition)

const beforePressure = state.expedition.pressure
state = gameReducer(state, pressureAction)
if (state.expedition.pressure !== beforePressure) {
  recordPressureSnapshot(metrics, state.expedition)
}
```

Ownership table:

| Metric | Record after |
|---|---|
| `routeSteps` | successful `RECORD_EXPEDITION_ARRIVAL` |
| `grossReward` | gig/event/contract reward is applied |
| `securedReward` | `FINALIZE_EXPEDITION` result is known |
| repair spend | repair purchase action succeeds |
| supply spend | supply/cargo purchase succeeds |
| insurance premium spend | `START_EXPEDITION` commits `insurancePremiumPaid` |
| insurance claim | `insuranceClaimUsed` transitions `false -> true` |
| starter perk | validated loadout is committed at `START_EXPEDITION` |
| legendary unlock | completed finale persists a previously unowned `expedition.perk.legendary.*` marker |
| condition minima | travel/gig/repair transition settles |
| defects/disabled assets | Condition reducer transition |
| crew crisis/injury | Crew reducer/event settlement |
| Heat/Exposure | pressure reducer transition |
| obligation counts | obligation action transitions |
| rival/authority encounters | event becomes the selected/settled event |
| intel usage | selected route had a revealed detail not available at intel 0 |
| draft offered | `OFFER_EXPEDITION_DRAFT` is accepted by the reducer |
| draft accepted / trait pick | `SELECT_EXPEDITION_DRAFT` appends a new `draftTraitId` |

For the premium, call `recordExpeditionSpend(metrics, 'insurance', state.expedition.insurancePremiumPaid)` once at run start. Do not infer claims from a Condition increase or legendary unlocks from `finaleType`; count the canonical one-shot state/storage transition only.

Never increment a simulator counter before the corresponding production mutation. This prevents the report from claiming an interaction occurred when production rejected it.

- [ ] **Step 3: Preserve ledger reconciliation**

Add:

```js
run.expeditionReconciled =
  Number.isFinite(run.securedReward) &&
  Math.abs(run.securedReward - run.settlementLedger.securedTotal) < 0.01
```

All 2,000 runs in every profile must reconcile. Do not average reconciliation errors away.

- [ ] **Step 4: Run tests and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/game-balance-simulation.test.js tests/node/expedition-balance-metrics.test.js

git add scripts/game-balance-simulation.mjs scripts/utils/expedition-balance-metrics.mjs tests/node
git commit -m "feat(balance): instrument expedition run systems"
```

---

### Task 6: Replace Legacy KPI Gates with Expedition Safety Gates and Soft Design Review

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `tests/node/game-balance-simulation.test.js`

The old `KPI_TARGETS` contain 10-day money bands and Fame-per-gig assumptions. They must not silently remain blocking after the horizon changes.

- [ ] **Step 1: Write failing safety-gate tests**

Add exported definitions:

```js
export const EXPEDITION_SAFETY_GATES = Object.freeze({
  clean_sponsor: Object.freeze({ failureMaxPct: 35 }),
  underground_heat: Object.freeze({ failureMaxPct: 50 }),
  diy_repair: Object.freeze({ failureMaxPct: 40 }),
  scout_intel: Object.freeze({ failureMaxPct: 35 }),
  high_exposure_performance: Object.freeze({ failureMaxPct: 40 }),
  rival_hunter: Object.freeze({ failureMaxPct: 45 })
})
```

Test every profile has exactly one hard failure ceiling and that missing profile coverage fails closed.

These ceilings are broad **playability safety limits**, not desired risk targets.

- [ ] **Step 2: Add invariant hard gates**

For calibration and holdout, hard failure occurs when any profile has:

```text
invalidRouteCount > 0
settlementReconciliationPct < 100
nonFiniteStateCount > 0
negativeProtectedResourceCount > 0
extractionDoubleSettlementCount > 0
staleRunStateAfterResetCount > 0
contractDoubleSettlementCount > 0
severeRepeatProtectionViolationCount > 0
failurePct > profile.failureMaxPct
```

`protectedResource` means values whose production sanitizers require non-negative state (cash after clamp, fuel, condition, cargo counts, supplies/spare parts, stress bounds as applicable). Do not classify intended signed deltas as protected state.

- [ ] **Step 3: Add non-blocking design hypothesis corridors**

Export:

```js
export const EXPEDITION_DESIGN_HYPOTHESES = Object.freeze({
  clean_sponsor: Object.freeze({
    extractedPct: [15, 45],
    completedPct: [40, 75],
    failedPct: [5, 25]
  }),
  underground_heat: Object.freeze({
    extractedPct: [10, 40],
    completedPct: [25, 60],
    failedPct: [15, 40]
  }),
  diy_repair: Object.freeze({
    extractedPct: [15, 45],
    completedPct: [35, 70],
    failedPct: [10, 30]
  }),
  scout_intel: Object.freeze({
    extractedPct: [15, 45],
    completedPct: [40, 75],
    failedPct: [5, 25]
  }),
  high_exposure_performance: Object.freeze({
    extractedPct: [10, 40],
    completedPct: [30, 65],
    failedPct: [10, 30]
  }),
  rival_hunter: Object.freeze({
    extractedPct: [10, 40],
    completedPct: [25, 65],
    failedPct: [10, 35]
  })
})
```

These values express the approved product intent (Extraction should be a real option; finale should be common but not automatic; risky builds should fail more often). A breach creates a design warning, **not** a failing process exit.

- [ ] **Step 4: Add non-blocking subsystem health bands**

Report warnings for:

```js
export const EXPEDITION_SYSTEM_HEALTH = Object.freeze({
  disabledAssetRunsPct: [3, 25],
  crewCrisisRunsPct: [5, 30],
  seriousInjuryRunsPct: [2, 20],
  obligationFailurePct: [10, 50],
  intelInfluencedRoutePctForScout: [15, 80]
})
```

The lower bounds catch systems that technically exist but never matter; upper bounds catch systems that overwhelm every run.

- [ ] **Step 5: Rename report logic so hard vs soft cannot be confused**

Use two exported builders:

```js
buildExpeditionSafetyValidation(...)
buildExpeditionDesignReview(...)
```

Remove expedition use of legacy `checkKpi()`/`KPI_TARGETS`. Leave legacy functions only if another legacy-only report imports them; otherwise delete them and update tests in the same commit.

- [ ] **Step 6: Run tests and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/game-balance-simulation.test.js

git add scripts/game-balance-simulation.mjs tests/node/game-balance-simulation.test.js
git commit -m "feat(balance): gate expedition safety separately from design"
```

---

### Task 7: Preserve Disjoint 2,000-Run Holdout Validation Under the New Namespace

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `tests/node/game-balance-simulation.test.js`

- [ ] **Step 1: Add failing holdout contract test**

Assert report metadata states:

```js
assert.equal(holdout.runsPerScenario, 2000)
assert.equal(
  holdout.seedStrategy,
  'profile-id-plus-roguelite-expedition-v1-plus-holdout-marker-plus-run-index'
)
assert.equal(holdout.profileResults.length, EXPEDITION_BALANCE_PROFILES.length)
```

- [ ] **Step 2: Generate holdout seeds with an explicit disjoint marker**

```js
createScenarioSeed(
  `${profile.id}${SIMULATION_CONSTANTS.seedNamespace}#holdout`,
  runIndex
)
```

Do not reuse calibration runs for design warnings or hard safety evaluation.

- [ ] **Step 3: Evaluate hard gates on both cohorts**

The aggregate `passes` value is true only when:

```js
calibrationSafety.passes && holdoutSafety.passes
```

Missing holdout profile data is a hard failure, not `0%` or an empty success.

- [ ] **Step 4: Report stability of soft classifications without blocking on it**

For each soft metric, show calibration classification, holdout classification and whether they agree. A disagreement is a warning requiring investigation/re-run, not an automatic balance change.

- [ ] **Step 5: Run and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/game-balance-simulation.test.js

git add scripts/game-balance-simulation.mjs tests/node/game-balance-simulation.test.js
git commit -m "test(balance): validate expedition on disjoint holdout seeds"
```

---

### Task 8: Build a Paired Extraction Decision Probe

**Files:**
- Create: `scripts/game-balance-expedition-probe.mjs`
- Create: `tests/node/game-balance-expedition-probe.test.js`
- Modify: `package.json`

The main report cannot prove that Extraction is a meaningful decision because players who extract and players who continue reach different states. This probe evaluates both choices from the **same deterministic snapshot**.

- [ ] **Step 1: Write the failing paired-probe test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildExtractionProbeSeed,
  evaluateExtractionPair
} from '../../scripts/game-balance-expedition-probe.mjs'

test('paired extraction branches share the same pre-decision seed identity', () => {
  assert.equal(
    buildExtractionProbeSeed('clean_sponsor', 3, 12),
    buildExtractionProbeSeed('clean_sponsor', 3, 12)
  )
})

test('paired extraction result reports both secured outcomes', () => {
  const result = evaluateExtractionPair({
    extractSecuredReward: 700,
    continueSecuredReward: 900,
    continueFailed: false
  })
  assert.deepEqual(result, {
    extractSecuredReward: 700,
    continueSecuredReward: 900,
    continueFailed: false,
    continuePremium: 200,
    continuePremiumPct: 28.57
  })
})
```

- [ ] **Step 2: Add the probe seed namespace**

Use:

```js
export const EXTRACTION_PROBE_NAMESPACE =
  '#roguelite-expedition-v1#paired-extraction'
export const EXTRACTION_PROBE_RUNS_PER_PROFILE = 2000
```

At each configured extraction step, capture a serializable state snapshot and deterministic RNG continuation token. Branch A finalizes extraction immediately. Branch B continues from the same snapshot with the profile's normal policy. The two branches must not share mutable objects.

- [ ] **Step 3: Add `structuredClone` boundary test**

Pin branch isolation in `tests/node/game-balance-expedition-probe.test.js`:

```js
test('paired extraction branches do not share mutable state', () => {
  const source = makeProbeSnapshot({
    money: 1200,
    expedition: {
      routeStep: 3,
      cargo: { spareParts: 2, supplies: 1 },
      pressure: { heat: 35, exposure: 20 }
    }
  })
  const extractBranch = structuredClone(source)
  const continueBranch = structuredClone(source)

  continueBranch.expedition.cargo.spareParts = 0
  continueBranch.expedition.pressure.heat = 90

  assert.equal(extractBranch.expedition.cargo.spareParts, 2)
  assert.equal(extractBranch.expedition.pressure.heat, 35)
  assert.deepEqual(source, extractBranch)
})
```

The production probe must create both branches with `structuredClone(snapshot)` before either branch runs. RNG continuation state is copied into each branch separately as part of the snapshot.

- [ ] **Step 4: Report extraction decision metrics**

For each profile/extraction step report:

- immediate secured reward,
- continue secured reward,
- Continue failure probability,
- Continue reward premium absolute and percent,
- P10/P50/P90 premium,
- share where Continue wins,
- share where Extract wins,
- share where rewards are within 10%.

The desired outcome is **not** 50/50. The hard diagnostic only flags dominance when one decision wins on secured reward in `>= 90%` of paired states in both calibration and holdout at every extraction window.

- [ ] **Step 5: Add package script**

```json
"simulate:balance:expedition-probe": "node --import tsx scripts/game-balance-expedition-probe.mjs"
```

The script writes:

```text
reports/game-balance-expedition-probe-results.json
reports/game-balance-expedition-probe-analysis.md
```

- [ ] **Step 6: Run focused test and probe smoke mode**

Support `--runs 20` for local smoke execution without changing the default 2,000-run report contract:

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/game-balance-expedition-probe.test.js
node --import tsx scripts/game-balance-expedition-probe.mjs --runs 20
```

Expected: PASS; smoke report contains all six profiles and configured extraction windows.

- [ ] **Step 7: Commit**

```bash
git add scripts/game-balance-expedition-probe.mjs tests/node/game-balance-expedition-probe.test.js package.json
git commit -m "feat(balance): add paired expedition extraction probe"
```

---

### Task 9: Add Strategy-Dominance Detection

**Files:**
- Modify: `scripts/utils/expedition-balance-metrics.mjs`
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `tests/node/expedition-balance-metrics.test.js`

A strategy is a release blocker only when it is **materially better on reward and safety** in both calibration and holdout. Small rank changes are not dominance.

- [ ] **Step 1: Write failing dominance tests**

```js
const dominant = {
  id: 'a',
  avgSecuredReward: 1250,
  failedPct: 10
}
const weaker = {
  id: 'b',
  avgSecuredReward: 1000,
  failedPct: 17
}
assert.equal(isMateriallyDominant(dominant, weaker), true)

assert.equal(
  isMateriallyDominant(
    { id: 'a', avgSecuredReward: 1080, failedPct: 10 },
    weaker
  ),
  false
)
```

- [ ] **Step 2: Implement the exact materiality rule**

```js
export const STRATEGY_DOMINANCE_THRESHOLDS = Object.freeze({
  securedRewardAdvantagePct: 20,
  failureRateAdvantagePoints: 5
})
```

`A` dominates `B` only if:

```text
A.avgSecuredReward >= B.avgSecuredReward * 1.20
AND
A.failedPct <= B.failedPct - 5 percentage points
```

A **blocking** dominance finding requires the same ordered pair `A > B` in both calibration and holdout.

This intentionally catches obvious best-of-both-worlds builds without pretending six deliberately different strategies should have identical expected value.

- [ ] **Step 3: Report a Pareto table**

Markdown columns:

```text
Profile | Avg Secured Reward | Failure % | Extraction % | Completion % | Calibration Dominates | Holdout Dominates | Gate
```

- [ ] **Step 4: Run and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expedition-balance-metrics.test.js tests/node/game-balance-simulation.test.js

git add scripts/utils/expedition-balance-metrics.mjs scripts/game-balance-simulation.mjs tests/node
git commit -m "feat(balance): detect expedition strategy dominance"
```

---

### Task 10: Convert Experiments from Legacy Day Levers to Expedition Levers

**Files:**
- Modify: `scripts/game-balance-experiment-config.mjs`
- Modify: `scripts/game-balance-experiments.mjs`
- Modify: `tests/node/game-balance-experiments.test.js`

The current experiment config encodes `through day 3/5`, repeat-gig windows, and legacy 10-day controls. Those levers no longer answer the Expedition design question after v15.

- [ ] **Step 1: Replace the legacy experiment inventory test**

Pin these candidate families:

```text
extraction_retention
road_wear
repair_cost
crew_stress
exposure_gain
pressure_event_rate
```

Each family must include a neutral no-op candidate and at least two bounded interventions.

- [ ] **Step 2: Define bounded candidates**

Use these initial candidate values:

```js
export const EXPEDITION_EXPERIMENTS = Object.freeze({
  extractionRetention: [
    { id: 'retention-none', multiplier: 1 },
    { id: 'retention-90', multiplier: 0.9 },
    { id: 'retention-80', multiplier: 0.8 }
  ],
  roadWear: [
    { id: 'road-wear-none', multiplier: 1 },
    { id: 'road-wear-115', multiplier: 1.15 },
    { id: 'road-wear-130', multiplier: 1.3 }
  ],
  repairCost: [
    { id: 'repair-cost-none', multiplier: 1 },
    { id: 'repair-cost-115', multiplier: 1.15 },
    { id: 'repair-cost-130', multiplier: 1.3 }
  ],
  crewStress: [
    { id: 'crew-stress-none', multiplier: 1 },
    { id: 'crew-stress-110', multiplier: 1.1 },
    { id: 'crew-stress-125', multiplier: 1.25 }
  ],
  exposureGain: [
    { id: 'exposure-none', multiplier: 1 },
    { id: 'exposure-115', multiplier: 1.15 },
    { id: 'exposure-130', multiplier: 1.3 }
  ],
  pressureEventRate: [
    { id: 'pressure-events-none', multiplier: 1 },
    { id: 'pressure-events-115', multiplier: 1.15 },
    { id: 'pressure-events-130', multiplier: 1.3 }
  ]
})
```

- [ ] **Step 3: Preserve selection discipline**

Keep the search/validation flow explicit in `scripts/game-balance-experiments.mjs`:

```js
const calibrationResults = candidates.map(candidate => ({
  candidate,
  result: evaluateCandidate(candidate, { seedStream: 'calibration' })
}))

const selected = selectCandidateFromCalibration(calibrationResults, {
  preferNeutralCandidate: true
})

const validation = evaluateCandidate(selected.candidate, {
  seedStream: 'validation',
  abortOnBreach: false
})

return { calibrationResults, selected: selected.candidate, validation }
```

`selectCandidateFromCalibration` never accepts validation rows. If validation breaches a hard cap, emit the existing `no-production-recommendation-final-validation-failed` result and stop; do not search for a replacement on the validation stream.

- [ ] **Step 4: Change experiment acceptance metrics**

Replace legacy end-money/day objectives with explicit v15 selectors in `scripts/game-balance-experiment-config.mjs`:

```js
export const EXPEDITION_EXPERIMENT_OBJECTIVES = Object.freeze({
  roadWear: {
    primaryMetric: 'avgRepairInteractions',
    guardrailMetric: 'failureRate',
    direction: 'increase_primary_without_guardrail_breach'
  },
  repairCost: {
    primaryMetric: 'repairSpendSharePct',
    guardrailMetric: 'professionalRepairUsagePct',
    direction: 'increase_primary_keep_guardrail_nonzero'
  },
  crewStress: {
    primaryMetric: 'crewCrisisRunsPct',
    guardrailMetric: 'crewRoleConcentrationPct',
    direction: 'increase_primary_limit_concentration'
  },
  exposureGain: {
    primaryMetric: 'pressureEventDifferentiationPct',
    guardrailMetric: 'completionRate',
    direction: 'increase_primary_without_guardrail_breach'
  },
  extractionRetention: {
    primaryMetric: 'continueDecisionWinSharePct',
    guardrailMetric: 'continueFailurePct',
    direction: 'avoid_decision_dominance'
  }
})
```

`game-balance-experiments.mjs` resolves these metrics from the v15 report/probe result; missing or non-finite metrics fail the candidate closed instead of being treated as zero. Candidate selection remains calibration-only, then the selected configuration is measured once on holdout.

- [ ] **Step 5: Run experiments tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/game-balance-experiments.test.js tests/node/game-balance-simulation.test.js
```

Expected: PASS; no test refers to day 3/day 5 legacy windows.

- [ ] **Step 6: Commit**

```bash
git add scripts/game-balance-experiment-config.mjs scripts/game-balance-experiments.mjs tests/node/game-balance-experiments.test.js
git commit -m "refactor(balance): retarget experiments to expedition systems"
```

---

### Task 11: Update Report Rendering for Decision-Relevant Expedition Sections

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `tests/node/game-balance-simulation.test.js`

- [ ] **Step 1: Add a Markdown snapshot assertion for required headings**

The generated report must contain exactly these new analytical sections:

```text
## Expedition-Ergebnisübersicht
## Extraction & Push-your-Luck
## Cash-Sinks nach Kategorie
## Insurance & Starter-Perks
## Condition, Defekte & Reparaturen
## Crew-Stress & Verletzungen
## Heat, Exposure & Obligations
## Rivalen, Behörden & Finales
## Fog-of-War & Scouting
## Strategie-Paretovergleich
## Harte Expedition-Sicherheitsgrenzen (Holdout)
## Weiche Expedition-Designhypothesen
```

- [ ] **Step 2: Remove legacy labels that would misstate the new horizon**

The v15 report must not contain:

```text
Tage je Run
Geld Tag 3
Geld Tag 5
Geld Tag 7
10-Tage-Tour
```

Historical v14 files keep those terms unchanged.

- [ ] **Step 3: Render route-step progression**

Use:

```text
Ø Geld/Condition/Heat nach Schritt 2
Ø ... nach Schritt 4
Ø ... nach Schritt 6
```

and show sample size for profiles that ended before a checkpoint. Do not treat missing late checkpoints as zero.

- [ ] **Step 4: Render insurance/perk trade-offs explicitly**

For each profile show `starterPerkId`, insurance policy/take rate, average insurance premium spend, claim-run percentage, completion/failure rate, secured reward, and legendary unlock incidence. Also render an aggregate starter-perk comparison. A zero-insurance profile remains a valid row; never divide only by insured runs when reporting the overall claim-run percentage.

```js
const insuranceAndPerkRows = profileResults.map(row => ({
  profileId: row.profileId,
  starterPerkId: row.starterPerkId ?? 'none',
  insurancePolicyId: row.insurancePolicyId ?? 'none',
  avgInsuranceSpend: row.avgInsuranceSpend,
  insuranceClaimRunsPct: row.insuranceClaimRunsPct,
  completedPct: row.completedPct,
  failedPct: row.failedPct,
  avgSecuredReward: row.avgSecuredReward,
  legendaryUnlockRate: row.legendaryUnlockRate
}))
```

Pass these rows to the existing Markdown table helper; do not introduce a second report renderer.

- [ ] **Step 5: Render distribution statistics, not only means**

At minimum for secured reward, minimum vehicle condition, max Heat and crew stress include:

```text
Mean | Median | P10 | P90
```

- [ ] **Step 6: Run focused test and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/game-balance-simulation.test.js

git add scripts/game-balance-simulation.mjs tests/node/game-balance-simulation.test.js
git commit -m "feat(balance): report expedition decision metrics"
```

---

### Task 12: Expand Provenance Coverage to Every Expedition Balance Source

**Files:**
- Modify: `scripts/utils/balance-report-metadata.mjs`
- Modify: `tests/node/balanceSourceFiles.test.js`

- [ ] **Step 1: Add failing required-source assertions**

Add the exact new production/report sources to `REQUIRED_SOURCES`, including at minimum:

```js
[
  'src/data/expedition/tourTypes.ts',
  'src/data/expedition/regions.ts',
  'src/data/expedition/crew.ts',
  'src/data/expedition/contracts.ts',
  'src/data/expedition/pressureModifiers.ts',
  'src/data/expedition/insurance.ts',
  'src/data/expedition/starterPerks.ts',
  'src/data/expedition/runTraits.ts',
  'src/domain/expedition/runDrafts.ts',
  'src/domain/expedition/extraction.ts',
  'src/domain/expedition/loadout.ts',
  'src/domain/expedition/nodeIntel.ts',
  'src/domain/expedition/insurance.ts',
  'src/domain/expedition/starterPerks.ts',
  'src/domain/expedition/condition.ts',
  'src/domain/expedition/repairs.ts',
  'src/domain/expedition/crew.ts',
  'src/domain/expedition/pressure.ts',
  'src/domain/expedition/contracts.ts',
  'src/domain/expedition/finale.ts',
  'src/utils/mapGenerator.ts',
  'src/utils/eventEngine/eventSelection.ts',
  'src/utils/assetConfig.ts',
  'src/utils/assetModuleRegistry.ts',
  'scripts/utils/expedition-balance-profiles.mjs',
  'scripts/utils/expedition-balance-metrics.mjs',
  'scripts/game-balance-expedition-probe.mjs'
]
```

The paths above are the canonical paths defined by G1-G5. A missing path is a failing provenance test, not a reason to add a compatibility stub.

- [ ] **Step 2: Add all influencing sources to `BALANCE_SOURCE_FILES`**

`BALANCE_SOURCE_FILES` is already `Object.freeze([...])`. Insert these exact literals into that existing array **before its closing `])`**; do not mutate the frozen export at runtime:

```js
  'src/data/expedition/tourTypes.ts',
  'src/data/expedition/regions.ts',
  'src/data/expedition/crew.ts',
  'src/data/expedition/contracts.ts',
  'src/data/expedition/pressureModifiers.ts',
  'src/data/expedition/insurance.ts',
  'src/data/expedition/starterPerks.ts',
  'src/data/expedition/runTraits.ts',
  'src/domain/expedition/runDrafts.ts',
  'src/domain/expedition/extraction.ts',
  'src/domain/expedition/loadout.ts',
  'src/domain/expedition/nodeIntel.ts',
  'src/domain/expedition/vehicle.ts',
  'src/domain/expedition/cargo.ts',
  'src/domain/expedition/insurance.ts',
  'src/domain/expedition/starterPerks.ts',
  'src/domain/expedition/condition.ts',
  'src/domain/expedition/repairs.ts',
  'src/domain/expedition/crew.ts',
  'src/domain/expedition/crewStress.ts',
  'src/domain/expedition/injuries.ts',
  'src/domain/expedition/pressure.ts',
  'src/domain/expedition/pressureDirector.ts',
  'src/domain/expedition/contracts.ts',
  'src/domain/expedition/rivals.ts',
  'src/domain/expedition/finale.ts',
  'src/domain/expedition/regionProfile.ts',
  'src/domain/expedition/tourPressure.ts',
  'src/utils/mapGenerator.ts',
  'src/utils/eventEngine/eventSelection.ts',
  'src/utils/eventEngine/eventEffectHandlers.ts',
  'src/utils/assetConfig.ts',
  'src/utils/assetModuleRegistry.ts',
  'scripts/utils/expedition-balance-profiles.mjs',
  'scripts/utils/expedition-balance-metrics.mjs',
```

Before committing, sort/position them consistently with the existing source-group comments and remove literals already present (`src/utils/mapGenerator.ts`, `src/utils/eventEngine/eventSelection.ts`, `src/utils/eventEngine/eventEffectHandlers.ts`, `src/utils/assetConfig.ts`, or `src/utils/assetModuleRegistry.ts` if the current list already contains them). The test must assert the final frozen list has no duplicate strings. Keep UI/localization files out because the simulator does not read them.

- [ ] **Step 3: Update generator fingerprints**

Main report generator paths:

```js
[
  'scripts/game-balance-simulation.mjs',
  'scripts/utils/expedition-balance-profiles.mjs',
  'scripts/utils/expedition-balance-metrics.mjs',
  'scripts/utils/balance-report-metadata.mjs'
]
```

Paired probe generator paths also include `scripts/game-balance-expedition-probe.mjs`.

- [ ] **Step 4: Run provenance tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/balanceSourceFiles.test.js
```

Expected: every listed file exists, no duplicates, source hash stable.

- [ ] **Step 5: Commit**

```bash
git add scripts/utils/balance-report-metadata.mjs tests/node/balanceSourceFiles.test.js
git commit -m "chore(balance): fingerprint expedition balance sources"
```

---

### Task 13: Generate Fresh v15 Calibration, Holdout and Paired-Probe Artifacts

**Files:**
- Regenerate: `reports/game-balance-simulation-results.json`
- Regenerate: `reports/game-balance-simulation-analysis.md`
- Regenerate: `reports/game-balance-simulation-baseline.json`
- Regenerate: `reports/game-balance-experiments-results.json`
- Regenerate: `reports/game-balance-experiments-analysis.md`
- Create/Regenerate: `reports/game-balance-expedition-probe-results.json`
- Create/Regenerate: `reports/game-balance-expedition-probe-analysis.md`

- [ ] **Step 1: Generate the authoritative v15 report**

```bash
pnpm run simulate:balance
```

Expected:

- 6/6 profiles have 2,000 calibration runs;
- 6/6 profiles have 2,000 holdout runs;
- report version is 15;
- seed namespace is `#roguelite-expedition-v1`;
- hard safety section has no missing profile coverage.

- [ ] **Step 2: Generate the paired extraction probe**

```bash
pnpm run simulate:balance:expedition-probe
```

Expected: every configured extraction window has 2,000 paired states per applicable profile; no branch-shared-state failure.

- [ ] **Step 3: Run experiment selection**

```bash
pnpm run simulate:balance:experiments
```

Expected: experiment report uses Expedition candidate families and disjoint selection/holdout semantics.

- [ ] **Step 4: Write a v15 baseline only after reviewing the report**

```bash
pnpm run simulate:balance:baseline
```

The written baseline is v15 and becomes the future regression comparator. The frozen v14 historical artifacts remain untouched.

- [ ] **Step 5: Verify baseline comparison is self-consistent**

```bash
pnpm run simulate:balance:compare
```

Expected: freshly generated v15 report compared to the freshly written v15 baseline has zero regression deltas within deterministic precision.

- [ ] **Step 6: Commit generated artifacts**

```bash
git add reports package.json
git commit -m "chore(balance): publish expedition v15 baseline"
```

---

### Task 14: Add the Final G6 Release Gate

**Files:**
- Modify: `tests/node/game-balance-simulation.test.js`
- Modify: `tests/node/game-balance-expedition-probe.test.js`
- Modify: `package.json` only if a dedicated aggregate script is preferred

- [ ] **Step 1: Make generated-artifact safety status testable**

Add a test that reads the committed v15 report and asserts:

```js
assert.equal(report.constants.reportVersion, 15)
assert.equal(report.holdoutSafetyValidation.passes, true)
assert.equal(report.strategyDominance.blockingFindings.length, 0)
assert.equal(report.metadata.runsPerScenario, 2000)
assert.equal(report.metadata.seedNamespace, '#roguelite-expedition-v1')
```

- [ ] **Step 2: Make extraction dominance testable**

Read the committed paired-probe report and assert:

```js
assert.equal(probe.runsPerProfile, 2000)
assert.equal(probe.blockingDecisionDominance.length, 0)
```

If this fails, do **not** relax the 90% dominance definition in the test. Investigate/tune the production retention/reward/risk mechanics through the experiment workflow.

- [ ] **Step 3: Run targeted balance tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expedition-balance-profiles.test.js \
  tests/node/expedition-balance-metrics.test.js \
  tests/node/game-balance-expedition-probe.test.js \
  tests/node/game-balance-simulation.test.js \
  tests/node/game-balance-experiments.test.js \
  tests/node/balanceSourceFiles.test.js
```

Expected: PASS.

- [ ] **Step 4: Run repository-wide release gates**

```bash
pnpm run typecheck:core
pnpm run typecheck
pnpm run test:all
pnpm run test:additional
pnpm run deadcode:check
pnpm run deadcode:budget
pnpm run symbols:update
pnpm run symbols:check
pnpm run test:e2e
```

Expected:

- all commands exit 0;
- `symbols:check` is clean after update;
- dead-code budget does not regress unexpectedly;
- Expedition core journey remains playable in E2E.

- [ ] **Step 5: Re-run authoritative reports from the exact release tree**

```bash
pnpm run simulate:balance
pnpm run simulate:balance:expedition-probe
pnpm run simulate:balance:experiments
```

Expected: generated source/generator fingerprints match the final release tree and `workingTreeDirty` is false when run from the clean branch.

- [ ] **Step 6: Commit only if regenerated artifacts are from the final source state**

```bash
git add reports tests scripts package.json
git commit -m "test(balance): enforce expedition release gates"
```

If the final report says `workingTreeDirty: true`, do not treat the artifacts as release evidence; commit source changes first, regenerate on the clean commit, then commit the generated report in the intended artifact commit flow used by this repository.

---

## G6 Exit Criteria

G6 is complete only when all of the following are true:

- Report v14 remains preserved as immutable pre-Expedition historical evidence.
- Main balance report is v15 with `#roguelite-expedition-v1` and no legacy `daysPerRun` horizon semantics.
- Six canonical strategy profiles use production-valid loadout/region/tour ids.
- Every profile has 2,000 calibration and 2,000 disjoint holdout runs.
- Extraction, Condition, Crew, Pressure, Rival, Fog-of-War and obligation metrics are present and reconciled.
- No hard safety gate fails on calibration or holdout.
- No profile materially dominates another by both `>=20%` secured reward and `>=5pp` lower failure in both calibration and holdout.
- No Extract/Continue choice wins `>=90%` of paired states at every extraction window in both cohorts.
- Soft design-hypothesis warnings are explicitly visible and are not mislabeled as safety failures.
- Experiment selection is calibration-only and holdout remains validation-only.
- Every production source that can move report output is included in the source fingerprint.
- Fresh v15 baseline compares deterministically to itself.
- Full type/test/dead-code/symbol/E2E gates pass.
- Final report/probe fingerprints correspond to the exact release source state.

---

## Recalibration Decision Rule After G6

Do not tune production numbers merely because a soft band is red. Use this order:

1. **Correctness first:** fix any invariant/reconciliation/provenance failure.
2. **Dominance second:** if one build or extraction choice is clearly dominant under the blocking definitions, run the bounded experiment family that owns that lever.
3. **System activity third:** if a mechanic is below its soft lower bound, raise its opportunity/frequency before increasing punishment magnitude.
4. **Overload fourth:** if a mechanic is above its soft upper bound, reduce repeat frequency/cooldown pressure before reducing player agency.
5. **Playtest validation:** only promote soft design hypotheses into hard product corridors after real-player sessions confirm that the measured ranges correspond to the intended 20–30 minute tension curve.

This keeps the simulator as evidence for design decisions rather than allowing the simulator's own initial assumptions to become self-fulfilling balance targets.
