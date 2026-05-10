# Detailed Implementation Instructions — Codebase Review 2026-05-10

Follow-up to `docs/codebase-review-2026-05-10.md`.
Each section gives exact file paths, what to change, and why. One correction from the original report is noted in §4.3.

---

## 1. Rename `src/types/rhythmGame.ts` → `rhythmGame.d.ts`

**Why:** Every other type definition file in `src/types/` uses the ambient `.d.ts` extension. `rhythmGame.ts` contains only `type`/`export type` declarations, so the `.ts` extension misleads tools and readers into expecting runtime code.

**Steps:**

```bash
git mv src/types/rhythmGame.ts src/types/rhythmGame.d.ts
```

Then update the two import sites that reference it by name (TypeScript resolves `.d.ts` implicitly, so imports that use the bare module path need no change; only explicit path references need updating):

```bash
grep -rn "from.*types/rhythmGame" src/ --include="*.ts" --include="*.tsx"
```

If any import reads `from '../types/rhythmGame'`, it will continue to resolve correctly after the rename because TypeScript's module resolution picks up `.d.ts` automatically. Verify with:

```bash
pnpm run typecheck:core
```

---

## 2. Remove `DEFAULT_POST_FAILED_MSG` — i18n key already exists

**Why:** The i18n key `ui:postGig.postResolutionFailed` is already present in both
`public/locales/en/ui.json:510` and `public/locales/de/ui.json:510` with the exact same string.
The constant is a redundant export from a hook file that the `t()` call already covers.

**File:** `src/hooks/usePostGigHandlers.ts`

Remove line 44:
```ts
// DELETE this line:
export const DEFAULT_POST_FAILED_MSG = 'Post failed. Try another option.'
```

Change line 136–138, which passes the constant as `defaultValue`:
```ts
// BEFORE:
t('ui:postGig.postResolutionFailed', {
  defaultValue: DEFAULT_POST_FAILED_MSG
})

// AFTER:
t('ui:postGig.postResolutionFailed')
```

**File:** `src/hooks/usePostGigLogic.ts`

Remove line 13, which re-exports the constant:
```ts
// DELETE this line:
export { DEFAULT_POST_FAILED_MSG } from './usePostGigHandlers'
```

Search for any consumer of the re-export and remove those imports:
```bash
grep -rn "DEFAULT_POST_FAILED_MSG" src/ --include="*.ts" --include="*.tsx"
```

---

## 3. Move `calculateGuaranteedDailyCost` to `economyEngine.ts`

**Why:** `economyEngine.ts` is the authoritative module for all money calculations. `calculateGuaranteedDailyCost` is a financial function and already imports `EXPENSE_CONSTANTS` from `economyEngine`. Callers looking for daily cost logic will search `economyEngine` first.

**Step 1 — Move the function.**

In `src/utils/simulationUtils.ts`, cut lines 280–297:
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

Paste it into `src/utils/economyEngine.ts` near the other `calculateX` exports. No new imports needed — `EXPENSE_CONSTANTS` is already defined in that file.

**Step 2 — Fix the internal call in `simulationUtils.ts`.**

Line 314 in `simulationUtils.ts` calls `calculateGuaranteedDailyCost` internally. Add an import:
```ts
import { calculateGuaranteedDailyCost } from './economyEngine'
```

Remove the old export from `simulationUtils.ts`. The `EXPENSE_CONSTANTS` import from `economyEngine` at the top of `simulationUtils.ts` is already there — no change needed there.

**Step 3 — Update the two external import sites.**

```
src/hooks/useTravelLogic.ts:47  import { calculateGuaranteedDailyCost } from '../utils/simulationUtils'
```

Change both occurrences of `'../utils/simulationUtils'` that import this function to `'../utils/economyEngine'`.

**Verify:**
```bash
pnpm run typecheck:core
pnpm run test
```

---

## 4. Document the `unlockManager` / `unlockCheck` boundary

**Why:** These two modules have names that don't express their different responsibilities. Contributors regularly add unlock-adjacent logic to the wrong file.

Add a comment block at the top of each file (after the imports):

**`src/utils/unlockManager.ts`** — add after imports:
```ts
/**
 * Persistence layer for earned unlock IDs.
 * Reads and writes the unlock list to localStorage.
 * Does NOT evaluate whether state qualifies for an unlock —
 * see unlockCheck.ts for that logic.
 */
```

