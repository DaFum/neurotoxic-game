# Code-Quality Audit — `src/` (2026-10-05)

Read-only audit of `main` @ `ac2b303cf`, prepared as input for an autonomous fix pass. No source files were modified.

## Method

- **Scope.** All of `src/` (about 810 TS/TSX/JS files). `tests/` was checked only for stale references.
- **Conventions.** Root `AGENTS.md`/`CLAUDE.md` and the nested `AGENTS.md` for each audited area. Items already marked intentional in `docs/dead-code-triage.md` are left out unless that doc is now wrong about them.
- **Orphan detection.**
  - The default `pnpm exec knip` run reports 9 findings, within the budget of 10. It treats `tests/**` as entry points, so exports used only by tests never show up there.
  - A second knip pass used only `src/main.tsx!` and `api/**!` as production entries.
  - A TypeScript-AST import graph covered barrels, `export *`, `import()` and `import.meta.glob`. Both methods agree on every value export.
  - Every candidate was then grep-checked across `src/`, `tests/`, `scripts/` and `docs/`.
- **Locales.** `tests/locale/full.test.js` passes (15/15). On top of that, a scratchpad script checked 4,145 static `ns:key` references and 121 dynamic template keys against their source enums and registries.
- **Spot-checks.** Findings tagged **[V]** were re-checked by hand before writing this report.
- **Severity.**
  - **HIGH:** player-visible bug, unreachable feature, or a type-safety hole.
  - **MED:** convention violation with a real failure mode, or a drifted duplicate.
  - **LOW:** cleanup.
- **Actions.**
  - **DELETE**, **MERGE**, **INTEGRATE**, **FIX** as requested.
  - **UNEXPORT:** keep the symbol and drop its `export`.

> **Gate caveat.** Several "missing integration" items (§5.2, §5.3) are specified in `docs/superpowers/plans/roguelite-expedition/0*.md`. Before INTEGRATE or DELETE, check whether the UI wiring is a pending gate task. Per `AGENTS.md`, the plan section is the binding contract.

---

## Executive summary — top 10

| # | Sev | Finding | Action |
|---|---|---|---|
| 1 | HIGH | `src/types/*.d.ts` reference `PlayerState`, `BandState` and other types they never import. `skipLibCheck` hides about 178 errors, so `GameState.player` and `GameState.band` are silently `any` (§3.1) **[V]** | FIX |
| 2 | HIGH | The three Expedition quests have no offer path, so Ascension can never be earned in real play (§5.1) **[V]** | INTEGRATE |
| 3 | HIGH | Insolvent-Career between-tour decision `sponsor_advance` shows raw i18n keys on its text and both buttons (§3.6) **[V]** | FIX |
| 4 | HIGH | 12 Expedition/Career dispatch methods have complete reducers but no UI caller (§5.2) **[V]** | INTEGRATE (per plan) |
| 5 | HIGH | Kabelsalat never mounts `MinigameSceneFrame`, so it has no SKIP and no DEV backdoor (unlike Roadie and Amp), and its skip branches are dead (§5.4) **[V]** | INTEGRATE |
| 6 | HIGH | `dealHandlerUtils.ts` is orphaned and tested, while the drifted production copy in `sponsors.ts` is NaN-unsafe and untested (§1.1) **[V]** | MERGE |
| 7 | HIGH | `reststop_trunk_dealer` charges €120 for `c_diy_overdrive`, an item that doesn't exist (§4.1) **[V]** | FIX |
| 8 | HIGH | The `neuro_overclock` graft writes raw i18n keys as the trait's name and description, plus `health`/`stress` fields that nothing reads (§4.2) **[V]** | FIX |
| 9 | MED | `handlePurchaseChassis` doesn't re-check the DIY+loan or loan-eligibility rules its creator enforces, so the reducer isn't authoritative (§3.2) | FIX |
| 10 | MED | Two save-validation pipelines (`saveValidator` vs `stateSanitizers`) have drifted. `gigModifiers` loses `damaged_gear` on reload (§1.4) | MERGE |

---

## 1. DUPLICATES

### 1.1 Exact or near-duplicates with drift (fix first)

| Sev | Locations | Description | Action |
|---|---|---|---|
| HIGH | `src/hooks/postGig/handlers/dealHandlerUtils.ts:18` (`buildAcceptDealQuestEvents`) ↔ `src/domain/expedition/sponsors.ts:257-277` (inline in `resolveBrandDealAcceptance`) | The whole file is orphaned: nothing reachable from `main.tsx` imports it, and only `tests/ui/postGigHandlerLogic.test.jsx:6` uses it. The live copy reads `brandReputation?.[x] ?? 0` (NaN leaks; breaks the `finiteNumberOr` rule) and drops the `if (deal.alignment)` guard. The tests cover the dead copy. **[V]** | MERGE: port the `finiteNumberOr` and alignment guard into `sponsors.ts`, retarget the tests at `resolveBrandDealAcceptance`, then DELETE `dealHandlerUtils.ts` |
| MED | `src/utils/saveValidator.ts:158-182` (`checkPrototypePollution`) ↔ `src/utils/objectUtils.ts:49-95` (`hasForbiddenKeysDeep`) | The validator copy has no `WeakSet` and no depth cap, so a cyclic or very deep save overflows the stack. Breaks the AGENTS rule on recursive utilities. | MERGE: call `hasForbiddenKeysDeep` and throw `StateError` |
| MED | `src/context/initialState.ts:195-221` (`sanitizeGigModifierUpdates`) ↔ `src/context/reducers/sanitizers/stateSanitizers.ts:1558-1585` (`sanitizeGigModifiers`) | The load copy only iterates `DEFAULT_GIG_MODIFIERS` keys, so it drops `damaged_gear`. That modifier is set at `minigameReducer.ts:443,737`, read at `gigModifiersUtils.ts:143`, and persisted (`usePersistence.ts:89`). | MERGE onto one whitelist that includes `damaged_gear` |
| MED | `src/utils/saveValidator.ts:83-311` (`validatePlayer`/`validateBand`) ↔ `stateSanitizers.ts:653-1046` (`sanitizePlayer`/`sanitizeBand`) | **Drift between the two pipelines:**<br>• `clinicVisits` is integer-clamped only in the validator; a direct `LOAD_GAME` skips that and a negative value lowers the cost curve at `clinicReducer.ts:77`.<br>• Member mood has no floor in the validator, while `clampMemberMood` floors.<br>**Unclamped on load:** `score`, `tutorialStep`, `eventsTriggeredToday`, `totalTravels`, `passiveFollowers` (`:686-725`); `tempo`, `style`, `crit` (`:928-940`); `inventorySlots` (`:828`). | MERGE: make the sanitizers authoritative and keep the validator structural only |
| MED | `src/utils/gameState/delta.ts:209-~470` (`calculateAppliedDelta`) ↔ `delta.ts:~515-900` (`applyEventDelta`) | The preview hand-mirrors the apply step and has drifted: preview shows `player.day` raw while apply floors and clamps it to ≥1 (`:262` vs `:601-607`), and preview shows `player.stats` unclamped (`:265` vs `:561-580`). | MERGE: build the preview by applying to a snapshot and diffing |
| MED | `src/domain/expedition/insurance.ts:144` (`resolveExpeditionInsuranceClaim`, test-only) ↔ `src/context/reducers/expeditionReducer.ts:172-193`, `:1472-1491`, `:1546-1568` | Claim resolution is re-implemented three times in the reducer, and the restore value `25` is hardcoded in all of them plus `insurance.ts:177,185`. | MERGE: call the resolver, or share a restore constant |
| MED | `src/domain/expedition/crew.ts:58-70` (`validateExpeditionCrewSelection`, test-only) ↔ `src/domain/expedition/loadout.ts:701-708` | The 3-crew cap, duplicate check and availability check exist in both, with the cap `3` hardcoded twice. The `loadout.ts` copy rejects *unavailable* crew with `'CREW_DUPLICATE'` (`:707`), which is the wrong code. Plan 03:215 names `crew.ts` as the API. | MERGE into `crew.ts` and FIX the reason code |
| MED | `src/domain/expedition/injuries.ts:74-84` (`canPerformExpeditionGig`, test-only) ↔ `condition.ts:329-333` (`canStartExpeditionPreGig`) ↔ `failure.ts:327-331` (`getCrewFailureSignal`) | The same `bandInjuryByMemberId[id] === 'critical'` loop appears three times; the named helper is the copy production never calls. | MERGE: call `canPerformExpeditionGig` from the other two |
| MED | `src/domain/expedition/failure.ts:219-226` ↔ `src/domain/expedition/repairs.ts:149-155,205` | Professional-repair pricing (`Math.ceil(missing*10)*mult`) and the cannibalize `>= 55` threshold are duplicated. **PLAUSIBLE bug:** `hasLegalTechnicalRecovery` (`failure.ts:256-279`) ignores `improvise`, which `repairs.ts:173-193` always allows, so the "no legal recovery" termination path can fire while a repair is still on offer. | MERGE: derive the controls from `resolveExpeditionRepair` |
| MED | `src/domain/expedition/runResources.ts:27-52` (`getExpeditionConditionBand`: good/worn/critical/breaking) ↔ `src/domain/expedition/inspections.ts:33-40` (`getConditionBand`: optimal/degraded/critical/disabled) | Same 70/40 thresholds, but "critical" means a different range in each. | MERGE onto one band table |
| MED | `src/utils/mapUtils.ts:339,369-381` (`checkSoftlock`) ↔ `src/hooks/useBloodBank.ts:45-48` | Blood-bank payout `Math.floor(base * (1 + fameLevel*0.2))` is duplicated. | MERGE into a `calculateBloodBankPayout` in `bloodBankUtils.ts` |
| MED | `src/ui/PirateRadioModal.tsx:28-195` ↔ `src/ui/ZealotryActionModal.tsx:46-157` | `usePirateRadio` already uses `ZealotryActionConfig` and `useZealotryAction`. The modal still hand-rolls `StatRow`, the disabled-reason ladder, and a `?? 0` affordability check. `DarkWebLeakModal` and `CultIndoctrinationModal` are already thin wrappers. | MERGE: make it a label wrapper |
| MED | `src/ui/bandhq/hooks/useBandHQLogic.ts:50-57,117-129` ↔ `src/ui/bandhq/hooks/usePurchaseLock.ts:34-63` | Band HQ hand-rolls a `processingItemId` lock, and its void-trade release skips the yield that `usePurchaseLock` exists to add. That hook's docs say it is shared with Band HQ, but only `SupplyStopModal.tsx:64` uses it. | MERGE: use `runWithLock` |
| MED | `src/domain/expedition/meta.ts:220` (`EXPEDITION_META_UNLOCK_QUEST_ID`) ↔ `src/data/questsConstants.ts:175` (`QUEST_EXPEDITION_META_UNLOCK`, 0 refs) | Same literal `'quest_expedition_meta_unlock'` in two constants. **[V]** | MERGE: `meta.ts` imports from `questsConstants` |

