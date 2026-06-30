# Neurotoxic — Code-Quality Audit Findings

**Scope:** complete codebase under `src/`. `node_modules`, `dist`, and `tests/` excluded from the primary audit (tests consulted only to confirm orphan/contract claims).
**Method:** symbols index (`symbols.json`) mined for orphans/duplicate names + 5 parallel subsystem audits + ripgrep verification of every substantive claim.
**Baseline:** audited 2026-06-30 against PR base `e5fb198`. All `file:line` references and code snippets below describe the **pre-fix** state.
**Status:** every finding below was *resolved in this PR* (fix commits `5df1e8a` + `f16ac7a`) **except** rows/sections explicitly marked *Retracted*/*Kept*/*Deferred*. See the Status column and per-finding **Resolution** notes — the snippets are intentionally left as the original findings so the document stays a faithful before/after record.

## Executive summary

This codebase is **unusually clean**. The state/payload-safety layer, React/Pixi style rules (no hardcoded colors, no `.propTypes`, no invented CSS aliases), i18n EN/DE key parity, and action-type→reducer coverage are all effectively compliant. There are **no true orphan components, no missing features, no dead action handlers, and no EN/DE key gaps.**

Genuine findings are few and concentrated. The headline items (all resolved in this PR):

| # | Severity | Finding | Action | Status |
|---|----------|---------|--------|--------|
| 1 | HIGH | `harmonyRegenTravel` applied **+4** in daily tick vs **+5** in both travel/arrival paths, and skipped the `finiteNumberOr` addend wrap the other two use | FIX | ✅ Fixed → standardized to +5 with `finiteNumberOr` |
| 2 | MED | `buildSongChartDensity` is orphaned (test-only) AND its per-song bucketing loop is copy-pasted inside `buildSetlistChartDensity` | INTEGRATE | ✅ Fixed → shared `buildSongDensityEvents`/`accumulateDensityCounts` |
| 3 | MED | Byte-identical "BOLT OPTIMIZATION" quest-index loop duplicated in `questAdvance.ts` (×2) | MERGE | ✅ Fixed → `findActiveQuestIndex` |
| 4 | MED | `crisis.opt1` locale string hardcodes `-$250` (wrong symbol + no `{{amount}}`), in an unreachable default-actions branch | FIX | ✅ Fixed → amount removed (EN+DE) |
| 5 | MED | 3 quest id constants + `negotiateDeal`/`generateBrandOffers` rival-proximity duplication + others | INTEGRATE/MERGE | ✅ Fixed → constants wired + `isRivalInPlayerLocation`/`selectTop3ByScore` |

---

## 1. INCONSISTENCIES

### 1.1 — HIGH — Divergent `harmonyRegenTravel` magnitude + missing finite guard
- **`src/utils/dailyTickLogic.ts:329`** applies `clampBandHarmony(nextBand.harmony + 4)`.
- **`src/utils/travelUtils.ts:296`** (`getTravelArrivalUpdates`) applies `clampBandHarmony(finiteNumberOr(band.harmony, 0) + 5)`.
- **`src/utils/arrivalUtils.ts:72`** (`processHarmonyRegen`) applies `clampBandHarmony(finiteNumberOr(band.harmony, 0) + 5)`.

Three sites handle the **same** `harmonyRegenTravel` flag with **two** different magnitudes (+4 vs +5). The daily-tick site is also the only one that does **not** wrap the addend with `finiteNumberOr`, violating the [`CLAUDE.md`](./CLAUDE.md) arithmetic-then-clamp rule (wrap persisted addends with `finiteNumberOr(value, fallback)` before calling clamp helpers) — a persisted `undefined`/`NaN` harmony silently drops the bonus (clamp short-circuits NaN→0).
- **Action: FIX** — wrap the daily-tick addend with `finiteNumberOr(nextBand.harmony, 0)` and standardize to +5 to match the travel/arrival paths.
- **Resolution (this PR):** ✅ Fixed — `dailyTickLogic.ts` now applies `clampBandHarmony(finiteNumberOr(nextBand.harmony, 0) + 5)`.

### 1.2 — MED — Inconsistent import path for `isForbiddenKey`
- `src/utils/translationUtils.ts:1` imports it from the `./gameState` barrel; `saveValidator.ts` imports it from its definition site `./objectUtils`.
- **Action: FIX** — pick one path (prefer the definition site).

### 1.3 — MED — `||` where `0` is a valid value in `socialEngine.ts`
- `src/utils/socialEngine.ts:439` — `options.modifiers || 0` (a valid `0` modifier collapses; rest of file uses `??`).
- `src/utils/socialEngine.ts:119` — `(social?.reputationCooldown || 0) > 0` while sibling sites (140, 304, 332) use `??`.
- **Action: FIX** — use `?? 0`.

