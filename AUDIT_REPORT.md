# Neurotoxic Codebase Audit - Logic & Feature Review

Date: 2026-05-28  
Scope: `src/` primary audit. `public/locales/{en,de}` checked for parity. Tests were not primary audit scope, but test-only references are noted where relevant.

Conventions loaded: root `AGENTS.md`, root `CLAUDE.md`, and every nested `src/**/AGENTS.md`.

Clean checks: no EN/DE locale key parity drift found; no `React.forwardRef`, `.propTypes`, `@ts-ignore`, or `@ts-nocheck` found in source; direct Tone.js imports/calls are contained under `src/utils/audio/`.

## 1. DUPLICATES

| Severity | file:line                                                                                              | Symbol(s)                                                  | Description                                                                                                                                                        | Action |
| -------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| MED      | `src/utils/assetTicks.ts:193`, `src/context/reducers/assetReducer.ts:377`                              | `processCrowdfundTick`, `handleResolveCrowdfund`           | Near duplicate crowdfund resolution paths both remove campaigns, adjust fame, and materialize assets, but only `processCrowdfundTick` is wired into `ADVANCE_DAY`. | MERGE  |
| MED      | `src/context/reducers/assetReducer.ts:21`, `src/utils/assetTicks.ts:193`                               | `handlePurchaseChassis`, `processCrowdfundTick`            | Near duplicate asset materialization builds `LongTermAsset` objects and slots in separate paths; drift already appears in DIY config lookup behavior.              | MERGE  |
| LOW      | `src/utils/numberUtils.ts:4`, `src/utils/gameStateUtils.ts:114`, `src/utils/audio/midiPlayback.ts:336` | `toFiniteNumber`, `finiteNumberOr`, local `toFiniteNumber` | Re-implemented finite-number fallback helpers overlap; the MIDI-local version additionally parses strings, which makes same-name semantics divergent.              | MERGE  |

## 2. ORPHANED / UNINTEGRATED EXPORTS

All entries below were verified with `rg` for zero app-source imports/usages outside their definition file. Test and documentation mentions are noted where they exist.

| Severity | file:line                                         | Symbol                                                                                   | Tests / docs / likely intent                                                                                         | True orphan vs public API                                                     | Action                              |
| -------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------- |
| HIGH     | `src/context/assetActionCreators.ts:413`          | `resolveCrowdfund`                                                                       | Tests: `tests/node/assetActionCreators.test.js`; obvious missing call site would be crowdfund tick resolution.       | True orphan in app source; action path is superseded by direct tick mutation. | DELETE or WIRE-UP                   |
| HIGH     | `src/context/assetActionCreators.ts:458`          | `assetRiskEventTriggered`                                                                | Tests: none beyond action-type presence; obvious missing call site would be `rollAssetRiskEvents`.                   | True orphan.                                                                  | DELETE or WIRE-UP                   |
| MED      | `src/components/assets/ForeclosureModal.tsx:19`   | `ForeclosureModal`                                                                       | Docs: named in `src/components/assets/AGENTS.md`; no tests; obvious missing call site after liability foreclosure.   | True orphan, likely intended-but-forgotten UX.                                | WIRE-UP                             |
| MED      | `src/components/assets/RiskEventModal.tsx:22`     | `RiskEventModal`                                                                         | Docs: named in `src/components/assets/AGENTS.md`; no tests; obvious missing call site after risk events.             | True orphan, likely intended-but-forgotten UX.                                | WIRE-UP                             |
| LOW      | `src/components/assets/LoanProfileModal.tsx:18`   | `LoanProfileModal`                                                                       | No tests; inline comment says future refinance flow; acquisition modal embeds profile selection instead.             | Legitimate future surface, but dead today.                                    | DELETE or INTEGRATE                 |
| LOW      | `src/scenes/kabelsalat/kabelsalatConstants.ts:97` | `CONNECTOR_TYPES`                                                                        | Docs mention it must derive from `CABLES`; no tests or src imports.                                                  | True orphan constant.                                                         | DELETE                              |
| LOW      | `src/data/hqItems.ts:733`                         | `ALL_HQ_ITEMS`                                                                           | Docs say to use it when flat iteration is needed; currently only used in same file to build `HQ_ITEMS_BY_MERCH_KEY`. | Legitimate public utility, currently no external consumer.                    | INTEGRATE or keep documented        |
| LOW      | `src/data/chatter/venueChatter.ts:1`              | `VENUE_CHATTER_DB`                                                                       | Tests import it; app source imports `VENUE_CHATTER_LOOKUP` instead.                                                  | Test seam, not player-facing orphan.                                          | KEEP or unexport with test refactor |
| LOW      | `src/data/songs.ts:42`                            | `transformSongsData`                                                                     | Tests import it; source uses it only inside the same file to build `SONGS_DB`.                                       | Test seam.                                                                    | KEEP or unexport with test refactor |
| LOW      | `src/hooks/minigames/useRoadieLogic.ts:56`        | `checkCollision`, `handleCrash`, `handlePickup`, `handleDelivery`                        | Tests import them; hook uses them internally.                                                                        | Test-only exports.                                                            | KEEP or unexport with test refactor |
| LOW      | `src/hooks/useAudioControl.ts:12`                 | `executeAudioAction`, `createAudioHandlers`, `getAudioSnapshot`, `createAudioSubscriber` | Tests import them; hook uses them internally.                                                                        | Test-only exports.                                                            | KEEP or unexport with test refactor |
| LOW      | `src/hooks/useGigEffects.ts:17`                   | `calculateChaosStyle`, `playBandMemberAnimation`, `applyChaosJitter`                     | Tests import them; hook uses them internally.                                                                        | Test-only exports.                                                            | KEEP or unexport with test refactor |

