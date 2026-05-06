# Comprehensive Codebase Review

**Date:** 2026-05-05  
**Repository:** `neurotoxic-game`  
**Branch:** `claude/fix-quest-preview-state-ECiGZ`  
**Review Scope:** Full `src/` tree for inconsistencies, duplicates, and unintegrated utilities

---

## 1. Critical Issues (Must Fix Before Merge)

### [Resolved] C-1: `getAudioTimeMs()` Bypasses Mandatory Timing API

**Location:** `src/hooks/rhythmGame/useRhythmGameScoring.ts`, line 298

**Issue:** Uses `getAudioTimeMs()` (wraps `Tone.now() * 1000`) directly for hit-detection scoring, bypassing the architecture-mandated `audioEngine.getGigTimeMs()` which is the official gig timing source.

The function at `src/utils/audio/playback.ts:679` implements `getAudioTimeMs()` and is used for MIDI note scheduling at the point of a successful hit. The concern is that mixing `getGigTimeMs()` (gig-relative elapsed time) with raw `Tone.now()` ms within the same callback at lines 263 and 298 could cause subtle timing drift.

**Recommended Fix:**
- Rename `getAudioTimeMs` to `getToneAbsoluteTimeMs` to make the semantic distinction explicit
- Add a clarifying comment explaining why absolute Tone time is needed here (MIDI scheduling) vs. `getGigTimeMs()` for all other gig timing

---

### [Resolved] C-2: Van Fuel Clamped with Hardcoded `100`

**Location:** `src/context/reducers/systemReducer.ts`, lines 490–496

**Issue:**
```ts
fuel: Math.max(0, Math.min(100, typeof rawPlayer.van.fuel === 'number' ? rawPlayer.van.fuel : 100))
```

Hardcodes `100` as the max fuel cap instead of using `clampVanFuel()` which references `EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL`. If this constant ever changes (e.g., for van upgrades), the save-load sanitizer will silently cap to the wrong value, corrupting van state.

**Recommended Fix:**
```ts
fuel: clampVanFuel(typeof rawPlayer.van.fuel === 'number' ? rawPlayer.van.fuel : EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL)
```

---

### [Resolved] C-3: `band.harmony || 0` Instead of `?? 1` in 4 Files

**Locations:**
- `src/context/reducers/bandReducer.ts:276` — `(newBand.harmony || 0) + item.value`
- `src/context/reducers/systemReducer.ts:1292` — `(band.harmony || 0) - value`
- `src/utils/purchaseLogicUtils.ts:323` — `(band.harmony || 0) + val`
- `src/utils/unlockCheck.ts:178` — `(band.harmony || 0) >= 90`

**Issue:** `band.harmony` is clamped to `[1, 100]` by `clampBandHarmony` and will never legitimately be `0`. Using `|| 0` produces a semantically wrong intermediate fallback (`0` is less than the minimum `1`) and violates AGENTS.md: "Preserve valid falsy values with nullish checks (`??`), not truthy fallbacks (`||`)."

**Recommended Fix:** Replace all instances with `(band.harmony ?? 1)` since `1` is the authoritative minimum.

---

## 2. Architecture Violations

### AV-1: Reducers Re-Clamp Values (Contradiction with AGENTS.md)

**Rule (AGENTS.md):** "Clamp bounded state once in action creators via `src/utils/gameStateUtils.ts`. Reducers must not re-clamp."

**Violation:** Multiple reducer files call clamp functions directly:

- `src/context/reducers/bandReducer.ts` — 8+ clamp calls
- `src/context/reducers/minigameReducer.ts` — 6+ clamp calls
- `src/context/reducers/clinicReducer.ts` — all resource mutations use clamps
- `src/context/reducers/socialReducer.ts` — inline `Math.max/min` for zealotry and loyalty
- `src/context/reducers/questReducer.ts` — direct clamping of money, fame, harmony
- `src/context/reducers/tradeReducer.ts` — `clampPlayerFame` at line 73

**Root Cause:** These reducer actions (like `CLINIC_HEAL`, `COMPLETE_QUEST`, `MERCH_PRESS`) receive raw payload objects without pre-clamping from action creators.

**Assessment:** The constraint is structurally unenforceable for these paths unless action creators are added or the rule is formally acknowledged as having exceptions for terminal reducers.

**Recommended Fix:**
- Either add action creator wrappers with clamping for all resource-touching actions
- Or formally accept reducer clamping for terminal reducer paths that don't have pre-clamping creators

---

### [ToDo] AV-2: `||` vs `??` Violations Across Reducer Files

**Rule (AGENTS.md):** "Preserve valid falsy values with nullish checks (`??`), not truthy fallbacks (`||`)."

**Violations:**

- `src/context/reducers/clinicReducer.ts:37, 97` — `clinicVisits || 0` should be `?? 0`
- `src/context/reducers/socialReducer.ts:159–161, 280–282, 406–408` — `Number(fame) || 0`
- `src/context/reducers/questReducer.ts:41, 76` — `money || 0`, `fame || 0` should use `??`
- `src/context/reducers/gigReducer.ts:72` — `consecutiveBadShows || 0` should be `?? 0`

