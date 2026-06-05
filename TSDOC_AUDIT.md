# Neurotoxic — TSDoc Comment-Quality Audit

**Scope:** all `.ts/.tsx/.d.ts` under `src/` (TSDoc is a TypeScript-API concern). `.js/.jsx` were inspected only for the inverse problem (none found — see note). Tests, `node_modules/`, `dist/`, and generated `symbols.json` were skipped.
**Standard measured against:** `.agents/skills/tsdoc-writer/SKILL.md` + reference guide + perfect example, plus the domain invariants in root `AGENTS.md`/`CLAUDE.md`.
**Method:** deterministic tag/syntax scans over `symbols.json` (1,422 local exported symbols) and raw source, followed by 7 parallel directory-scoped read-only deep audits, with HIGH/uncertain findings hand-verified against source.
**This audit modified no files** (other than producing this report).

---

## Summary

### Headline coverage facts

- **TSDoc presence is effectively 100%.** All **1,422** local exported symbols in `symbols.json` carry a non-empty `jsDoc.summary`. This is an automated/uniform doc pass — so the audit weight is on **accuracy (Cat 1)**, **syntax/tag correctness (Cat 3)**, **noise (Cat 4)**, and **consistency (Cat 5)**, not missing summaries (Cat 2).
- **Zero `@deprecated` tags** anywhere — no stale-deprecation risk.
- **Zero `@example` blocks** anywhere in `src/`. Not a defect per se (examples are optional), but the entire public surface lacks copy-pasteable usage examples.
- **Zero JSDoc type-syntax violations** (`@param {string}`, `@returns {…}`, `@type {…}`) in `.ts/.tsx/.d.ts` — the single most important Cat-3 rule is clean.
- **Zero** `@default` / `@return` / `@arg` / block-form `@link` in TypeScript files.
- **`.js/.jsx` inverse check:** no offending TSDoc-in-JS situations; the few `.js/.jsx` files legitimately use CheckJS `@param {type}` and were not flagged.
- **Tooling:** `eslint-plugin-tsdoc@^0.5.2` is a devDependency, but there is **no TypeDoc and no API-Extractor** — so all release tags (`@internal`) in app code are inert and flagged LOW per SKILL.md.

### Counts per category

| Category | HIGH | MED | LOW | Total |
| --- | --- | --- | --- | --- |
| 1 — Inaccurate / Stale | 6 | 4 | 3 | 13 |
| 2 — Missing TSDoc | 1 | 19 | 6 | 26 |
| 3 — Syntax / Tag correctness | 0 | 4 | 14 | 18 |
| 4 — Low-value / Noise | 0 | 4 | 19 | 23 |
| 5 — Consistency | 0 | 4 | 4 | 8 |
| **Total** | **13** | **35** | **46** | **88** |

(Cat-3 LOW is dominated by ~12 inert `@internal` tags across 6 files. Cat-4 LOW figures are representative samples of a widespread-but-shallow pattern, not an exhaustive enumeration of every weak `@param`.)

### Coverage quality note

- **% of exported symbols carrying any TSDoc: ~100%** (1,422/1,422 have a summary; the gaps are *below* the summary line — class public members, interface property docs, `@typeParam`, `@throws`).
- **% passing the SKILL.md "first sentence stands alone / no type restatement" bar: ~85%.** Estimated per-area: types/data ~90%, components/ui ~90%, context/reducers ~80%, hooks/scenes ~80%, audio/stage ~75%. The recurring drags are: `Module:` / `Type:` / `Constant:` / `Enum:` pseudo-tag header lines that restate the filename or declared type; `@param x - The x.` echoes; and two "Architecture (…)" essay-style summaries that bury the standalone sentence.

### Top 10 highest-impact items (stale first)