**`src/utils/unlockCheck.ts`** — add after imports:
```ts
/**
 * Domain logic layer for trait unlock evaluation.
 * Inspects game state + a context object to derive which
 * trait unlocks have been earned in a given event.
 * Does NOT persist anything — see unlockManager.ts for that.
 */
```

Also add to `AGENTS.md` under the "Architecture Constraints" section:
```markdown
- `unlockManager` (utils) is the localStorage persistence layer for earned unlock IDs.
  `unlockCheck` (utils) evaluates game state to derive which trait unlocks apply.
  Do not add persistence logic to `unlockCheck` or evaluation logic to `unlockManager`.
```

---

## 5. Extend `audioEngine.ts` to cover `audioManager` and `audioService`

**Context:** `src/utils/audio/audioEngine.ts` already functions as an export hub for stateless audio utilities (playback functions, setup, MIDI, etc.) — it says so in its own file header. However, the two stateful objects `audioManager` (used by 14 files) and `audioService` (used by 1 file) are not included. This forces consumers to import from two different paths.

**What `audioEngine.ts` does NOT currently export:**
- `audioManager` from `./AudioManager`
- `audioService` from `./audioService`

**Step 1 — Add two export lines to `src/utils/audio/audioEngine.ts`:**

At the end of the file, append:
```ts
export { audioManager } from './AudioManager'
export { audioService } from './audioService'
```

**Step 2 — Migrate import sites.**

Run:
```bash
grep -rn "from.*utils/audio/AudioManager\|from.*utils/audio/audioService" src/ \
  --include="*.ts" --include="*.tsx"
```

For each of the 14 `AudioManager` import sites and 1 `audioService` import site outside `src/utils/audio/`, change:
```ts
// BEFORE:
import { audioManager } from '../utils/audio/AudioManager'
import { audioService } from '../utils/audio/audioService'

// AFTER:
import { audioManager } from '../utils/audio/audioEngine'
import { audioService } from '../utils/audio/audioEngine'
```

**Step 3 — Add a note to the audio AGENTS.md** (`src/utils/audio/AGENTS.md`):
```markdown
## Public API
All imports from outside this directory should use `audioEngine.ts` as the
single entry point. Direct sub-module imports are only permitted within
`src/utils/audio/` itself.

- `audioManager` — stateful class instance; use for lifecycle management and
  direct method calls in non-React contexts (Pixi controllers, imperative hooks).
- `audioService` — React `useSyncExternalStore`-compatible adapter wrapping
  `audioManager`; use inside React components and hooks that need reactivity.
- All stateless utility functions — also re-exported via `audioEngine.ts`.
```

**Verify:**
```bash
pnpm run typecheck:core
pnpm run test:ui
```

---

## 6. Remove all `.propTypes` blocks (76 occurrences across 67 files)

**Why:** React 19 removes runtime `propTypes` validation. Every prop shape is already enforced statically by TypeScript interfaces declared in `src/types/components.d.ts` or inline in the same file. These blocks duplicate the source of truth and add dead bundle weight.

**Step 1 — Remove `import PropTypes from 'prop-types'` and the `.propTypes = { … }` blocks.**

Complete list of files to touch (all confirmed by `grep -rn "import PropTypes"`):

```
src/components/PixiStage.tsx
src/components/clinic/ClinicHeader.tsx
src/components/clinic/ClinicMemberCard.tsx
src/components/minigames/gig/AudioLockedOverlay.tsx
src/components/minigames/gig/BandMembersLayer.tsx
src/components/minigames/tourbus/TourbusControls.tsx
src/components/minigames/tourbus/TourbusHUD.tsx
src/components/postGig/CompletePhase.tsx
src/components/postGig/DealCard.tsx
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
src/ui/shared/propTypes.ts       ← delete this file entirely
```

**Pattern per file** (example using `FinancialList.tsx`):

```ts
// BEFORE:
import PropTypes from 'prop-types'
// … component body …
FinancialList.propTypes = {
  items: PropTypes.arrayOf(…).isRequired,
  type: PropTypes.oneOf(['income', 'expense']).isRequired
}

// AFTER:
// (import line removed, propTypes block removed — TypeScript interface in
//  src/types/components.d.ts already enforces FinancialListProps)
```

**Step 2 — Delete the shared propTypes helper file:**
```bash
git rm src/ui/shared/propTypes.ts
```
Confirm it has no imports elsewhere:
```bash
grep -rn "from.*shared/propTypes" src/ --include="*.ts" --include="*.tsx"
```

**Step 3 — Check if `prop-types` can be removed from dependencies:**
```bash
grep -rn "prop-types" package.json
# If only dev dependency or only in the above files — remove it:
pnpm remove prop-types
```