## 3. INCONSISTENCIES

| Severity | file:line                                                                                                                                                                                                                                | Symbol                                                                                            | Description                                                                                                                                                                                                                  | Action |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| HIGH     | `src/hooks/useTravelLogic.ts:303`, `src/hooks/useTravelLogic.ts:621`                                                                                                                                                                     | `dailyCost`                                                                                       | Travel affordability and confirmation still call `calculateGuaranteedDailyCost(player, band, social)`, so long-term asset upkeep/revenue and liability payments are ignored even though arrival calls `advanceDay()`.        | FIX    |
| HIGH     | `src/context/reducers/assetReducer.ts:34`, `src/context/reducers/assetReducer.ts:302`                                                                                                                                                    | `configTier`                                                                                      | Purchase and sell paths rebuild DIY tiers with `buildDiyTier(legitTier)` instead of reading `CHASSIS_CONFIG[kind][flavor][tier]`, violating the asset config source-of-truth rule and diverging from `processCrowdfundTick`. | FIX    |
| HIGH     | `src/context/reducers/playerReducer.ts:32`, `src/context/reducers/playerReducer.ts:39`                                                                                                                                                   | `handleUpdatePlayer`                                                                              | Reducer-side payload authority accepts `typeof value === 'number'`; hostile `NaN`/`Infinity` bypassing the action creator is clamped to `0`, mutating money/fame instead of rejecting the field.                             | FIX    |
| HIGH     | `src/context/reducers/bandReducer.ts:52`, `src/context/reducers/bandReducer.ts:101`, `src/context/reducers/bandReducer.ts:106`                                                                                                           | `handleUpdateBand`                                                                                | Reducer-side member updates use bare `typeof === 'number'` for harmony/mood/stamina and do not sanitize `staminaMax`, allowing malformed numeric payloads to collapse or persist in band state.                              | FIX    |
| MED      | `src/components/assets/ChassisAcquisitionModal.tsx:155`, `src/components/assets/ModulePickerModal.tsx:234`, `src/ui/shared/GeneratedImagePanel.tsx:63`, `src/components/overworld/OverworldMap.tsx:148`, `src/scenes/ClinicScene.tsx:28` | `var(--color-void)`, `var(--color-blood)`, `var(--color-toxic-red)`, `var(--color-void-black-90)` | Multiple components reference undefined CSS color tokens; the real tokens are `--color-void-black`, `--color-blood-red`, etc.                                                                                                | FIX    |

## 4. DEAD / UNREACHABLE CODE