1. **[Cat 1] `src/utils/audio/AudioManager.ts:343` — `AudioSystem.playSFX`** — `@param key` examples `'CLICK'`/`'ERROR'` are not valid `AudioSfxType` members; passing them logs "Unknown SFX type". Actively misleading.
2. **[Cat 1] `src/context/reducers/clinicReducer.ts:141` — `handleClinicHeal`** — `@param type` says "Must be 'heal' or 'enhance'" on the heal-only handler; misstates the cost contract.
3. **[Cat 1] `src/context/reducers/clinicReducer.ts:298` — `handleClinicEnhance`** — same stale dual-value `@param type` on the enhance-only handler (the matching creator correctly says "'enhance'").
4. **[Cat 1] `src/utils/gameStateUtils.ts:1328` — `hasActiveSponsorship`** — orphaned TSDoc block is physically attached to `type SponsorshipDealLike` (line 1335), not the function; the function has a second correct block at 1340. IntelliSense shows the wrong doc on the type.
5. **[Cat 1] `src/ui/EventModal.tsx:23-30` — `EventModal`** — orphaned duplicate TSDoc block floats above `interface EventOptionButtonProps`; the authoritative `EventModal` doc is at line 88. Stale duplicate misattached.
6. **[Cat 1/5] `src/App.tsx:73-77` — `GameContent`** — entire block in German *and* stale: claims `GameContent` selects the scene, but selection is delegated to `<SceneRouter>` (line 144).
7. **[Cat 1] `src/data/events/constants.ts:3` — `EVENT_STRINGS`** — summary claims the file exists "to support … localization," but the value hardcodes raw English UI text (`' (Saved by Bandleader!)'`) — the opposite of the namespaced-i18n invariant.
8. **[Cat 2] `src/utils/errorHandler.ts:515` — `runSafeStorageOperation`** — `@returns "Result or fallback"` but with no fallback arg the function **throws `StorageError`** (line 570). The contract-critical throw path is undocumented.
9. **[Cat 2] `src/utils/mapGenerator.ts:173` — `MapGenerator.generateMap`** — throws `StateError` on missing/empty venue pools at 6 sites; no `@throws`.
10. **[Cat 2] `src/components/stage/BaseStageController.ts:48-183` — lifecycle members** — public `init/setup/update/draw/dispose` (the subclass-override contract + ticker/resize side effects + leak-relevant `dispose`) carry no TSDoc.

---

## Category 1 — Inaccurate / Stale TSDoc

> Always HIGH when a comment is actively misleading; MED/LOW reserved for imprecise-but-not-wrong phrasing.

### HIGH

- **[HIGH] `src/utils/audio/AudioManager.ts:343` — `AudioSystem.playSFX` — FIX**
  Example SFX keys contradict the type.
  - comment: `* @param key - The SFX identifier (e.g., 'CLICK', 'ERROR').`
  - code: `playSFX(key: AudioSfxType)` where `AudioSfxType = 'hit' | 'miss' | 'menu' | 'travel' | 'cash' | 'crash' | 'honk' | 'pickup' | 'deliver' | 'void_hit'` (lines 13-24). `'CLICK'`/`'ERROR'` are not members; the function logs "Unknown SFX type" for them.
  - Action: replace examples with real members (e.g. `'hit'`, `'miss'`).

- **[HIGH] `src/context/reducers/clinicReducer.ts:141` — `handleClinicHeal` — FIX**
  - comment: `* - \`payload.type\` - Must be 'heal' or 'enhance'. Used to compute cost from CLINIC_CONFIG.`
  - code: heal handler; only `type === 'heal'` charges money (`executeClinicAction`, lines 42-44). Documenting it as accepting `'enhance'` misstates the cost contract.
  - Action: change to "Must be `'heal'`."

- **[HIGH] `src/context/reducers/clinicReducer.ts:298` — `handleClinicEnhance` — FIX**
  - comment: `* - \`payload.type\` - Must be 'heal' or 'enhance'. …`
  - contradicting code: this is the enhance handler; the paired creator `createClinicEnhanceAction` (`actionCreators.ts:898`) correctly says "Must be 'enhance'." The reducer doc disagrees with its own creator.
  - Action: change to "Must be `'enhance'`."

- **[HIGH] `src/utils/gameStateUtils.ts:1328-1334` — `hasActiveSponsorship` — DELETE**
  Orphaned/misattached TSDoc block.
  - comment (1328-1334): `Checks if the player has an active, non-expired sponsorship brand deal. … @param socialState … @returns …`
  - code: the block immediately precedes `type SponsorshipDealLike = { … }` (line 1335); the real function `hasActiveSponsorship` (line 1346) has its own correct block at 1340-1345.
  - Action: delete the 1328-1334 block (superseded duplicate; would render on the type in IntelliSense).