These produce incorrect semantics when state has a valid `0` value.

---

### [ToDo] AV-3: Missing Canonical Clamp Functions

**Issue:** Loyalty (`[0, 100]`) and zealotry (`[0, 100]`) lack `clampLoyalty` and `clampZealotry` functions in `src/utils/gameStateUtils.ts`.

**Locations with inline clamping:**
- `src/context/reducers/socialReducer.ts:52, 165, 287–294, 409–414`

These use `Math.max(0, Math.min(100, ...))` instead of centralized clamp functions, inconsistent with how harmony and other bounded stats are handled.

**Recommended Fix:** Add `clampLoyalty` and `clampZealotry` to `gameStateUtils.ts` and use them throughout.

---

## 3. Duplicated / Doubled Logic

### D-1: `isPlainRecord` Duplicates `isPlainObject`

**Locations:**
- `src/context/reducers/systemReducer.ts:60` — Defines `isPlainRecord` locally
- `src/utils/gameStateUtils.ts:17` — Exports `isPlainObject` with identical logic

**Issue:** `isPlainRecord` is only used within `systemReducer.ts` and duplicates `isPlainObject`.

**Recommended Fix:** Replace local `isPlainRecord` with `import { isPlainObject }` from `gameStateUtils`.

---

### D-2: `simulationUtils.ts` Exports Unused Constants

**Locations:** `src/utils/simulationUtils.ts:281–283`

**Issue:**
```ts
export const CONTROVERSY_ACCELERATED_DECAY_THRESHOLD = ...
export const CONTROVERSY_ACCELERATED_DECAY_AMOUNT = ...
```

These three constants are exported but never imported anywhere. They are used only internally by `calculateDailyUpdates` in the same file.

**Recommended Fix:** Remove the `export` keyword to make them module-level constants.

---

### D-3: `buildQuestsProps.ts` is a Trivial Wrapper

**Location:** `src/hooks/buildQuestsProps.ts`

**Issue:** This file contains a single 3-property passthrough function that is only called by `useQuestsModal.ts`. It adds no logic beyond `activeQuests ?? []`.

**Recommended Fix:** Inline this function into `useQuestsModal.ts` to reduce file count.

---

### D-4: `contrabandStashUtils.ts`, `darkWebLeakUtils.ts`, `pirateRadioUtils.ts`

**Assessment:** These are properly factored with single, focused callers. No duplication detected. Well-integrated.

---

## 4. Unintegrated Utilities

### [Don't proceed this] U-6: `clearImageCache()` Has Zero Call Sites — Memory Leak

**Location:** `src/utils/imageGen.ts`, line 95

**Issue:** `clearImageCache()` function is never called anywhere in `src/`. The docstring states it should be called "between full game runs" to avoid memory leaks from accumulated blob URLs.

**Impact:** Every game playthrough that visits PostGig, SocialPhase, or ZealotryGauge components generates blob object URLs via `getGenImageUrl()` and `fetchGenImageAsObjectUrl()` that are never revoked. These accumulate for the entire browser session.

**Recommended Fix:** Call `clearImageCache()` (fire-and-forget) inside `handleResetState` in `src/context/reducers/systemReducer.ts`:

```ts
// At the start of handleResetState
clearImageCache()  // fire-and-forget async cleanup
```

This is a 2-line change that closes a real memory leak.

---

### [ToDo] U-12: `hasUpgrade` Imported with Alias in `GameState.tsx`

**Location:** `src/context/GameState.tsx:19`

**Issue:**
```ts
import { hasUpgrade as checkUpgrade } from '../utils/upgradeUtils'
```

The same function is imported directly as `hasUpgrade` in other files (`useTourbusLogic.ts`, `Overworld.tsx`), but here it's aliased as `checkUpgrade`. This creates naming inconsistency.

**Recommended Fix:** Drop the alias and use `hasUpgrade` directly, or rename the import site-wide for consistency.

---

### Other Utilities: Properly Integrated

- `contrabandStashUtils.ts` — 1 caller (`useContrabandStash.ts`) ✓
- `darkWebLeakUtils.ts` — 1 caller (`useDarkWebLeak.ts`) ✓
- `pirateRadioUtils.ts` — 1 caller (`usePirateRadio.ts`) ✓
- `rivalEngine.ts` — 1 caller (`rivalReducer.ts`) ✓
- `arrivalUtils.ts` — 2 callers (`useTravelLogic.ts`, `useArrivalLogic.ts`) ✓
- `effectFormatter.ts` — 1 caller (`EventModal.tsx`) ✓
- `eventValidator.ts` — 1 caller (module-load validation in `src/data/events/crisis.ts`) ✓
- `leaderboardUtils.ts` — 1 caller (`usePostGigHandlers.ts`) ✓
- `unlockManager.ts` and `unlockCheck.ts` — Separate concerns, both integrated ✓