### 1.2 Re-implemented utilities

| Sev | Locations | Description | Action |
|---|---|---|---|
| MED | Weighted pickers: `src/domain/expedition/map.ts:179` (`pickWeighted`, `cursor < 0`), `pressure.ts:253-258` (`roll <= 0`), `src/data/chatter/index.ts:171-188`, `src/utils/contrabandUtils.ts:78-96` (`pickRarity`, `r < w`), `src/hooks/preGig/usePreGigHandlers.ts:296-309` | Four or five weighted-random pickers with inconsistent boundary handling. | MERGE into `pickWeighted(entries, rng)` in `selectionUtils.ts`, keeping the same rng call count so seeds don't shift |
| MED | Seeded RNGs: `src/utils/mapGenerator.ts:45-58` (LCG 9301/49297/233280) ↔ `src/utils/seededRng.ts:19` (`mulberry32`) | The map generator also coerces its seed with `Number(seed)` and falls back to `Date.now()`. | FIX the seed handling now (`isFiniteNumber` + `IClock`); switch the algorithm only as a deliberate migration, since it changes every map |
| LOW-MED | Float 0..100 clamps: `src/domain/expedition/pressure.ts:53,388`, `crowdHype.ts:5`, `runResources.ts:99,160,168`, `src/context/reducers/sanitizers/expeditionSanitizers.ts:1179-1182,1654`, `src/utils/economy/minigameLogic.ts:27` | Re-inlined because `clamps.ts:122` only provides the flooring `clamp0to100`. `expeditionSanitizers.ts:537-539` re-clamps condition even though `clampCondition` exists (`condition.ts:39`). `clampUnit` is re-inlined at `map.ts:118,353`. | MERGE: add a non-flooring `clampPercent(value: unknown)` and use `clampCondition` |
| LOW | `src/domain/expedition/cargo.ts:26` ↔ `src/domain/expedition/loadout.ts:403` (`isNonNegativeInteger`), plus inline copies at `expeditionSanitizers.ts:131,143` | Same predicate defined twice and inlined twice more. | MERGE into `src/utils/finiteNumber.ts` |
| LOW | `src/utils/gameState/delta.ts:783` ↔ `src/domain/questRewards.ts:157` | Member skill 1..10 clamp inlined twice; one copy floors and the other doesn't. | MERGE: add `clampMemberSkill` |
| LOW | Hashes: `src/utils/stringUtils.ts:9` (`hashString`, `\| 0`) ↔ `src/domain/expedition/defects.ts:33` (`>>> 0`); FNV-1a ×3 at `map.ts:140`, `mapGenerator/cityTraits.ts:54`, `runDrafts.ts:12` | Same hash algorithms with different signedness. | MERGE into `hash31`/`fnv1a32` with byte-identical outputs |
| LOW | `src/context/reducers/sanitizers/careerSanitizers.ts:53`, `stateSanitizers.ts:872,894` | The forbidden-key triad is spelled out by hand, or only `'__proto__'` is checked, instead of using `isForbiddenKey`/`hasForbiddenOwnKeys`. `objectUtils.ts:28-35` warns against exactly this. | FIX |
| LOW | `src/components/overworld/hooks/useOverworldUrls.ts:97-111` (`escapeSvgText`) ↔ `src/context/reducers/tradeReducer.ts:22-28` (`ESCAPE_MAP`) | Duplicated SVG/HTML escaping. | MERGE into a utils helper |
| LOW | `src/utils/mapUtils.ts:305-309` ↔ `src/utils/travelUtils.ts:358-359` | Travel cash-required formula `Math.max(totalCost, totalCost + dailyObligations)` is copied; the comment says "mirrors". | MERGE |

### 1.3 Duplicated constants / magic numbers