- **[HIGH] `src/ui/EventModal.tsx:23-30` — `EventModal` — DELETE**
  Orphaned duplicate block.
  - comment (24): `* A modal dialog for displaying game events and capturing player choices.`
  - code: the block precedes `interface EventOptionButtonProps {` (line 32); the authoritative `EventModal` doc is at line 88 (`Presents the active event narrative, options, and precomputed outcomes.`).
  - Action: delete lines 23-30.

- **[HIGH] `src/App.tsx:73-77` — `GameContent` — REWRITE** (also Cat 5: language)
  German block *and* stale behavior description.
  - comment (73): `* Wählt basierend auf dem aktuellen Spielzustand die passende Szene aus und rendert diese…`
  - code (144): `<SceneRouter currentScene={currentScene} minigameType={minigameType} />` — scene selection is delegated to `SceneRouter`, not done by `GameContent`.
  - Action: rewrite in English and align with the `SceneRouter` delegation.

- **[HIGH] `src/data/events/constants.ts:1-7` — `EVENT_STRINGS` — REWRITE**
  Localization claim contradicts the value and the i18n invariant.
  - comment (3): `* This file centralizes hardcoded narrative additions to support maintainability and localization.`
  - code (6): `SAVED_BY_BANDLEADER: ' (Saved by Bandleader!)'` — raw English string, not an i18n key.
  - Action: state these are intentional hardcoded fallbacks (or migrate to i18n keys); do not claim localization.

### MED

- **[MED · Cat 1] `src/hooks/rhythmGame/useRhythmGameScoring.ts:81` — `useRhythmGameScoring` — FIX**
  `@returns` lists only `handleHit, handleMiss, activateToxicMode` but the hook also returns `gameOverTimerRef` (line 444, part of `RhythmGameScoringReturn`). Action: add `gameOverTimerRef` or generalize.

- **[MED · Cat 1] `src/utils/economyEngine.ts:1` — module header — REWRITE**
  - comment: `// This file is deprecated. Imports should point to src/utils/economy/index.ts instead.`
  - contradicting code: still imported first-party — `gameStateUtils.ts:2` (`EXPENSE_CONSTANTS`), `assetSelectors.ts:14` (`calculateGuaranteedDailyCost`). (Note: this is a `//` line comment, not a `/** */` TSDoc block, but it is misleading repo guidance.) Action: reframe as a back-compat barrel, not a "should redirect" instruction.

- **[MED · Cat 1] `src/utils/assetTicks.ts:54-58` — `processAssetTick` — REWRITE**
  Summary says net cashflow is computed "for productive assets," but the loop bills upkeep for *all* assets (broken assets yield 0 revenue yet still incur upkeep). Action: correct the framing.

- **[MED · Cat 1] `src/data/merch.ts:144-145` — `DEFAULT_MERCH_PRICES` — FIX (minor)**
  Comment "Re-exported by economyEngine.ts"; the re-export statement actually lives in `src/utils/economy/constants.ts` (`economyEngine` is a barrel that forwards it — functionally importable, but the named file is imprecise). Action: soften to "re-exported through the economyEngine barrel."

### LOW

- **[LOW · Cat 1] `src/utils/mapGenerator.ts:287` — `_populateCityStates` — FIX** — typo "determinisic" in the summary.
- **[LOW · Cat 1] `src/data/merch.ts` `calculateMerchIncome` reference** — comment attributes it to `economyEngine` though it lives in `economy/gigLogic.ts` (re-exported via barrel; functionally correct). Action: optional precision fix.
- **[LOW · Cat 1] `src/utils/audio/state.ts:89` — `resetGigState`** — summary "Resets the gig state to default values" is fine, but the non-obvious scope (resets only the gig subset; does NOT touch instruments/setup flags) deserves a one-line `@remarks`. Action: optional ADD.

> **Verified PASS (excluded):** `bandReducer.ts:44 handleUpdateBand` "@returns harmony clamped to `1..100`" — `clampBandHarmony` (`gameStateUtils.ts:362`) floors at `1` (`Math.max(1, …)`, and returns `1` for non-finite). Doc is correct.

---

## Category 2 — Missing TSDoc

> On surfaces the standard warrants. All symbols below confirmed exported/public (or public class members).

