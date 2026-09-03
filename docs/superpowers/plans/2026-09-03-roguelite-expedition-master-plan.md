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
- `RECORD_EXPEDITION_CAREER_RESULT` has one contract owned by G5 Task 2: stable `runId`, finalized outcome/region, canonical token reward, and `settledRunIds` idempotence. Its root reducer revalidates that `runId`, outcome and region still match the currently finalized Expedition before minting progress. Run Summary consumes that contract and never redefines settlement or rank math.
- Declarative `{ type: 'expedition' }` effects are established in G2 Task 10 through `eventEffectHandlers.ts -> EventDelta.expedition -> eventResolver.ts -> APPLY_EXPEDITION_EVENT_DELTA`. G3 Task 9 extends that one path with crew stress and explicit Rival Battle intent. Generic `APPLY_EVENT_DELTA` / `src/utils/gameState/delta.ts` never silently owns Expedition state.
- Relationship actions carry two crew ids, not a prebuilt pair key. The Career reducer revalidates both ids and derives the canonical key before any persisted write.
- Every focused TDD command in the plan must name a file that exists before the task starts (or a file the immediately preceding step explicitly creates); a red step must fail on the new assertion, never on module/file resolution.

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
2. Condition/Repairs/Cargo   3. Crew/Stress/Relationships Tasks 1-8
        |                    |
        +-------> G3 Tasks 9-10 <+
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