### 1.4 — LOW — `||` fallbacks where falsy could matter
- `src/utils/rhythmUtils.ts:32,35` — `song.bpm || 120`, `song.difficulty || 2` (mirrored at `gigModifiersUtils.ts:171`); a `0` difficulty silently becomes 2. Invalid data anyway → low impact.
- `src/domain/questAdd.ts:77` — `[...(state.activeQuests || []), ...]` on an array; harmless but `??` is project convention.
- `src/utils/crypto.ts:120-139` — the `(lut[buffer[n] ?? 0] || '')` chain mixes `??` and `||`; the `|| ''` is redundant since `lut` is a string array with no falsy non-empty entries and `?? 0` already guarantees a valid index. **Action: FIX** — drop the `|| ''` suffixes.
- **Action: FIX** (low value).

### 1.8 — LOW — Legacy dual-signature invites misuse
- `src/utils/socialEngine.ts:432-441` — `calculateViralChance` accepts `options: ViralOptions | number` for backward compatibility; a caller passing `0` (intending "no modifiers") routes through the numeric branch, which is correct but easy to misuse. **Action: FIX** — add a `@deprecated` JSDoc on the numeric overload to steer callers to the object signature.

### 1.5 — LOW — `normalizeVenueId` null/empty-string convention mismatch
- `src/utils/mapUtils.ts` `normalizeVenueId` returns `null` for malformed input while `getCityKeyFromVenueId` (mapGenerator) returns `''`; callers must guard both. **Action: FIX** — unify.

### 1.6 — LOW — Type mismatch threaded through kabelsalat
- `src/scenes/kabelsalat/useKabelsalatState.ts:24` — `faultReason` initialized as `''` (string) but consumer props (`KabelsalatBoard`/overlays) declare `string | null`, forcing defensive `??`. **Action: FIX** — pick one type end-to-end.
- `src/scenes/kabelsalat/hooks/useKabelsalatTimer.ts:11-12` — a `import type { SocketId }` sits below code that already uses a sibling import; compiles fine, but breaks conventional import ordering. **Action: FIX** (style only).

### 1.7 — LOW (parity-only, transitively safe)
- `src/utils/assetTicks.ts:166-167` (`processLiabilityTick`) seeds `currentMoney`/`nextFame` from raw `state.player.*` without `finiteNumberOr`, unlike the sibling `processAssetTick` (lines 91-103). Defended transitively (asset tick runs first and emits finite money/fame), but a future reorder would propagate NaN into `fame`/`fameLevel`. **Action: FIX** for parity.
- `src/context/reducers/systemReducer.ts:487` (`processContrabandExpiry`) computes `(remainingDuration as number) - 1` without `finiteNumberOr`, diverging from the rest of the file. Reachable only via malformed direct dispatch (load path clamps it). **Action: FIX** for convention parity.

---

## 2. DUPLICATES

### 2.1 — MED — `chartDensity.ts` per-song density loop duplicated (also an orphan, see 3.1)
- `src/utils/chartDensity.ts:70-93` (inside `buildSongChartDensity`) and `:157-163`+ (inside `buildSetlistChartDensity`) contain the same note→bucket counting logic. `buildSetlistChartDensity` reimplements the per-song pass inline instead of calling `buildSongChartDensity`.
- **Action: INTEGRATE/MERGE** — have `buildSetlistChartDensity` call `buildSongChartDensity` (or extract a shared `updateDensityCounts` helper). This simultaneously resolves orphan 3.1.

### 2.2 — MED — Identical quest-index lookup loop copy-pasted
- `src/domain/questAdvance.ts:18-24` (`advanceQuest`) and `:82-88` (`setQuestProgress`) — byte-identical "BOLT OPTIMIZATION" procedural loop, comment block and all.
- **Action: MERGE** into a private `findQuestIndex(activeQuests, questId)` helper.

### 2.3 — MED — Rival-in-location proximity check duplicated within `brandDealLogic.ts`
- `src/utils/brandDealLogic.ts:199-202` (`generateBrandOffers`) and `:293-295` (`negotiateDeal`) — identical 3-clause `rivalBand.currentLocationId === player.currentNodeId` check.
- **Action: MERGE** into a local helper.

### 2.4 — LOW — Top-3-by-score selection duplicated across files
- `src/utils/socialEngine.ts:197-229` and `src/utils/brandDealLogic.ts:214-243` — same "top-3 by score with `-Infinity` sentinel" logic.
- **Action: MERGE** into a shared `selectTop3` util.

### 2.5 — LOW — Venue-id suffix parsing reimplemented in sanitizer
- `src/context/reducers/sanitizers/stateSanitizers.ts` (~`:1062`) manually parses the `venues:<id>.name` suffix instead of calling `normalizeVenueId`/`migratePlayerLocation` from `src/utils/mapUtils.ts:85-95`.
- **Action: INTEGRATE** — route the sanitizer through `normalizeVenueId`.

