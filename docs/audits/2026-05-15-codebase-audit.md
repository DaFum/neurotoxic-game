# Neurotoxic Codebase — Categorized Findings Report

**Date:** 2026-05-15
**Branch:** `claude/review-integrate-subagent-REvMX`
**Scope:** `src/` (388 files, ~71k LOC). Verified orphan claims with ripgrep. Locale parity (EN/DE) is intact across all 9 namespaces — no missing-key inconsistencies found.

---

## 1. DUPLICATES

### D1. `pickRandomSubset` — near-duplicate (HIGH)
- `src/utils/randomUtils.ts:20` (exported standalone util, 80 LOC, uses `secureRandom`)
- `src/utils/mapGenerator.ts:741` (`MapGenerator.pickRandomSubset()` method, uses instance `this.random()`)
- Both implement the same Fisher‑Yates algorithm with identical k=1/k=2/sparse fast paths. The standalone export in `randomUtils.ts` has **zero callers** in `src/` (only referenced from AGENTS.md docs and a test).
- Recommendation: **MERGE** — make `MapGenerator` accept an injected `rng` and delegate to the shared util, or **DELETE** `randomUtils.ts` if the class method is canonical.

### D2. `0–100` clamp re-implemented inline (MED)
The exported helper `clamp0to100` and named wrappers (`clampMemberMood`, `clampLoyalty`, `clampBandStress`, `clampZealotry`) live in `src/utils/gameStateUtils.ts`, but identical `Math.max(0, Math.min(100, …))` appears in:
- `src/utils/economyEngine.ts:1021,1022` (perfScore, resonance)
- `src/utils/socialEngine.ts:611` (zealotry — should use `clampZealotry`)
- `src/utils/gigStats.ts:22`
- `src/context/actionCreators.ts:451` (equipmentDamage)
- `src/hooks/minigames/useRoadieLogic.ts:82` (equipmentDamage)
- `src/hooks/minigames/useTourbusLogic.ts:190` (damage)
- `src/components/postGig/ZealotryGauge.tsx:49`
- `src/scenes/kabelsalat/components/KabelsalatBoard.tsx:76`
- `src/components/stage/AmpStageController.ts:91`
- Recommendation: **MERGE** — replace inline expressions with `clamp0to100` / `clampZealotry` etc. Particularly egregious: `socialEngine.ts:611` re-clamps zealotry alongside an existing `clampZealotry` import path.

### D3. Inline `isImageGenerationAvailable() ? getGenImageUrl(…) : getGeneratedImageFallbackUrl()` (LOW)
This 3-symbol ternary appears in ~15 callsites: `BandHQ.tsx`, `BloodBankModal.tsx`, `ContrabandStash.tsx`, `MerchPressModal.tsx`, `MainMenu.tsx`, `PostGig.tsx`, `bandhq/ShopItem.tsx`, `postGig/CompletePhase.tsx`, `postGig/DealCard.tsx`, `postGig/SocialOptionButton.tsx`, `postGig/ZealotryGauge.tsx`, `stage/EffectTextureManager.ts`, `stage/CrowdTextureManager.ts`, `stage/NoteTextureManager.ts`, `overworld/OverworldMap.tsx`, `useGigVisuals.ts`, `kabelsalat/hooks/useKabelsalatBackground.ts`.
- Recommendation: **MERGE** — extract a single `resolveGenImageUrl(prompt, isOnline?)` helper in `imageGen.ts`.

### D4. `Object.keys(...).length` for emptiness (MED)
AGENTS.md rule: use `isEmptyObject` helper. Violations:
- `src/context/reducers/systemReducer.ts:567`
- `src/context/reducers/minigameReducer.ts:184,206`
- `src/scenes/kabelsalat/hooks/useKabelsalatTimer.ts:60` (acceptable — counting members, not testing emptiness)
- Recommendation: **FIX** — first three replace with `!isEmptyObject(...)` / `isEmptyObject(...)`.

### D5. `MapGenerator` does not reuse `secureRandom`/seeded helper (LOW)
The class accepts a seed in constructor and constructs its own `this.random`. `randomUtils.ts` already imports `secureRandom`. Either the seeded engine should live alongside `randomUtils.ts`, or one of the two should consume the other.

### D6. Manual JSON sanity in two reducers (LOW)
`hasForbiddenKeys` / `isForbiddenKey` and `Object.hasOwn` patterns appear consistently, but `systemReducer.ts:1270-1272`'s manual relationship-number pickling does not use `clampRelationship` (see I3).

---

## 2. ORPHANED / UNINTEGRATED CODE

Verified zero non-self / non-test imports unless noted.