| Sev | Locations | Description | Action |
|---|---|---|---|
| MED | Controversy `40`: `calculateTicketIncome.ts:68`, `calculateMerchIncome.ts:73-74`, `src/data/postOptions.ts:374`, `src/data/events/consequences.ts:99`, `src/data/events/crisis.ts:268` | The "high controversy" threshold is hardcoded in five places. The "cult" gate `controversy>=40 && loyalty>=20` is duplicated as well. | MERGE into `BALANCE_CONFIG` |
| LOW | Loan default `7`: `src/components/assets/LiabilitiesPanel.tsx:75` ↔ `src/utils/assetTicks.ts:234,282` | No shared constant. | FIX: export a constant |
| LOW (PLAUSIBLE) | Repair price per point: `assetConfig.ts:93` (8, `round`), `logisticsLogic.ts:204-207` (`ceil`), `data/expedition/betweenTour.ts:65` (12), Expedition professional repair (10) | Possibly separate concepts. | Confirm and document, or MERGE |

### 1.4 UI component duplicates

| Sev | Locations | Description | Action |
|---|---|---|---|
| MED | Modal shells: `src/ui/BandHQ.tsx:24-31,46-69`, `src/ui/BloodBankModal.tsx:216-246`, `src/ui/EventModal.tsx:450-508`, `src/ui/shared/BrutalistUI.tsx:374-401` (`CrisisModal`); focus trap in `OverworldMenu.tsx:596-632` | Four hand-rolled dialog shells bypass `src/ui/shared/Modal.tsx`, so they lose the modal stack, focus trap, `inert` and focus restore. `EventModal` and `CrisisModal` are near copy-paste of each other. `BandHQ`'s window-level Escape listener would double-fire with `Modal`'s. | MERGE onto `Modal`, or a shared `DialogShell` |
| MED | Tablist keyboard handling: `src/ui/bandhq/BandHQTabsList.tsx:48-85`, `src/ui/bandhq/leaderboard/components/LeaderboardTabs.tsx:~18-50`, `src/scenes/PreGig.tsx:24-58` | Arrow/Home/End handling copied three times. `AssetsBottomTabs.tsx:35-50` and `TourPrepLoadout.tsx:449-458` declare `role='tablist'` but have no keyboard handling at all. | MERGE into a `useRovingTabs` hook or `Tabs` primitive |
| MED | Progress bars: `AmpHUD.tsx:35-39,68-72,137-141`, `ZealotryGauge.tsx:44-51`, `KabelsalatBoard.tsx:76`, `SetlistBlock.tsx:86`, `TourPrepLoadout.tsx:832`, `MerchPressModal.tsx:228-233` | These bypass `ui/shared/ProgressBar.tsx`. None sets `role='progressbar'`, and the AmpHUD and SetlistBlock widths are unclamped. | MERGE |
| LOW | `src/ui/HUD.tsx:62-91` ↔ `src/ui/overworld/OverworldHUD.tsx:50-96` | Duplicated player-status card (money row with the same `< 40` threshold, day/location row, `VanStatusMiniBars`). | MERGE into a `PlayerStatusCard` |
| LOW | `src/App.tsx:121-123` ↔ `src/components/MinigameSceneFrame.tsx:50-52` | The CRT overlay is rendered twice in Tourbus, Roadie and Amp, so the effect stacks. | DELETE the frame copy |
| LOW | `src/components/assets/RiskEventModal.tsx:39-49` ↔ `components/assets/shared/ConfirmButton.tsx` | Hand-styled copy of `ConfirmButton`. | MERGE |
| LOW | `ui:button.cancel`, `ui:cancel`, `ui:action_cancel`, `ui:dark_web_leak.cancel`, `ui:cult_indoctrination.cancel` | Five locale keys for "Cancel". | MERGE onto one key |
| LOW | Disclosure boilerplate in `useBandHQModal.ts:12-26`, `useQuestsModal.ts:8-14`, `useMerchPress.ts:15-18`, `useBloodBank.ts:37-40`, `useZealotryAction.ts:28-30`, `useClinicLogic` | `useState(false)` plus open/close callbacks repeated six times. All of them are wired; this is a merge opportunity only. | MERGE into `useDisclosure` (optional) |

---

## 2. ORPHANED / UNINTEGRATED CODE

Counted against **production** reachability from `src/main.tsx`. Totals: 336 exports have no production import (175 values, 161 types).

### 2.1 Clear orphans (0 references in src, tests, scripts or docs)

| Sev | Symbol | File:line | Notes | Action |
|---|---|---|---|---|
| MED | `useGameStore` | `src/context/GameState.tsx:316` | Its TSDoc mentions chatter scheduling, which no longer uses it. The `GameStore` type is still used internally. | DELETE |
| LOW | `QUEST_EXPEDITION_RUN_GOAL`, `QUEST_EXPEDITION_NEMESIS`, `QUEST_EXPEDITION_META_UNLOCK` | `src/data/questsConstants.ts:165,170,175` | The quest files hardcode the literals instead. **[V]** | INTEGRATE: use them in `src/data/quests/quest_expedition_*.ts` and `meta.ts` (see §1.1) |
| LOW | `stopAmbientPlayback` (barrel re-export) | `src/utils/audio/audioEngine.ts:32` | The definition at `transportControl.ts:34` is only used inside its own file. | DELETE the barrel line and UNEXPORT the definition |
| LOW | `EVENT_CATEGORIES`, `EventCategory` (re-export) | `src/data/events/index.ts:24` | Consumers import `./categories` directly. | DELETE the re-export |
| LOW | `AudioState`, `AudioControls` (re-export) | `src/types/components.d.ts:19` | Consumers import from `types/audio`. | DELETE the re-export |
| LOW | `setGameMap` | `src/context/useGameDispatchActions.ts:477-482` | Documented as an "intentional test seam", but 0 references in src and tests alike. | DELETE, or add the promised test |
| LOW | `setScreenshotMode` | GameDispatchActions | 0 consumers. PLAUSIBLE: the screenshot skill injects `isScreenshotMode` straight into state, so `SET_SCREENSHOT_MODE` as a whole may be dead. | DELETE (check the skill script first) |

### 2.2 Test-only (missing integration, or a superseded copy)