*Non-findings:* the three asset confirm modals (`SellConfirmModal`/`RepairConfirmModal`/`UpgradeConfirmModal`) already share `shared/ConfirmButton` and differ only in domain content — not duplicates. `tradeReducer.ts:sanitizeContextValue` vs `errors/types.ts:sanitizeContextValue` is a name collision only (both delegate to the shared primitive). `MapConnection` component vs type is benign.

---

## 3. ORPHANED / UNINTEGRATED CODE

### 3.1 — MED — `buildSongChartDensity` is orphaned (test-only)
- `src/utils/chartDensity.ts:29` — exported, has a test, but **no `src/` consumer** (verified: only `buildSetlistChartDensity` is imported, by `SetlistBlock.tsx`). Its logic is duplicated inline (see 2.1).
- **Action: INTEGRATE** — wire it into `buildSetlistChartDensity` so it has a real consumer and the duplication disappears.

### 3.2 — MED — `initGlobalErrorHandling` export is dead
- `src/utils/errors/handler.ts:205` (re-exported at `errors/index.ts:10`) — the function self-invokes at module load (`handler.ts:252`); **no import consumes the export** anywhere in `src/`.
- **Action: DELETE the export** (keep the self-call), or document it as an intentional public API.

### 3.3 — LOW — 3 quest id constants used only via raw string literals
- `src/data/questsConstants.ts:50-52` — `QUEST_BACK_FROM_PIT`, `QUEST_SINCERE_REDEMPTION`, `QUEST_BAND_PACT` have **no non-test `src/` consumer**, while the other 29 constants are imported into `events/quests.ts`. The quests themselves are **not** dead — they are registered in `questRegistry.ts` and reached via `followupQuestId: 'quest_back_from_pit'` etc. (string literals) in `quest_prove_yourself`/`quest_apology_tour`/`quest_ego_management`. The constants are also required by `tests/data/questRegistry.test.js` (every registry id must have an exported constant), so deleting them breaks tests.
- **Action: INTEGRATE** — replace the raw `followupQuestId` string literals with the exported constants so the references become real and consistent with the other 29.

### 3.4 — ~~LOW — `BASE_SPEED` / `TARGET_DISTANCE` re-export with no `src` consumer~~ (RETRACTED — required fixture)
- `src/hooks/minigames/useTourbusLogic.ts` — re-exported "for backward compatibility and tests"; only tests reference them.
- **Action: KEEP.** This was initially deleted, but it is the canonical *aliased re-export fixture* that `tests/node/updateSymbols.test.js` asserts against (`ks.BASE_SPEED` with `isAlias`/`localName`, and `meta.aliasedReexports >= 1`). Removing it drops `aliasedReexports` to 0 and reds the Node.js test suite. Restored with an explicit comment; not a true orphan.

### 3.5 — LOW — Unused error-API surface
- `src/utils/errors/index.ts:3` — `ErrorCategory` re-export has no `src/` consumer (`ErrorSeverity` does). **Action: DELETE** the re-export or document as intended API.
- `src/utils/errors/types.ts` — `GameError.State` and `GameError.Audio` static factories are never called (callers use `new GameError(...)`/`StateError`). **Action: DELETE.**

*Note — over-exported but used in-file (33 symbols, LOW):* a programmatic pass found 33 exports whose only references are within their own defining file (e.g. `EFFECT_HANDLERS`, `DRUM_HANDLERS`, `TUTORIAL_STEPS`, `handleToggleNeuroDecimator`, `getQuestNextStepHint`, `resolveVenue`, the `eventEngine/helpers.ts` trio `toStringArray`/`logEventError`/`processEvent`, and the type-only `questProgress.ts:21` `LegacyQuestProgressEvent`). These are used (dispatch tables, test seams, save-compat type unions) but exported unnecessarily. Bulk un-export is optional cleanup, not a defect — and `LegacyQuestProgressEvent` should be confirmed against save-file compatibility before any change.

---

## 4. DEAD / UNREACHABLE CODE

### 4.1 — LOW — Unreachable default crisis-modal actions + hardcoded currency (see also 1.x / 4 in i18n)
- `src/ui/shared/BrutalistUI.tsx:362-378` — the default `modalActions` array (the only consumer of `crisis.opt1/opt2/opt3`) is **never reached**: the sole caller `ForeclosureModal.tsx` always passes an explicit `actions` prop. The `crisis.opt1` string also hardcodes `-$250`.
- **Action: INTEGRATE** — if a default crisis modal is intended elsewhere, wire it up and fix the currency string; otherwise the keys/branch are removable.

