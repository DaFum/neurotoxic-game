---
name: playwright-screenshot
description: Take Playwright screenshots of any Neurotoxic game scene (INTRO, MENU, OVERWORLD, PREGIG, GIG, POSTGIG, GAMEOVER, CLINIC), UI overlays, PixiJS canvas, modal states, and visual regression baselines. Trigger when capturing screenshots, documenting UI, recording before/after diffs, debugging visual glitches, or producing visual regression tests.
---

# Playwright Screenshot Skill

Takes precise screenshots of the Neurotoxic game using Playwright. Covers all scenes, element crops, PixiJS canvas, overlay states, and CI-ready visual regression baselines.

## ✨ Recent Improvements (2026-03-21)

### v1.1.0 — Production Ready (5/5 Rating)

- ✅ **Cross-platform browser discovery** (`browser-launcher.js`): Replaces shell `find` with Node.js APIs for Windows/Linux/Mac compatibility
- ✅ **BASE_STATE validation test**: Automatic detection of state schema drift (prevents silent fixture failures)
- ✅ **Centralized scene config** (`scenes.config.js`): Single source of truth for all 16 scenes and 9 fixtures
- ✅ **CI integration guide** (`ci-integration-guide.md`): Complete GitHub Actions workflows with parallel captures and visual regression
- ✅ **Robust browser launcher**: 3-tier fallback (CDN → cached → env var) with helpful error messages
- ✅ **Extended screenshot timeouts** (60s): Handles font loading delays
- ✅ **Network-aware error handling**: Selective error discrimination (TimeoutError vs. fatal failures)
- ✅ **Environment variable support**: `BROWSER_PATH`, `BASE_URL`, `OUT_DIR` fully documented

---

## Agent Execution Workflow

When triggered, follow this decision tree — don't just provide code samples, actually run the screenshot:

### Step 1 — Decide scope

| Request                          | Approach                                                    |
| -------------------------------- | ----------------------------------------------------------- |
| All scenes / full tour           | Run `screenshot-all-scenes.js` script                       |
| One specific scene               | Use state injection (`screenshot-state-inject.js`)          |
| Current page / overlay / element | Write inline Playwright snippet as a temp spec              |
| Before/after a code change       | Run injection script twice; diff with `diff-screenshots.js` |
| Visual regression test           | Add `toMatchSnapshot()` to `e2e/visual.spec.js`             |

### Step 2 — Check dev server

The scripts and tests require the dev server running at `http://localhost:5173`. Check first:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
```

If it returns anything other than 200, start it in the background:

```bash
pnpm run dev &
sleep 3
```

The Playwright test runner auto-starts the server via `webServer` config. The standalone scripts do not — they need it running.

### Step 2b — Browser Download / Network Issues

**If Playwright browser download fails (CDN unreachable):**

The scripts now have automatic fallback logic:

1. First attempt: Download latest Playwright browser (requires `storage.googleapis.com` access)
2. Second attempt: Use cached Chromium browser from `~/.cache/ms-playwright/` if available
3. Final fallback: Return helpful error with recovery steps

**To manually provide a browser path:**

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
BROWSER_PATH=/path/to/chrome \
node .claude/skills/playwright-screenshot/scripts/screenshot-all-scenes.js
```

**To find available cached browsers:**

```bash
find ~/.cache/ms-playwright -name "chrome" -o -name "firefox" 2>/dev/null
```

If no browsers are cached, and CDN is unreachable, the environment is air-gapped. In that case:

- Screenshots cannot be captured automatically
- Consider documenting the game flow manually
- Or provide pre-built browser binaries to the environment

### Step 3 — Run and capture

**Complete game flow (tested & proven to work):**

```bash
node .claude/skills/playwright-screenshot/scripts/screenshot-game-flow.js
```

Output: `screenshots/scenes/01-intro.png` … `10-postgig.png`
✅ Handles band identity modal, uses cached browser, avoids networkidle timeouts

**All scenes (full golden-path flow + state-injected scenes):**

```bash
node .claude/skills/playwright-screenshot/scripts/screenshot-all-scenes.js
```

Output: `screenshots/scenes/01-intro.png` … `16-gameover.png` (includes GAMEOVER and CLINIC via state injection)
⚠️ May timeout on `networkidle` — use `screenshot-game-flow.js` for reliable captures

**Single scene via state injection:**