| Sev | Symbol | File:line | Evidence | Action |
|---|---|---|---|---|
| HIGH | `buildAcceptDealQuestEvents` (whole file) | `src/hooks/postGig/handlers/dealHandlerUtils.ts:18` | See §1.1. **[V]** | MERGE + DELETE |
| HIGH | `getExpeditionCrisisChoices` | `src/domain/expedition/failure.ts:547-577` | Only `expeditionFailure.test.js` calls it. See §5.5. | INTEGRATE or DELETE |
| MED | `revealExpeditionDefect`, `triggerExpeditionDefect`, `resolveExpeditionDefect` | `src/context/expeditionActionCreators.ts:495,520,547` | 0 src references outside the definition; 3 test refs each. Reducer cases are wired (`gameReducer.ts:269-271`), but defects change state through other routes (`expeditionReducer.ts:1616,1628,1861,1887`; `defects.ts:137`). `handleTriggerExpeditionDefect` (`:1757`) duplicates the damage logic. The TSDoc names params that don't exist (`source`, `repairResolutionId`). | DELETE the type, creator and handler trio, or INTEGRATE into the inspect/repair flows per plan 02:415-417 |
| MED | `createAdvanceQuestAction` / `advanceQuest` dispatch | `src/context/actionCreators.ts` (~960); `src/context/useQuestDispatchActions.ts:35` | 0 production callers (12 test refs). Quest progress actually flows through `APPLY_QUEST_EVENT`. | DELETE, or mark `@internal` test-only |
| MED | `canPerformExpeditionGig` | `src/domain/expedition/injuries.ts:74` | See §1.1. | INTEGRATE |
| MED | `validateExpeditionCrewSelection` | `src/domain/expedition/crew.ts:58` | See §1.1. | INTEGRATE |
| MED | `resolveExpeditionInsuranceClaim` | `src/domain/expedition/insurance.ts:144` | See §1.1. | INTEGRATE |
| MED | `isStoryFlag` | `src/data/flags.registry.ts:79` | Its TSDoc says it narrows flags "from a save file", but the load path (`systemReducer.ts:233`) uses `sanitizeStringArray`, which accepts any string. Possibly kept for legacy flags. | INTEGRATE as a load filter, or document why not |
| MED | `materializeCommittedContracts` | `src/domain/expedition/contracts.ts:168` | Used only by `expeditionG4Systems.test.js` and `expeditionLegendaries.test.js`. | INTEGRATE or DELETE (check plan 04) |
| MED | `isExpeditionFinaleReachable` | `src/domain/expedition/map.ts:677` | Its TSDoc claims it "is asserted on every built map", but `buildExpeditionMap` never calls it. | INTEGRATE into the builder/validator, or FIX the doc |
| LOW | `FIRST_EXPEDITION_EXTRACTION_ROUTE_STEP` | `src/domain/expedition/map.ts:73` | Superseded by `routeProfile.extractionWindowRange` (`:448`); the TSDoc is misleading. | DELETE and update the test |
| LOW | `getExpeditionNodePublicFacts` | `src/domain/expedition/map.ts:637` | The likely consumer is a node tooltip in `ExpeditionRunControls`. | INTEGRATE or DELETE |
| LOW | `isRegisteredBreakdownLabelKey` | `src/utils/economy/breakdownLabelKeys.ts:64` | Test only. | INTEGRATE in the breakdown renderer, or DELETE |
| LOW | `HQ_FACILITY_IDS`, `EXPEDITION_UNLOCK_SET_IDS` | `src/data/expedition/hqFacilities.ts:33`, `src/data/expedition/unlockSets.ts:96` | Tests only. | UNEXPORT |
| LOW | `CANONICAL_LEADERBOARD_IDS` | `lib/leaderboardSongIds.js:1` (outside `src/`) | Used only by `tests/api/leaderboard.song.test.js`. | Confirm intent |
| — | Deliberate test oracles and tooling: `findExpeditionRewardsWithUnreachableTarget`, `getContrabandValidationFailures`, `BASE_EXPEDITION_REGION_ID`, `GIG_CLOCK_DRIFT_TOLERANCE_MS`, `doesLegacyHqItemTouchExpedition`, `resolveBalanceTuning`, `BALANCE_RECOMMENDATION_HOLD`, `createCrewDevelopmentEligibilityProof` | various | Plan- or script-backed. | KEEP; record them in `docs/dead-code-triage.md` |
| — | Test seams: `ClockProvider`, `StorageProvider`, `NoopAdapter`, `createFixedClock`, `resetStorageFallback`, `NullAudioEngine`, `createStubAudioEngine`, `__testInternals` (crypto, unlockManager), `resetLastMinigameFallback` | various | Explicit DI/reset seams. | KEEP; record them in the triage doc |
| LOW | 16 test-only barrel re-exports in `src/utils/audio/audioEngine.ts:9-63` (`getRawAudioContext`, `withAudioContext`, `safeDispose`, `calculateGigTimeMs`, `startGigClock`, `playMidiFile`, `NOTE_TAIL_MS`, …) | — | Production imports the leaf modules; tests go through the barrel. | Either declare the barrel a facade in the triage doc, or repoint the tests and drop the lines |

### 2.3 Unnecessary exports (used only inside their own file)

There are 273 in total: 153 are fully internal (mostly `*Props`/`*Return` types), 117 are exported only so tests can reach them, and 3 are also used by scripts. The ones worth acting on:

| Sev | Symbol | File:line | Action |
|---|---|---|---|
| LOW | `ValidatedMap` | `src/utils/mapValidation.ts:38` | UNEXPORT. The triage demoted it to private and commit `682160f92` re-exported it; default knip flags it again. |
| LOW | `DRUM_HANDLERS` | `src/utils/audio/drumMappings.ts:20` | UNEXPORT |
| LOW | `GameDispatchActions`, `GameStore` | `src/context/GameState.tsx:51,53` | UNEXPORT |
| LOW | `{Asset,Career,Expedition,Minigame}DispatchActions` | `src/context/use*DispatchActions.ts` | UNEXPORT |
| LOW | `PurchaseChassisInput`, `InstallModuleInput`, `StartCrowdfundInput` | `src/context/assetActionCreators.ts:125,224,510` | UNEXPORT |
| LOW | `SectionView`, `AssetSectionTab` | `src/components/assets/sectionRegistry.ts:19`, `sectionTabs.ts:13` | UNEXPORT |
| LOW | `GeneratedMapNode`, `MapGeneratorState`, `VenuePools`, `MapValidationIssue`, `ArrivalNode`, `GigArrivalNode`, `ArrivalResult`, `ChassisTierConfig`, `ChassisKindConfig`, `AmpGameRefs`, `AmpGameSetters`, `ExpeditionCargo*`, `ExpeditionChassis*`, `ChassisDescriptor` | utils / domain | UNEXPORT |
| LOW | `SettingsPanel` re-export | `src/ui/shared/index.tsx:8` | DELETE the barrel entry. It is a feature composite (it includes save deletion), which breaks `src/ui/shared/AGENTS.md`; import it from the leaf in `SettingsTab.tsx:4` instead. |

### 2.4 Broken or stale test references

No test imports a missing module. The problems are mocks that point at the wrong module, so they silently do nothing.

| Sev | Location | Problem | Action |
|---|---|---|---|
| MED | `tests/ui/BrandDealsTab.test.jsx:20` | `vi.mock('../../src/utils/networkStatus')`: no such module (the hook is `src/hooks/useNetworkStatus.ts`). The real hook runs. | FIX the path |
| MED | `GameState.comprehensive.test.jsx:63`, `MainMenuStability.test.jsx:59`, `proceedToTour.bench.jsx:53`, `proceedToTourTime.bench.test.jsx:49`, `MainMenu.identity.test.jsx:37`, `MainMenu.test.jsx:39`, `useLeaderboardSync.test.jsx:14` | They mock `safeStorageOperation` on `utils/errorHandler`, but it lives in `utils/storage.ts`. | FIX the mock target |
| MED | `tests/ui/usePostGigLogic.test.jsx:68` | Mocks `generateBrandOffers` on `socialEngine`; it lives in `brandDealLogic.ts`. | FIX |
| LOW | `usePostGigLogic.test.jsx:18` (`extractActions`), `useRhythmGameLoop.test.jsx:16` (`checkCollisions`) | Mocked names that exist nowhere in src. | DELETE the keys |
| LOW | `BandHQ.test.jsx:74` (`getPrimaryEffect` on `usePurchaseLogic`), `audioSharedBufferUtils.test.js:7` (`setupAudio` on `audio/context.ts`), `utils/postGig/derivations.test.ts:20` (`socialEngine.SocialPostOption`) | Wrong module, or a symbol that isn't exported there. | FIX |
| LOW | 32 test files and helpers, including `useBloodBank.test.jsx:22`, `tests/useArrivalLogicTestUtils.js:82`, `tests/useRhythmGameLogicTestUtils.js:123`, `tests/mainMenuAudioTestUtils.js:90` | They mock `useGameState`, which was removed in `0c98dc7bc`. `useBloodBank.test.jsx` even drives behaviour through `useGameState.mockReturnValue`. | FIX: drop the stale key and check that each test still exercises `useGameSelector`/`useGameActions` |
| LOW | `GigIntegration.test.jsx:119`, `CrowdManager.test.js:120`, `BandHQStats.test.jsx:5` (`VolumeSlider` on the `ui/shared` barrel) | Extra keys for symbols that no longer exist; harmless. | Clean up |