### HIGH

- **[HIGH] `src/utils/errorHandler.ts:515-521` — `runSafeStorageOperation` — ADD**
  `@returns "Result or fallback value"` but when **no fallback** is supplied, the function `throw storageError` (line 570). The throw path is contract-critical and undocumented. Action: add `@throws {StorageError}` and note the no-fallback behavior.

### MED

- **[MED] `src/utils/mapGenerator.ts:173` — `MapGenerator.generateMap` — ADD `@throws {StateError}`** (thrown at lines 213, 394, 424, 441, 500, 529, 557).
- **[MED] `src/utils/storage.ts:19-21` — `safeStorageOperation` — ADD** — summary only; omits the no-fallback `StorageError` propagation; no `@param`/`@returns`/`@typeParam T`.
- **[MED] `src/utils/logger.ts:33-37` — `Logger` public fields (`logs`/`maxLogs`/`minLevel`/`listeners`) — ADD** brief member docs.
- **[MED] `src/utils/mapGenerator.ts:147-148` — `MapGenerator.seed` — ADD** (undocumented public field).
- **[MED] `src/utils/seededRng.ts:13` — `mulberry32` — ADD** symbol-level summary (only the module header mentions it).
- **[MED] `src/utils/unlockManager.ts:117` — `__testInternals` — ADD** (exported, undocumented) or DEMOTE if it should not be public surface.
- **[MED] `src/components/stage/BaseStageController.ts:18` — `BaseStageController<TState>` — ADD `@typeParam TState`** (non-trivial generic).
- **[MED] `src/components/stage/BaseStageController.ts:48-183` — lifecycle members (`init/setup/update/draw/handleResize/handleTicker/dispose`) — ADD** summaries + `@remarks` on the subclass-override contract and ticker/resize side effects (`dispose` is leak-relevant).
- **[MED] `src/components/stage/CrowdManager.ts:60-151` — `loadAssets/init/update/dispose` — ADD** (public members; `init` mutates state, `dispose` destroys the Pixi container).
- **[MED] `src/components/stage/PixiStageController.ts:16` — `PixiStageController<TState>` — ADD `@typeParam TState`.**
- **[MED] `src/components/PixiStageController.ts:263` — `createPixiStageController<TState>` — ADD `@typeParam TState`** (exported generic factory).
- **[MED] `src/components/stage/PixiStageController.ts:20-48` — `colorMatrix`/`toxicFilters`/`isToxicActive` accessors — ADD** (public getters/setters; pairs with the explicit-return-type rule).
- **[MED] `src/context/reducers/playerReducer.ts:23` — `handleUpdatePlayer<TState extends WithPlayer>` — ADD `@typeParam TState`.**
- **[MED] `src/context/reducers/bandReducer.ts:709` — `bandReducer` — ADD `@throws`** (default branch hits `assertNever`).
- **[MED] `src/context/gameReducer.ts:257` — `gameReducer` — ADD `@throws`** (`assertNever(action as never)` at line 284); `@returns` omits the throw path.
- **[MED] `src/context/reducers/systemReducer.ts:1519` — `handleLoadGame` — ADD `@remarks`** — summary omits two caller-visible side effects: forces `currentScene: OVERWORLD` (line 1582) and bumps version (1632-1635).
- **[MED] `src/context/reducers/systemReducer.ts:1915` — `handleAdvanceDay` — ADD `@remarks`** — omitting `dayRngStream` silently skips asset risk-event resolution (line 1941); reinforce "use the typed `advanceDay(state)` creator" invariant.
- **[MED] `src/components/MinigameSceneFrame.tsx:16-19` — `MinigameSceneFrame<TState>` — ADD `@typeParam TState`** + `@remarks` for the DEV-only Shift+P force-complete and focus-handoff side effects (lines 62-119).
- **[MED] `src/ui/CrashHandler.tsx:98` — `ErrorBoundary` — ADD** summary + `@remarks` (error-capture/recovery contract, injected `t` prop, dev-mode error display) — currently undocumented exported HOC.
- **[MED] `src/hooks/rhythmGame/useRhythmGameScoring.ts:255` — `handleHit` — ADD `@throws`** (`Error("Missing lane at index … during hit handling")`, lines 270-272).
- **[MED] `src/scenes/kabelsalat/hooks/useKabelsalatInteractions.ts:20-34` — `useKabelsalatInteractions` — ADD `@throws`/`@remarks`** (DEV-only throws on invalid `socketId`/`selectedCable`, lines 124-140).
- **[MED] `src/hooks/useLeaderboardSync.ts:131` — `syncLeaderboardStats` — ADD `@throws`** (throws on non-ok, non-404 response, line 156); `@returns` only covers true/skipped.
- **[MED · Cat 2/5] `src/utils/assetSections/{bandhaus,studio,tourbus,workshop}Modules.ts:~4` — ADD file-level TSDoc** — these four files export nothing useful; their purpose is an import-time side effect registering into `MODULE_REGISTRY`/`MODULE_PROMPTS`. Document the side effect (mirror `assetRegistryStore.ts`).
- **[MED] Type-file generics missing `@typeParam` (non-trivial) — ADD:**
  - `src/types/game.d.ts:173` `Action<TType extends ActionType, TPayload>` — also document the conditional shape (no `payload` key when `TPayload` is `undefined`).
  - `src/types/callbacks.d.ts:14` `AsyncCallback<TResult>` — note "may return sync, void, or Promise."
  - `src/types/components.d.ts` — `MinigameLogicBase<TState>` (121), `MinigameSceneFrameProps<TState>` (131), `StageControllerOptions<TState>` (161), `PixiStageProps<TState>` (170), `UseAudioControlResult<TState>` (123).
  - `src/utils/objectUtils.ts:130` `safeJsonParse<T>`, `src/components/stage/stageRenderUtils.ts:96` `withTimeout<T>`, `src/utils/storage.ts:22` `safeStorageOperation<T>`.
  *(Trivial pass-through `TState = unknown` generics on prop types are borderline — describe where role is non-obvious, skip where it adds nothing.)*