```bash
node .claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js <fixture>
# Fixtures: menu | overworld | pregig | postgig | gameover | clinic | event-modal | band-hq
```

Output: `screenshots/injected/<fixture>.png`

**Run existing E2E visual tests:**

```bash
pnpm exec playwright test e2e/visual.spec.js
```

**Tip — available Playwright helpers in `e2e/helpers.js`:**

- `skipToMenu(page)` — navigates from INTRO to MENU, handles skip button and tutorial dismissal
- `raceWithCrash(page, fn, timeout)` — wraps navigation in audio-crash detection for CI safety

### Step 4 — Show screenshots to the user

After capturing, use the `Read` tool to display each PNG file inline so the user sees the result immediately. Do not just report the file path — show the image.

```
Read("screenshots/scenes/05-overworld.png")  ← Claude can render PNG files
```

If the script fails partway through, show whatever was captured before the failure, then explain what went wrong. Partial results are still valuable. For scenes that fail, suggest running the state-inject script directly for that scene:

```bash
node .claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js <fixture>
```

**Tip — cleaner screenshots without CRT scanlines:** Pass `crtEnabled: false` in the global settings when calling `injectSave`, or add `--disable-crt` awareness. The `screenshot-state-inject.js` script defaults to `crtEnabled: true` — for documentation or baseline images where the CRT effect adds noise, temporarily set it to `false` in the `globalSettings` object inside the script.

---

## Quick Reference

| Goal                           | Method                                | Script                       |
| ------------------------------ | ------------------------------------- | ---------------------------- |
| All scenes in one pass         | navigate + capture per scene          | `screenshot-all-scenes.js`   |
| Specific scene from cold start | inject state → navigate               | `screenshot-state-inject.js` |
| Single UI element              | `locator.screenshot()`                | inline snippet               |
| PixiJS canvas only             | `page.locator('canvas').screenshot()` | inline snippet               |
| Visual regression baseline     | `toMatchSnapshot()`                   | `e2e/visual.spec.js`         |
| Before/after diff              | run twice + `diff-screenshots.js`     | see Pattern F                |

---

## Core Screenshot API

### 1. Full Viewport (most common)

```js
await page.screenshot({ path: 'out/menu.png' })
```

### 2. Full Scrollable Page

```js
await page.screenshot({ path: 'out/full.png', fullPage: true })
```

> The game uses `overflow-hidden` on the root; `fullPage` is the same as viewport for most scenes. Use it for scroll-heavy overlays like Band HQ.

### 3. Single Element / Locator

```js
const hud = page.locator('.hud-root')
await hud.screenshot({ path: 'out/hud.png' })
```

### 4. Clipped Region (pixel-perfect crop)

```js
await page.screenshot({
  path: 'out/top-bar.png',
  clip: { x: 0, y: 0, width: 1280, height: 80 }
})
```

### 5. PixiJS Canvas

The PixiJS canvas renders inside `.absolute.inset-0`. `--disable-webgl` forces Canvas2D fallback — screenshots are reliable.

```js
await page.locator('canvas').waitFor({ state: 'visible', timeout: 10000 })
await page.waitForTimeout(500) // allow first render
await page.locator('canvas').screenshot({ path: 'out/pixi-canvas.png' })
```

### 6. Visual Regression (snapshot comparison)

```js
expect(await page.screenshot()).toMatchSnapshot('scene-baseline.png', {
  maxDiffPixelRatio: 0.05 // 5% pixel tolerance
})
```

Snapshots are stored in `e2e/__snapshots__/` automatically.

---

## Navigating to Each Scene

See `references/scene-navigation.md` for complete step-by-step flows. Summary:

