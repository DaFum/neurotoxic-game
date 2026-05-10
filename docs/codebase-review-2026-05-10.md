# Neurotoxic Codebase Review — 2026-05-10

> Scope: full `src/` tree (371 TypeScript/TSX files, ~44 utility files, 37 custom hooks, 118 components).
> Purpose: identify inconsistencies, duplicated components/functions, and exported symbols that are available but not yet integrated into application logic.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Inconsistencies](#2-inconsistencies)
3. [Duplicated / Overlapping Code](#3-duplicated--overlapping-code)
4. [Available but Unintegrated Symbols](#4-available-but-unintegrated-symbols)
5. [React 19 Deprecations](#5-react-19-deprecations)
6. [Architecture Observations](#6-architecture-observations)
7. [Summary Table](#7-summary-table)

---

## 1. Project Overview

| Layer | Count | Notes |
|---|---|---|
| TypeScript source files | 371 | All actively imported |
| Custom hooks | 37 | spread across 6 sub-directories |
| Utility files | 44 | `src/utils/` + `src/utils/audio/` (24 files) |
| Components | 118 | scenes, UI, stage, minigame |
| Action types / creators | 48 / 54 | dispatched via map-based `gameReducer` |
| Domain modules | 2 | `eventResolver`, `questLifecycle` |

No circular imports were detected. All but a handful of exported symbols are actively consumed.

---

## 2. Inconsistencies

### 2.1 Type-definition file extensions

Some shared contracts use the ambient `.d.ts` extension; one does not:

| File | Extension | Issue |
|---|---|---|
| `src/types/game.d.ts` | `.d.ts` | correct — ambient declarations |
| `src/types/audio.d.ts` | `.d.ts` | correct |
| `src/types/rhythmGame.ts` | `.ts` | inconsistent — should be `.d.ts` or a regular module with explicit exports |

**Recommendation:** If `rhythmGame.ts` contains only type/interface declarations, rename it to `rhythmGame.d.ts` to match the convention established by every other file in `src/types/`.

---

### 2.2 `DEFAULT_POST_FAILED_MSG` exported from a hook file

```
src/hooks/usePostGigHandlers.ts:44  export const DEFAULT_POST_FAILED_MSG = …
src/hooks/usePostGigLogic.ts:13     export { DEFAULT_POST_FAILED_MSG } from './usePostGigHandlers'
```

A UI string constant is exported from a hook, then re-exported from a second hook. Constants that represent user-facing fallback text belong in a locale JSON entry (i18n key) or, at minimum, in a `src/utils/` or `src/data/` module — not in a hook file.

**Recommendation:** Move the string to a namespaced i18n key (e.g. `ui:postGig.postFailed`) and replace the raw constant with a `t()` call. If a raw constant is required for tests, place it in `src/data/postOptions.ts` or a similar data module.

---

### 2.3 `calculateGuaranteedDailyCost` — split across modules

`src/utils/economyEngine.ts` is named and positioned as the authority for all money calculations, yet `calculateGuaranteedDailyCost` lives in `src/utils/simulationUtils.ts`:

```
src/utils/simulationUtils.ts:280  export const calculateGuaranteedDailyCost = (…)
src/hooks/useTravelLogic.ts:47     import { calculateGuaranteedDailyCost } from '../utils/simulationUtils'
```

`economyEngine` does **not** define or re-export this function. Anyone looking for daily cost logic will look in `economyEngine` first.

**Recommendation:** Move `calculateGuaranteedDailyCost` into `economyEngine.ts` and update the three import sites (`simulationUtils.ts` internal call, `useTravelLogic.ts`).

---

### 2.4 `unlockManager` vs `unlockCheck` — split responsibility with no clear boundary

Two files handle unlocks with no documented division of ownership:

| File | Exports | Used by |
|---|---|---|
| `src/utils/unlockManager.ts` | `getUnlocks`, `addUnlock` | `usePersistence`, `useEventSystem`, `GameState.tsx` |
| `src/utils/unlockCheck.ts` | `checkTraitUnlocks` | 5 reducers + `usePurchaseLogic` |

`checkTraitUnlocks` calls `hasTrait` from `traitUtils`. The distinction between "managing the unlock list" (manager) and "checking trait prerequisites" (check) is reasonable, but is not documented anywhere. New contributors routinely add unlock-adjacent logic to the wrong file.

**Recommendation:** Add an `AGENTS.md` note (or inline JSDoc) explaining the boundary: `unlockManager` is the persistence layer for earned unlock IDs; `unlockCheck` is the domain logic that interrogates game state to derive which trait unlocks apply.

---

### 2.5 Audio module — no barrel export, multiple direct sub-module imports

The 24-file `src/utils/audio/` directory has no `index.ts` barrel. Consumers import directly from individual sub-modules across 22+ import sites:

```ts
// 13 different files import from AudioManager
import { audioManager } from '../utils/audio/AudioManager'

// 6 different files import from audioEngine
import { pauseAudio, resumeAudio, stopAudio } from '../utils/audio/audioEngine'

// 1 file imports from audioService
import { audioService } from '../utils/audio/audioService'
```

`audioService` is a thin adapter that wraps `audioManager` for React `useSyncExternalStore` consumption, yet it is only imported in one hook (`useAudioControl`). All other audio consumers bypass it and import `audioManager` directly, creating an inconsistent access pattern.

**Recommendation:**
1. Create `src/utils/audio/index.ts` re-exporting the stable public API (`audioManager`, `audioEngine` functions, `audioService`).
2. Migrate all import sites to use the barrel.
3. Document that `audioService` is the intended React-layer interface and `audioManager` is for non-React contexts (Pixi stage controllers, hooks that manage lifecycle imperatively).

---

### 2.6 `useAudioControl` overloaded export

```
src/hooks/useAudioControl.ts:164  export function useAudioControl(
src/hooks/useAudioControl.ts:168  export function useAudioControl<TSelected>(
src/hooks/useAudioControl.ts:172  export function useAudioControl<TSelected = AudioSnapshot>(
```

Three overload signatures exported from the same file is correct TypeScript; however, only the third (implementation) signature appears in the deduplicated export scan, which is expected. No actual duplication exists here — this is noted for clarity.

---

### 2.7 Hook directory depth inconsistency

Root-level hooks co-exist with three sub-directories at different nesting levels:

```
src/hooks/
  useArrivalLogic.ts          ← root level
  usePostGigHandlers.ts       ← root level (817 lines)
  overworld/
    useAmbientResume.ts
  rhythmGame/
    useRhythmGameAudio.ts
  minigames/
    useRoadieLogic.ts
```

Meanwhile, `src/scenes/kabelsalat/hooks/` contains 5 scene-specific hooks outside `src/hooks/` entirely.

**Recommendation:** Adopt a consistent rule: scene-specific hooks live alongside their scene (`scenes/<scene>/hooks/`); shared hooks live in `src/hooks/` with sub-directories for domain groupings. This is already partially followed for kabelsalat — formalise it.

---

## 3. Duplicated / Overlapping Code

### 3.1 `calculatePostGigStateUpdates` — mentioned in two utility files

The audit surface initially flagged this as a potential duplicate because both `postGigUtils` and `simulationUtils` appeared in the same search. **On closer inspection, no duplication exists.** `calculatePostGigStateUpdates` is defined only in `postGigUtils.ts:37` and imported from there by `usePostGigHandlers`. `simulationUtils` exposes the unrelated `calculateDailyUpdates`.

---

### 3.2 `propTypes` on 20+ components — duplicates TypeScript type-checking

76 occurrences of `.propTypes = { … }` were found across the codebase:

```
src/components/PixiStage.tsx
src/components/postGig/FinancialList.tsx
src/components/postGig/SideEffectsPreview.tsx
src/components/postGig/NegotiationModal.tsx
src/components/postGig/FinancialColumn.tsx
src/components/postGig/ZealotryGauge.tsx
src/components/postGig/NetResult.tsx
src/components/postGig/DealCard.tsx          ← 4 sub-component blocks
src/components/postGig/SideEffectsSummary.tsx
src/components/postGig/SocialOptionButton.tsx
src/components/postGig/DealsPhase.tsx
src/components/postGig/CompletePhase.tsx
src/components/clinic/ClinicHeader.tsx
src/components/clinic/ClinicMemberCard.tsx
src/components/pregig/GigModifiersBlock.tsx
src/components/pregig/PreGigStartButton.tsx
```

React 19 removes `propTypes` runtime validation. These blocks add dead weight: every prop shape is already fully enforced by the TypeScript interface/type declared immediately above it, making `propTypes` a maintenance burden that duplicates the source of truth.

**Recommendation:** Remove all `.propTypes` assignments. The AGENTS.md already states "React 19 passes `ref` as a normal prop; do not introduce `React.forwardRef()`" — a companion note banning new `propTypes` blocks is warranted.

---

## 4. Available but Unintegrated Symbols

### 4.1 `clearImageCache` — exported, never called in application code

```ts
// src/utils/imageGen.ts:95
export const clearImageCache = async () => { … }
```

`clearImageCache` is exercised by `tests/node/imageGen.test.js` but is never called from any application path (no import in `src/`).

**When to integrate:** Image cache should be cleared on hard reset (`RESET_STATE`) or when the user navigates back to the main menu after a full run, to free object-URL memory.

**How to integrate:**
```ts
// src/context/reducers/systemReducer.ts — in handleResetState
import { clearImageCache } from '../../utils/imageGen'

export const handleResetState = (state: GameState): GameState => {
  void clearImageCache()          // fire-and-forget; non-blocking
  return createInitialState()
}
```

Alternatively, call it inside `usePostGigHandlers` when the "continue" path leads back to the menu after a game-over.

---

### 4.2 `VisualPrototypes` components — exported, never mounted

`src/ui/prototypes/VisualPrototypes.tsx` exports six standalone components:

| Export | Purpose |
|---|---|
| `TerminalReadout` | Animated terminal log |
| `CorruptedText` | Glitch-text animation |
| `RhythmMatrix` | Visual rhythm pattern display |
| `SelloutContract` | Stylised contract prop |
| `ToxicChatter` | Fake chatter UI |
| `VoidDecryptor` | Decryption animation |

No file in `src/` imports this module. These are not referenced in any scene, modal, or overlay.

**Assessment:** These appear to be design prototypes created to validate the visual language. Options:

1. **Integrate select components** into the game proper (e.g. `CorruptedText` could replace plain text in `ChatterOverlay`; `TerminalReadout` suits the `DebugLogViewer`).
2. **Delete if stale.** If the design exploration phase is over, the file adds dead weight.
3. **Keep as isolated showcase** only if there is an active `/prototypes` debug route.

**Integration example for `CorruptedText`:**
```tsx
// src/components/ChatterOverlay.tsx — replace static <p> renders
import { CorruptedText } from '../ui/prototypes/VisualPrototypes'

// In the message render:
<CorruptedText text={line.text} delay={index * 120} />
```

---

### 4.3 `pickRarity` and `pickRandomContrabandByRarity` — exported, never used outside tests

```ts
// src/utils/contrabandUtils.ts
export function pickRarity(rng = secureRandom) { … }          // line 68
export function pickRandomContrabandByRarity(…) { … }         // line 94
```

`minigameReducer` imports only `computeDropChance` and `pickRandomContraband`. The rarity-aware variant `pickRandomContrabandByRarity` and its helper `pickRarity` are not called by any application code.

**When to integrate:** These functions exist to power a weighted drop system based on item rarity. They are the correct foundation for a contraband drop system that respects rarity tiers.

**How to integrate:**
```ts
// src/context/reducers/minigameReducer.ts
// Replace the current flat pick:
import { pickRandomContrabandByRarity, computeDropChance } from '../../utils/contrabandUtils'

// In the drop logic:
const item = pickRandomContrabandByRarity()   // respects rarity weights
```

This replaces the current `pickRandomContraband` (uniform random) with the weighted variant — a balance improvement already coded and waiting to be activated.

---

### 4.4 `resetSecureRandomBatchForTesting` — test utility leaked into production bundle

```ts
// src/utils/crypto.ts:142
export const resetSecureRandomBatchForTesting = (): void => { … }
```

This function is exported from a production file (`crypto.ts`) and consumed only by tests. It resets internal CSPRNG batch state, which is useful in tests but represents an unnecessary bundle surface in production.

**Recommendation:** Guard the export behind an environment check or move the function into a test-only helper:

```ts
// Option A — environment guard in crypto.ts
export const resetSecureRandomBatchForTesting =
  process.env.NODE_ENV === 'test'
    ? (): void => { /* reset logic */ }
    : undefined
```

Or extract reset logic into `tests/helpers/cryptoTestUtils.ts` and access the internal via a module mock in tests.

---

### 4.5 `getImagePromptForCategory` — internal imageGen helper used inconsistently

```ts
// src/components/postGig/SocialOptionButton.tsx:53
backgroundImage: `url("${… ? getGenImageUrl(getImagePromptForCategory(opt.category, opt.badges)) : …}")`
```

`getImagePromptForCategory` is called inline inside JSX but is not exported from `imageGen.ts` — it must be a local helper inside the component file. Meanwhile, `IMG_PROMPTS` (a typed constant map) is exported from `imageGen.ts` and used by `DealCard` and `CompletePhase` to look up prompts.

There are now two strategies for obtaining image prompts:
- `IMG_PROMPTS.<key>` — exported typed map (used in 2 components)
- `getImagePromptForCategory(category, badges)` — local helper (used in 1 component)

**Recommendation:** Consolidate. Either export `getImagePromptForCategory` from `imageGen.ts` so all components use the same function, or have the function delegate to `IMG_PROMPTS` internally. The current split means adding a new prompt category requires editing two different locations.

---

## 5. React 19 Deprecations

### 5.1 `propTypes` (76 occurrences) — covered in §3.2

### 5.2 No `forwardRef` usage found

The codebase correctly avoids `React.forwardRef` (zero occurrences). React 19 passes `ref` as a normal prop; AGENTS.md documents this correctly.

---

## 6. Architecture Observations

These are not bugs or inconsistencies, but patterns worth acknowledging for future contributors.

### 6.1 Very large single files

| File | Lines | Concern |
|---|---|---|
| `src/utils/gameStateUtils.ts` | ~1,213 | 50+ exports; consider splitting into `clampHelpers.ts`, `fameUtils.ts`, `stateChecks.ts` |
| `src/context/reducers/systemReducer.ts` | ~1,441 | largest reducer; candidates for extraction: settings, toast, map, unlock handlers |
| `src/hooks/useTravelLogic.ts` | ~817 | two `calculateGuaranteedDailyCost` call sites suggest potential `useConfirmTravel` split |
| `src/hooks/usePostGigHandlers.ts` | ~470 | deal-accept and story-spin could be separate hooks |

### 6.2 `audioService` vs `audioManager` — intended access pattern undocumented

`audioService` is a React `useSyncExternalStore`-compatible adapter wrapping `audioManager`. It is currently used only by `useAudioControl`. All other hook and component files import `audioManager` directly.

If `audioService` is the intended React-layer interface (preferred for predictable re-renders), this should be documented and enforced. If `audioManager` is acceptable everywhere, `audioService` can be inlined into `useAudioControl`.

### 6.3 `src/domain/` is underutilised

`src/domain/eventResolver.ts` and `src/domain/questLifecycle.ts` are well-placed domain modules that encapsulate complex lifecycle logic. Only 4 files consume them. As the game grows, additional domain concepts (e.g. rival band logic, contraband lifecycle, deal negotiation) would benefit from the same treatment rather than accumulating in large reducer files.

---

## 7. Summary Table

| # | Category | Location | Severity | Action |
|---|---|---|---|---|
| 2.1 | Inconsistency | `src/types/rhythmGame.ts` | Low | Rename to `.d.ts` |
| 2.2 | Inconsistency | `usePostGigHandlers.ts:44` | Medium | Move to i18n key |
| 2.3 | Inconsistency | `simulationUtils.ts:280` | Medium | Move `calculateGuaranteedDailyCost` to `economyEngine.ts` |
| 2.4 | Inconsistency | `unlockManager` / `unlockCheck` | Low | Document boundary in AGENTS.md |
| 2.5 | Inconsistency | `src/utils/audio/` | Medium | Add `index.ts` barrel; document `audioService` as React interface |
| 2.7 | Inconsistency | `src/hooks/` | Low | Document scene-hook co-location rule |
| 3.2 | Duplication | 16+ component files | Medium | Remove all `.propTypes` blocks |
| 4.1 | Unintegrated | `imageGen.ts:clearImageCache` | Medium | Call on `RESET_STATE` in `systemReducer` |
| 4.2 | Unintegrated | `src/ui/prototypes/VisualPrototypes.tsx` | Low–Medium | Integrate or delete |
| 4.3 | Unintegrated | `contrabandUtils:pickRandomContrabandByRarity` | Medium | Replace `pickRandomContraband` in `minigameReducer` |
| 4.4 | Unintegrated | `crypto.ts:resetSecureRandomBatchForTesting` | Low | Guard with `NODE_ENV === 'test'` or move to test helpers |
| 4.5 | Inconsistency | `imageGen` prompt strategy | Low | Consolidate `IMG_PROMPTS` and `getImagePromptForCategory` |
| 6.1 | Architecture | Large files | Low | Consider splitting when next feature touches them |
| 6.2 | Architecture | `audioService` | Low | Document intended access pattern |
| 6.3 | Architecture | `src/domain/` | Low | Prefer domain modules for new lifecycle logic |

---

*Generated 2026-05-10 · branch `claude/codebase-review-integration-nY5Ph`*