- **[MED · property docs] `src/types/` interfaces — ADD `@remarks`/property docs where the invariant lives:**
  - `band.d.ts:4` `BandMember.mood`/`.stamina` — note persisted numerics are not load-time enforced (may be `NaN`/`undefined` from stale saves; use `finiteNumberOr` at the arithmetic boundary).
  - `band.d.ts:11` `BandMember.relationships` — cite the never-self-relationship invariant.
  - `game.d.ts:108` `ToastPayload` — distinguish pre-baked `message` from `messageKey`+`options` (dual-toast-path); document the `type` union.
  - `validation.d.ts:10` `ValidationResult` — document the third `silent: true` branch vs the error-message branch.

### LOW

- **[LOW] `src/utils/audio/audioService.ts:32` — `setSfxVolume` — ADD `@remarks`** noting it intentionally bridges to `audioManager.setSFXVolume` (the naming-normalization invariant).
- **[LOW] `src/components/stage/stageRenderUtils.ts:96` — `withTimeout<T>` — ADD `@typeParam T`** (params/return reference `T`).
- **[LOW] `src/quests/producers/socialQuestEvents.ts:83-95` — `createSocialControversyChangedQuestEvent` — ADD `@remarks`** — `success: amount <= 0` inverts the sign vs every sibling producer (`>= 0`); surprising and undocumented.
- **[LOW] `src/data/characters.ts:1` — `CHARACTERS` — ADD `@remarks`** — the `CLINIC` entry is an NPC pseudo-character (zero stats by design, empty relationships); ties into the self-relationship invariant.
- **[LOW] `src/types/react-compat.d.ts:4-9` — `MemoExoticComponent`/`NamedExoticComponent` augmentation — ADD** one-line `@remarks` explaining the React-19 `propTypes`-removal shim rationale.
- **[LOW] `src/types/rhythmGame.d.ts:114` — `RhythmGameRefState` — ADD** property docs for the audio-end-detection fields (`setlistCompleted`, `nextMissCheckIndex`, `lastEndedSongIndex`, `transportPausedByOverlay`); full per-field docs likely overkill.

---

## Category 3 — Syntax / Tag correctness

> No JSDoc type syntax, no `@default`/`@return`/`@arg`, no block `@link` anywhere in TS. Findings are pseudo-tag noise, stray-block-comment misuse, and inert release tags.

### MED