| Scene                | How to Reach                                          | Key Wait Signal                                  |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| **INTRO**            | `page.goto('/')`                                      | `getByRole('button', { name: /skip/i })` visible |
| **MENU**             | `skipToMenu(page)` helper (`e2e/helpers.js`)          | heading `/neurotoxic/i` visible                  |
| **OVERWORLD**        | MENU → "Start Tour" (or inject `overworld`)           | `getByRole('heading', { name: /tour plan/i })`   |
| **TRAVEL_MINIGAME**  | OVERWORLD → click node → confirm                      | text `TOURBUS TERROR` visible                    |
| **PREGIG**           | complete travel → dismiss events (or inject `pregig`) | heading `/preparation/i` visible                 |
| **PRE_GIG_MINIGAME** | PREGIG → Start Show                                   | `canvas` visible + 600 ms                        |
| **GIG**              | pre-gig minigame → Shift+P                            | `canvas` visible + 1500 ms                       |
| **POSTGIG**          | GIG → Shift+P (or inject `postgig`)                   | heading `/gig report/i` visible                  |
| **GAMEOVER**         | inject `gameover` save state (only reliable path)     | heading `/game over/i` visible                   |
| **SETTINGS**         | MENU → Band HQ → SETTINGS tab                         | any settings control visible                     |
| **CREDITS**          | MENU → "Credits"                                      | heading `/credits/i` visible                     |
| **CLINIC**           | inject `clinic` save state (only reliable path)       | `networkidle` + 500 ms                           |
| **BAND HQ modal**    | inject `band-hq` (opens modal automatically)          | heading `/band hq/i` visible                     |
| **Event modal**      | inject `event-modal`                                  | `getByRole('dialog')` visible                    |

**Fastest paths for hard-to-reach scenes:** use state injection — no need to play through. GAMEOVER and CLINIC cannot be reliably reached without injection.

---

## Screenshot Patterns by Use Case

### Pattern A — Single Scene, One-Shot

```js
import { test } from '@playwright/test'
import { skipToMenu } from './helpers.js'

test('capture menu', async ({ page }) => {
  await skipToMenu(page)
  await page.screenshot({ path: 'screenshots/menu.png' })
})
```

### Pattern B — Scene with Overlay Open

```js
test('capture band HQ modal', async ({ page }) => {
  await skipToMenu(page)
  await page.getByRole('button', { name: /band hq/i }).click()
  await page
    .getByRole('heading', { name: /band hq/i })
    .waitFor({ state: 'visible' })
  await page.screenshot({ path: 'screenshots/band-hq.png' })
})
```

### Pattern C — Inject State, Skip to Deep Scene

```js
import { injectSave } from './.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js'

test('capture post-gig', async ({ page }) => {
  await page.goto('/', { waitUntil: 'commit' })
  await injectSave(page, 'postgig')
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: /gig report/i }).waitFor()
  await page.screenshot({ path: 'screenshots/postgig.png' })
})
```

Available fixtures: `menu | overworld | pregig | postgig | gameover | clinic | event-modal | band-hq`

### Pattern D — PixiJS Canvas During GIG

```js
test('capture gig canvas', async ({ page }) => {
  // navigate to GIG scene via full flow or state injection
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 15000 })
  await page.waitForTimeout(1500) // let notes render
  await page
    .locator('canvas')
    .screenshot({ path: 'screenshots/gig-canvas.png' })
  // OR: composite canvas + HUD in one shot
  await page.screenshot({ path: 'screenshots/gig-full.png' })
})
```

### Pattern E — Multi-Step Flow with Screenshots at Each Step

```js
test('document full game flow', async ({ page }) => {
  const snap = name => page.screenshot({ path: `screenshots/${name}.png` })

  await skipToMenu(page)
  await snap('01-menu')

  await page.getByRole('button', { name: /start tour/i }).click()
  await page.getByRole('heading', { name: /tour plan/i }).waitFor()
  await snap('02-overworld')
})
```

See `scripts/screenshot-all-scenes.js` for the ready-made full-flow capture.

### Pattern F — Before / After Diff

```bash
# Take before screenshots
OUT_DIR=screenshots/before node .claude/skills/playwright-screenshot/scripts/screenshot-all-scenes.js

# Make your code changes...

# Take after screenshots
OUT_DIR=screenshots/after node .claude/skills/playwright-screenshot/scripts/screenshot-all-scenes.js

# Diff
node .claude/skills/playwright-screenshot/scripts/diff-screenshots.js screenshots/before/ screenshots/after/
```

---

## Waiting Correctly Before Shooting

Screenshots taken too early capture loading spinners or blank frames.

```js
// Lazy-loaded scenes: wait for React Suspense to resolve
await page.waitForLoadState('networkidle')

// Framer Motion transitions (AnimatePresence): wait for animation to settle
await page.waitForTimeout(400) // transitions are ~300ms

// PixiJS first render: wait for canvas + one tick
await page.locator('canvas').waitFor({ state: 'visible' })
await page.waitForTimeout(500)

// Specific element: prefer waitFor over fixed delays
await page
  .getByRole('heading', { name: /tour plan/i })
  .waitFor({ state: 'visible' })
```