| Severity | file:line                                                                   | Symbol                                                        | Description                                                                                                                              | Action            |
| -------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| HIGH     | `src/context/actionTypes.ts:66`, `src/context/reducers/assetReducer.ts:377` | `RESOLVE_CROWDFUND`, `handleResolveCrowdfund`                 | Reducer case is reachable only by malformed/manual dispatch; normal campaign resolution is performed directly by `processCrowdfundTick`. | DELETE or WIRE-UP |
| MED      | `src/context/actionTypes.ts:68`, `src/context/reducers/assetReducer.ts:460` | `ASSET_RISK_EVENT_TRIGGERED`, `handleAssetRiskEventTriggered` | Risk events are applied directly inside `rollAssetRiskEvents`; no source path dispatches this action creator/case.                       | DELETE or WIRE-UP |
| MED      | `src/components/assets/ForeclosureModal.tsx:19`                             | `ForeclosureModal`                                            | The modal cannot render because no scene/hub state ever mounts it after `processLiabilityTick` removes an asset.                         | WIRE-UP           |
| LOW      | `src/scenes/kabelsalat/kabelsalatConstants.ts:97`                           | `CONNECTOR_TYPES`                                             | Constant is derived correctly but never consumed in source or tests.                                                                     | DELETE            |

## 5. MISSING INTEGRATION

| Severity | file:line                                                                      | Symbol                                           | Description                                                                                                                                                    | Action            |
| -------- | ------------------------------------------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| HIGH     | `src/hooks/useTravelLogic.ts:303`, `src/hooks/useTravelLogic.ts:621`           | `calculateGuaranteedDailyCost` call sites        | Long-term asset obligations are not integrated into travel resource checks, so a player can confirm travel without cash for same-day liability/upkeep effects. | INTEGRATE         |
| HIGH     | `src/utils/assetTicks.ts:132`, `src/components/assets/ForeclosureModal.tsx:19` | `processLiabilityTick`, `ForeclosureModal`       | Foreclosures remove assets and apply fame loss with no mounted modal or toast path, despite a dedicated modal existing.                                        | WIRE-UP           |
| MED      | `src/utils/assetTicks.ts:299`, `src/components/assets/RiskEventModal.tsx:22`   | `rollAssetRiskEvents`, `RiskEventModal`          | Risk events emit warning toasts only; the full event card surface is never opened.                                                                             | WIRE-UP           |
| MED      | `src/utils/assetTicks.ts:193`, `src/context/assetActionCreators.ts:413`        | `processCrowdfundTick`, `resolveCrowdfund`       | Crowdfund success/fail resolution bypasses the action creator/reducer action path entirely; choose one authority.                                              | DELETE or WIRE-UP |
| MED      | `src/utils/assetTicks.ts:299`, `src/context/assetActionCreators.ts:458`        | `rollAssetRiskEvents`, `assetRiskEventTriggered` | Risk-event state mutation bypasses the dedicated action creator/reducer pair.                                                                                  | DELETE or WIRE-UP |

## Summary

Counts:

| Category                        | Count |
| ------------------------------- | ----: |
| Duplicates                      |     3 |
| Orphaned / unintegrated exports |    12 |
| Inconsistencies                 |     5 |
| Dead / unreachable code         |     4 |
| Missing integration             |     5 |

Top 10 highest-impact items:

1. `useTravelLogic` ignores long-term asset obligations during travel affordability checks.
2. `assetReducer` rebuilds DIY chassis tiers instead of using `CHASSIS_CONFIG` as source of truth.
3. `handleUpdatePlayer` lets hostile non-finite numeric payloads mutate money/fame.
4. `handleUpdateBand` lets malformed numeric member payloads collapse or persist.
5. Foreclosures have no wired player-facing feedback despite `ForeclosureModal`.
6. Crowdfund resolution has two overlapping authorities, with the action path dead in app source.
7. Asset risk events have a dead action/reducer path while tick code mutates directly.
8. `RiskEventModal` is present but never mounted.
9. Undefined color tokens cause several UI surfaces to miss intended styling.
10. Test-only exports are widespread; deleting or privatizing them requires coordinated test refactors.