- **[MED] `src/utils/errorHandler.ts:17, 33, 161` — `ErrorSeverity`/`ErrorCategory`/`errorLog` — DELETE** the invented pseudo-tag lines `Enum: \`string\``, `Type: \`Array<Object>\`` (type restatement in fake-tag form).
- **[MED] `src/utils/errorHandler.ts:7` — file header — DELETE** the `Module: \`errorHandler\`.` line (restates filename).
- **[MED] `src/utils/unlockCheck.ts:137-142` — inline "Gear Nerd Unlock Logic" — DEMOTE-TO-PLAIN-COMMENT** — a `/** */` block used inside a function body attaches to nothing; convert to `//`.
- **[MED] `src/ui/shared/BrutalistUI.tsx:63-76` — `UplinkButton` — DELETE** — a `/** */` developer scratchpad ("ACTUAL UPDATES (#1)", "NEXT STEPS…", "FOUND ERRORS…") inside the component body; impl-history noise that will surface oddly in tooling. Reduce to a one-line `//` if the URL-safety rationale is worth keeping.

### LOW

- **[LOW] Inert `@internal` release tags (no TypeDoc/API-Extractor consumes them) — DEMOTE (remove tag; `_`-prefix already signals intent):**
  - `src/utils/logger.ts:110, 121, 136`
  - `src/utils/mapGenerator.ts:608`
  - `src/components/PixiStageController.ts:84, 94, 140, 216`
  - `src/components/stage/CrowdManager.ts:93`
  - `src/data/contraband.ts:473` (`_CONTRABAND_DB_FOR_TESTING` — `DO NOT USE` prose already conveys intent)
- **[LOW] `src/utils/errorHandler.ts:16, 30` — `ErrorSeverity`/`ErrorCategory` — DELETE** `@readonly` (redundant with `as const`; not consumed).
- **[LOW] `src/components/stage/stageRenderUtils.ts:268` — `_imageTextureCache` — DELETE** the `Type: \`Map<string, Texture>\`.` restatement line (keep the rationale prose).
- **[LOW] `src/hooks/useTravelLogic.ts:88-93` — `TRAVEL_ANIMATION_TIMEOUT_MS` — DELETE** the trailing `Constant: \`number\`` restatement line.
- **[LOW] `Module: \`X\`.` file-header pseudo-tags — DELETE across:** `src/context/actionCreators.ts:5`, `src/context/gameReducer.ts:4`, `src/data/milestones/milestones.ts:1-4`, `src/data/contraband.ts:1-6`, and the shared-UI header files listed in Cat 5.

---

## Category 4 — Low-value / Noise

> Representative sample. The dominant pattern is mechanical `@param x - The x.` restatement, concentrated in the Kabelsalat sub-hooks, gig/rhythm helpers, and a few shared-UI files. Auto-doc origin makes this shallow-but-broad.

### MED

- **[MED] `src/context/reducers/bandReducer.ts:333-339` — `addContrabandHelper` — REWRITE** — leads with an "Architecture (Redux Orchestration / State Transitions):" label; the standalone-summary bar fails (IntelliSense shows the label, not what it does). Lead with the action verb; move rationale to `@remarks`.
- **[MED] `src/context/reducers/questReducer.ts:1-8` — module header — REWRITE** — "Architecture (Quest System / Clean Architecture):" essay header; keep the delegation note brief.
- **[MED] `src/components/assets/AssetsScene.tsx:15-26` — `AssetsScene` — REWRITE** — summary documents the rollout roadmap ("registered lazily by section plans 2-5", "foundation phase remains playable") — impl/process detail that will go stale. Trim to routing-and-accent intent.
- **[MED] `src/ui/shared/Modal.tsx:12-21` — `ModalProps` — DELETE duplicate** — type-level block restates per-prop info and bakes literal Tailwind default class strings into prose, duplicating the component-level block (32-35) and guaranteeing drift.

### LOW (representative)