**Step 4 — Add a guardrail to `AGENTS.md`:**
```markdown
- Do not add `.propTypes` blocks. React 19 has removed runtime propTypes
  validation. TypeScript interfaces in `src/types/components.d.ts` or inline
  types are the sole source of truth for prop contracts.
```

**Verify:**
```bash
pnpm run typecheck:core
pnpm run test:ui
```

---

## 7. Wire `clearImageCache` into the game reset flow

**Why:** `clearImageCache` revokes blob object-URLs created by `fetchGenImageAsObjectUrl` and clears the in-memory cache. Without it, each game run accumulates unreleased blob URLs. The function is exported and tested but never called in application code.

**Important constraint:** `handleResetState` is a pure reducer — it cannot call async functions. The cache clear must happen in a React hook via a side-effect.

**Chosen integration point:** `src/context/GameState.tsx`, using a `useEffect` that fires whenever the scene transitions to `MAIN_MENU` (which is where `RESET_STATE` lands).

**Step 1 — Add the import to `GameState.tsx`:**
```ts
import { clearImageCache } from '../utils/imageGen'
```

**Step 2 — Add the effect** (place after the existing `useLeaderboardSync(state)` call, or alongside other side-effect hooks in the provider body):
```ts
const currentScene = state.currentScene

useEffect(() => {
  if (currentScene === 'MAIN_MENU') {
    void clearImageCache()
  }
}, [currentScene])
```

This fires once every time the player returns to the main menu — which covers both the normal post-game-over path and any debug reset. The `void` operator discards the promise because cleanup failure is non-critical.

**Verify:**
```bash
pnpm run typecheck:core
# Then manually: start game → play through → hit game over → return to menu
# In DevTools Memory tab, verify blob: URLs are revoked
```

---

## 8. Resolve `VisualPrototypes.tsx` — integrate or delete

`src/ui/prototypes/VisualPrototypes.tsx` exports 6 visual components. The i18n keys they use (`ui:terminal.*`) already exist in both EN and DE locale files, so the components are technically functional.

**Option A — Delete (recommended if prototyping is done):**
```bash
git rm src/ui/prototypes/VisualPrototypes.tsx
git rm -r src/ui/prototypes/      # if directory becomes empty
```

**Option B — Integrate `CorruptedText` into `ChatterOverlay`:**

`CorruptedText` is the most reusable export — it takes a `text` string and a `delay` number and applies a character-by-character glitch animation. It would improve the visual quality of the chatter overlay at zero logic cost.

In `src/components/ChatterOverlay.tsx` (or wherever individual chatter lines are rendered), import and replace plain text renders:

```ts
import { CorruptedText } from '../ui/prototypes/VisualPrototypes'
```

In the message list render:
```tsx
// BEFORE (approximate):
<span className='…'>{line.text}</span>

// AFTER:
<CorruptedText text={line.text} delay={index * 80} />
```

Move the component out of the `prototypes/` directory into `src/ui/shared/CorruptedText.tsx` before doing so (the `prototypes/` prefix signals "not ready").

**Option C — Expose as a debug route** (only if the design exploration tooling is actively used):

Add a `PROTOTYPES` scene value and render `VisualPrototypes` from `SceneRouter.tsx` behind `process.env.NODE_ENV === 'development'`.

---

## 9. Guard `resetSecureRandomBatchForTesting` against production exposure

**Why:** `src/utils/crypto.ts` exports a function whose sole purpose is to reset internal CSPRNG batch state for deterministic test runs. Exporting it from a production module means it's included in the production bundle and exposes the ability to reset cryptographic state.

**File:** `src/utils/crypto.ts`, lines 139–146.

**Option A — Conditional export (minimal change):**
```ts
// BEFORE:
/**
 * Resets the batch and error flag for testing purposes.
 */
export const resetSecureRandomBatchForTesting = (): void => {
  batchArray = null
  batchIndex = BATCH_SIZE
  secureRandomErrorReported = false
}

// AFTER:
export const resetSecureRandomBatchForTesting =
  process.env.NODE_ENV === 'test'
    ? (): void => {
        batchArray = null
        batchIndex = BATCH_SIZE
        secureRandomErrorReported = false
      }
    : undefined
```

Test files that import this must then guard the call:
```ts
// tests/node/crypto.test.js — already imports it, add a guard:
resetSecureRandomBatchForTesting?.()
```

**Option B — Extract to a test-only module (cleaner):**