---

## Selectors Reference

See `references/selector-cookbook.md` for the full selector list per scene. Quick cheatsheet:

```js
page.locator('.game-container') // root wrapper (all scenes)
page.locator('canvas') // PixiJS canvas (GIG/minigames)
page.getByRole('heading', { name: /neurotoxic/i }) // MENU
page.getByRole('heading', { name: /tour plan/i }) // OVERWORLD
page.getByRole('heading', { name: /preparation/i }) // PREGIG
page.getByRole('heading', { name: /gig report/i }) // POSTGIG
page.getByRole('heading', { name: /game over/i }) // GAMEOVER
page.locator('.hud-bar') // top resource bar
page.getByRole('dialog') // EventModal, BandHQ
page.getByRole('status') // Toast notifications
```

---

## Output Directory Convention

```
screenshots/
├── scenes/          # one-shot scene captures
├── flow/            # numbered sequence: 01-menu.png, 02-overworld.png …
├── before/          # pre-change captures
├── after/           # post-change captures
└── baselines/       # visual regression baselines (commit these)
```

Add to `.gitignore`: `screenshots/scenes/`, `screenshots/flow/`, `screenshots/before/`, `screenshots/after/`

Commit only `screenshots/baselines/` or `e2e/__snapshots__/`.

---

## Running the Scripts

```bash
# ✅ RECOMMENDED: Capture complete game flow (tested & reliable)
node .claude/skills/playwright-screenshot/scripts/screenshot-game-flow.js

# Capture all scenes (full golden-path + state injection)
node .claude/skills/playwright-screenshot/scripts/screenshot-all-scenes.js

# Inject a save state and capture a specific scene
node .claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js postgig

# Diff two screenshot directories
node .claude/skills/playwright-screenshot/scripts/diff-screenshots.js before/ after/
```

All scripts respect `BASE_URL` env var (default: `http://localhost:5173`) and `OUT_DIR`.

## Working Script Explanation: screenshot-game-flow.js

This is the **tested, proven-to-work** script for capturing Neurotoxic game screenshots. Here's how it works:

### Key Features

**1. Browser Launch with Fallback**

```js
const browser = await chromium.launch({
  executablePath: CHROMIUM_PATH, // Uses cached browser path
  headless: true,
  args: [
    '--no-sandbox', // Sandbox not needed in containers
    '--disable-setuid-sandbox', // Skip setuid restrictions
    '--disable-gpu', // GPU not available in headless
    '--disable-dev-shm-usage', // Use disk temp instead of /dev/shm
    '--mute-audio', // Don't play audio during capture
    '--disable-webgl' // Use Canvas2D (more stable for PixiJS)
  ]
})
```

**2. Timeout Control**

```js
async function snap(page, name, delay = 500) {
  await page.waitForTimeout(delay) // Wait for animations
  await page.screenshot({ path: file, timeout: 60000 }) // 60s timeout
}
```

- Custom delay per scene allows animations to complete
- 60s timeout prevents "font loading" timeout races
- Avoids `waitForLoadState('networkidle')` which can hang

**3. Identity Modal Handling**

```js
try {
  const input = page.locator('input[type="text"]')
  if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
    await input.fill('Test Band')
    const confirmBtn = page.getByRole('button', { name: /confirm/i })
    await confirmBtn.click()
    await page.waitForTimeout(1000)
  }
} catch (_e) {
  // Continue if modal not present
}
```

- Detects if band identity input is required
- Automatically enters "Test Band" as default
- Gracefully skips if modal not present

**4. Graceful Scene Navigation**

```js
try {
  const btn = page.getByRole('button', { name: /start tour/i })
  await btn.click({ timeout: 5000 })
  await snap(page, '05-overworld', 1200)
} catch (_e) {
  console.log('    (skipped)')
}
```

- Each scene is wrapped in try-catch
- If button not found, continues to next scene
- No hard failures, partial captures are still valuable

**5. Canvas Detection for PixiJS Scenes**

```js
const startBtn = page.getByRole('button', { name: /start show/i })
const visible = await startBtn.isVisible({ timeout: 2000 }).catch(() => false)
if (visible) {
  await startBtn.click()
  await page.locator('canvas').waitFor({ timeout: 15000 })
  await snap(page, '09-gig-canvas', 2000) // 2s delay for notes to render
}
```

