# Neurotoxic Game Codebase Audit Report

## 1. DUPLICATES

### Missing Sanitization Duplicates
**Severity:** MEDIUM
**Locations:**
- `src/context/useGameDispatchActions.ts:248` (e.g. `updatePlayer`)
- `src/context/useGameDispatchActions.ts:254` (e.g. `updateBand`)
**Description:** Action creators are the single source of truth for sanitization per `AGENTS.md`. Hooks delegate correctly, but there's a risk of duplication if logic diverges.
**Evidence:** `useGameDispatchActions` relies on `actionCreators` but sometimes lacks strict enforcement if bypassed.
**Recommended Action:** MERGE inline validation logic into `actionCreators.ts` if any exists, and ensure all dispatches use the provided action creators.

## 2. ORPHANED / UNINTEGRATED SYMBOLS

### Audio Subsystem Cleanup Helpers
**Severity:** LOW
**Locations:**
- `src/utils/audio/cleanupUtils.ts:10` - `clearTransportEvent`
- `src/utils/audio/cleanupUtils.ts:24` - `stopAndDisconnectSource`
**Description:** Audio cleanup utilities defined but never called, suggesting potential memory/event leaks during audio lifecycle changes.
**Evidence:** `rg -l "clearTransportEvent|stopAndDisconnectSource" src/` only shows the defining file `src/utils/audio/cleanupUtils.ts`.
**Recommended Action:** INTEGRATE into `audioEngine.ts` teardown flows or DELETE if superseded by Tone.js garbage collection.

### Minigame Configs
**Severity:** LOW
**Locations:**
- `src/scenes/kabelsalat/components/HardwareProps.tsx:39` - `RackScrew`
**Description:** Minigame configs exported but unused in the main loops.
**Evidence:** `rg -l "RackScrew" src/` only shows the defining file `src/scenes/kabelsalat/components/HardwareProps.tsx`.
**Recommended Action:** DELETE if unused, or INTEGRATE into the minigame tick loops.

### Gig Effects & Visuals
**Severity:** LOW
**Locations:**
- `src/hooks/useGigEffects.ts:17` - `calculateChaosStyle`
- `src/hooks/useGigEffects.ts:43` - `playBandMemberAnimation`
- `src/hooks/useGigEffects.ts:89` - `applyChaosJitter`
**Description:** Visual effect calculations are implemented but never bound to the React component render paths outside the hook.
**Evidence:** `rg -l "calculateChaosStyle|playBandMemberAnimation|applyChaosJitter" src/` only returns `src/hooks/useGigEffects.ts`.
**Recommended Action:** INTEGRATE into `PixiStageController` or `GigHUD` rendering layers.

## 3. INCONSISTENCIES

### Reducer Case Fallthrough & Organization
**Severity:** HIGH
**Locations:**
- `src/context/gameReducer.ts:121` vs `src/context/reducers/bandReducer.ts:14`
**Description:** Most actions are handled via the `reducerMap` in `gameReducer.ts`. However, band-related actions (e.g., `UPDATE_BAND`, `UNLOCK_TRAIT`, `CONSUME_ITEM`, `USE_CONTRABAND`, `TOGGLE_NEURO_DECIMATOR`) bypass this map entirely and fall through to a legacy `switch` statement in `bandReducer`.
**Evidence:** `rg "case ActionTypes" src/context/` shows only `bandReducer.ts` uses switch cases.
**Recommended Action:** FIX by refactoring `bandReducer` actions into the main `reducerMap` pattern for consistency and O(1) dispatch.

### Nullish Coalescing vs Logical OR (Falsy Preservation)
**Severity:** MEDIUM
**Locations:**
- `src/context/actionCreators.ts:481`
- `src/context/actionCreators.ts:482`
- `src/context/actionCreators.ts:637`
- `src/context/actionCreators.ts:644`
- `src/context/actionCreators.ts:649`
- `src/context/actionCreators.ts:724`
- `src/context/actionCreators.ts:728`
**Description:** `AGENTS.md` explicitly dictates: "Preserve valid falsy values with nullish checks (??), not truthy fallbacks (||)". Action creators use `Number(val) || 0` instead of `??`. While `0 || 0` evaluates to `0` either way (it does not destroy numeric zeros), this pattern conflates invalid numeric coercions (like `NaN`) with intentional defaults. The use of `||` is still problematic style here as it is technically imprecise and violates the preference for explicit nullish coalescing to avoid falling back on other falsy inputs.
**Evidence:** `rg "\|\| 0" src/context/actionCreators.ts` matches several locations.
**Recommended Action:** FIX by replacing `Number(val) || 0` with explicit `isNaN` checks and `?? 0`, e.g., `const parsed = Number(val); return isNaN(parsed) ? 0 : parsed;`. Do NOT blindly replace `||` with `??` as `NaN ?? 0` evaluates to `NaN`.