### 4.2 — LOW — Detached JSDoc block
- `src/utils/rhythmGameLoopUtils.ts:39-46` — JSDoc detached from any declaration (its `finalizeGig` target is ~185 lines later). **Action: DELETE** or relocate.

### 4.3 — LOW — Misleading single-arg `Math.max`
- `src/utils/eventEngine/eventSelection.ts:212` — `Math.max(Math.min(CAP, x))`; the outer single-arg `Math.max` is a no-op. **Action: FIX** — drop the outer `Math.max`.

### 4.4 — LOW — Never-exercised inner guard in `normalizeVenueId`
- `src/utils/mapUtils.ts:91-95` — the `if (hasName && id.includes(':'))` branch is never taken by real data: production venue ids always have the colon before the `.name` suffix (`venues:<id>.name`), so the two conditions never co-occur in the shape this branch targets. Defensive, not strictly dead. **Action: FIX** — remove the inner guard or document the intended malformed-input case.

*Non-findings (verified, deliberately kept):*
- `useStartTravelSequence.ts:61-69` failsafe `setTimeout`/`onTravelComplete` is unreachable in production but is a documented deliberate fallback (hooks/AGENTS.md) — **KEEP.**
- `changeScene` calls in `useKabelsalatGameEnd`/`useAmpTimer`/`useRoadieSceneTransition` are **NOT** violations — the forbidden rule applies to the `handleComplete*` reducers (which do not touch `currentScene`); scene-side hooks owning `changeScene` is exactly what kabelsalat AGENTS.md mandates.
- No `if (false)`/`&& false`/permanently-false flags anywhere; `import.meta.env.DEV` gates are intentional.

---

## 5. MISSING INTEGRATION

No features were found built-but-unwired. Every minigame hook, overworld hook, travel sub-hook, asset action creator, quest module, and React component traces to a live consumer (scene, reducer, or barrel used by a scene). Spot-verified: all asset creators (`refinanceLiability`, `upgradeChassisTier`, `resolveCrowdfundProbability`, `createCheckRivalEncounterAction`) are dispatched from UI; `MODIFIER_COSTS` is the single source of truth; every `*_FAILED` action type has a reducer binding.

Two items warrant a glance (behavioral, not orphans):
- **LOW** — `src/utils/purchaseLogicUtils.ts:~640-667` (`applyUnlockHQ`): the HQ bundle includes `hq_room_cheap_beer_fridge` but the inner switch has no explicit case, so it falls to `default` (mood +5), possibly diverging from that item's daily-tick mood effect. **Action: FIX** — add an explicit case or confirm intended.
- **LOW** — `src/utils/logger.ts:61,63,95,97` reads/writes `localStorage` directly instead of via the `storage.ts` safe helpers. Likely justified (logger is a low-level bootstrap dep). **Action: INTEGRATE** if no circular-dep blocker, else document.

---

## Coverage notes
- Orphan claims cross-checked against `symbols.json` usage graph (`usedBy`/`usedByTests`/`referencedBy`/`referencedByLocal`/`referencedInFile`) and ripgrep. The 8 audio functions (`playSFX`, `setMusicVolume`, etc.) that appeared test-only are **false positives** — re-exported via the `audioEngine` barrel and called as `audioEngine.x()`.
- EN/DE locale parity verified across all 10 file pairs (identical flattened key sets); all `ns:key` literals in `src/data` resolve in both locales.
- 162 event ids and 32 quest definitions confirmed unique/registered exactly once.

### Reconciled false positives (raised by deep-read helpers, rejected after context)
Severities below were corrected against the relevant `AGENTS.md` rules; they are recorded here so the fix pass does not re-introduce them as defects.
- **`changeScene` in minigame end-hooks** (`useAmpLogic.ts:377`, `useRoadieLogic.ts:177`, `useKabelsalatGameEnd.ts:66`) — flagged HIGH ×3 by an automated sweep. **NOT violations.** The ban applies to the `handleComplete*` reducers (verified clean in `minigameReducer.ts`); scene-side hooks owning routing is explicitly mandated by kabelsalat `AGENTS.md`. See §4 Non-findings.
- **`useGigEffects` exported seams** (`calculateChaosStyle`/`playBandMemberAnimation`/`applyChaosJitter`) — not dead; covered by `tests/node/useGigEffects.test.js`.
- **`mapUtils.ts:79` `rawId === 0`** — downgraded MED→LOW: defensive check at an `unknown` boundary, not unreachable dead code.
- **`logger.ts` direct `localStorage`** — downgraded HIGH→LOW: logger is a low-level bootstrap dependency; routing through `storage.ts` may introduce a circular dependency (see §5).
- **Orphaned JSDoc / venue-parse duplication** — these are documentation/DRY cleanups, not correctness HIGHs; rated LOW (§4.2) and LOW (§2.5).
