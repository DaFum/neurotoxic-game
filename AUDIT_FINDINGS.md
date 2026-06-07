# Neurotoxic Codebase Audit — Categorized Findings

**Scope:** all of `src/` (540 files). Tests checked only for orphan references.
**Method:** `symbols.json` exported-symbol index (with `usedBy` / `referencedByLocal` / `referencedInFile` / `usedByTests`) for orphan detection, plus ripgrep verification for every semantic claim. No files were modified.

## Headline

The codebase is **unusually clean**. The strong, verified negatives are as important as the findings:

- **0** orphaned runtime exports (functions/components/hooks/constants). The index reports only 4 orphaned *type* interfaces (below).
- **0** action creators without a runtime caller (all 50 wired).
- **0** exported hooks without a runtime consumer (all 72 used).
- **0** dead reducer cases — all 124 `case` labels in `src/context/reducers/**` map 1:1 to `actionTypes.ts`.
- **0** `if (false)` / hardcoded-false render gates / `@deprecated` / unreachable-after-return markers.
- **EN/DE locale key parity is exact** across all 10 locale files (verified by the inconsistency sub-audit).
- No inline hex color literals in `src/components`, `src/ui`, `src/scenes`.
- The four name-collisions that looked like duplicates are **not** duplicates (see "Investigated, NOT a finding").

The real findings are a small set: 4 orphan types, one half-finished i18n migration, and two `finiteNumberOr` gaps.

---

## 1. Duplicates

**No true duplicates found.** Four exported names are declared in 2+ files; all were investigated and cleared:

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

No action. (Noted only because it was flagged for investigation.)

---

## 2. Orphaned / Unintegrated Code

### 2.1 Four orphaned type interfaces — **LOW** — DELETE (or confirm as intended public API)

Declared in a domain `.d.ts`, re-exported through the `src/types/game.d.ts` barrel, but referenced **nowhere** in `src/` (verified: no usage outside the declaring file and the barrel; `symbols.json` reports empty `usedBy`/`referencedByLocal` and `referencedInFile: false`):

- `CharacterProfile` — `src/types/npc.d.ts:4`
- `CompleteTravelMinigamePayload` — `src/types/actions.d.ts:6`
- `QuestCooldown` — `src/types/quest.d.ts:357`
- `QuestScopeCompletion` — `src/types/quest.d.ts:368`

`CompleteTravelMinigamePayload` is the most suspicious: the `COMPLETE_TRAVEL_MINIGAME` action exists and is handled, yet its dedicated payload type is unused — the reducer/creator likely types the payload inline or via a different name. Worth a glance to confirm the intended payload type isn't drifting from the one that's actually used.

No runtime impact (type-only). DELETE the dead exports, or, if they are an intentional published API surface, leave them.

---

## 3. Inconsistencies

### 3.1 `postOptions.ts` — half-migrated i18n — **MED** — FIX

`src/data/postOptions.ts` has **16 `message:` fields using `i18n.t('ui:postOptions.…')` and 16 using raw English string literals**, all flowing through the same render path (`result.message` rendered at `src/components/postGig/CompletePhase.tsx:78`). German players see English for the un-migrated half. Examples of raw strings:

- `postOptions.ts:241` `'The fans are responding well to your honesty.'`
- `postOptions.ts:273` `'It looked completely staged. Backlash increased.'`
- `postOptions.ts:294`, `:316`, `:374`, `:433`, `:452`, `:478`, `:494`, `:513`, `:534`, `:818` (the last also hardcodes `€`: `` `…Made ${hypeCash}€.` ``).

Violates AGENTS.md "User-facing text must use namespaced i18n keys." Migrate the remaining 16 to `ui:postOptions.*` keys (add matching EN+DE entries) and format the `€` value with `formatCurrency`.

> Note for contrast: `brandDeals.ts` also contains raw English `description`/`title` strings, but those run through a dedicated translation layer (`src/utils/brandDealI18n.ts`) applied at render, so they are localized fallbacks, **not** a violation.

### 3.2 State-safety: `finiteNumberOr` gaps (arithmetic-then-clamp) — **MED** — FIX

AGENTS.md requires persisted numeric addends to be wrapped with `finiteNumberOr(value, fallback)` because a stale/hostile save can carry non-finite numerics that bare `typeof === 'number'` lets through.

- **`src/context/reducers/bandReducer.ts:310`** — `staminaMax: (typeof currentMember.staminaMax === 'number' ? currentMember.staminaMax : 100) + value`. A `NaN`/`Infinity` `staminaMax` passes the `typeof` guard, and `NaN + value` is persisted. Use `finiteNumberOr(currentMember.staminaMax, 100) + value`.
- **`src/context/reducers/minigameReducer.ts:356` and `:539`** (`applyPostMinigameResult` / `handleCompleteRoadieMinigame`) — the `stress` addend in `finiteNumberOr(state.band.harmony, 0) - stress` wraps the left operand but not `stress`. The source values appear finite today, so severity is **LOW–MED**; wrapping `stress` with `finiteNumberOr(stress, 0)` aligns with the invariant defensively.

### 3.3 `typeof x === 'number'` audit — mostly benign

A sweep of all bare `typeof … === 'number'` guards (23 in `systemReducer.ts`, plus scattered others) found that — apart from 3.2 above — they are either (a) paired with `Number.isFinite` on the adjacent line (e.g. `toastSanitizers.ts:150/158`), (b) immediately fed to `finiteNumberOr` which collapses `NaN` (e.g. `assetSanitizers.ts:347`), (c) followed by a canonical clamp that short-circuits `NaN` (e.g. `systemReducer.ts:2020` → `clampBandHarmony`), or (d) pure type discrimination, not finiteness validation (e.g. `bandReducer.ts:462`, `systemReducer.ts:1887`). No additional action required.

### 3.4 `||` vs `??`

Verified clean. Every numeric `||` fallback sampled is either a legitimate post-`Number()` `NaN`-collapse (`Number(x) || 0`, which AGENTS.md explicitly allows) or a fallback on an optional-chain read where `0`/`''`/`false` cannot legitimately occur. No falsy-value-clobbering bugs found.

### 3.5 Colors & locale templates

No invented CSS var aliases, no inline hex in components, no hardcoded `€` in `public/locales/**` JSON. The only `€` literals in `src/` are code comments (`gameState/constants.ts:25`, `hqItems.ts`), an icon prop (`StatsTab.tsx:30` `icon='€'`), and the `postOptions.ts:818` string already flagged in 3.1.

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
- **Symbol index:** zero runtime exports with empty `usedBy` + `referencedByLocal` + `referencedInFile` + `usedByTests`.

The only "incomplete" signal that touches integration is the unused `CompleteTravelMinigamePayload` type (2.1) — investigate whether the travel-minigame completion path is meant to use it.

---

## Recommended Fix Priority for the Autonomous Pass

| # | Severity | Finding | Action |
|---|---|---|---|
| 3.1 | MED | `postOptions.ts` 16 raw English `message:` strings (+ hardcoded `€` at :818) | Migrate to `ui:postOptions.*` keys (EN+DE), format currency |
| 3.2a | MED | `bandReducer.ts:310` `staminaMax` not wrapped in `finiteNumberOr` | Wrap addend with `finiteNumberOr(…, 100)` |
| 3.2b | LOW | `minigameReducer.ts:356/:539` `stress` addend unwrapped | Wrap `stress` with `finiteNumberOr(stress, 0)` |
| 2.1 | LOW | 4 orphan type interfaces (incl. `CompleteTravelMinigamePayload`) | DELETE unused exports / confirm travel payload type |