### O1. `src/utils/randomUtils.ts` — entire file orphaned (HIGH)
Only test references and AGENTS.md doc-only reference. The `MapGenerator` class re-implements `pickRandomSubset` inline.
- Recommendation: **DELETE** the file (and update the AGENTS.md gotcha bullet), **OR INTEGRATE** by having `mapGenerator.ts` import this util.

### O2. `src/ui/prototypes/VisualPrototypes.tsx` — orphan UI prototype (HIGH)
432 LOC. Only consumer is `tests/ui/BrutalistUI.test.jsx`. Not lazy-loaded anywhere, not routed.
- Recommendation: **DELETE** (and delete or repurpose the test), or move under `tests/fixtures/`.

### O3. HUD bars never rendered (HIGH — primary user interest) — **FALSE POSITIVE**
- `src/components/hud/CorruptionMeter.tsx` and `src/components/hud/OverloadMeter.tsx` are imported and rendered by `src/components/hud/StatsOverlay.tsx`, which is rendered by `src/components/GigHUD.tsx`. The audit missed the `StatsOverlay` intermediary.
- Recommendation: **NO ACTION** — both meters are correctly integrated.

### O4. `UPDATE_VOID_STRESS` action + creator is dead and the call site is silently broken (HIGH — primary user interest)
- `src/context/actionTypes.ts:9` defines `UPDATE_VOID_STRESS`
- `src/context/actionCreators.ts:104` exports `createUpdateVoidStressAction`
- `src/types/game.d.ts:113` declares `Action<…UPDATE_VOID_STRESS, { delta: number }>`
- **No reducer handler** exists in `gameReducer.ts` reducerMap nor in any case-style reducer.
- **No `voidStress` state field** exists anywhere in `src/types/` or `initialState.ts`.
- The only caller, `src/hooks/rhythmGame/useRhythmGameScoring.ts:194`, does:
  ```ts
  const action = createUpdateVoidStressAction(2.5 * count)
  if ('payload' in action) { updateBand(action.payload) }
  ```
  This dispatches `UPDATE_BAND` with payload `{ delta: 2.5*count }` — but `delta` is not a band field, so this silently no-ops in `handleUpdateBand`.
- Recommendation: **INTEGRATE** (add `voidStress` to band/player state, write reducer handler, dispatch the action properly) OR **DELETE** action type + creator + union member + the caller block.

### O5. `fetchGenImage`, `fetchGenImageAsObjectUrl`, `clearImageCache` (MED)
`src/utils/imageGen.ts:33,55,95` — exported but only referenced from `tests/node/imageGen.test.js`. Production code uses `getGenImageUrl` (direct URL string) instead.
- Recommendation: **DELETE** the unused exports and their tests, OR **INTEGRATE** via switching consumers (e.g., `useGigVisuals.ts`) to use object-URL caching.

### O6. `withRetry` in `src/utils/errorHandler.ts:607` (MED)
Exported but only referenced from its own file's comments. Per AGENTS.md "Retry/error helpers must preserve the original failure cause" — appears intended for callers that don't exist.
- Recommendation: **INTEGRATE** at known retry sites (asset loading in `loadTexture`, leaderboard sync), or **DELETE**.

### O7. `RenderError` class in `src/utils/errorHandler.ts:134` (LOW)
Exported, only referenced from its own factory at line 90. `AudioError`, `GameError`, `StateError`, `StorageError` are all used by callers, but no caller ever instantiates `RenderError`.
- Recommendation: **INTEGRATE** in `PixiStageController.ts` / texture managers, or **DELETE**.

### O8. `removeSafeStorageItem`, `hasSafeStorageItem` in `src/utils/storage.ts:65,80` (LOW)
Exported, zero callers.
- Recommendation: **DELETE** unless reserved for upcoming features.

### O9. `clampRelationship` in `src/utils/gameStateUtils.ts:252` (MED)
Exported but only referenced internally by `applyEventDelta` in the same file. Reducers that mutate relationship maps (`systemReducer.ts:906-908`, `1270-1272`) do not call it during sanitization.
- Recommendation: **INTEGRATE** in `systemReducer.ts` and `bandReducer.ts` wherever relationship numbers are assigned.

### O10. `clampVanCondition`, `clampVanFuel` partial integration (LOW)
Exported (`gameStateUtils.ts:295,307`); used 3 places each, but `useRoadieLogic.ts:82` and `useTourbusLogic.ts:190` and `actionCreators.ts:451` inline-clamp condition/damage instead of using these helpers (see D2).
- Recommendation: **FIX** call sites to use canonical helpers.

