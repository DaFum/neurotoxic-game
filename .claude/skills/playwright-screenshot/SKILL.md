---
name: playwright-screenshot
description: |
  Take Playwright screenshots at any point in the Neurotoxic app — single scene, full tour, UI overlays, PixiJS canvas, modal states, and visual regression baselines.

  Trigger when: asked to take screenshots of any game scene (INTRO, MENU, OVERWORLD, PREGIG, GIG, POSTGIG, GAMEOVER), capture UI states (modals, toasts, overlays, HUD), produce visual regression baselines, record before/after diffs for a UI change, document the game for any purpose, capture PixiJS canvas content, or debug visual glitches.

  Also trigger for: "show me what X looks like", "what does X look like", "capture a screenshot of the gig scene", "take a screenshot before and after this change", "update visual baseline", "record all scenes", "screenshot at this point in the flow", "make a visual test for this UI", "document the game", "I want to see the current state of", "can you show me", "screenshot this".
---

# Playwright Screenshot Skill

Takes precise screenshots of the Neurotoxic game using Playwright. Covers all scenes, element crops, PixiJS canvas, overlay states, and CI-ready visual regression baselines.

---

## Agent Execution Workflow

When triggered, follow this decision tree — don't just provide code samples, actually run the screenshot:

### Step 1 — Decide scope

| Request | Approach |
|---------|----------|
| All scenes / full tour | Run `screenshot-all-scenes.js` script |
| One specific scene | Use state injection (`screenshot-state-inject.js`) |
| Current page / overlay / element | Write inline Playwright snippet as a temp spec |
| Before/after a code change | Run injection script twice; diff with `diff-screenshots.js` |
| Visual regression test | Add `toMatchSnapshot()` to `e2e/visual.spec.js` |

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

### Step 3 — Run and capture

**All scenes:**
```bash
node .claude/skills/playwright-screenshot/scripts/screenshot-all-scenes.js
```
Output: `screenshots/scenes/01-intro.png` … `14-overworld-after-gig.png`

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

### Step 4 — Show screenshots to the user

After capturing, use the `Read` tool to display each PNG file inline so the user sees the result immediately. Do not just report the file path — show the image.

```
Read("screenshots/scenes/05-overworld.png")  ← Claude can render PNG files
```

---

## Quick Reference

| Goal | Method | Script |
|------|--------|--------|
| All scenes in one pass | navigate + capture per scene | `screenshot-all-scenes.js` |
| Specific scene from cold start | inject state → navigate | `screenshot-state-inject.js` |
| Single UI element | `locator.screenshot()` | inline snippet |
| PixiJS canvas only | `page.locator('canvas').screenshot()` | inline snippet |
| Visual regression baseline | `toMatchSnapshot()` | `e2e/visual.spec.js` |
| Before/after diff | run twice + `diff-screenshots.js` | see Pattern F |

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
  maxDiffPixelRatio: 0.05   // 5% pixel tolerance
})
```

Snapshots are stored in `e2e/__snapshots__/` automatically.

---

## Navigating to Each Scene

See `references/scene-navigation.md` for complete step-by-step flows. Summary:

| Scene | How to Reach | Key Wait Signal |
|-------|-------------|-----------------|
| **INTRO** | `page.goto('/')` | `getByRole('button', { name: /skip/i })` visible |
| **MENU** | `skipToMenu(page)` helper | heading `/neurotoxic/i` visible |
| **OVERWORLD** | MENU → "Start Tour" | `getByRole('heading', { name: /tour plan/i })` |
| **TRAVEL_MINIGAME** | OVERWORLD → click node → confirm | text `TOURBUS TERROR` visible |
| **PREGIG** | complete travel → dismiss events | heading `/preparation/i` visible |
| **PRE_GIG_MINIGAME** | PREGIG → Start Show | `canvas` visible + 600 ms |
| **GIG** | pre-gig minigame → Shift+P | `canvas` visible + 1500 ms |
| **POSTGIG** | GIG → Shift+P (or auto-fail) | heading `/gig report/i` visible |
| **GAMEOVER** | inject `gameover` save state | heading `/game over/i` visible |
| **SETTINGS** | MENU → Band HQ → SETTINGS tab | heading `/settings/i` visible |
| **CREDITS** | MENU → "Credits" | heading `/credits/i` visible |
| **CLINIC** | inject `clinic` save state | `networkidle` + 500 ms |

**Fastest paths for hard-to-reach scenes:** use state injection — no need to play through.

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
  await page.getByRole('heading', { name: /band hq/i }).waitFor({ state: 'visible' })
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
  await page.waitForTimeout(1500)  // let notes render
  await page.locator('canvas').screenshot({ path: 'screenshots/gig-canvas.png' })
  // OR: composite canvas + HUD in one shot
  await page.screenshot({ path: 'screenshots/gig-full.png' })
})
```

### Pattern E — Multi-Step Flow with Screenshots at Each Step

```js
test('document full game flow', async ({ page }) => {
  const snap = (name) => page.screenshot({ path: `screenshots/${name}.png` })

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
await page.waitForTimeout(400)    // transitions are ~300ms

// PixiJS first render: wait for canvas + one tick
await page.locator('canvas').waitFor({ state: 'visible' })
await page.waitForTimeout(500)

// Specific element: prefer waitFor over fixed delays
await page.getByRole('heading', { name: /tour plan/i }).waitFor({ state: 'visible' })
```

---

## Selectors Reference

See `references/selector-cookbook.md` for the full selector list per scene. Quick cheatsheet:

```js
page.locator('.game-container')                    // root wrapper (all scenes)
page.locator('canvas')                             // PixiJS canvas (GIG/minigames)
page.getByRole('heading', { name: /neurotoxic/i }) // MENU
page.getByRole('heading', { name: /tour plan/i })  // OVERWORLD
page.getByRole('heading', { name: /preparation/i })// PREGIG
page.getByRole('heading', { name: /gig report/i }) // POSTGIG
page.getByRole('heading', { name: /game over/i })  // GAMEOVER
page.locator('.hud-bar')                            // top resource bar
page.getByRole('dialog')                            // EventModal, BandHQ
page.getByRole('status')                            // Toast notifications
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
# Capture all scenes (requires running dev server)
node .claude/skills/playwright-screenshot/scripts/screenshot-all-scenes.js

# Inject a save state and capture a specific scene
node .claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js postgig

# Diff two screenshot directories
node .claude/skills/playwright-screenshot/scripts/diff-screenshots.js before/ after/
```

All scripts respect `BASE_URL` env var (default: `http://localhost:5173`) and `OUT_DIR`.

## CI Usage

See `references/ci-integration.md` for the full GitHub Actions workflow. The `webServer.command` in `playwright.config.js` is correctly set to `pnpm run dev`.

```bash
# Update visual regression baselines
pnpm exec playwright test e2e/visual.spec.js --update-snapshots

# Run all E2E tests
pnpm exec playwright test
```
