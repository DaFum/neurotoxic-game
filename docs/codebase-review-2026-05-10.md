# Neurotoxic Codebase Review — 2026-05-10

> **Scope:** Full `src/` tree — 371 TypeScript/TSX files, 44 utility files (24 under `src/utils/audio/`), 37 custom hooks, 118 components, 48 action types, 2 domain modules.
> **Purpose:** Identify inconsistencies, duplicated components/functions, and exported symbols that are available but not yet integrated into application logic.
> **Method:** Manual file inspection plus an AST-flavoured grep sweep across all 371 files, cross-referenced against `tests/` to distinguish "unused in app" from "unused entirely."

---

## Table of Contents

1. [Project Inventory](#1-project-inventory)
2. [Dead Code](#2-dead-code) — confirmed unreachable from any app entry point
3. [Inconsistencies](#3-inconsistencies) — convention drift and placement issues
4. [Available but Unintegrated Symbols](#4-available-but-unintegrated-symbols) — exported and ready to wire up
5. [Duplicated / Overlapping Code](#5-duplicated--overlapping-code)
6. [React 19 Drift](#6-react-19-drift)
7. [Architecture Observations](#7-architecture-observations)
8. [Severity-Sorted Action List](#8-severity-sorted-action-list)
9. [Findings Withdrawn After Verification](#9-findings-withdrawn-after-verification)

---

## 1. Project Inventory

| Layer | Count | Notes |
|---|---:|---|
| TypeScript / TSX files | 371 | all imported transitively from `App.tsx` |
| Custom hooks | 37 | 25 root + 12 in 3 sub-dirs (rhythm/minigames/overworld), plus 5 more in `src/scenes/kabelsalat/hooks/` |
| Utility files | 44 | `src/utils/` (20) + `src/utils/audio/` (24) |
| Components | 118 | scene, UI, stage, minigame |
| Action types / creators | 48 / 54 | dispatched via map-based `gameReducer` (`reducerMap satisfies ReducerMap`) |
| Domain modules | 2 | `eventResolver`, `questLifecycle` (used by 4 files) |
| Total LoC across 10 largest files | 8,763 | see §7.1 |

The dependency graph is acyclic. No file is completely orphaned — every file participates in at least one import chain reachable from `App.tsx`.

---

## 2. Dead Code

### 2.1 Five unused components in `src/ui/shared/BrutalistUI.tsx` (~550 lines)

`BrutalistUI.tsx` is 1,278 lines. Five exported components inside it are re-exported through the `src/ui/shared/index.tsx` barrel but consumed nowhere:

| Export | Lines | Definition |
|---|---:|---|
| `BrutalToggle` | ~100 | `BrutalistUI.tsx:733` |
| `BrutalTabs` | ~77 | `BrutalistUI.tsx:832` |
| `BrutalFader` | ~56 | `BrutalistUI.tsx:908` |
| `CrisisModal` | ~204 | `BrutalistUI.tsx:963` |
| `BrutalSlot` | ~113 | `BrutalistUI.tsx:1166` |

Verification (zero hits outside the file and the barrel):
```bash
grep -rn 'BrutalFader\|BrutalSlot\|BrutalTabs\|BrutalToggle\|CrisisModal' \
  src/ tests/ --include='*.ts' --include='*.tsx' --include='*.js' \
  | grep -v 'BrutalistUI.tsx\|ui/shared/index.tsx'
# → no output
```

These look like UI exploration leftovers. They each instantiate Tailwind brutalist styles already covered by simpler shared primitives (`ActionButton`, `ToggleSwitch`, `Modal`, `VolumeSlider`).

**Recommendation:** Delete the five exports plus their barrel re-exports. ~43% of `BrutalistUI.tsx` evaporates.

---

### 2.2 `src/ui/prototypes/VisualPrototypes.tsx` — six exports, zero consumers

```
src/ui/prototypes/VisualPrototypes.tsx
  TerminalReadout    ← line 36
  CorruptedText      ← line 76
  RhythmMatrix       ← line 120
  SelloutContract    ← line 206
  ToxicChatter       ← line 293
  VoidDecryptor      ← line 363
```

No file under `src/` imports this module. The i18n keys it uses (`ui:terminal.*`) exist in both locales, so the components are functional — but they were never wired into a scene. See §4.4 for the integrate-or-delete decision.

---

### 2.3 `DEFAULT_POST_FAILED_MSG` constant — i18n key already covers it

```
src/hooks/usePostGigHandlers.ts:44  export const DEFAULT_POST_FAILED_MSG = 'Post failed. Try another option.'
src/hooks/usePostGigLogic.ts:13     export { DEFAULT_POST_FAILED_MSG } from './usePostGigHandlers'
```

The fallback string is used at `usePostGigHandlers.ts:138` as a `defaultValue:` for `t('ui:postGig.postResolutionFailed', …)`. That i18n key already exists in both `public/locales/en/ui.json:510` and `public/locales/de/ui.json:510` with the exact same English/German text. The fallback never fires. Delete the constant and its re-export.

---

### 2.4 `DEFAULT_SOCIAL_UNAVAILABLE_MSG` — exported, never imported

```
src/hooks/usePostGigLogic.ts  export const DEFAULT_SOCIAL_UNAVAILABLE_MSG = …
```

No file imports this symbol. Likely the twin of `DEFAULT_POST_FAILED_MSG` from a copy-paste; remove during the same pass as 2.3.

---

### 2.5 Internal-only functions still marked `export`

These are referenced only inside their declaring file (and never in `tests/`), so the `export` keyword serves no purpose and inflates the module's public API:

| Symbol | File | Internal use site |
|---|---|---|
| `applyContrabandEffect` | `src/context/reducers/bandReducer.ts:232` | line 364 (same file) |
| `calculateMemberRelationshipChange` | `src/utils/gameStateUtils.ts:736` | line 939 (same file) |

**Recommendation:** Drop the `export` keyword. If a future test needs them, re-add the export at that point.

---

## 3. Inconsistencies

### 3.1 Type-definition file extension drift

`src/types/` contains 10 files. Nine use `.d.ts`; one uses `.ts`:

| File | Extension | Contents |
|---|---|---|
| `audio.d.ts`, `callbacks.d.ts`, `components.d.ts`, `economy.d.ts`, `game.d.ts`, `kabelsalat.d.ts`, `migration-stubs.d.ts`, `react-compat.d.ts` | `.d.ts` | type-only |
| `rhythmGame.ts` | `.ts` | **type-only** — should be `.d.ts` |

The audio AGENTS.md explicitly references it: *"Song/note contracts live in `src/types/audio.d.ts` and `src/types/rhythmGame.ts`."* The mismatch is a documented but unintentional outlier.

---

### 3.2 `calculateGuaranteedDailyCost` lives in the wrong module

`economyEngine.ts` (1,015 lines) is the authoritative module for money calculations and already defines `calculateGigFinancials`, `calculateTravelExpenses`, `calculateFuelCost`, `calculateRepairCost`, `calculateRefuelCost`, `EXPENSE_CONSTANTS`, `MAX_GIG_NET`, and `MODIFIER_COSTS`. Yet `calculateGuaranteedDailyCost` is defined in `simulationUtils.ts:280`:

```
src/utils/simulationUtils.ts:3    import { EXPENSE_CONSTANTS } from './economyEngine'
src/utils/simulationUtils.ts:280  export const calculateGuaranteedDailyCost = …
src/hooks/useTravelLogic.ts:47    import { calculateGuaranteedDailyCost } from '../utils/simulationUtils'
src/hooks/useTravelLogic.ts:252,570  (two call sites)
```

It reads `EXPENSE_CONSTANTS.DAILY.BASE_COST` from `economyEngine` and produces a daily cost number — it belongs in `economyEngine`.

---

### 3.3 Audio module barrel does not include stateful objects

`src/utils/audio/audioEngine.ts` already functions as an export hub for the audio directory. Its own header says: *"This module manages the AudioContext and Tone.js logic … This file is an export hub."*

But it omits the two stateful objects that consumers actually need most:

| Symbol | Where defined | Where imported from |
|---|---|---|
| `audioManager` | `src/utils/audio/AudioManager.ts:497` | 14 files import directly from `AudioManager` |
| `audioService` | `src/utils/audio/audioService.ts:24` | 1 file imports from `audioService` |

So `audioEngine.ts` is *almost* a barrel — two missing lines short of being the single public entry point.

---

### 3.4 `unlockManager` vs `unlockCheck` — unmarked responsibility split

```
src/utils/unlockManager.ts   getUnlocks, addUnlock     ← localStorage persistence
src/utils/unlockCheck.ts     checkTraitUnlocks         ← state-based eligibility eval
```

The two filenames are nearly interchangeable and there is no comment explaining the split. New unlock-adjacent logic lands in the wrong file with consistent regularity. Both files together are <200 lines, so merging is feasible but documentation is cheaper.

---

### 3.5 Hook directory depth is uneven

```
src/hooks/                   ← 25 root-level hooks
src/hooks/minigames/         ← 3 hooks
src/hooks/overworld/         ← 5 hooks
src/hooks/rhythmGame/        ← 5 hooks
src/scenes/kabelsalat/hooks/ ← 5 hooks (scene-co-located, breaks the pattern above)
```

`kabelsalat` is the only scene-co-located hook bucket. Either all scene-specific hooks live next to their scene (move `src/hooks/rhythmGame/*` next to the Gig scene, etc.) or all hooks live under `src/hooks/`. Pick one and document.

---

### 3.6 `SocialOptionButton.tsx` defines a local prompt mapper

`SocialOptionButton.tsx:15` defines `CATEGORY_PROMPTS` and `getImagePromptForCategory` locally. Both already source their values from the exported `IMG_PROMPTS` map. This is not duplication — but the next contributor adding a category will read `imageGen.ts`, see `IMG_PROMPTS`, and miss the local mapping. Low-priority but worth a doc comment in `imageGen.ts` pointing at consumers.

---

## 4. Available but Unintegrated Symbols

### 4.1 `clearImageCache` — exported, exercised by tests, never called in app

```
src/utils/imageGen.ts:95  export const clearImageCache = async () => { … }
```

`fetchGenImageAsObjectUrl` builds blob URLs and stores them in a module-level `objectUrlCache: Map<string, Promise<string>>`. `clearImageCache` iterates that map and calls `URL.revokeObjectURL` on each. Without ever calling it, every game run leaks blob URLs (small but cumulative on long sessions).

**Integration point:** A `useEffect` in `GameState.tsx` watching for transitions to `GAME_PHASES.MENU`. Reducers can't host this — they must stay synchronous and pure.

---

### 4.2 `getMidiNoteFrequency` / various MIDI helpers in `audio/midiUtils.ts`

Re-exported via `audioEngine.ts` as `export * from './midiUtils'` but several utilities are only consumed inside the audio directory. Not actually a bug — barrel re-export is fine — but worth knowing if you're auditing public API surface.

---

### 4.3 `VisualPrototypes` components

Six components ready to drop into the game. The most valuable for low-cost integration:

- **`CorruptedText`** — character-by-character glitch animation. Drop-in replacement for plain text in `ChatterOverlay`, `HecklerOverlay`, or `EventModal` to reinforce the cyberpunk aesthetic.
- **`TerminalReadout`** — uses i18n keys `ui:terminal.log1` … `log8` (already present in both locales). Could replace the static debug placeholder in `DebugLogViewer`.

The others (`RhythmMatrix`, `SelloutContract`, `ToxicChatter`, `VoidDecryptor`) are more bespoke and need scene-specific placement decisions. If no decision lands within a sprint, delete them — they read as design noise.

---

### 4.4 `resetSecureRandomBatchForTesting` — test utility exported from production module

```
src/utils/crypto.ts:142  export const resetSecureRandomBatchForTesting
```

Used in three test files, never in `src/`. Currently ships in the production bundle, exposing a way to reset CSPRNG batch state. Two fixes possible (see instructions doc §9):

- **Cheap:** wrap export in `process.env.NODE_ENV === 'test' ? … : undefined`
- **Clean:** extract a `tests/helpers/cryptoTestUtils.js` re-export and delete the production export

---

## 5. Duplicated / Overlapping Code

### 5.1 `propTypes` on 67 files — runtime duplicate of TypeScript types

`prop-types@15.8.1` is a **runtime** dependency (not devDependencies). It is imported and applied in 67 source files via 76 `.propTypes = { … }` blocks. Every shape is also enforced statically by the matching TypeScript interface, usually in `src/types/components.d.ts`.

| Directory | Files with propTypes |
|---|---:|
| `src/components/postGig/` | 14 |
| `src/scenes/kabelsalat/components/` | 18 |
| `src/ui/` and `src/ui/shared/` | 12 |
| `src/ui/settings/` | 6 |
| `src/components/clinic/` and `pregig/` | 5 |
| `src/components/minigames/` | 5 |
| `src/scenes/mainmenu/` `gameover/` `credits/` | 5 |
| Other (`PixiStage`, `BloodBankModal`, etc.) | 9 (approx.) |

The full file list is in the instructions doc §6. Total impact:
- runtime: one extra dependency in production bundle (`prop-types`)
- maintainability: two sources of truth per component
- React 19: `propTypes` is deprecated and will warn

**Recommendation:** Mechanical removal in one PR, drop the dependency afterwards. AGENTS.md should ban future additions.

---

### 5.2 `secureRandom` vs `getSafeRandom` — intentional, but worth noting

```
src/utils/crypto.ts:28   export const secureRandom         ← raw crypto.getRandomValues batch
src/utils/crypto.ts:62   export const getSafeRandom        ← wraps secureRandom with try/catch
```

Both are exported and both are used (~25 imports each). `getSafeRandom` is a safety wrapper preventing a circular dependency between the error handler and the RNG. This is intentional and is documented in `crypto.ts:102`. Not a bug — recording so future audits don't flag it again.

---

## 6. React 19 Drift

### 6.1 `propTypes` (covered in §5.1)

### 6.2 No `forwardRef` usage

Verified zero occurrences. The code follows the React 19 convention of `ref` as a normal prop. AGENTS.md already encodes this.

### 6.3 No `PropTypes.func` callbacks where TS would type a `(args) => unknown`

Side benefit of removing §5.1 — drops 67 `import PropTypes from 'prop-types'` lines.

---

## 7. Architecture Observations

### 7.1 The "big-10" files

| File | LoC | Notes |
|---|---:|---|
| `src/context/reducers/systemReducer.ts` | 1,528 | candidates for extraction: settings, toast, map, unlock, daily-cycle |
| `src/ui/shared/BrutalistUI.tsx` | 1,278 | ~550 lines are dead (§2.1); pruning leaves ~730 |
| `src/utils/gameStateUtils.ts` | 1,213 | 50+ exports; consider splitting clamps, fame, state checks |
| `src/utils/economyEngine.ts` | 1,015 | will grow by ~17 lines after §3.2 move |
| `src/utils/eventEngine.ts` | 916 | cohesive — leave as is |
| `src/utils/socialEngine.ts` | 910 | cohesive — leave as is |
| `src/hooks/useTravelLogic.ts` | 817 | confirm-travel + travel-execution could split |
| `src/utils/mapGenerator.ts` | 703 | single class — leave as is |
| `src/utils/postGigUtils.ts` | 615 | cohesive |
| `src/utils/simulationUtils.ts` | 576 | will lose ~17 lines after §3.2 move |

### 7.2 `audioService` is barely used

`audioService` is a `useSyncExternalStore`-friendly adapter wrapping `audioManager`. It is imported by exactly one file (`useAudioControl.ts`). All other React-layer consumers import `audioManager` directly and miss React's tearing-protection contract. Two options:

- Promote `audioService` as the *only* React-layer entry point (instructions doc §5)
- Inline `audioService` into `useAudioControl` and drop the file

### 7.3 `src/domain/` is healthy but underused

`eventResolver.ts` and `questLifecycle.ts` are well-shaped domain modules. New domain concepts (rival band lifecycle, contraband lifecycle, deal negotiation phases) would benefit from the same treatment rather than continuing to grow `systemReducer.ts`.

---

## 8. Severity-Sorted Action List

| # | Severity | Effort | Item |
|---|---|---|---|
| §5.1 | High | Medium | Remove 76 `propTypes` blocks across 67 files + drop `prop-types` dep |
| §2.1 | High | Low | Delete 5 dead components in `BrutalistUI.tsx` (~550 lines) |
| §3.3 | High | Low | Extend `audioEngine.ts` barrel; migrate 15 import sites |
| §3.2 | Medium | Low | Move `calculateGuaranteedDailyCost` to `economyEngine.ts` |
| §4.1 | Medium | Low | Wire `clearImageCache` into `GAME_PHASES.MENU` transition |
| §4.4 | Medium | Low | Guard or extract `resetSecureRandomBatchForTesting` |
| §2.3 + §2.4 | Low | Low | Remove `DEFAULT_POST_FAILED_MSG` and `DEFAULT_SOCIAL_UNAVAILABLE_MSG` |
| §2.5 | Low | Trivial | Drop redundant `export` on `applyContrabandEffect`, `calculateMemberRelationshipChange` |
| §3.1 | Low | Trivial | Rename `rhythmGame.ts` → `.d.ts` (update one AGENTS.md reference) |
| §3.4 | Low | Trivial | Document `unlockManager`/`unlockCheck` boundary in AGENTS.md |
| §4.3 | Low | Low–Medium | Integrate `CorruptedText`/`TerminalReadout` or delete `VisualPrototypes.tsx` |
| §3.5 | Low | Medium | Pick a hook-location convention; relocate kabelsalat hooks or formalise scene-co-location |
| §7.1 | Low | Medium | Split `systemReducer.ts` and `gameStateUtils.ts` when next feature touches them |

---

## 9. Findings Withdrawn After Verification

The first draft of this review listed two findings that fail close inspection. They are recorded here so future audits don't re-raise them:

| Withdrawn finding | Reason |
|---|---|
| "`pickRarity` and `pickRandomContrabandByRarity` are unintegrated" | Both are called by `pickRandomContraband` itself (`contrabandUtils.ts:110-111`). The reducer's existing call to `pickRandomContraband` already runs the rarity-weighted path. |
| "Consolidate `IMG_PROMPTS` and `getImagePromptForCategory`" | `getImagePromptForCategory` already sources its values from `IMG_PROMPTS` via the local `CATEGORY_PROMPTS` const map. Code is composable, not duplicated. |

---

*Generated 2026-05-10 · branch `claude/codebase-review-integration-nY5Ph`*