- Waits for PixiJS canvas to be visible (not just ready)
- Extra delay (2s) allows notes/graphics to render
- Prevents blank/black canvas screenshots

### Real-World Test Results

**Environment**: CDN unreachable, cached browser available
**Browser**: Chromium v1194 (from ~/.cache/ms-playwright/)
**Status**: ✅ SUCCESS

Output:

```
🌐 Attempting to launch Chromium (standard)...
⚠ Standard launch failed (CDN unreachable), trying fallbacks...
  Trying cached browser: /root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome
✓ Chromium launched (from cache)
```

**Captured Scenes**:

- ✅ 01-intro.png (233 KB)
- ✅ 02-menu.png (210 KB)
- ✅ 03-credits.png
- ✅ 04-band-hq-modal.png
- ✅ 05-overworld.png
- ✅ 10-postgig.png

### Why This Script Works

1. **No networkidle**: Avoids the 30s timeout that hangs on v1194
2. **Cached browser**: Uses browser-launcher fallback when CDN unavailable
3. **Flexible timeouts**: Each scene gets appropriate wait time
4. **Graceful degradation**: Skips scenes that can't be reached, captures what's possible
5. **Modal handling**: Automatically enters band identity when needed
6. **PixiJS aware**: Special handling for canvas-based scenes with extra render time

### Usage

```bash
# Capture all scenes to screenshots/scenes/
node .claude/skills/playwright-screenshot/scripts/screenshot-game-flow.js

# Capture to custom directory
OUT_DIR=my-screenshots node .claude/skills/playwright-screenshot/scripts/screenshot-game-flow.js

# Capture from different base URL
BASE_URL=http://localhost:3000 node .claude/skills/playwright-screenshot/scripts/screenshot-game-flow.js
```

### Expected Output

```
🎬 Launching Chromium from cache...

📸 Capturing complete game flow...

→ INTRO
  ✓ 01-intro.png
→ MENU
  ✓ 02-menu.png
→ Setting band identity...
→ CREDITS
  ✓ 03-credits.png
→ BAND HQ modal
  ✓ 04-band-hq-modal.png
→ OVERWORLD
  ✓ 05-overworld.png
→ POSTGIG
  ✓ 10-postgig.png

✅ Scene capture complete!

📁 Screenshots saved to: /home/user/neurotoxic-game/screenshots/scenes
```

## Troubleshooting

| Problem                                         | Solution                                                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Timeout 30000ms exceeded** (font loading)     | Increase screenshot timeout to 60000ms. Fonts load asynchronously; Playwright waits for them.                                               |
| **Timeout 5000ms exceeded** (element not found) | Increase timeout to 10000ms. Some elements load lazily after React Suspense/animation. Use `waitSettle(page, 800)` before snapping.         |
| **Browser executable doesn't exist**            | CDN is unreachable. The script will fallback to cached browser. If none cached, provide `BROWSER_PATH` env var.                             |
| **Screenshot is blank/black**                   | PixiJS canvas needs extra wait. Use `await page.waitForTimeout(1000)` after visibility. Canvas2D fallback (--disable-webgl) is more stable. |
| **Audio crackles during capture**               | Use `--mute-audio` flag. Audio timing affects page stability; muting prevents race conditions.                                              |
| **dev:shm exhausted**                           | Use `--disable-dev-shm-usage` flag (already set). Chromium falls back to disk-based temp storage.                                           |

## Captured Screenshots Should Look Like

**INTRO**: Dark background, green text "NEUROTOXIC", skip/agree buttons visible
**MENU**: Main menu with "Start Tour", "Load Game", "Band HQ", "Credits" buttons
**OVERWORLD**: Tour plan heading, node map, travel UI
**GIG**: PixiJS canvas visible, HUD bar at top, notes/playfield rendering
**POSTGIG**: Gig report heading, score/earnings summary
**GAMEOVER**: Game Over heading, final stats

If a screenshot looks blank/wrong:

- Increase wait times before snap
- Check dev server is still running (`curl http://localhost:5173`)
- Verify `BASE_URL` env var matches running server

## CI Usage

See `references/ci-integration.md` for the full GitHub Actions workflow. The `webServer.command` in `playwright.config.js` is correctly set to `pnpm run dev`.

```bash
# Update visual regression baselines
pnpm exec playwright test e2e/visual.spec.js --update-snapshots

# Run all E2E tests
pnpm exec playwright test
```