### O11. Economy constants exported with zero `src/` consumers (LOW)
In `src/utils/economyEngine.ts`:
- `BAR_RATE_VIP` (line 22)
- `BAR_RATE_NORMAL` (line 32)
- `AVG_SPEND_PER_PERSON_AT_BAR` (line 33)
- `GLOBAL_PAYOUT_NERF` (line 152)

All four are only consumed inside `economyEngine.ts` (or sim scripts — none referenced from `scripts/`).
- Recommendation: **DELETE** the `export` keyword (downgrade to module-private), unless balance-sim mirroring is planned.

### O12. `calculateDistance` (LOW)
`src/utils/economyEngine.ts:390` — exported but used only internally in the same file.
- Recommendation: drop `export`.

### O13. `MINIGAME_REGISTRY` partially used (LOW)
`src/utils/minigameRegistry.ts` defines a registry with `startAction`, `completeAction`, `calculateResult`, `scene`. Only `.scene` is read by `minigameReducer.ts`. The other fields are dead.
- Recommendation: **INTEGRATE** — the registry should drive `dispatch(START/COMPLETE)` and `calculateResult()` from a single source rather than hand-wired switches in `minigameReducer`. OR slim the registry to `{ scene }`.

### O14. Deprecated re-export shims (LOW)
- `src/components/stage/utils.ts` — used by `PixiStageController.ts:14` (one importer)
- `src/hooks/minigames/constants.ts` — no consumers
- `src/scenes/kabelsalat/utils.ts` — no consumers
- `src/scenes/kabelsalat/constants.ts` — no consumers
- Recommendation: update `PixiStageController.ts` to import from `stageRenderUtils` directly; then **DELETE** all four shims.

### O15. Over-exported internal effect handlers (LOW)
`src/utils/purchaseLogicUtils.ts`: `applyInventorySet` (227), `applyInventoryAdd` (240), `applyStatModifier` (278), `applyUnlockUpgrade` (480), `applyUnlockHQ` (514), `applyPassive` (626) are exported but only used inside `EFFECT_HANDLERS` in the same file.
- Recommendation: drop `export` keyword.

### O16. `IMG_PROMPTS` — verify completeness (LOW)
`src/utils/imageGen.ts:109` exports a constant; multiple entries consumed (`BRAND_DEAL_*`, `GIG_SUCCESS`, etc.). Spot-check shows consumers exist; flagged here only to verify each member key actually has a callsite — would require enumerating both sides.

---

## 3. INCONSISTENCIES

### I1. `||` instead of `??` for valid-zero numeric fallbacks (LOW)
AGENTS.md: "Preserve valid falsy values with nullish checks (??), not truthy fallbacks (||)."
- `src/hooks/useMerchPress.ts:27,28` — `(player?.money || 0) >= config.cost && (band?.harmony || 0) >= config.harmonyCostOnFail`. `harmony` minimum is 1 (per AGENTS.md), and `money` legitimately can be 0; using `||` is acceptable for the comparison but violates the convention.
- `src/components/postGig/CompletePhase.tsx:23` — `(social?.controversyLevel || 0) > 50`. 0 is valid; harmless here but inconsistent.
- `src/hooks/useBloodBank.ts:15,27` & `useMerchPress.ts:15` — `(player?.fameLevel || 0) * multiplier`. Fame level 0 is valid; this is the documented convention violation.
- Recommendation: **FIX** to `??`.

### I2. Clamp helper usage inconsistent across reducers/hooks (MED)
Per AGENTS.md "Reducers remain the final authority for bounded state … apply canonical clamp helpers." Inline `Math.max(0, Math.min(100, …))` in `actionCreators.ts:451`, `useRoadieLogic.ts:82`, `useTourbusLogic.ts:190` bypasses the helper layer. See D2/O10.

### I3. Relationship score sanitization (MED)
`systemReducer.ts:906-908` filters relationship map entries by `[key, value]` predicate but does not pipe `value` through `clampRelationship`; `:1270-1272` accepts any finite number for `npc.relationship`. `clampRelationship` (`gameStateUtils.ts:252`) exists and is unused outside `applyEventDelta`.
- Recommendation: **FIX** — call `clampRelationship` in both sanitize paths.

