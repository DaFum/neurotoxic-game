# Scene Navigation Guide

Step-by-step Playwright navigation recipes for every Neurotoxic game scene.
For each scene: fastest path, key wait signal, and known gotchas.

---

## Table of Contents

1. [INTRO](#intro)
2. [MENU](#menu)
3. [CREDITS](#credits)
4. [SETTINGS](#settings)
5. [OVERWORLD](#overworld)
6. [TRAVEL_MINIGAME](#travel_minigame)
7. [PREGIG](#pregig)
8. [PRE_GIG_MINIGAME (Roadie / Kabelsalat)](#pre_gig_minigame)
9. [GIG (rhythm game)](#gig)
10. [POSTGIG](#postgig)
11. [GAMEOVER](#gameover)
12. [CLINIC](#clinic)
13. [Modal overlays](#modal-overlays)

---

## INTRO

The app always starts here on a fresh load. IntroVideo plays a looping background.

```js
await page.goto('/', { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle')
// Wait signal: skip button
await page.getByRole('button', { name: /skip/i }).waitFor({ state: 'visible', timeout: 8000 })
// Screenshot
await page.screenshot({ path: 'intro.png' })
```

**Gotcha:** The skip button may not appear immediately; it fades in after the intro animation starts.

---

## MENU

The fastest reliable path. `skipToMenu` in `e2e/helpers.js` encapsulates this.

```js
import { skipToMenu } from '../e2e/helpers.js'

await skipToMenu(page)
// Wait signal already handled by helper — heading /neurotoxic/i is visible
await page.screenshot({ path: 'menu.png' })
```

Manual equivalent:
```js
await page.goto('/')
// Race: skip button OR menu heading
const skip = page.getByRole('button', { name: /skip/i })
const menu = page.getByRole('heading', { name: /neurotoxic/i })
await Promise.race([
  skip.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {}),
  menu.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {})
])
if (await skip.isVisible()) await skip.click()
await menu.waitFor({ state: 'visible', timeout: 10000 })
// Dismiss tutorial
try {
  await page.getByRole('button', { name: /skip all/i }).waitFor({ timeout: 2000 })
  await page.getByRole('button', { name: /skip all/i }).click()
} catch (_) {}
```

**Gotcha:** Tutorial overlay (`TutorialManager`) appears on first load and blocks UI.
Always try to dismiss it before screenshotting.

---

## CREDITS

```js
await skipToMenu(page)
await page.getByRole('button', { name: /credits/i }).click()
await page.getByRole('heading', { name: /credits/i, exact: true }).waitFor({ state: 'visible' })
await page.waitForTimeout(300) // text fade-in animation
await page.screenshot({ path: 'credits.png' })
// Return
await page.getByRole('button', { name: /return/i }).click()
```

---

## SETTINGS

Settings is accessible as a scene (SETTINGS) and also as a tab inside Band HQ.

**As a standalone scene** (from within Band HQ → SETTINGS tab):
```js
await skipToMenu(page)
await page.getByRole('button', { name: /band hq/i }).click()
await page.getByRole('button', { name: 'SETTINGS' }).click()
await page.waitForTimeout(300)
await page.screenshot({ path: 'settings-panel.png' })
```

**Gotcha:** There is no direct SETTINGS button on the main menu; it lives inside Band HQ.

---

## OVERWORLD

Reached via MENU → "Start Tour". Audio initialization can cause a Chromium crash —
wrap in `raceWithCrash` when running in CI.

```js
import { skipToMenu, raceWithCrash } from '../e2e/helpers.js'

await skipToMenu(page)
const result = await raceWithCrash(
  page,
  () => page.getByRole('button', { name: /start tour/i }).click(),
  8000
)
if (result !== 'success') {
  test.skip(true, 'Audio crash — skip')
  return
}
await page.getByRole('heading', { name: /tour plan/i }).waitFor({ state: 'visible', timeout: 8000 })
await page.waitForTimeout(400) // map SVG render
await page.screenshot({ path: 'overworld.png' })
```

**Via state injection (no audio crash risk):**
```js
import { injectSave, waitForFixtureScene } from
  './.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js'

await page.goto('/', { waitUntil: 'commit' })
await injectSave(page, 'overworld')
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle')
await waitForFixtureScene(page, 'overworld')
await page.screenshot({ path: 'overworld.png' })
```

---

## TRAVEL_MINIGAME

The Tourbus minigame (TourbusScene.jsx). Reached by clicking a travel node on the overworld
and confirming.

```js
// Assumes we are on OVERWORLD
const node = page.getByRole('button', {
  name: /Travel to (Goldgrube|MTC|Die Distille)/i
}).first()
await node.waitFor({ state: 'visible', timeout: 5000 })
await node.click()                                         // first click = select
await page.getByText('CONFIRM?').waitFor({ state: 'visible', timeout: 3000 })
await node.click()                                         // second click = confirm

await page.getByText('TOURBUS TERROR').waitFor({ state: 'visible', timeout: 10000 })
await page.waitForTimeout(600) // canvas first render
await page.screenshot({ path: 'travel-minigame.png' })

// Backdoor-complete (Shift+P dev shortcut):
await page.keyboard.press('Shift+P')
await page.getByRole('button', { name: /continue/i }).waitFor({ state: 'visible', timeout: 10000 })
```

**Gotcha:** The canvas is PixiJS (Canvas2D fallback because `--disable-webgl` is set).
Wait at least 500 ms after the scene text appears before screenshotting the canvas.

---

## PREGIG

Reached after completing TRAVEL_MINIGAME and dismissing arrival events.

```js
// After travel minigame completes and continue is clicked:
for (let i = 0; i < 3; i++) {
  try {
    const opt = page.locator('button', { hasText: /^1 / }).first()
    await opt.waitFor({ state: 'visible', timeout: 2000 })
    await opt.click()
    await page.waitForTimeout(800)
  } catch (_) { break }
}
await page.getByRole('heading', { name: /preparation/i }).waitFor({ state: 'visible', timeout: 15000 })
await page.screenshot({ path: 'pregig.png' })
```

**Via state injection:**
```js
await injectSave(page, 'pregig')
await page.reload({ waitUntil: 'networkidle' })
await waitForFixtureScene(page, 'pregig')
await page.screenshot({ path: 'pregig.png' })
```

---

## PRE_GIG_MINIGAME

Either Roadie Run (RoadieRunScene) or Kabelsalat (KabelsalatScene), chosen randomly.
Reached after clicking "Start Show" on PREGIG.

```js
// Assumes we are on PREGIG with a song selected
await page.getByText('01 Kranker Schrank').click()
await page.getByRole('button', { name: /start show/i }).click()
await page.waitForTimeout(2000)             // minigame lazy-loads
await page.locator('canvas').waitFor({ state: 'visible', timeout: 10000 })
await page.waitForTimeout(600)
await page.screenshot({ path: 'pregig-minigame.png' })

// Backdoor-complete:
await page.keyboard.press('Shift+P')
await page.waitForTimeout(1500)
```

**Gotcha:** Which minigame appears is random. Both use `canvas` and respond to `Shift+P`.

---

## GIG

The rhythm game (Gig.jsx + PixiStage). The game auto-starts after the pre-gig minigame.
Capturing mid-gig requires timing; the simplest approach is to screenshot immediately
after the scene loads.

```js
// Assumes we have completed the pre-gig minigame
// The GIG scene starts automatically. Notes begin falling ~1-2s in.
await page.locator('canvas').waitFor({ state: 'visible', timeout: 15000 })
await page.waitForTimeout(1500) // let notes render
await page.screenshot({ path: 'gig-canvas.png' })

// Or composite (canvas + HUD):
await page.screenshot({ path: 'gig-full.png' })

// Let the gig auto-fail (no input → health drops to 0 → GigReport appears)
await page.getByRole('heading', { name: /gig report/i }).waitFor({ timeout: 90000 })
```

**Capturing the GIG HUD (GigHUD.jsx):**
```js
// GigHUD overlays the canvas. It shows health, score, crowd meter.
// It is rendered above the canvas (z-index 30).
// Screenshot the full viewport to capture both canvas + HUD.
await page.screenshot({ path: 'gig-with-hud.png' })
```

**Gotcha:** `--disable-webgl` forces Canvas2D rendering in Pixi. The visual output is
identical to the WebGL path for our game. Screenshots are reliable.

---

## POSTGIG

The post-gig report and social strategy phases (PostGig.jsx).

**Via full flow (auto-fail gig):**
```js
// After GIG scene, wait for gig report heading
await page.getByRole('heading', { name: /gig report/i }).waitFor({ timeout: 90000 })
await page.waitForTimeout(400)
await page.screenshot({ path: 'postgig-report.png' })

// Social phase
await page.getByRole('button', { name: /continue to socials/i }).click()
await page.getByRole('heading', { name: /post to social media/i }).waitFor()
await page.screenshot({ path: 'postgig-social.png' })
```

**Via state injection (fastest):**
```js
await injectSave(page, 'postgig')
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('heading', { name: /gig report/i }).waitFor({ timeout: 10000 })
await page.screenshot({ path: 'postgig.png' })
```

---

## GAMEOVER

GAMEOVER (GameOver.jsx) is triggered when `player.money` reaches 0 or other bankruptcy conditions.

**Via state injection (only reliable path):**
```js
await injectSave(page, 'gameover')
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('heading', { name: /game over/i }).waitFor({ timeout: 10000 })
await page.waitForTimeout(400)
await page.screenshot({ path: 'gameover.png' })
```

**Gotcha:** GAMEOVER is triggered by the reducer; injecting `currentScene: 'GAMEOVER'` directly
in localStorage is the only way to reach it without playing 10+ rounds to bankruptcy.

---

## CLINIC

ClinicScene.jsx — accessible from specific overworld nodes.

```js
// Via state injection
await injectSave(page, 'clinic')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForLoadState('networkidle')
await page.waitForTimeout(500)
await page.screenshot({ path: 'clinic.png' })
```

---

## Modal Overlays

### EventModal (random events)

Events appear over OVERWORLD, PREGIG, and POSTGIG scenes.

```js
// Via state injection with active event:
await injectSave(page, 'event-modal')
await page.reload({ waitUntil: 'networkidle' })
// Event modal renders as role="dialog" or via EventModal component
try {
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 5000 })
} catch (_) {
  // Fallback: overworld loaded without modal (scene mismatch on reload)
  await page.getByRole('heading', { name: /tour plan/i }).waitFor()
}
await page.screenshot({ path: 'event-modal.png' })
```

### BandHQ Modal

```js
await skipToMenu(page)
await page.getByRole('button', { name: /band hq/i }).click()
await page.getByRole('heading', { name: /band hq/i }).waitFor()
await page.screenshot({ path: 'band-hq.png' })
// Navigate tabs
await page.getByRole('button', { name: 'SHOP' }).click()
await page.screenshot({ path: 'band-hq-shop.png' })
await page.getByRole('button', { name: 'SETTINGS' }).click()
await page.screenshot({ path: 'band-hq-settings.png' })
```

### Toast Notifications

Toasts are transient. Capture them immediately after the triggering action.

```js
// Trigger an action that produces a toast (e.g., purchase in shop)
await page.getByRole('button', { name: /buy/i }).first().click()
// Toasts appear quickly; screenshot within 500ms
await page.waitForTimeout(200)
await page.screenshot({ path: 'toast.png' })
// Or capture just the toast region (top of screen)
await page.screenshot({ path: 'toast-crop.png', clip: { x: 0, y: 0, width: 1280, height: 120 } })
```

---

## Scene Load Timing Reference

| Scene | Load type | Min wait before screenshot |
|-------|-----------|---------------------------|
| INTRO | Eager | 800 ms (animation starts) |
| MENU | Lazy (React Suspense) | `networkidle` + 300 ms |
| OVERWORLD | Lazy + SVG map | `networkidle` + 400 ms |
| TRAVEL_MINIGAME | Lazy + Pixi canvas | canvas visible + 500 ms |
| PREGIG | Lazy | heading visible + 300 ms |
| PRE_GIG_MINIGAME | Lazy + Pixi canvas | canvas visible + 600 ms |
| GIG | Lazy + Pixi canvas | canvas visible + 1500 ms |
| POSTGIG | Lazy | heading visible + 400 ms |
| GAMEOVER | Lazy | heading visible + 300 ms |
| CLINIC | Lazy | `networkidle` + 500 ms |