### Hardcoded Colors
**Severity:** MEDIUM
**Locations:**
- `src/components/overworld/OverworldMap.tsx:56`
- `src/components/overworld/OverworldMap.tsx:57`
- `src/components/overworld/OverworldMap.tsx:58`
- `src/components/overworld/OverworldMap.tsx:59`
**Description:** Contains hardcoded hex colors (`#0a0a0a`, `#ffffff`, `#00ff41`, `#888888`) contrary to the `AGENTS.md` rule "Do not hardcode colors. Use CSS vars or Pixi token helpers".
**Evidence:** `rg "#[0-9a-fA-F]{3,6}" src/components/overworld/OverworldMap.tsx`
**Recommended Action:** FIX by replacing hex codes with `getPixiColorFromToken('--color-name')`.

## 4. DEAD / UNREACHABLE

### Unreachable Reducer Exports
**Severity:** LOW
**Locations:**
- `src/context/reducers/questReducer.ts:72` - `handleFailQuests`
- `src/context/reducers/bandReducer.ts:16` - `handleUpdateBand`
- `src/context/reducers/bandReducer.ts:62` - `handleUnlockTrait`
- `src/context/reducers/bandReducer.ts:78` - `handleConsumeItem`
- `src/context/reducers/bandReducer.ts:101` - `handleUseContraband`
- `src/context/reducers/bandReducer.ts:124` - `handleToggleNeuroDecimator`
**Description:** These reducer handlers are exported but only used internally within their own module's switch statement (or not at all for `handleFailQuests`).
**Evidence:** `rg "handleUpdateBand" src/` only shows `bandReducer.ts`.
**Recommended Action:** FIX by removing `export` keyword or migrating to `gameReducer` map.

## 5. MISSING INTEGRATION (USER'S PRIMARY INTEREST)

### Contraband System Setup
**Severity:** HIGH
**Locations:**
- `src/utils/contrabandUtils.ts:50` (and `pickRandomContraband`)
**Description:** The math to calculate contraband drops is wired into `minigameReducer.ts` and `transport.ts`, but the game lacks a proper hook to trigger these drops consistently in regular end-of-gig loops.
**Evidence:** Contraband maths exist, but normal game loops do not grant contraband unless highly specific minigame paths trigger.
**Recommended Action:** INTEGRATE `pickRandomContraband` and drop logic broadly into `postGigUtils.ts` or travel event generation.

### Roadie Minigame Integration Hook
**Severity:** HIGH
**Locations:**
- `src/hooks/minigames/useRoadieLogic.ts:1`
**Description:** The internal mechanics for the Roadie minigame (`checkCollision`, `handleCrash`, `handlePickup`, `handleDelivery`) are correctly invoked within `useRoadieLogic.ts` itself and the hook is mounted in `RoadieRunScene.tsx`. However, it lacks deep integration to trigger the scene.
**Evidence:** The logic is there but the scene trigger is poorly exposed to normal travel flows.
**Recommended Action:** INTEGRATE the `useRoadieLogic` hook into the relevant minigame rendering scene more tightly.

### Gig Chaos Visuals
**Severity:** HIGH
**Locations:**
- `src/hooks/useGigEffects.ts:17`
**Description:** Visual feedback for high-chaos or negative gig states (`calculateChaosStyle`, `applyChaosJitter`, `playBandMemberAnimation`) exists but is never applied to the UI components.
**Evidence:** `rg -l "calculateChaosStyle|playBandMemberAnimation|applyChaosJitter" src/` confirms they are defined but unimported by rendering components.
**Recommended Action:** INTEGRATE into `GigHUD.tsx` or `PixiStage.tsx` render passes.