---

## 5. Minor Inconsistencies

### [ToDo] M-1: Dead Fallback in `CompletePhase.tsx`

**Location:** `src/components/postGig/CompletePhase.tsx:28, 32`

```ts
return IMG_PROMPTS.GIG_SUCCESS || IMG_PROMPTS.SOCIAL_POST_VIRAL
return IMG_PROMPTS.GIG_FAILURE || IMG_PROMPTS.SOCIAL_POST_DRAMA
```

`IMG_PROMPTS.GIG_SUCCESS` is a string constant and will never be falsy. The `||` fallback is dead code.

**Fix:** Remove the fallback or replace `||` with `??` per project rules.

---

### [ToDo] M-2: Inconsistent `clinicVisits` Null-Coalescing

**Locations:**
- `src/hooks/useClinicLogic.ts:143` — correctly uses `?? 0`
- `src/context/reducers/clinicReducer.ts:37` — uses `|| 0`

**Issue:** Inconsistency. While the numeric result is identical in practice, the principle is wrong per AGENTS.md.

---

### [ToDo] M-3: Stale Changelog Comments in Source Files

**Locations:**
- `src/utils/simulationUtils.ts:1–5`
- `src/utils/unlockCheck.ts:1–5`

Both files have dead comment blocks like:
```ts
/*
 * (#1) Actual Updates: Added missing REVIEW.md comment block.
```

These are git commit artifacts and belong in history, not source files.

**Fix:** Remove these comment blocks.

---

### [ToDo] M-4: Inconsistent Nullish Coalescing in `gigReducer.ts`

**Location:** `src/context/reducers/gigReducer.ts:65`

```ts
const updates = (typeof payload === 'function' ? payload(state.gigModifiers) : payload) || {}
```

Should use `??` instead of `||` for clarity, though the practical effect is the same.

---

### [ToDo] M-5: `assertNever` Structurally in Dead Code Path

**Location:** `src/context/gameReducer.ts:205–210`

The `assertNever(action as never)` call is reachable only if an action somehow bypasses both the `reducerMap` and `BAND_ACTIONS` checks, which shouldn't happen. The structure is defensive but confusing — the comment and `logger.warn` before it suggest this is an error path, but it's architecturally unreachable if the dispatch system is working correctly.

**Assessment:** Not a bug, but worth documenting in a comment that this is a safety check for truly malformed actions.

---

## 6. Executive Summary

### Most Urgent Finding

The **`band.harmony || 0`** pattern (C-3) appears in 4 reducer/utility paths and creates incorrect intermediate values. When harmony-affecting actions encounter a state where harmony is at its clamped minimum of `1`, the `|| 0` fallback produces `0` before `clampBandHarmony` corrects it to `1`. While the clamp catches this at the boundary, it violates the AGENTS.md nullish-check rule and is semantically wrong.

Additionally, **`getAudioTimeMs()` nomenclature (C-1)** obscures a deliberate architectural bypass and could mislead future developers into misusing the function for general gig timing instead of MIDI scheduling.

### Biggest Unintegrated Opportunity

**`clearImageCache()` in `imageGen.ts` has zero call sites** — this is a real memory leak. PostGig, ZealotryGauge, and SocialPhase all generate blob object URLs that are never revoked. Wiring `clearImageCache()` into `handleResetState` in `systemReducer.ts` (fire-and-forget) closes the leak with a 2-line change.

### Overall Health Assessment

- **Strengths:**
  - Reducer/action-creator pattern is well-established with strong `assertNever` coverage
  - Zero `@ts-ignore` comments; TypeScript discipline is high
  - Prototype-pollution defenses (`Object.hasOwn`) used throughout
  - Error handling and validation are consistent

- **Main Systemic Weakness:**
  - The "clamp only in action creators, never in reducers" rule (AGENTS.md) is unenforced for clinic/trade/social/quest reducer families which receive raw payloads without pre-clamping creators
  - This is not a bug but an unacknowledged architectural deviation that should either be formally excepted or resolved through action creator wrappers

**Recommendation:** Address the three critical issues (C-1, C-2, C-3) before merge. Fix the `clearImageCache()` memory leak. Schedule the architecture constraint gap (AV-1) as a follow-up refactor.

---

## Fix Priority

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | C-3: `band.harmony \|\| 0` → `?? 1` | 5 min | Semantic correctness |
| P0 | C-2: Van fuel hardcoded `100` | 5 min | Data integrity on load |
| P0 | C-1: Rename `getAudioTimeMs()` | 10 min | Architecture clarity |
| P1 | U-6: Wire `clearImageCache()` | 2 min | Memory leak fix |
| P2 | D-1: Replace `isPlainRecord` | 2 min | Reduce duplication |
| P2 | AV-3: Add `clampLoyalty`/`clampZealotry` | 10 min | Consistency |
| P3 | M-3: Remove stale comments | 1 min | Code hygiene |