- **[LOW] `src/context/actionCreators.ts:474+` — thin creators** (`createPopPendingEventAction`, `createConsumeItemAction:486`, `createAddCooldownAction:497`, `createSetMapAction:280`, `createSetGigAction:291`, `createAddUnlockAction:836`) — summaries echo the action name; state the non-obvious state contract (queue advance, dedupe) where one exists, leave trivial passthroughs.
- **[LOW] `src/context/reducers/bandReducer.ts:518` — `applyContrabandEffect`** — "Pure helper function to apply…" filler prefix; tighten to the effect-application + duration-tracking contract.
- **[LOW] Kabelsalat sub-hooks — DEMOTE/trim restating `@param`:** `useKabelsalatGameEnd.ts:12` ("State, derived values, and callbacks for kabelsalat Game End." generic `@returns`; returns only `{ forceAdvance }`), `useKabelsalatVoidSurge.ts:11` (same generic stub), `useKabelsalatShuffle.ts:13-21`, `useKabelsalatTimer.ts:14-23` ("isPoweredOn - Whether powered on is active", "setTimeLeft - State setter for time left").
- **[LOW] `src/scenes/kabelsalat/kabelsalatUtils.ts:34-38` — `getMessyPath` — REWRITE** — `@returns Computed result.` stub; should be "SVG path `d` string, or empty string when the cable/socket index is unresolved."
- **[LOW] Gig/rhythm helper `@param` restatements:** `useGigVisuals.ts:14-18` (`isToxicMode - Is toxic mode.`, `overload - Overload.`), `useGigEffects.ts:14-19`, `useGigInput.ts:115,128`, `useRhythmGameInput.ts:42-44` (`laneIndex - Lane index.`, `isDown - Whether the input is pressed.`).
- **[LOW] `src/hooks/useArrivalLogic.ts:19-31` — `useArrivalLogic`** — ad-hoc `ARRIVAL_REF_RESET_TRIGGER = 'nodeId'` pseudo-token in the summary; move to `@remarks`.
- **[LOW] `src/data/socialTrends.ts:1-4` — `ALLOWED_TRENDS` — REWRITE** — summary restates the literal value (`Constant: \`readonly ['NEUTRAL', …]\``); drift hazard. State intent instead.
- **[LOW] `src/data/consequences.ts:5-7` — DELETE** orphaned stub block (`/** Consequences Event Pool */` attached to nothing; the real doc is at line 13).
- **[LOW] `src/utils/contrabandUtils.ts:69, 95, 111` — REWRITE** — `@param rng - Defaults to \`secureRandom\``, `@param luck - Defaults to \`0\`` restate defaults in prose; use `@defaultValue`. `@returns` fragments restate the shape.
- **[LOW] `src/utils/contrabandStashUtils.ts:14, 37` — trim** — `@returns Validation result \`isValid, errorKey, defaultMessage\`` / `Message payload \`key, options\`` restate the object shape.
- **[LOW] `src/utils/logger.ts:109-136` — trim** — `@param event - Event object \`type, entry\``, `@param data - Associated data`, `@param level - Log level` add nothing beyond the signature.
- **[LOW] `src/types/callbacks.d.ts:4` — `VoidCallback`** and **`src/types/game.d.ts:41` — `UnknownRecord`** — summaries lean toward restating the type; `UnknownRecord` adds boundary intent and is acceptable, `VoidCallback` is borderline-stub.

---

## Category 5 — Consistency

### MED

- **[MED] German vs English doc comments — TRANSLATE** (repo standard is English doc text; only user-facing strings use i18n):
  - `src/types/assets.d.ts` — inline German throughout (lines ~23, 73, 76, 82, 99, 107, 119, 143, 147, 149, 217-219): `Slot-Typen sind kategorie-spezifisch…`, `normalisiert über Background-Bild`, `Schlüssel in MODULE_PROMPTS`, `gleicher Key auf zwei Modulen → gegenseitiger Ausschluss`, `processCrowdfundTick setzt den Wert…`. Several are valuable constraint notes that should become proper `@remarks`/property docs.
  - `src/App.tsx:73-77` — `GameContent` (also Cat 1 HIGH above).
  - `src/data/contraband.ts:12, 79` — `// ursprüngliche Items (bewahrt)`, `// viele neue Items`.
