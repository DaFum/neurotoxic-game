# Neurotoxic Codebase Audit — Categorized Findings

**Scope:** all of `src/` (540 files). Tests checked only for orphan references.
**Method:** `symbols.json` exported-symbol index (with `usedBy` / `referencedBy` / `referencedByLocal` / `referencedInFile` / `usedByTests`) for orphan detection, plus ripgrep verification for every semantic claim.

> **Status:** All actionable findings this audit raised have been resolved on this branch (see git history). What remains below is the audit's standing record of verified-clean areas and non-findings. The one false-positive class the audit hit — cross-file type references invisible to the symbol index — was fixed at the generator level (`scripts/update-symbols.mjs` now records a `referencedBy` edge for `export *`-reachable type usage and namespace-member access), so it can no longer recur.

## Headline

The codebase is **unusually clean**. The strong, verified negatives:

- **0** orphaned runtime exports (functions/components/hooks/constants).
- **0** orphaned type exports (after the index fix, cross-file ambient `.d.ts` type usages are correctly attributed via `referencedBy`).
- **0** action creators without a runtime caller (all 50 wired).
- **0** exported hooks without a runtime consumer (all 72 used).
- **0** dead reducer cases — all 124 `case` labels in `src/context/reducers/**` map 1:1 to `actionTypes.ts`.
- **0** `if (false)` / hardcoded-false render gates / `@deprecated` / unreachable-after-return markers.
- **EN/DE locale key parity is exact** across all 10 locale files.
- No inline hex color literals in `src/components`, `src/ui`, `src/scenes`.
- The three name-collisions that looked like duplicates are **not** duplicates (see Section 1).

---

## 1. Duplicates

**No true duplicates found.** Three exported-name collisions were investigated and cleared:

| Name | Verdict |
|---|---|
| `isOnCooldown` (`src/utils/gameState/checks.ts:102`, `src/utils/eventEngine/eventEngineCore.ts:92`) | **Not a duplicate.** `eventEngineCore` imports the `checks.ts` impl from the `gameState` barrel (`isOnCooldown as isOnCooldownShared`) and re-exports it. Single source of truth. |
| `safeStorageOperation` (`src/utils/storage.ts:32`) vs `runSafeStorageOperation` (`src/utils/errorHandler.ts:522`) | **Not a duplicate.** `safeStorageOperation` is a thin variadic facade that delegates to `runSafeStorageOperation`; the retry/error logic lives only in the latter. |
| `useAudioControl` (`src/hooks/useAudioControl.ts:206`) | **Not a duplicate.** Three lines are TypeScript overload signatures for one implementation. |

### Audio subsystem (specifically investigated for parallel implementations)

Initial signals suggested `playSFX` / `setMusicVolume` / `playRandomAmbient*` existed in both the leaf modules and `AudioManager.ts`. **Verified false.** The audio layer is a clean layered design, not duplication:

- Runtime imports go through the `src/utils/audio/audioEngine.ts` **barrel** (heavily imported across hooks/scenes/components).
- `audioEngine.ts` re-exports the leaf modules (`sfx.ts`, `ambient.ts`, `transportControl.ts`, `AudioManager.ts`, `audioService.ts`).
- `AudioManager.ts` (`import * as audioEngine from './audioEngine'`) **delegates** to those leaf functions (`audioEngine.playSFX(key)` at `AudioManager.ts:351`, `audioEngine.setMusicVolume` at `:367`, `audioEngine.playRandomAmbientOgg` at `:214`, etc.).
- `audioService.ts` is a facade over the `audioManager` instance; consumers call `audioService.playSFX(...)`.

No action.

---

## 2. Orphaned / Unintegrated Code

**None.** No exported symbol (runtime or type) is unreferenced. The four type interfaces an earlier index read flagged (`CharacterProfile`, `CompleteTravelMinigamePayload`, `QuestCooldown`, `QuestScopeCompletion`) are all consumed as field/payload types in `src/types/game.d.ts`; the index now records this via `referencedBy`.

---

## 3. Inconsistencies

### 3.1 `typeof x === 'number'` audit — mostly benign

A sweep of all bare `typeof … === 'number'` guards (23 in `systemReducer.ts`, plus scattered others) found they are either (a) paired with `Number.isFinite` on the adjacent line (e.g. `toastSanitizers.ts:150/158`), (b) immediately fed to `finiteNumberOr` which collapses `NaN` (e.g. `assetSanitizers.ts:347`), (c) followed by a canonical clamp that short-circuits `NaN` (e.g. `systemReducer.ts:2020` → `clampBandHarmony`), or (d) pure type discrimination, not finiteness validation (e.g. `bandReducer.ts:462`, `systemReducer.ts:1887`). No action required.

### 3.2 `||` vs `??`

Verified clean. Every numeric `||` fallback sampled is either a legitimate post-`Number()` `NaN`-collapse (`Number(x) || 0`, which AGENTS.md explicitly allows) or a fallback on an optional-chain read where `0`/`''`/`false` cannot legitimately occur. No falsy-value-clobbering bugs found.

### 3.3 Colors & locale templates

No invented CSS var aliases, no inline hex in components, no hardcoded `€` in `public/locales/**` JSON. The only `€` literals in `src/` are code comments (`gameState/constants.ts:25`, `hqItems.ts`) and an icon prop (`StatsTab.tsx:30` `icon='€'`).

---

## 4. Dead / Unreachable Code

**None found.**

- All 124 reducer `case` labels correspond to live entries in `actionTypes.ts` — no orphaned switch arms.
- No `if (false)`, `&& false`, `|| true`, hardcoded-`false` render gates, or `@deprecated`/`UNREACHABLE` markers in non-test `src/`.

---

## 5. Missing Integration

**No fully-built-but-unwired feature found.** Each integration seam was checked:

- **Action creators:** all 50 exported creators (`actionCreators.ts`, `assetActionCreators.ts`) have ≥1 runtime caller outside their definition file and tests.
- **Hooks:** all 72 exported `useX` hooks are imported by a runtime consumer.
- **Reducers ↔ creators:** 1:1 case/type mapping (Section 4).
- **Event data:** all 9 event-domain arrays (`TRANSPORT_/BAND_/GIG_/FINANCIAL_/SPECIAL_/CRISIS_/CONSEQUENCE_/RELATIONSHIP_/QUEST_EVENTS`) are imported and spread into `ALL_RAW_EVENTS` → `EVENTS_DB` in `src/data/events/index.ts`. None defined-but-forgotten.
- **Symbol index:** zero runtime exports with empty `usedBy` + `referencedBy` + `referencedByLocal` + `referencedInFile` + `usedByTests`.