---

## 3. INCONSISTENCIES

### 3.1 Type system

| Sev | File:line | Description | Action |
|---|---|---|---|
| **HIGH** | `src/types/game.d.ts:112-137`; same pattern in `src/types/actions.d.ts`, `band.d.ts`, `events.d.ts` | **Silently `any` state types.** `GameState` references `PlayerState`, `BandState`, `RivalBandState`, `SocialState`, `GameMap`, `Venue`, `QuestCooldown`, `QuestScopeCompletion`, `CharacterProfile` and `GigModifiers` without importing them. `game.d.ts` is a module (it has 8 `import type` lines), and these are `export interface` declarations in other modules (`player.d.ts:4`, `band.d.ts:57`, `quest.d.ts:302`), so the names don't resolve. `skipLibCheck: true` hides about 178 errors. A probe confirmed that assigning `{definitelyNot:true}` to `GameState['player']` compiles. This also explains why `QuestCooldown`, `QuestScopeCompletion`, `CharacterProfile` and `CompleteTravelMinigamePayload` look unused. **[V]** | FIX: add the missing `import type` lines and run one typecheck with `skipLibCheck: false`. Expect a lot of fallout, because many `state.player.*` reads are currently `any`; do this in its own PR. |

### 3.2 Reducer authority and sanitization

| Sev | File:line | Description | Action |
|---|---|---|---|
| MED | `src/context/reducers/assetReducer.ts:87-169` (`handlePurchaseChassis`) | Doesn't re-check DIY+loan (`assetActionCreators.ts:171-174`) or `isLoanProfileEligible` (`:190-201`). `handleRefinanceLiability` does (`assetReducer.ts:619-626`). A raw dispatch can finance a DIY chassis or bypass the fame/scenePresence gate. | FIX |
| MED | `src/context/reducers/expeditionReducer.ts:2165,2479,2517,2612,2640,2805`; `clinicReducer.ts:414`; `gigReducer.ts:93`; `socialReducer.ts:623` | These handlers dereference `payload` without a null/object guard, so a payloadless dispatch throws out of the root reducer. Every G1–G3 handler has the guard (e.g. `:669,:902,:1958`). `:2815` also indexes `EXPEDITION_SOCIAL_RESULTS[payload.resultId]` without `Object.hasOwn`. | FIX |
| MED | `src/context/reducers/playerReducer.ts:38-58` (`UPDATE_PLAYER`) | Validates only money and fame. `van.fuel`, `van.condition`, `day`, `time` and `location` merge raw, while `APPLY_EVENT_DELTA` (`delta.ts:583-607`) and load (`stateSanitizers.ts:771-778`) clamp them. | FIX |
| MED | `src/context/reducers/expeditionReducer.ts:174-185` (`applyVehicleInsuranceClaim`) | Uses `van?.condition ?? 100` and `van?.fuel ?? 0`. `Math.max(NaN,30)` is `NaN`, so NaN fuel or condition is written back. | FIX: `finiteNumberOr` + `clampVanFuel`/`clampVanCondition` |
| MED | `src/context/reducers/socialReducer.ts:164-179`, `:642-651`, `:549` | Player funds are read three different ways: `Number()` coercion, a strict `clampPlayerMoney` equality check that rejects fractional money, and `finiteNumberOr`. | FIX: one helper built on `isFiniteNumber` |
| MED | `src/ui/BandHQ.tsx:10` (`VOID_TRADER_CONTROVERSY_THRESHOLD = 30`) → prop-drilled into `BandHQTabsList.tsx:11,39-42` and `BandHQContentArea.tsx:28,183` | A gameplay gate enforced only in the UI; `tradeReducer.ts` has no controversy check. The `?? 1000` cost fallback is duplicated at `useBandHQLogic.ts:60,97`. | FIX: move it next to `VOID_TRADER_COSTS` (`src/data/contraband.ts:522`) and enforce it in the reducer or creator |
| LOW-MED | `src/context/actionCreators.ts:457-486` (`createAddToastAction`) + `src/context/reducers/systemReducer.ts:478-483` | Raw payload spread with no primitive-only sanitizing, contrary to `src/context/AGENTS.md`; `sanitizeSuccessToast` exists. `handleSetGig` (`gigReducer.ts:70-76`) and `handleSetMap` (`systemReducer.ts:459-469`) also store payloads unchecked. | FIX |
| LOW | `src/context/reducers/systemReducer.ts:719` | Risk-event toast id built inline as `` `risk_${assetId}_${eventType}_${day}` `` instead of `buildDeterministicToastId`, as `reducers/AGENTS.md` requires. | FIX |
| LOW | `src/context/expeditionActionCreators.ts:208-210` (`createPrepareExpeditionSponsorOffersAction`) | Throws a `TypeError` where its sibling creators return `null`. `useExpeditionDispatchActions.ts:100-112` doesn't catch it. | FIX: return `null` |
| LOW | `src/context/useAssetDispatchActions.ts:89-90` (`sellChassis`) | Skips `dispatchWithFailureToast`, unlike every other `*_FAILED` path. | FIX |
| LOW | `src/context/actionCreators.ts:164-169` | TSDoc on `createSettleSoldMerchAction` describes UPDATE_BAND. | FIX the doc |
| LOW | `src/context/reducers/expeditionReducer.ts:196-244` (`handleSettleSoldMerch`) | Settles normal band inventory outside any expedition run, but lives in the expedition reducer. | Move it to the band/gig reducer (optional) |

### 3.3 `Number()` coercion (forbidden in sanitizers)

| Sev | File:line | Action |
|---|---|---|
| MED | `src/context/actionCreators.ts:86` (`sanitizeNonNegativePayload`: `'50'` → 50, `true` → 1; covers PIRATE_BROADCAST, DARK_WEB_LEAK, MERCH_PRESS, BLOOD_BANK_DONATE), `:669` (`createCompleteTravelMinigameAction`), `:960` (`createAdvanceQuestAction`) | FIX → `isFiniteNumber` |
| MED | `src/utils/purchaseLogicUtils.ts:274,306`; `src/utils/eventEngine/eventEffectHandlers.ts:18` | FIX |
| LOW | `src/context/expeditionActionCreators.ts:214` (redundant after `isFiniteNumber`); `src/scenes/TourbusScene.tsx:41-50` (and its toast string is concatenated outside `t()`; compare the correct `RoadieRunScene.tsx:40-50`); `src/utils/mapGenerator.ts` (seed) | FIX |

### 3.4 `??` / `typeof === 'number'` letting NaN through (should be `finiteNumberOr`)

| Sev | File:line | Impact | Action |
|---|---|---|---|
| MED | `src/hooks/useEventSystem.ts:215,254` (`eventsTriggeredToday ?? 0`) | `NaN >= 2` is false, so the 2-events-per-day cap stops applying. | FIX |
| MED | `src/hooks/useMerchPress.ts:22,34-35`; `src/ui/PirateRadioModal.tsx:127,138`; `src/ui/MerchPressModal.tsx:224-251` | NaN `fameLevel` poisons the multiplier. `useBloodBank.ts:43-45` already fixed the same bug. | FIX |
| LOW | `src/context/assetActionCreators.ts:197,487`; `assetReducer.ts:622` (`scenePresence ?? 0`) | — | FIX |
| LOW | `src/domain/expedition/sponsors.ts:262` | See §1.1. | FIX |
| LOW | `src/utils/gameState/delta.ts:568-570` (`typeof === 'number'`), `:598-600` (`location`/`currentNodeId` assigned on truthiness, with no string check) | — | FIX |

### 3.5 Clock, RNG and region rules

