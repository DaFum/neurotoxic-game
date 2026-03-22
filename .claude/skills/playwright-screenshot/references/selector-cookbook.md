# Selector Cookbook

Playwright selectors for every interactive element and structural landmark in Neurotoxic.

Prefer `getByRole` over CSS selectors — they are resilient to class-name changes and
correctly reflect accessibility semantics. Fall back to `locator()` when no semantic
role exists (e.g., canvas, custom containers).

---

## Table of Contents

1. [Global / App Shell](#global--app-shell)
2. [MENU scene](#menu-scene)
3. [OVERWORLD scene](#overworld-scene)
4. [Band HQ modal](#band-hq-modal)
5. [PREGIG scene](#pregig-scene)
6. [GIG / PixiJS canvas](#gig--pixijs-canvas)
7. [POSTGIG scene](#postgig-scene)
8. [GAMEOVER scene](#gameover-scene)
9. [Event modal](#event-modal)
10. [HUD bar](#hud-bar)
11. [Toast notifications](#toast-notifications)
12. [Tutorial overlay](#tutorial-overlay)

---

## Global / App Shell

```js
// Root game container (present in all scenes)
page.locator('.game-container')
// or equivalently:
page.locator('div.relative.w-full.h-full.overflow-hidden')

// PixiJS canvas (GIG, TRAVEL_MINIGAME, PRE_GIG_MINIGAME)
page.locator('canvas')

// CRT overlay (always present when crtEnabled = true)
page.locator('.crt-overlay') // class may vary; inspect DOM if needed
```

---

## MENU scene

```js
// Main heading
page.getByRole('heading', { name: /neurotoxic/i })

// Primary action buttons
page.getByRole('button', { name: /start tour/i })
page.getByRole('button', { name: /load game/i })
page.getByRole('button', { name: /band hq/i })
page.getByRole('button', { name: /credits/i })

// Band member portraits (rendered as images inside buttons or divs)
// No stable selector — query by alt text if images have it:
page.getByAltText(/matze/i)
page.getByAltText(/marius/i)
page.getByAltText(/lars/i)
```

---

## OVERWORLD scene

```js
// Scene heading
page.getByRole('heading', { name: /tour plan/i })

// Map container (SVG-based game map)
page.locator('svg') // the map SVG
page.locator('svg').first() // if multiple SVGs exist

// Travel node buttons — name includes "Travel to <venue>"
page.getByRole('button', { name: /travel to goldgrube/i })
page.getByRole('button', { name: /travel to mtc/i })
page.getByRole('button', { name: /travel to die distille/i })
page.getByRole('button', { name: /travel to stadtfest/i })
page.getByRole('button', { name: /travel to deichbrand/i })
page.getByRole('button', { name: /travel to wacken/i })
// Generic: first reachable travel node
page
  .getByRole('button', {
    name: /travel to (Goldgrube|MTC|Die Distille|Stadtfest|Deichbrand|Wacken)/i
  })
  .first()

// Confirm travel tooltip
page.getByText('CONFIRM?')

// HUD actions on overworld
page.getByRole('button', { name: /band hq/i })

// Current location indicator (text varies by location)
page.getByText(/stendal/i) // example starting city
```

---

## Band HQ modal

```js
// Modal heading
page.getByRole('heading', { name: /band hq/i, exact: true })

// Tab navigation
page.getByRole('button', { name: 'SHOP' })
page.getByRole('button', { name: 'SETTINGS' })
page.getByRole('button', { name: 'BAND' }) // if tab exists
page.getByRole('button', { name: 'LEADERBOARD' }) // if tab exists

// Close button
page.getByRole('button', { name: /leave \[esc\]/i })

// Shop items (generic — text varies by item name)
page.locator('button[data-item-id]') // if data attrs exist
page.getByRole('button', { name: /buy/i }).first()

// Settings panel elements
page.locator('#logLevelSelect') // log level dropdown
page.getByRole('checkbox', { name: /crt/i }) // CRT toggle
page.getByRole('slider') // audio sliders (volume etc.)
```

---

## PREGIG scene

```js
// Scene heading
page.getByRole('heading', { name: /preparation/i })

// Setlist / song picker
page.getByText('01 Kranker Schrank') // first song by display name
page.getByText('02') // second slot etc.
// Songs are rendered as clickable list items
page.locator('[data-song-id]').first() // if data attr exists

// Modifier checkboxes (promo, soundcheck, merch, catering, guestlist)
page.getByRole('checkbox', { name: /promo/i })
page.getByRole('checkbox', { name: /soundcheck/i })
page.getByRole('checkbox', { name: /merch/i })
page.getByRole('checkbox', { name: /catering/i })
page.getByRole('checkbox', { name: /guestlist/i })

// Primary action
page.getByRole('button', { name: /start show/i, exact: true })

// Cost display (euro amounts shown in UI)
page.getByText(/€\d+/)
```

---

## GIG / PixiJS canvas

The entire rhythm game render happens on the canvas. There are no DOM elements inside it —
the HUD is a separate React layer on top.

```js
// Canvas element (PixiStage)
page.locator('canvas')

// GIG HUD (React overlay above canvas, z-index 30)
// Health bar
page.locator('.health-bar') // class name may vary
page.getByRole('progressbar') // if health bar is a <progress>

// Score counter
page.getByText(/score/i) // look for score label

// Crowd meter
page.locator('.crowd-meter')

// GIG ends → gig report heading
page.getByRole('heading', { name: /gig report/i })
```

**Capturing canvas content:**

```js
// Full viewport (canvas + HUD overlay)
await page.screenshot({ path: 'gig-full.png' })

// Canvas only (strips HUD overlay)
await page.locator('canvas').screenshot({ path: 'gig-canvas-only.png' })
```

---

## POSTGIG scene

```js
// Report heading
page.getByRole('heading', { name: /gig report/i })

// Stats visible in report
page.getByText(/earnings/i)
page.getByText(/crowd score/i)
page.getByText(/fame/i)

// Navigation
page.getByRole('button', { name: /continue to socials/i })

// Social media phase
page.getByRole('heading', { name: /post to social media/i })
page.locator('button:has-text("Platform")').first() // social platform buttons

// After posting
page.getByRole('button', { name: /back to tour/i })
```

---

## GAMEOVER scene

```js
// Scene heading
page.getByRole('heading', { name: /game over/i })

// Restart / menu buttons
page.getByRole('button', { name: /new game/i })
page.getByRole('button', { name: /main menu/i })
```

---

## Event modal

Random events appear as a modal overlay. They have a title, description, and numbered options.

```js
// Modal container
page.getByRole('dialog')

// Option buttons are numbered: "1 Fix the van (€80)", "2 Limp along"
page.locator('button', { hasText: /^1 / }).first()
page.locator('button', { hasText: /^2 / }).first()
page.locator('button', { hasText: /^3 / }).first()

// Event title (i18n key resolved to text)
page.getByRole('heading') // first heading inside the modal
```

---

## HUD bar

The HUD is rendered above all game scenes except INTRO, MENU, SETTINGS, CREDITS, GAMEOVER,
TRAVEL_MINIGAME, PRE_GIG_MINIGAME, and CLINIC.

```js
// Resource values (text-based)
page.getByText(/€\d+/) // money display
page.getByText(/day \d+/i) // day counter
page.getByText(/harmony/i) // harmony label

// Fuel bar (progress element or text)
page.getByRole('progressbar', { name: /fuel/i })

// HUD container (screenshot the top bar only)
await page.screenshot({
  path: 'hud-bar.png',
  clip: { x: 0, y: 0, width: 1280, height: 60 }
})
```

---

## Toast notifications

Toasts (ToastOverlay) appear in the top-right corner. They are transient (~3 s).

```js
// Any toast
page.getByRole('status').first()

// Specific toast by content
page.getByRole('status').filter({ hasText: /purchased/i })

// Toast region crop
await page.screenshot({
  path: 'toast.png',
  clip: { x: 900, y: 0, width: 380, height: 120 }
})
```

---

## Tutorial overlay

TutorialManager renders a full-screen or positioned overlay on first load.

```js
// Dismiss button
page.getByRole('button', { name: /skip all/i })
page.getByRole('button', { name: /next/i })

// Tutorial step text
page.getByRole('dialog') // if tutorial uses a dialog role
```

Always dismiss the tutorial before taking screenshots:

```js
try {
  const skipAll = page.getByRole('button', { name: /skip all/i })
  await skipAll.waitFor({ state: 'visible', timeout: 2000 })
  await skipAll.click()
} catch (_) {
  // Tutorial not visible — already dismissed or tutorialSeen = true in state
}
```

---

## Selector Priority Guide

| Priority | Strategy          | Example                                        | When to use                            |
| -------- | ----------------- | ---------------------------------------------- | -------------------------------------- |
| 1        | `getByRole`       | `getByRole('button', { name: /start tour/i })` | Buttons, headings, dialogs, checkboxes |
| 2        | `getByText`       | `getByText('01 Kranker Schrank')`              | Static text content                    |
| 3        | `getByAltText`    | `getByAltText(/matze/i)`                       | Images with alt text                   |
| 4        | `locator(id)`     | `locator('#logLevelSelect')`                   | Form elements with stable IDs          |
| 5        | `locator(css)`    | `locator('canvas')`                            | Canvas, structural containers          |
| 6        | `locator(data-*)` | `locator('[data-song-id]')`                    | Only if data attributes are present    |