Create `tests/helpers/cryptoTestUtils.js`:
```js
// Re-exports the reset helper for use in test files only.
// This file must never be imported from src/.
export { resetSecureRandomBatchForTesting } from '../../src/utils/crypto.js'
```

Remove the export from `crypto.ts`:
```ts
// DELETE lines 139–146 from crypto.ts
```

Update all three test imports:
```
tests/node/crypto.test.js:5
tests/node/chatterLogic.test.js:133
tests/security/randomness.test.js:25
```

Change from:
```js
import { resetSecureRandomBatchForTesting } from '../../src/utils/crypto.js'
```
To:
```js
import { resetSecureRandomBatchForTesting } from '../helpers/cryptoTestUtils.js'
```

Option B is preferred — it makes the test boundary explicit and removes the symbol from the production bundle entirely.

---

## 10. Consolidate image prompt strategy in `imageGen.ts`

**Why:** Two components use `IMG_PROMPTS.<key>` (an exported typed map) while one component uses a local `getImagePromptForCategory(category, badges)` function. Adding a new image prompt category currently requires editing two different patterns.

**Current state:**
- `src/utils/imageGen.ts` exports `IMG_PROMPTS` (a `const` object with string values)
- `src/components/postGig/SocialOptionButton.tsx` defines `getImagePromptForCategory` locally and calls it directly

**Step 1 — Move `getImagePromptForCategory` into `imageGen.ts` and export it:**

In `src/components/postGig/SocialOptionButton.tsx`, cut the local `getImagePromptForCategory` function. Paste it into `src/utils/imageGen.ts` as an export:

```ts
// Add to src/utils/imageGen.ts
export const getImagePromptForCategory = (
  category: string,
  badges: string[]
): string => {
  // … existing implementation from SocialOptionButton.tsx …
}
```

**Step 2 — Update `SocialOptionButton.tsx`:**
```ts
import { getImagePromptForCategory } from '../../utils/imageGen'
// Remove the local definition
```

**Step 3 — Verify `IMG_PROMPTS` and `getImagePromptForCategory` are consistent.**

`getImagePromptForCategory` should either delegate to `IMG_PROMPTS` for known categories or return a value from it:
```ts
export const getImagePromptForCategory = (
  category: string,
  badges: string[]
): string => {
  // If a specific prompt exists for this category, use it
  const key = category.toUpperCase() as keyof typeof IMG_PROMPTS
  if (Object.hasOwn(IMG_PROMPTS, key)) return IMG_PROMPTS[key]
  // Fallback
  return IMG_PROMPTS.SOCIAL_POST_COMMERCIAL
}
```

---

## ⚠️ Correction to Original Report — Finding 4.3

**The original report incorrectly stated that `pickRarity` and `pickRandomContrabandByRarity` were unintegrated.**

On closer inspection, `pickRandomContraband` (line 109–112 of `contrabandUtils.ts`) is a thin wrapper:
```ts
export function pickRandomContraband(rng = secureRandom) {
  const rarity = pickRarity(rng)                         // ← calls pickRarity
  return pickRandomContrabandByRarity(rarity, rng)       // ← calls the rarity variant
}
```

`minigameReducer` uses `pickRandomContraband`, which already applies the full rarity-weighted system. `pickRarity` and `pickRandomContrabandByRarity` are correctly exported for direct testing and for potential future callers that need to control rarity explicitly. **No change needed.**

---

## Quick-reference priority order

| Priority | Item | Effort | Impact |
|---|---|---|---|
| High | §6 Remove propTypes (67 files) | Medium | Bundle size + maintainability |
| High | §5 Audio barrel: add 2 export lines + migrate 15 imports | Low | Consistency |
| Medium | §3 Move `calculateGuaranteedDailyCost` to economyEngine | Low | Discoverability |
| Medium | §7 Wire `clearImageCache` in GameState.tsx | Low | Memory hygiene |
| Medium | §9 Guard `resetSecureRandomBatchForTesting` | Low | Security hygiene |
| Low | §2 Remove `DEFAULT_POST_FAILED_MSG` constant | Low | Clean up |
| Low | §1 Rename `rhythmGame.ts` → `.d.ts` | Trivial | Convention |
| Low | §4 Document unlock boundary | Trivial | Onboarding |
| Low | §8 Decide on VisualPrototypes | Low | Dead code |
| Low | §10 Consolidate image prompt helpers | Low | Maintainability |

---

*Generated 2026-05-10 · branch `claude/codebase-review-integration-nY5Ph`*