| Sev | File:line | Description | Action |
|---|---|---|---|
| MED | `src/data/chatter/standardChatter.ts:38-49` (`isPlayerInCity`) | Matches with `includes()`/`startsWith()` on raw `player.location` instead of `getRegionKeyForLocation`. The substring match can mis-fire on short slugs. Related: `getRegionKeyForLocation` (`mapUtils.ts:144`) and `getCityKeyFromVenueId` (`cityTraits.ts:16`) disagree on underscore-less ids; that's latent, since all current venue ids have underscores. | FIX |
| LOW | `src/context/initialState.ts:285,355` | `rngSeed = Date.now() >>> 0` bypasses `IClock`. The neighbouring `runSeed` uses `getSecureRandomUint32` specifically to avoid this. | FIX |
| LOW | `src/utils/mapGenerator.ts:47`, `src/utils/logger.ts:158` | Direct `Date.now()` / `new Date()`. | FIX: inject `IClock` |
| LOW | `src/hooks/minigames/useTourbusLogic.ts:60`, `useRoadieLogic.ts:35` (`performance.now()` ids), `src/components/stage/AmpWaveManager.ts:61,68` (`Math.random()`) | Should use `getSafeUUID`/`getSafeRandom`. | FIX |
| LOW | `src/domain/expedition/nodeIntel.ts:192`, `defects.ts:76`, `map.ts:265` | Inline `Math.floor(rng()*len)` where `src/utils/AGENTS.md` requires `pickIndex`/`pickBoundedIndex`. Same rng call count, so seeds are unaffected. | FIX |
| MED (PLAUSIBLE) | `src/utils/eventEngine/eventEffectHandlers.ts:97-108` | `moodChange`/`staminaChange` are overwritten rather than accumulated, while every other stat accumulates. A composite event with two mood effects keeps only the last one. | FIX: accumulate |

### 3.6 i18n

EN/DE key sets are identical in every namespace (0 missing either way), with no plural or interpolation mismatches. The problems are code-to-locale.

| Sev | File:line | Missing or wrong key | Action |
|---|---|---|---|
| **HIGH** | `src/scenes/RunSummary.tsx:200,219`, driven by `src/data/expedition/betweenTour.ts:22,42` | `ui:expedition.betweenTour.sponsor_advance`, `…option.take_advance` and `…option.decline_advance` are missing in EN and DE, with no `defaultValue`. `sponsor_advance` has top priority, so an insolvent Career sees raw keys. **[V]** | FIX: add the keys to EN and DE |
| HIGH | `src/context/reducers/clinicReducer.ts:441-442` | `traits:neuro_overclock.name/.description` don't exist, and other traits use `.desc`, not `.description`. See §4.2. **[V]** | FIX |
| HIGH (edge) | `src/utils/effectFormatter.ts:84` | `ui:quest.unknown` is missing, and its `defaultValue` is the key itself. | FIX |
| HIGH (latent) | `src/utils/postGig/derivations.ts:224,231` | `economy:gigExpenses.swingDampener.detail` and `economy:gigIncome.swingBoost.detail` are missing. `detailKey` isn't rendered yet (`FinancialList.tsx`). | FIX |
| MED | `src/ui/bandhq/detailedStats/components/MemberEquipment.tsx:30` | No `ui:equipment.slots.*` keys exist. `defaultValue: k` shows the raw English slot id in DE. | FIX: add the keys |
| MED | `src/ui/bandhq/detailedStats/components/InventoryEquipmentSection.tsx:30` | `items:${key}.name` exists for none of the 15 inventory keys in `initialState.ts:123-138`. Items are keyed as `hq_*`, so the English fallback always shows. | FIX: add keys or a mapping |
| MED | `src/ui/expedition/FailureCrisisDialog.tsx:104` | `ui:expedition.crisis.source.${sourceId}` has keys for only 3 of the source-id families. Raw node, member and contract ids, and `authority:<runId>:<step>`, leak through `defaultValue`. | FIX: map ids to labels |
| LOW | `src/components/ChatterOverlay.tsx:248` | No `ui:chatter_labels` entries for PRACTICE, ASSETS, TOUR_PREP or RUN_SUMMARY; it falls back to "Band Feed". | FIX (optional) |
| LOW | `src/components/assets/ModulePickerModal.tsx:32` | Raw `reason.amount` goes into "Requires {{amount}} money" without `formatCurrency`. | FIX |
| LOW | `src/components/MinigameSceneFrame.tsx:26,28` | Hardcoded `'COMPLETE'` / `'CONTINUE'` default props. | FIX |
| LOW | `src/utils/eventEngine/eventSelection.ts:90` | `venue: String(player.location \|\| 'the venue')`: inserts a raw `venues:` key, with an English fallback. | FIX |
| LOW | `defaultValue`s using JS `${…}` instead of `{{…}}` in about 20 sites: `AmpCalibrationView.tsx:84-107`, `useBandHQLogic.ts:64`, `VoidTraderTab.tsx:102`, `MerchPressModal.tsx:185`, `CompletePhase.tsx:109,135`, `EventLog.tsx:85-104`, `TutorialManager.tsx:103`, `CrowdfundSetupModal.tsx:107,125`, `TourbusTrailerOverlay.tsx:49`, `SideEffectsSummary.tsx:92`, `CareerOverviewSection.tsx:63`, `VanConditionSection.tsx:25`, `InventoryEquipmentSection.tsx:54`, `useMinorHandlers.ts:117` | — | FIX |
| LOW | Percentages formatted with `toFixed` (no German decimal comma): `MapNodeView.tsx:138`, `StatsTab.tsx:67`, `VanConditionSection.tsx:19`, `LoanProfileModal.tsx:61`, `CrowdfundSetupModal.tsx:132`, `AmpHUD.tsx:183`, `useHandleTravel.ts:256` | — | FIX: add an `Intl` percent helper |
| LOW | `public/locales/*/ui.json` | `featureList.sec13.title/.description` both read "14. Quests". | FIX |
| LOW | `tests/locale/full.test.js` | Placeholder parity is enforced only for `economy`; the other 9 namespaces pass today but aren't guarded. | FIX: extend the test |

### 3.7 UI conventions

| Sev | File:line | Description | Action |
|---|---|---|---|
| MED | `src/ui/shared/ActionButton.tsx:15`; callers `src/scenes/PostGig.tsx:63-66`, `src/scenes/TourPrep.tsx:54-57` | `variant` is an untyped `string` that only styles `'primary'`. `'secondary'` (a `GlitchButton` variant) renders unstyled, so PostGig's escape-hatch button has no border. | FIX: type the union and correct the two callers |
| MED (PLAUSIBLE, needs a visual check) | `src/components/MinigameSceneFrame.tsx:57-65` ↔ `src/components/minigames/roadie/RoadieControls.tsx:31-40` | On md and wider, the SKIP button (`top-4 right-4`, z-modal) covers the Roadie controls toggle in the same spot. | FIX the layout |
| LOW | `src/ui/hud/shared/SharedHUDComponents.tsx:28-30` (`bg-warning-yellow`) ↔ `src/ui/bandhq/VanStatusBars.tsx:24` (`bg-fuel-yellow`) | Different fuel colour tokens. | FIX → `fuel-yellow` |
| LOW | `src/ui/shared/Modal.tsx:323-326` | Inlines four `UIFrameCorner` elements; `ui/shared/AGENTS.md` requires `FrameCorners`. | FIX |
| LOW | `src/components/minigames/amp/AmpCalibrationView.tsx:11` | Value import of `AmpStageController`, which is only used as a type. | FIX → `import type` |
| LOW | `src/hooks/travel/index.ts:22-25` | The doc claims `handleRefuel`/`handleRepair` are referentially stable, but `useVanMaintenance.ts:92,147` depend on the whole `player` object. | FIX the doc or the deps |