- **[MED] Toast currency-baking contract documented inconsistently / nowhere — DOCUMENT** — `socialReducer.ts:669` and `clinicReducer.ts:278` bake `cost`/`deltaMoney` via `formatCurrency(…, i18n.language, 'always')`, but `socialReducer.ts handleMerchPress:566` passes a raw numeric `cost` into the toast options. No reducer TSDoc states the dispatch-time `formatCurrency(value, i18n.language, signDisplay)` invariant. Add a shared `@remarks` (e.g. on `appendDeltaSuccessToast`/`sanitizeSuccessToast`) and reconcile the merch-press path.
- **[MED] Mixed prop-documentation convention — STANDARDIZE** — 9 files expand props into a `- \`props.x\` - …` bullet list under `@param props` (`ui/shared/index.tsx`, `Tooltip.tsx`, `ToggleSwitch.tsx`, `Modal.tsx`, `GlitchButton.tsx`, `EventModal.tsx`, `SceneRouter.tsx`, `HecklerOverlay.tsx`, `ChatterOverlay.tsx`), while the dominant convention is a single summarizing `@param props -` line. Pick one (single-line is dominant).
- **[MED] `Module:` / `Name - description` header convention — STANDARDIZE** — confined to a handful of shared-UI/util files (`ui/shared/Modal.tsx`, `ToggleSwitch.tsx`, `ActionButton.tsx`, `index.tsx`, `usePurchaseLogic.ts`): a redundant file-header block echoing the filename via the non-TSDoc `Module:` tag plus a name-echo summary, often duplicated by a proper symbol-level block. Standardize on the single symbol-level block.

### LOW

- **[LOW] `finiteNumberOr`/clamp-boundary contract** — reducers consistently wrap addends (`clampMemberStamina(finiteNumberOr(m.stamina,0)+v, …)`) but the load-bearing invariant is documented in zero TSDoc comments across `src/context/`. Add one representative `@remarks` (e.g. on `handleClinicHeal`) or rely on `CLAUDE.md`. Also: `finiteNumber.ts:8` `finiteNumberOr` lacks the `@param`/`@returns` its sibling clamps in `gameStateUtils.ts` all carry — inconsistent completeness for the canonical helper.
- **[LOW] "Pure helper function" / "Architecture (…)" summary prefixes** — appear in `bandReducer.ts` and `questReducer.ts` but nowhere else; normalize to the action-verb-first summary style used everywhere else.
- **[LOW] `src/utils/assetSelectors.ts:448` — `getLockReasons`** — inline parameter-position `/** When provided… */` doc on `asset?` duplicates the `@param asset` already present at line 442 (non-standard parameter-position TSDoc). DELETE the inline one.
- **[LOW] Lowercase `@returns` sentence fragments** (e.g. `contrabandUtils.ts` "rarity tier", "probability [0, MAX_DROP_CHANCE]") vs full-sentence `@returns` elsewhere — minor stylistic inconsistency.

---

## Appendix — Verified PASSES (notable, not findings)

- All four minigame-completion handlers (`handleCompleteTravelMinigame`, `handleCompleteAmpCalibration`, `handleCompleteKabelsalatMinigame`, `handleCompleteRoadieMinigame`) correctly document "leaving the current scene under overlay continuation control"; code does NOT set `currentScene`. ✔ matches invariant.
- `handleStartGig` doc "resets gig modifiers to defaults" matches `gigModifiers: { ...DEFAULT_GIG_MODIFIERS }`. ✔
- No `currentGig.venue` references in docs anywhere; reducers use `currentGig?.capacity`/`.id`. ✔
- `purchaseChassis` doc correctly states `PURCHASE_CHASSIS_FAILED` on DIY+loan; `advanceDay` creator doc correctly documents the pre-rolled RNG stream + next seed payload; `applyDailyBankruptcyCheck` uses `getTotalDailyObligations(state)`. ✔
- `createUpdatePlayerAction`/`handleUpdatePlayer` correctly drop paired `fameLevel` when `fame` is dropped. ✔
- No `audioPlaybackEnded` references in docs; audio-end docs reference `setlistCompleted` + sample-accurate timing consistently. ✔
- `clampBandHarmony` floors at `1` — the `handleUpdateBand` "1..100" doc is accurate. ✔
- `selectionUtils.ts selectRandomItem`, `stageRenderUtils.ts getPixiColorFromToken`/`withTimeout`, `storage.ts getSafeStorageItem` — exemplary hyphenated `@typeParam`/`@param` and empty-result `@returns`. ✔