### I4. Mixed direct `console.*` vs `logger` (LOW)
AGENTS.md style implies `logger`. 13 non-logger callsites in `src/`:
- `src/components/MinigameSceneFrame.tsx:111`
- `src/components/ReloadPrompt.tsx:14`
- `src/ui/DebugLogViewer.tsx:91` (legitimate — dumps logger)
- `src/ui/CrashHandler.tsx:46`
- `src/ui/ContrabandStash.tsx:95`
- `src/ui/bandhq/hooks/usePurchaseLogic.ts:138,221`
- `src/hooks/useChatterLogic.ts:87`
- `src/hooks/overworld/useOverworldSave.ts:26`
- `src/scenes/kabelsalat/hooks/useKabelsalatInteractions.ts:113,127`
- `src/utils/fullscreen.ts:8`
- Recommendation: route through `logger` (some legitimately should remain, e.g. CrashHandler where logger may be the failed dependency).

### I5. `getCityKeyFromVenueId` empty-string guard (LOW)
AGENTS.md notes callers must guard the empty-string case. Should verify each caller; spot-check OK but worth a sweep.

---

## 4. DEAD / UNREACHABLE CODE

### DC1. `useRhythmGameScoring.ts:194-198` `if ('payload' in action)` branch (HIGH)
The created action *always* has a `payload`. The `if` is dead-safe but the `else` is unreachable. More importantly the entire dispatch is broken (see O4) — the action's payload is forwarded to `updateBand` where `delta` is a no-op field.

### DC2. `@ts-expect-error` at `src/context/gameReducer.ts:172` (LOW)
Legitimate (typed indexing limitation). Verify directive still applies after any refactor; document the underlying limitation.

### DC3. Deprecated re-export shims (LOW)
See O14 — three shim files have no consumers.

### DC4. `imageGen.ts` `fetchGenImage*` / `clearImageCache` (MED)
See O5 — entire object-URL caching subsystem in `imageGen.ts:33-107` is reachable only from tests.

---

## 5. MISSING INTEGRATION

### MI1. Void Stress mechanic (HIGH)
Action type, action creator, action-union member exist; rhythm scoring tries to dispatch it on misses; **but no state field, no reducer, no UI surface**. Either complete the loop (state + reducer + HUD bar) or remove. The current state means rhythm-game miss penalties are silently swallowed. (See O4.)

### MI2. Corruption / Overload meters (HIGH) — **FALSE POSITIVE**
Both `CorruptionMeter` and `OverloadMeter` are rendered through `StatsOverlay` → `GigHUD`. Already integrated. (See O3.)

### MI3. Object-URL image caching (`fetchGenImageAsObjectUrl`) (MED)
The util exists with a cache to avoid redundant network requests, but every consumer uses `getGenImageUrl` directly (no caching). This means re-renders of e.g. `DealCard` or `ContrabandStash` images may re-fetch.
- Recommendation: route image-heavy components through `fetchGenImageAsObjectUrl` or **DELETE**.

### MI4. `withRetry` retry helper (MED)
Built but no callers — leaderboard sync, asset loading, and pollinations.ai fetches (which are flaky) all hand-roll their error handling without retry.
- Recommendation: wire into `submitLeaderboardScores` (`src/utils/leaderboardUtils.ts`) and `fetchGenImageAsObjectUrl`.

### MI5. `MINIGAME_REGISTRY.calculateResult` field unused (MED)
The registry centralizes minigame metadata but `minigameReducer.ts` calls `calculateTravelMinigameResult`, `calculateRoadieMinigameResult`, etc. directly. The registry's `calculateResult` and action references are orphaned data. (See O13.)

### MI6. `RenderError` (LOW)
Defined but never thrown. Pixi stage controllers throw bare `Error` or `GameError`.

### MI7. `clampRelationship` not used by reducers (MED)
See I3 / O9. Relationship-score sanitization is incomplete.

---

## Summary by severity

| Severity | Count |
|---|---|
| HIGH | 6 (D1, O1, O2, O3/MI2 [FALSE POSITIVE], O4/MI1, DC1) |
| MED | 14 |
| LOW | 12 |

Highest-leverage cleanups for an autonomous fix pass:
1. Resolve `UPDATE_VOID_STRESS` (O4/MI1) — decide build-out vs. removal; current code is misleading.
2. ~~Wire or remove `CorruptionMeter` / `OverloadMeter`~~ — already integrated via `StatsOverlay`.
3. Delete `randomUtils.ts` or have `MapGenerator` consume it (D1/O1).
4. Replace inline `Math.max(0, Math.min(100, …))` with canonical helpers (D2/I2).
5. Delete `VisualPrototypes.tsx` + companion test (O2).
6. Drop unused `export` keywords on internal-only purchase-effect handlers and economy constants (O11/O15).
7. Replace `Object.keys(...).length` emptiness checks with `isEmptyObject` (D4).
8. Apply `clampRelationship` in reducers (I3/O9).
9. Delete deprecated shim files now that consumers can import directly (O14).
10. Route `console.*` callsites through `logger` (I4).