The UI layer is clean on hardcoded colours: no hex, rgb, hsl, named colours, arbitrary Tailwind colour values or Pixi `0x` fills outside the `index.css` tokens. It is also clean on `any`/`@ts-ignore`, `.propTypes`, Howler, direct `Tone.*` time reads, raw `dispatch({type})`, and payloadless `createAdvanceDayAction()`.

---

## 4. DEAD / UNREACHABLE CODE

| Sev | File:line | Description | Action |
|---|---|---|---|
| **HIGH** | `src/data/events/transport.ts:989,1005` (`reststop_trunk_dealer`) | **4.1.** Charges €120 (or €60 after a charisma check) for `item: 'c_diy_overdrive'`. That id isn't in `CONTRABAND_DB`, has no gear or effect definition and no locale entry; it lands as an inventory counter that nothing reads. The spec says the player gets a random contraband or equipment item. **[V]** | FIX: add the contraband entry, or grant a real item |
| HIGH | `src/context/reducers/clinicReducer.ts:428-446` (`handleGraftNeuroOverclock`) | **4.2.** `getTraitById('neuro_overclock')` can never hit (no such trait in `src/data`), so the fallback object always runs, with raw i18n keys as name and description (§3.6). Trait *presence* is read (`useRhythmGameLogic.ts:148`, `ClinicMemberCard.tsx:62`). The fields written alongside it are not: `member.health`/`member.stress` (`:435-436`, 0 readers, and not in the `sanitizeBand` whitelist so lost on reload) and the trait's `rhythmMultiplier`/`stressPerGig`/`healthPerGig` (`:444-446`, 0 readers). **[V]** | FIX: register `neuro_overclock` in the traits data and locales; DELETE or INTEGRATE the inert fields |
| MED | `src/hooks/useMinigameSceneLogic.ts:98-101,146-148,170` | Kabelsalat branches (Shift+P backdoor, skip, `canSkip`) are unreachable because `KabelsalatScene` never mounts `MinigameSceneFrame`. The Tourbus backdoor branch (`:90-93`) is dead too, because `TourbusScene.tsx:22-29` always passes `finishMinigame`. **[V]** | INTEGRATE (§5.4), or DELETE |
| MED | `src/domain/expedition/failure.ts:231-232,274` | `salvageRights = false` is hardcoded ("when later available"), but Salvage Rights exists (`legendaries.ts:437`). | FIX: wire it to `isExpeditionLegendaryAvailable(state,'salvage_rights')`, or DELETE the field |
| LOW-MED | `GameState.npcs`: `src/context/initialState.ts:270`, persisted at `usePersistence.ts:88`, sanitized at `stateSanitizers.ts:1523` / `systemReducer.ts:251` | Persisted and sanitized, but 0 reads or writes elsewhere in src (3 test refs). | DELETE, following the `PERSISTED_FIELDS` checklist |
| LOW | `band.banterEvents`, written at `src/utils/gameState/delta.ts:655-672` | Write-only (0 readers) and dropped by `sanitizeBand` on load. | DELETE or INTEGRATE |
| LOW | `src/data/hqItems/hq.ts:17,27,54,65,75,85,95` (`unlock_hq` `effect.id`s) + `src/domain/expedition/legacyHqPolicy.ts:104-110` | `applyUnlockHQ` (`purchaseLogicUtils.ts:605-630`) stores `item.id`, so `effect.id` is never used. `EXPEDITION_TOUCHING_HQ_UNLOCKS` keys on those dead ids and misses `hq_diy_soundproofing`, which `dailyTickLogic.ts:388` reads. | FIX: key on item ids and drop the dead `effect.id`s |
| LOW | `src/domain/expedition/fame.ts:113-119` | "Unreachable" fallback returns `highProfileNodeWeightMultiplier: 1`, while the table's `unknown` band uses `0.9`. | FIX for consistency |
| LOW | `src/ui/shared/BrutalistUI.tsx:337-358` (`CrisisModal` fallbacks) + `ui:crisis.title/desc/opt1-3/safe/risk/risky` (`public/locales/en/ui.json:154-161`) | Demo placeholder content. Both callers (`ForeclosureModal.tsx:19-38`, `FailureCrisisDialog.tsx:100-115`) always pass `title`, `description` and `actions`. | DELETE; make the props required and drop the EN/DE keys |
| LOW | `src/components/assets/AssetsScene.tsx:66-72` | The `noSectionRegistered` branch can't fire: `sectionRegistry.ts:29-47` registers all four `AssetKind`s. Its docstring (`:15-17`) is stale. | DELETE, or type the registry as a full `Record` |
| LOW | `src/overworld.css`: lines 85-330, 661, 805-810, 821-823, 1052-1066 | About 45 unreferenced class rules (legacy HUD: `.ow-panel`, `.hud-left`, `.money-*`, `.van-*`, `.mbr-*`, `.bar-*`, `.harmony-*`, `.menu-sub-title`, `.money-anim-*`, `.ow-panel.fuel-warn`, `.mbr-crit/low/status-dot`, plus keyframes), superseded by the Tailwind `OverworldHUD`. The `.t-*` classes are still used dynamically. | DELETE |
| LOW | `src/data/events/transport.ts:302` (`unlock: 'rare_vinyl'`) | PLAUSIBLE: nothing checks the id; the only reader is a count in `milestones.ts:293`. | Confirm intent, or give it a consumer |
| LOW | `src/data/questEventTypes.ts`: 14 types (`social.loyaltyChanged`, `social.controversyChanged`, `social.trendMatched`, `brand.offerAccepted`, `asset.acquired`, `asset.repaired`, `asset.moduleInstalled`, `asset.conditionChanged`, `item.used`, `minigame.completed`, `minigame.failed`, `venue.gigCompleted`, `venue.goodGig`, `expedition.extracted`) | Emitted by `src/quests/producers/*`, but no quest `progressRules` consume them. | KEEP as infrastructure; consider quests for `expedition.extracted` |
| LOW | `public/locales/{en,de}/chatter.json`: `chatter:venues.koeln_live_music_hall.*`, `koeln_palladium.*`, `koeln_sonic_ballroom.*` (54 keys per language) | Chatter for venues that no longer exist (Köln now has `koeln_underground`, `koeln_mtc`, `koeln_luxor`). | DELETE, or re-key to existing venues |
| LOW (PLAUSIBLE) | About 35 `ui:` keys, mostly legacy duplicates (`ui:overworld.shortcuts.*`, `ui:shortcuts.{closeOverlays,hitNotes,mute,selectEvent}`, `ui:settings.{audio_mute,audio_unmute,crt_disable,crt_enable}`, `ui:postOptions.lifestyle.lifestyle_*.name`, top-level `ui:crowdEnergy`/`ui:toxicModeActive`, `ui:overworld.{band_status,career_*,harmony,keyboard_shortcuts,low_fuel,notAvailable}`, …); `items:{van_sound_system,van_tuning,lucky_pick,energy_drink}.*`; `economy:social.influence` | No static or dynamic reference found. | DELETE after a dynamic-key double-check |
| LOW | `src/ui/GigModifierButton.tsx:16,24-35` | The `disabled` prop is never passed by the only caller (`GigModifiersBlock.tsx:77-82`), so unaffordable modifiers look enabled. | INTEGRATE an affordability check, or DELETE the prop |
| LOW (PLAUSIBLE) | `src/hooks/useArrivalLogic.ts:13-43` | The `onShowHQ`/`onShowSupplyStop`/`rng` options are never passed in production (`TourbusScene.tsx:18`), only by tests. | KEEP as a documented seam, or DELETE |
| LOW | `docs/dead-code-triage.md:99` | Stale: it says nothing mounts `AudioEngineProvider`, but `App.tsx:192` mounts it. Also out of date: `ValidatedMap` has been re-exported, `lint-staged` is now unused, and `motion-dom`/`motion-utils` are gone. | FIX the doc |

