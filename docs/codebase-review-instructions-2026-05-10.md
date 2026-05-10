# Implementation Instructions — Codebase Review 2026-05-10

Companion to `docs/codebase-review-2026-05-10.md`.
Each section gives exact file paths, line numbers, before/after diffs, and verification commands. Sections appear in the priority order from the review's §8 action list.

| Step | Section | Estimated effort |
|---|---|---|
| 1 | [Remove `propTypes` everywhere](#1-remove-proptypes-everywhere-67-files) | 60–90 min (mechanical) |
| 2 | [Delete dead `BrutalistUI` exports](#2-delete-five-dead-brutalistui-exports) | 15 min |
| 3 | [Extend the audio barrel](#3-extend-the-audio-barrel) | 20 min |
| 4 | [Relocate `calculateGuaranteedDailyCost`](#4-relocate-calculateguaranteeddailycost) | 10 min |
| 5 | [Wire `clearImageCache`](#5-wire-clearimagecache-into-the-menu-transition) | 10 min |
| 6 | [Secure `resetSecureRandomBatchForTesting`](#6-secure-resetsecurerandombatchfortesting) | 15 min |
| 7 | [Remove unused i18n fallback constants](#7-remove-unused-i18n-fallback-constants) | 5 min |
| 8 | [Drop unnecessary `export` keywords](#8-drop-unnecessary-export-keywords) | 5 min |
| 9 | [Rename `rhythmGame.ts` → `.d.ts`](#9-rename-rhythmgamets--d-ts) | 5 min |
| 10 | [Document `unlockManager` / `unlockCheck` boundary](#10-document-unlockmanager--unlockcheck-boundary) | 5 min |
| 11 | [Decide on `VisualPrototypes.tsx`](#11-decide-on-visualprototypestsx) | 15–60 min |

After every step run:
```bash
pnpm run typecheck:core
pnpm run test
```
The full PR gate before merge is `pnpm run test:all`.

---

## 1. Remove `propTypes` everywhere (67 files)

**Why:** `prop-types@15.8.1` is a runtime dependency that duplicates every TypeScript interface. React 19 deprecates `propTypes` validation. The codebase already declares prop shapes in `src/types/components.d.ts` or inline.

### 1.1 Mechanical edit per file

For each affected file, perform two edits:

1. Delete the line `import PropTypes from 'prop-types'`.
2. Delete the entire trailing `ComponentName.propTypes = { … }` block (sometimes multiple blocks if the file declares sub-components).

**Example — `src/components/postGig/FinancialList.tsx`:**

```diff
-import PropTypes from 'prop-types'
 import { motion } from 'framer-motion'
 import { useTranslation } from 'react-i18next'
 …
 export const FinancialList = ({ items, type }: FinancialListProps) => { … }
-
-FinancialList.propTypes = {
-  items: PropTypes.arrayOf(
-    PropTypes.shape({
-      label: PropTypes.string,
-      labelKey: PropTypes.string.isRequired,
-      value: PropTypes.number.isRequired,
-      detail: PropTypes.string,
-      detailKey: PropTypes.string,
-      detailParams: PropTypes.object
-    })
-  ).isRequired,
-  type: PropTypes.oneOf(['income', 'expense']).isRequired
-}
```

### 1.2 Full file list (67 files)

```
src/components/PixiStage.tsx
src/components/clinic/ClinicHeader.tsx
src/components/clinic/ClinicMemberCard.tsx
src/components/minigames/gig/AudioLockedOverlay.tsx
src/components/minigames/gig/BandMembersLayer.tsx
src/components/minigames/tourbus/TourbusControls.tsx
src/components/minigames/tourbus/TourbusHUD.tsx
src/components/postGig/CompletePhase.tsx
src/components/postGig/DealCard.tsx          ← 4 sub-component blocks
src/components/postGig/DealsPhase.tsx
src/components/postGig/FinancialColumn.tsx
src/components/postGig/FinancialList.tsx
src/components/postGig/NegotiationModal.tsx
src/components/postGig/NetResult.tsx
src/components/postGig/ReportPhase.tsx
src/components/postGig/SideEffectsPreview.tsx
src/components/postGig/SideEffectsSummary.tsx
src/components/postGig/SocialOptionButton.tsx
src/components/postGig/SocialPhase.tsx
src/components/postGig/ZealotryGauge.tsx
src/components/pregig/GigModifiersBlock.tsx
src/components/pregig/PreGigHeader.tsx
src/components/pregig/PreGigStartButton.tsx
src/scenes/credits/CreditEntry.tsx
src/scenes/gameover/GameOverButtons.tsx
src/scenes/gameover/GameOverStats.tsx
src/scenes/kabelsalat/components/CableItem.tsx
src/scenes/kabelsalat/components/CableList.tsx
src/scenes/kabelsalat/components/ConnectionPath.tsx
src/scenes/kabelsalat/components/ConnectionPaths.tsx
src/scenes/kabelsalat/components/HardwareProps.tsx
src/scenes/kabelsalat/components/Header.tsx
src/scenes/kabelsalat/components/HeaderTimer.tsx
src/scenes/kabelsalat/components/HeaderTitle.tsx
src/scenes/kabelsalat/components/KabelsalatBoard.tsx
src/scenes/kabelsalat/components/LightningEffects.tsx
src/scenes/kabelsalat/components/Overlays.tsx
src/scenes/kabelsalat/components/PlugGraphics.tsx
src/scenes/kabelsalat/components/Rules.tsx
src/scenes/kabelsalat/components/SocketGraphics.tsx
src/scenes/kabelsalat/components/SocketItem.tsx
src/scenes/kabelsalat/components/SocketList.tsx
src/scenes/kabelsalat/components/overlays/KabelsalatGameOverOverlay.tsx
src/scenes/kabelsalat/components/overlays/PoweredOnOverlay.tsx
src/scenes/kabelsalat/components/overlays/ShockOverlay.tsx
src/scenes/mainmenu/MainMenuExistingSavePrompt.tsx
src/scenes/mainmenu/MainMenuFeatures.tsx
src/scenes/mainmenu/MainMenuNameInputPrompt.tsx
src/scenes/mainmenu/MainMenuSocials.tsx
src/ui/BloodBankModal.tsx
src/ui/CrashHandler.tsx
src/ui/DebugLogViewer.tsx
src/ui/EventModal.tsx
src/ui/GigModifierButton.tsx
src/ui/GlitchButton.tsx
src/ui/MerchPressModal.tsx
src/ui/PirateRadioModal.tsx
src/ui/QuestsModal.tsx
src/ui/settings/AudioSettings.tsx
src/ui/settings/DataManagement.tsx
src/ui/settings/LogSettings.tsx
src/ui/settings/SettingsPanel.tsx
src/ui/settings/SettingsReturnButton.tsx
src/ui/settings/VisualSettings.tsx
src/ui/shared/AnimatedTypography.tsx
src/ui/shared/Modal.tsx
src/ui/shared/ToggleSwitch.tsx
src/ui/shared/Tooltip.tsx
src/ui/shared/VolumeSlider.tsx
```

### 1.3 Delete the shared helper

```bash
git rm src/ui/shared/propTypes.ts
```

Verify no imports remain:
```bash
grep -rn "from.*shared/propTypes" src/
grep -rn "from 'prop-types'" src/
```
Both should return no results.

### 1.4 Remove the dependency

```bash
pnpm remove prop-types @types/prop-types
```

### 1.5 Add a guardrail to `AGENTS.md`

Append under the "Style" section:
```markdown
- Do not add `.propTypes` blocks. React 19 deprecates runtime propTypes
  validation. TypeScript interfaces in `src/types/components.d.ts` or inline
  prop types are the sole source of truth for prop contracts.
```

---

## 2. Delete five dead `BrutalistUI` exports

**Why:** Five components in `src/ui/shared/BrutalistUI.tsx` are re-exported via `src/ui/shared/index.tsx` but consumed nowhere. They account for ~550 of the file's 1,278 lines.

### 2.1 Verify before deleting

```bash
grep -rn 'BrutalFader\|BrutalSlot\|BrutalTabs\|BrutalToggle\|CrisisModal' \
  src/ tests/ --include='*.ts' --include='*.tsx' --include='*.js' \
  | grep -v 'BrutalistUI.tsx\|ui/shared/index.tsx'
```
Expect zero output. If anything appears, stop and re-evaluate.

### 2.2 Delete from `BrutalistUI.tsx`

Delete these export blocks (line numbers reference the current file):

| Export | Start line | End line (approx.) |
|---|---:|---:|
| `BrutalToggle` | 733 | ~832 |
| `BrutalTabs` | 832 | ~908 |
| `BrutalFader` | 908 | ~963 |
| `CrisisModal` | 963 | ~1166 |
| `BrutalSlot` | 1166 | ~1278 |

Also remove their accompanying TypeScript interfaces near the top of the file:
- `BrutalToggleProps` (line 31)
- `BrutalSlotItem` (line 41)
- `BrutalSlotProps` (line 46)
- `BrutalFaderProps` (line 63)
- (any `CrisisModalProps` if defined near line 963)

After deletion, confirm any internal helpers used only by these components (e.g. private constants, sub-components) are also removed.

### 2.3 Remove barrel re-exports

In `src/ui/shared/index.tsx`, delete the lines exporting these symbols:

```diff
-  CrosshairIcon,    # if also unused — verify with grep first
-  BrutalToggle,
-  BrutalTabs,
-  BrutalFader,
-  CrisisModal,
-  BrutalSlot,
```

`CrosshairIcon` and `GearIcon` appeared as unused in the AST sweep but are utility icons — verify before deleting:
```bash
grep -rn 'CrosshairIcon\|GearIcon' src/ --include='*.tsx' | grep -v 'BrutalistUI.tsx\|ui/shared/index.tsx'
```
Only delete them if the result is empty.

### 2.4 Verify

```bash
pnpm run typecheck:core
pnpm run test:ui
```

---

## 3. Extend the audio barrel

**Why:** `src/utils/audio/audioEngine.ts` already re-exports most audio symbols and self-identifies as "an export hub" in its file header. It omits the two stateful objects (`audioManager`, `audioService`) that are imported most often from outside the audio directory. Consumers currently import from two paths.

### 3.1 Append two export lines

At the bottom of `src/utils/audio/audioEngine.ts`:

```ts
// Stateful entry points
export { audioManager } from './AudioManager'
export { audioService } from './audioService'
```

### 3.2 Migrate the 15 external import sites

Run:
```bash
grep -rln "from.*utils/audio/AudioManager\|from.*utils/audio/audioService" \
  src/ --include='*.ts' --include='*.tsx' | grep -v 'src/utils/audio'
```

For each file in the result, change:
```ts
// before:
import { audioManager } from '../utils/audio/AudioManager'
// or
import { audioService } from '../utils/audio/audioService'

// after (path depth may vary):
import { audioManager } from '../utils/audio/audioEngine'
import { audioService } from '../utils/audio/audioEngine'
```

Specific files to touch (paths relative to project root):
```
src/hooks/minigames/useRoadieLogic.ts
src/hooks/minigames/useTourbusLogic.ts
src/hooks/overworld/useAmbientResume.ts
src/hooks/rhythmGame/useRhythmGameAudio.ts
src/hooks/rhythmGame/useRhythmGameScoring.ts
src/hooks/useAudioControl.ts             ← uses audioService
src/hooks/useDarkWebLeak.ts
src/hooks/useGigInput.ts
src/hooks/usePirateRadio.ts
src/hooks/usePreGigLogic.ts
src/hooks/useTravelLogic.ts
src/scenes/Gig.tsx
src/scenes/mainmenu/useMainMenu.ts
src/ui/HUD.tsx
```

### 3.3 Update audio AGENTS.md

Append to `src/utils/audio/AGENTS.md`:

```markdown
## Public API

All imports from outside this directory must go through `audioEngine.ts`.
Direct imports from sub-modules (`./AudioManager`, `./audioService`,
`./playback`, etc.) are only permitted inside `src/utils/audio/` itself.

Roles:
- `audioManager` (stateful class instance) — for non-React contexts:
  Pixi stage controllers, hook lifecycle, imperative timing.
- `audioService` (React-safe adapter) — for React components and hooks
  that need `useSyncExternalStore`-style reactivity.
- All other utilities are stateless and safe to call from anywhere.
```

---

## 4. Relocate `calculateGuaranteedDailyCost`

**Why:** `economyEngine.ts` already owns all related money calculations and `EXPENSE_CONSTANTS`. The function currently lives in `simulationUtils.ts` for historical reasons; that placement breaks discoverability.

### 4.1 Cut from `simulationUtils.ts:280–297`

Delete this block:
```ts
export const calculateGuaranteedDailyCost = (
  player: Pick<GameState['player'], 'fameLevel'>,
  band: Pick<GameState['band'], 'members'>,
  social: Partial<Pick<GameState['social'], 'youtube'>> = {}
) => {
  const bandSize = Array.isArray(band.members) ? band.members.length : 3
  const fameLevel = player.fameLevel || 0
  const lifestyleInflation = Math.floor(Math.pow(fameLevel, 1.4) * 15)
  let dailyCost =
    EXPENSE_CONSTANTS.DAILY.BASE_COST + bandSize * 8 + lifestyleInflation

  if ((social.youtube || 0) >= 10000) {
    const adRevenue = Math.floor((social.youtube || 0) / 10000) * 10
    dailyCost -= adRevenue
  }

  return dailyCost
}
```

### 4.2 Paste into `economyEngine.ts`

Place it near the other `calculateX` exports (around the existing daily/expense helpers). The function references `EXPENSE_CONSTANTS` which is defined in the same file at line 99, so no new imports are needed. `GameState` is already imported.

### 4.3 Fix the internal caller in `simulationUtils.ts`

The function is still used at `simulationUtils.ts:314`. Add an import:

```ts
import { EXPENSE_CONSTANTS, calculateGuaranteedDailyCost } from './economyEngine'
```

(Replace the existing `import { EXPENSE_CONSTANTS } from './economyEngine'` line.)

### 4.4 Update external import sites

```
src/hooks/useTravelLogic.ts:47
```

Change:
```diff
-import { calculateGuaranteedDailyCost } from '../utils/simulationUtils'
+import { calculateGuaranteedDailyCost } from '../utils/economyEngine'
```

Confirm no other importers:
```bash
grep -rn "calculateGuaranteedDailyCost" src/ tests/ --include='*.ts' --include='*.tsx' --include='*.js'
```

---

## 5. Wire `clearImageCache` into the `MENU` transition

**Why:** `clearImageCache` revokes the blob URLs created by `fetchGenImageAsObjectUrl`. Without it, blob URLs accumulate across game runs.

**Important:** Reducers must stay synchronous and pure. `clearImageCache` is async (returns a Promise) and has IO side effects (revoking URLs), so it must live in a `useEffect`, not in `handleResetState`. The original reducer-based recommendation was incorrect.

### 5.1 Choose the integration point

`src/context/GameState.tsx` — the provider that already owns side-effect hooks (`useLeaderboardSync(state)` etc.). The reset flow ultimately lands on `GAME_PHASES.MENU`, which is the safe trigger.

The scene constant is `GAME_PHASES.MENU` (string value `'MENU'`), declared in `src/context/gameConstants.ts:10`.

### 5.2 Add the import

At the top of `src/context/GameState.tsx`:
```ts
import { clearImageCache } from '../utils/imageGen'
import { GAME_PHASES } from './gameConstants'
```
(If `GAME_PHASES` is already imported, leave that line as-is.)

### 5.3 Add the effect

Inside the provider body, near the existing `useLeaderboardSync(state)` call:
```ts
useEffect(() => {
  if (state.currentScene === GAME_PHASES.MENU) {
    void clearImageCache()
  }
}, [state.currentScene])
```

The `void` discards the returned promise — failure to revoke a URL is non-critical and shouldn't surface to the user.

### 5.4 Verify

```bash
pnpm run typecheck:core
```

Manual smoke test:
1. Start a fresh game.
2. Play through to game over.
3. Return to main menu.
4. In Chrome DevTools → Memory → Heap snapshot, filter by `Blob` — confirm the count drops after returning to menu.

---

## 6. Secure `resetSecureRandomBatchForTesting`

`src/utils/crypto.ts:142` exports a test-only function into the production bundle. Pick one of two fixes.

### Option A — Conditional export (minimal change)

Edit `src/utils/crypto.ts:139–146`:
```diff
-/**
- * Resets the batch and error flag for testing purposes.
- */
-export const resetSecureRandomBatchForTesting = (): void => {
-  batchArray = null
-  batchIndex = BATCH_SIZE
-  secureRandomErrorReported = false
-}
+/**
+ * Resets the batch and error flag for testing purposes.
+ * In production builds this is `undefined`.
+ */
+export const resetSecureRandomBatchForTesting: (() => void) | undefined =
+  process.env.NODE_ENV === 'test'
+    ? (): void => {
+        batchArray = null
+        batchIndex = BATCH_SIZE
+        secureRandomErrorReported = false
+      }
+    : undefined
```

Update test call sites to handle the optional:
```
tests/node/crypto.test.js:26
tests/node/chatterLogic.test.js:133, 140
tests/security/randomness.test.js:43
```

```diff
-resetSecureRandomBatchForTesting()
+resetSecureRandomBatchForTesting?.()
```

### Option B — Extract to test helper (recommended, removes from prod bundle entirely)

1. Create `tests/helpers/cryptoTestUtils.js`:
   ```js
   // Test-only re-export of crypto internals. Do not import from src/.
   import { __testInternals } from '../../src/utils/crypto.js'
   export const resetSecureRandomBatchForTesting = __testInternals.resetBatch
   ```

2. In `src/utils/crypto.ts`, replace the public export with an internal-only namespace:
   ```ts
   // Delete the export at line 142–146 above.
   // Add at the bottom of crypto.ts:
   export const __testInternals = {
     resetBatch: (): void => {
       batchArray = null
       batchIndex = BATCH_SIZE
       secureRandomErrorReported = false
     }
   }
   ```

3. Update the three test imports:
   ```diff
   -import { resetSecureRandomBatchForTesting } from '../../src/utils/crypto.js'
   +import { resetSecureRandomBatchForTesting } from '../helpers/cryptoTestUtils.js'
   ```

Option B is preferred — it makes the test boundary explicit and the symbol cannot be called from production code at all. The `__testInternals` prefix is a strong "do not use" signal for app code.

---

## 7. Remove unused i18n fallback constants

### 7.1 `DEFAULT_POST_FAILED_MSG`

The locale key `ui:postGig.postResolutionFailed` already exists in both `public/locales/en/ui.json:510` and `public/locales/de/ui.json:510`. The `defaultValue:` fallback never fires.

**File:** `src/hooks/usePostGigHandlers.ts`

```diff
-export const DEFAULT_POST_FAILED_MSG = 'Post failed. Try another option.'
```

```diff
-t('ui:postGig.postResolutionFailed', {
-  defaultValue: DEFAULT_POST_FAILED_MSG
-})
+t('ui:postGig.postResolutionFailed')
```

**File:** `src/hooks/usePostGigLogic.ts`

```diff
-export { DEFAULT_POST_FAILED_MSG } from './usePostGigHandlers'
```

Verify nothing else imports it:
```bash
grep -rn "DEFAULT_POST_FAILED_MSG" src/ tests/
```

### 7.2 `DEFAULT_SOCIAL_UNAVAILABLE_MSG`

Defined in `src/hooks/usePostGigLogic.ts`, never imported.

```bash
grep -rn "DEFAULT_SOCIAL_UNAVAILABLE_MSG" src/ tests/
```

If the only result is the definition line, delete it.

---

## 8. Drop unnecessary `export` keywords

Two functions are exported but only used inside their own file (and not tested directly).

**`src/context/reducers/bandReducer.ts:232`:**
```diff
-export const applyContrabandEffect = (
+const applyContrabandEffect = (
```

**`src/utils/gameStateUtils.ts:736`:**
```diff
-export const calculateMemberRelationshipChange = (
+const calculateMemberRelationshipChange = (
```

Before saving, re-confirm no test or external file imports these:
```bash
grep -rn "applyContrabandEffect\|calculateMemberRelationshipChange" src/ tests/ --include='*.ts' --include='*.tsx' --include='*.js'
```

The internal call sites (`bandReducer.ts:364`, `gameStateUtils.ts:939`) need no change.

---

## 9. Rename `rhythmGame.ts` → `.d.ts`

**Why:** Convention drift — every other file in `src/types/` uses `.d.ts`.

```bash
git mv src/types/rhythmGame.ts src/types/rhythmGame.d.ts
```

TypeScript's module resolution picks up `.d.ts` automatically, so imports of the bare module path continue to work. Update the explicit reference in `src/utils/audio/AGENTS.md`:

```diff
-Song/note contracts live in `src/types/audio.d.ts` and `src/types/rhythmGame.ts`
+Song/note contracts live in `src/types/audio.d.ts` and `src/types/rhythmGame.d.ts`
```

---

## 10. Document `unlockManager` / `unlockCheck` boundary

**Why:** The two filenames look interchangeable. Contributors routinely place new unlock logic in the wrong file.

### 10.1 Header comments

Add to `src/utils/unlockManager.ts` after the imports:
```ts
/**
 * Persistence layer for earned unlock IDs.
 * Reads and writes `neurotoxic_unlocks` in localStorage.
 *
 * Does NOT evaluate whether state qualifies for an unlock.
 * For eligibility logic, see ./unlockCheck.ts.
 */
```

Add to `src/utils/unlockCheck.ts` after the imports:
```ts
/**
 * Domain logic for trait unlock evaluation.
 * Inspects game state + a context envelope and returns the
 * list of { memberId, traitId } pairs that have been earned.
 *
 * Does NOT persist anything. For persistence, see ./unlockManager.ts.
 */
```

### 10.2 AGENTS.md note

Append to `AGENTS.md` under "Architecture Constraints":
```markdown
- Unlock logic is split across two files. `src/utils/unlockManager.ts` owns
  localStorage persistence (`getUnlocks`, `addUnlock`). `src/utils/unlockCheck.ts`
  owns state-based eligibility evaluation (`checkTraitUnlocks`). Do not add
  persistence logic to `unlockCheck` or evaluation logic to `unlockManager`.
```

---

## 11. Decide on `VisualPrototypes.tsx`

Six components live in `src/ui/prototypes/VisualPrototypes.tsx` with zero consumers. Pick one path before the decision rots further.

### Option A — Delete entirely

```bash
git rm src/ui/prototypes/VisualPrototypes.tsx
rmdir src/ui/prototypes/ 2>/dev/null   # only if directory becomes empty
```

Choose this if the design exploration phase is over.

### Option B — Integrate `CorruptedText` into chatter (highest-value rescue)

1. Move the component to a stable location:
   ```bash
   git mv src/ui/prototypes/VisualPrototypes.tsx src/ui/shared/CorruptedText.tsx
   ```
   In the new file, delete every export except `CorruptedText`.

2. In `src/components/ChatterOverlay.tsx`, replace plain text rendering with:
   ```tsx
   import { CorruptedText } from '../ui/shared/CorruptedText'

   // … inside the message render:
   <CorruptedText text={line.text} delay={index * 80} />
   ```

3. Add a Vitest snapshot test for the overlay to catch regressions.

### Option C — Expose as a debug-only route

Only worth doing if there's an active visual design loop. Add a `PROTOTYPES` scene gated by `import.meta.env.DEV` in `SceneRouter.tsx`.

If no decision is made within one sprint, default to Option A. Lingering "prototype" directories rot quickly and confuse contributors.

---

## Post-implementation checks

After all sections are merged:

```bash
pnpm run test:all                # full PR gate
pnpm run typecheck                # strict reducer gate
pnpm run typecheck:core
```

Expected impact on the codebase:

| Metric | Before | After (estimated) |
|---|---:|---:|
| Production dependencies | n | n − 1 (`prop-types` removed) |
| LoC in `src/ui/shared/BrutalistUI.tsx` | 1,278 | ~728 |
| `import PropTypes` lines | 67 | 0 |
| `.propTypes =` blocks | 76 | 0 |
| Audio import-path variants outside `src/utils/audio/` | 2 | 1 |
| Truly-unused exports (per AST sweep) | 149 | ~140 |

---

*Generated 2026-05-10 · branch `claude/codebase-review-integration-nY5Ph`*
