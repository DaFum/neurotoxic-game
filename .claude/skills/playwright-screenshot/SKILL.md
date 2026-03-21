---
name: playwright-screenshot
description: |
  Take Playwright screenshots at any point in the Neurotoxic app — single scene, full tour, UI overlays, PixiJS canvas, modal states, and visual regression baselines.

  Trigger when: asked to take screenshots of any game scene (INTRO, MENU, OVERWORLD, PREGIG, GIG, POSTGIG, GAMEOVER), capture UI states (modals, toasts, overlays, HUD), produce visual regression baselines, record before/after diffs for a UI change, document the game for any purpose, capture PixiJS canvas content, or debug visual glitches.

  Also trigger for: "show me what X looks like", "capture a screenshot of the gig scene", "take a screenshot before and after this change", "update visual baseline", "record all scenes", "screenshot at this point in the flow", "make a visual test for this UI".
---

# Playwright Screenshot Skill

Takes precise screenshots of the Neurotoxic game at any point in its lifecycle using Playwright. Covers full-page captures, element-level crops, PixiJS canvas, all game scenes, overlay states, and CI-ready visual regression baselines.

## Quick Reference

| Goal | Method | Script |
|------|--------|--------|
| All scenes in one pass | navigate + capture per scene | `screenshot-all-scenes.js` |
| Specific scene from cold start | inject state → navigate | `screenshot-state-inject.js` |
| Single UI element | `locator.screenshot()` | inline snippet |
| PixiJS canvas only | `page.locator('canvas').screenshot()` | inline snippet |
| Visual regression baseline | `toMatchSnapshot()` | inline snippet |

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
const hud = page.locator('.hud-root')   // adjust selector
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

The PixiJS canvas is rendered inside `.absolute.inset-0` at z-index 20. The canvas element is the only `<canvas>` on the page during GIG / minigame scenes.

```js
// Wait for canvas to paint at least one frame
await page.locator('canvas').waitFor({ state: 'visible', timeout: 10000 })
await page.waitForTimeout(500) // allow first render
await page.locator('canvas').screenshot({ path: 'out/pixi-canvas.png' })
```

### 6. Visual Regression (snapshot comparison)

```js
expect(await page.screenshot()).toMatchSnapshot('scene-baseline.png', {
  maxDiffPixelRatio: 0.05   // 5 % pixel tolerance
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
| **PRE_GIG_MINIGAME** | PREGIG → Start Show | `canvas` visible |
| **GIG** | pre-gig minigame → Shift+P | heading `/gig report/i` (skip to postgig) |
| **POSTGIG** | GIG completes (or auto-fail) | heading `/gig report/i` visible |
| **GAMEOVER** | inject bankrupt save state | heading `/game over/i` visible |
| **SETTINGS** | MENU → any settings button | heading `/settings/i` visible |
| **CREDITS** | MENU → "Credits" | heading `/credits/i` visible |
| **CLINIC** | OVERWORLD → clinic node | clinic scene visible |

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

Use `screenshot-state-inject.js` to inject a pre-built localStorage save before loading the app. This is the fastest way to reach late-game scenes (POSTGIG, GAMEOVER) without playing through the full flow.

```js
import { injectSave } from './scripts/screenshot-state-inject.js'

test('capture post-gig', async ({ page }) => {
  await injectSave(page, 'postgig-ready')   // loads a fixture save
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'screenshots/postgig.png' })
})
```

See `scripts/screenshot-state-inject.js` for available fixtures and how to create custom saves.

### Pattern D — PixiJS Canvas During GIG

The Pixi canvas renders the rhythm lane. `--disable-webgl` is set in `playwright.config.js`; Pixi falls back to Canvas2D, which is fully screenshottable.

```js
test('capture gig canvas', async ({ page }) => {
  // ... navigate to GIG scene via full flow or state injection
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 15000 })
  await page.waitForTimeout(1000)  // let notes render
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

  // ... continue through flow
})
```

See `scripts/screenshot-all-scenes.js` for a ready-made full-flow capture.

### Pattern F — Before / After Diff

```js
// before.spec.js
await page.screenshot({ path: 'screenshots/before/component.png' })

// after.spec.js
await page.screenshot({ path: 'screenshots/after/component.png' })
```

Then diff with:
```bash
node .claude/skills/playwright-screenshot/scripts/diff-screenshots.js \
  screenshots/before/ screenshots/after/
```

---

## Waiting Correctly Before Shooting

Screenshots taken too early capture loading spinners or blank frames. Use the right wait signal per scene:

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
// Scene-level containers
page.locator('.game-container')                    // root wrapper (all scenes)
page.locator('canvas')                             // PixiJS canvas (GIG/minigames)

// Navigation landmarks
page.getByRole('heading', { name: /neurotoxic/i }) // MENU
page.getByRole('heading', { name: /tour plan/i })  // OVERWORLD
page.getByRole('heading', { name: /preparation/i })// PREGIG
page.getByRole('heading', { name: /gig report/i }) // POSTGIG
page.getByRole('heading', { name: /game over/i })  // GAMEOVER

// HUD (visible in OVERWORLD, PREGIG, POSTGIG, CLINIC)
page.locator('.hud-bar')                            // top resource bar

// Overlays
page.getByRole('dialog')                            // EventModal, BandHQ
page.getByRole('status')                            // Toast notifications
```

---

## Output Directory Convention

Store screenshots under `screenshots/` (gitignored by convention) or `e2e/__snapshots__/` for snapshot baselines:

```
screenshots/
├── scenes/          # one-shot scene captures
├── flow/            # numbered sequence: 01-menu.png, 02-overworld.png …
├── before/          # pre-change captures
├── after/           # post-change captures
└── baselines/       # visual regression baselines (commit these)
```

Add to `.gitignore`:
```
screenshots/scenes/
screenshots/flow/
screenshots/before/
screenshots/after/
```

Commit only `screenshots/baselines/` or `e2e/__snapshots__/`.

---

## CI Usage

```yaml
# .github/workflows/visual.yml (excerpt)
- name: Install Playwright browsers
  run: pnpm exec playwright install chromium --with-deps

- name: Run visual regression
  run: pnpm exec playwright test e2e/visual.spec.js

- name: Upload screenshots on failure
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-screenshots
    path: |
      e2e/__snapshots__/
      test-results/
```

See `references/ci-integration.md` for full CI workflow.

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

All scripts respect `BASE_URL` env var (default: `http://localhost:5173`).