---

## 5. MISSING INTEGRATION (primary interest)

### 5.1 HIGH — Expedition quests can never be offered, so Ascension is unreachable **[V]**

- **Where:** `src/data/questRegistry.ts:35-37,76-78` registers `quest_expedition_run_goal`, `quest_expedition_nemesis` and `quest_expedition_meta_unlock`, each with `offer: { trigger: 'random' }`.
- **Why they're never offered:** quests reach the player only through `defineQuestOfferEvent` entries in `src/data/events/quests.ts`, which has 0 Expedition entries. They are also not story-flag mappings or `followupQuestId` targets.
- **Consequence:** `isExpeditionAscensionEligible` (`src/domain/expedition/meta.ts:238-247`) requires `completedQuestIds.includes('quest_expedition_meta_unlock')`, so Ascension can't be earned.
- **Why tests didn't catch it:** `tests/node/expeditionG5Integration.test.js:255` injects the quest straight into `activeQuests`.
- **Spec:** plan `04-pressure-rivals-contracts.md` Task 11 and plan `05` (~line 546).
- **Action:** INTEGRATE. Add offer events (or another offer path) for all three, use the orphaned `QUEST_EXPEDITION_*` constants, and add an integration test that reaches the offer through real gameplay events.

### 5.2 HIGH — 12 Expedition/Career dispatch methods with complete reducers but no UI caller **[V]**

Each has 0 consumers outside `src/context/**`. Grep finds only the definitions in `useGameDispatchActions.ts`, `useExpeditionDispatchActions.ts`, `useCareerDispatchActions.ts` and `expeditionActionCreators.ts`.

| Method | Defined in | Feature left unreachable |
|---|---|---|
| `revealExpeditionNodeIntel` | `src/context/useExpeditionDispatchActions.ts:117` | Node-intel reveal |
| `createContactIntelGrant`, `createSocialIntelGrant` | `useExpeditionDispatchActions.ts:201` | The intel-grant loop |
| `addExpeditionReward` | `useExpeditionDispatchActions.ts` | Manual reward grants |
| `recordExpeditionRelationshipOutcome` | `useExpeditionDispatchActions.ts` | Relationship outcomes |
| `advanceExpeditionCrewInjury`, `advanceExpeditionBandInjury` | `useExpeditionDispatchActions.ts` | Injury progression |
| `advanceExpeditionRoute` | `useExpeditionDispatchActions.ts` | **Superseded:** `applyExpeditionRouteAdvance` runs on every arrival (`expeditionReducer.ts:680-711`) → DELETE or document |
| `purchaseExpeditionHqFacility` | `src/context/useCareerDispatchActions.ts:36` | HQ facilities |
| `recordExpeditionArchiveDiscovery` | `useCareerDispatchActions.ts:42` | Archive discoveries |
| `acquireExpeditionCrewSignature` | `useCareerDispatchActions.ts:56` | Crew signatures |
| `purchaseExpeditionUnlockSet` | `src/context/useGameDispatchActions.ts:639` | Crash-safe unlock-set purchase (9 tests) |

**Action:** INTEGRATE per `docs/superpowers/plans/roguelite-expedition/01`, `03` and `05`. Check first whether the UI wiring is still a pending gate.

### 5.3 MED — Fame `accessTier` is published but never consumed

- **Where:** `src/domain/expedition/fame.ts:18`, values at `:37-86`.
- **Evidence:** no production code reads it; the only reference is a range assertion in `tests/node/expeditionFameSignal.test.js:52`. Plan `05-meta-regions-ascension.md:348` says content gates on a minimum `accessTier`, and `src/data/AGENTS.md` calls a published field with no consumer "inert config".
- **Action:** INTEGRATE the content gate, or DELETE the field.

### 5.4 HIGH — Kabelsalat is cut off from the shared minigame frame **[V]**

- **What's built:** `useMinigameSceneLogic.ts:128-171` implements the KABELSALAT forfeit-skip (`completeKabelsalatMinigame({ isPoweredOn: false })`), and its comment says skip is offered for every pre-gig setup minigame.
- **What's missing:** `src/scenes/KabelsalatScene.tsx` builds its own shell. Only `TourbusScene` and `RoadieRunScene` mount `MinigameSceneFrame`, so a Kabelsalat player has no SKIP (Roadie and Amp do) and no DEV Shift+P backdoor.
- **Rules it breaks:** `src/scenes/AGENTS.md` (exit actions must stay reachable) and `src/components/AGENTS.md` (the backdoor lives in `MinigameSceneFrame`).
- **Action:** INTEGRATE. Wrap the scene in `MinigameSceneFrame`, or call `useMinigameSceneLogic` and render the skip control. Add a reachability test.

### 5.5 MED — The `extract` crisis choice is never offered

- **What's built:** `getExpeditionCrisisChoices` (`src/domain/expedition/failure.ts:547-577`) adds `'extract'` at extraction windows. The type (`expedition.d.ts:414`) and the sanitizer allow-list (`expeditionSanitizers.ts:94`) include it.
- **Why it never appears:** only tests call that function. `FailureCrisisDialog.tsx:108` renders the stored `pendingFailure.choices`, which never contain `'extract'`, and `handleResolveExpeditionCrisis` (`expeditionReducer.ts:~1466`) rejects anything other than refuel, tow or insurance_claim.
- **Spec:** plan `01:561` names refuel, tow, extract and fail.
- **Action:** INTEGRATE across choice sync, the dialog and the reducer, or DELETE the choice everywhere.

### 5.6 Smaller integration gaps (details above)

- `isExpeditionFinaleReachable` is documented as asserted on every map but never called in production (§2.2).
- `isStoryFlag` is not applied on load (§2.2).
- Salvage Rights recovery control is stubbed to `false` (§4).
- The `GigModifierButton` `disabled` prop is never wired (§4).
- The void-trader controversy gate isn't enforced by the reducer (§3.2).
- Defect action trio is never dispatched (§2.2).
- `getExpeditionNodePublicFacts` has no tooltip consumer (§2.2).

---

## Suggested fix-pass ordering

1. **Player-visible bugs:**
   - §3.6 `sponsor_advance` keys
   - §4.1 `c_diy_overdrive`
   - §4.2 `neuro_overclock`
   - §1.1 `gigModifiers` dropping `damaged_gear`
   - §3.7 unstyled secondary buttons
2. **Authority and NaN safety:**
   - §3.2 reducer guards and the chassis loan re-check
   - §3.3 `Number()` coercion
   - §3.4 `??` NaN leaks
   - §1.1 `checkPrototypePollution` without `WeakSet`
3. **Integration, gated on plan review:** §5.1, §5.2, §5.4, §5.5.
4. **Type hole (§3.1):** a dedicated PR, because it will surface a lot of latent errors.
5. **Merges:** §1.x, starting with the drifted duplicates: deal events, crew validation, insurance, injury check, condition bands.
6. **Cleanup:**
   - Orphans and UNEXPORTs
   - Stale test mocks (§2.4)
   - Dead CSS and locale keys
   - Refresh `docs/dead-code-triage.md`, then run `pnpm run deadcode:check` and `pnpm run deadcode:budget`
