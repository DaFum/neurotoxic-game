#!/usr/bin/env node
/**
 * screenshot-state-inject.js
 *
 * Injects a pre-built localStorage save state into the browser before loading
 * the Neurotoxic app, then navigates to the correct scene and captures a screenshot.
 *
 * This is the fastest way to capture late-game or hard-to-reach scenes
 * (POSTGIG, GAMEOVER, CLINIC, deep OVERWORLD state) without playing through
 * the entire golden-path flow.
 *
 * IMPORTANT: the game's LOAD_GAME reducer (`handleLoadGame`) always forces
 * `currentScene` back to OVERWORLD, so injecting `currentScene: 'POSTGIG'` alone
 * lands on OVERWORLD. After hydration we navigate to the fixture's intended scene
 * via the DEV-only `window.gameState.changeScene()` API (see navigateToFixtureScene).
 * The injected state (lastGigStats, currentGig, etc.) survives the load, so the
 * target scene renders correctly once we switch to it.
 *
 * Usage:
 *   node .claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js <fixture> [outfile]
 *
 *   Fixtures:  menu | overworld | pregig | gig | postgig | gameover | clinic | band-hq | event-modal
 *
 * Examples:
 *   node screenshot-state-inject.js gameover screenshots/gameover.png
 *   node screenshot-state-inject.js postgig
 *
 * Options (env vars):
 *   BASE_URL=http://localhost:5173   App URL (default)
 *   OUT_DIR=screenshots/injected     Output directory (default)
 *   HEADLESS=true                    Run headless (default true)
 *
 * Creating your own fixtures:
 *   1. Play the game to the desired state
 *   2. Open DevTools → Application → Local Storage → localhost:5173
 *   3. Copy the value of `neurotoxic_v3_save`
 *   4. Add a new entry to the FIXTURES map below with a meaningful key
 */

import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { launchBrowserWithFallback } from './browser-launcher.js'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const OUT_DIR = resolve(process.env.OUT_DIR ?? 'screenshots/injected')
const HEADLESS = process.env.HEADLESS !== 'false'

// ── Save key used by the game ──────────────────────────────────────────────
const SAVE_KEY = 'neurotoxic_v3_save'
const GLOBAL_SETTINGS_KEY = 'neurotoxic_global_settings'

// ── Minimal base state (mirrors initialState.js shape) ────────────────────
// This is the shape the game expects. You can override individual fields per fixture.
// Exported for validation in playwright-screenshot-fixture-validation.test.js
export const BASE_STATE = {
  version: 2,
  currentScene: 'MENU',
  player: {
    playerId: 'fixture-player',
    playerName: 'FIXTURE',
    money: 500,
    day: 3,
    time: 14,
    location: 'stendal',
    currentNodeId: 'node_0_0',
    lastGigNodeId: null,
    tutorialStep: 99, // skip tutorial
    score: 1200,
    fame: 350,
    fameLevel: 1,
    eventsTriggeredToday: 0,
    totalTravels: 2,
    hqUpgrades: [],
    clinicVisits: 0,
    van: { fuel: 80, condition: 75, upgrades: [], breakdownChance: 0.05 },
    passiveFollowers: 0,
    stats: {
      totalDistance: 120,
      conflictsResolved: 0,
      stageDives: 1,
      consecutiveBadShows: 0,
      proveYourselfMode: false
    }
  },
  rivalBand: null,
  band: {
    members: [
      {
        id: 'matze',
        name: 'Matze',
        role: 'Guitar',
        mood: 70,
        stamina: 85,
        traits: [],
        relationships: { Marius: 50, Lars: 50 }
      },
      {
        id: 'marius',
        name: 'Marius',
        role: 'Bass',
        mood: 65,
        stamina: 90,
        traits: [],
        relationships: { Matze: 50, Lars: 50 }
      },
      {
        id: 'lars',
        name: 'Lars',
        role: 'Drums',
        mood: 75,
        stamina: 80,
        traits: [],
        relationships: { Matze: 50, Marius: 50 }
      }
    ],
    harmony: 72,
    harmonyRegenTravel: false,
    inventorySlots: 0,
    luck: 0,
    stash: {},
    activeContrabandEffects: [],
    performance: {
      guitarDifficulty: 1.0,
      drumMultiplier: 1.0,
      crowdDecay: 1.0
    },
    inventory: {
      shirts: 40,
      hoodies: 15,
      patches: 80,
      cds: 20,
      vinyl: 5,
      neuro_cutting_board: 0,
      neuro_lunchbox: 0,
      neuro_mug: 0,
      neuro_bowl: 0,
      strings: true,
      cables: true,
      drum_parts: true,
      golden_pick: false
    }
  },
  social: {
    instagram: 1200,
    tiktok: 400,
    youtube: 85,
    newsletter: 50,
    viral: 0,
    lastGigDay: 2,
    lastPirateBroadcastDay: null,
    controversyLevel: 0,
    loyalty: 20,
    zealotry: 0,
    reputationCooldown: 0,
    egoFocus: null,
    sponsorActive: false,
    trend: 'MUSIC',
    activeDeals: [],
    brandReputation: {},
    influencers: {
      tech_reviewer_01: { tier: 'Macro', trait: 'tech_savvy', score: 0 },
      drama_queen_99: { tier: 'Mega', trait: 'drama_magnet', score: 0 },
      local_scene_kid: { tier: 'Micro', trait: 'tastemaker', score: 0 }
    }
  },
  gameMap: null, // game regenerates on load if null
  currentGig: null,
  gigModifiers: {
    promo: false,
    soundcheck: false,
    merch: false,
    catering: false,
    guestlist: false
  },
  lastGigStats: null,
  activeEvent: null,
  pendingEvents: [],
  isScreenshotMode: false,
  minigame: {
    active: false,
    type: null,
    targetDestination: null,
    gigId: null,
    equipmentRemaining: 0,
    accumulatedDamage: 0,
    score: 0
  },
  settings: { crtEnabled: true, tutorialSeen: true, logLevel: 'WARN' },
  toasts: [],
  setlist: [],
  activeStoryFlags: [],
  eventCooldowns: [],
  venueBlacklist: [],
  activeQuests: [],
  questCooldowns: [],
  completedQuestIds: [],
  completedQuestScopes: [],
  reputationByRegion: {},
  reputationByVenue: {},
  npcs: {},
  unlocks: [],
  pendingBandHQOpen: false,
  pendingSupplyStopInventory: null,
  pendingForeclosureNotices: [],
  pendingRiskEvent: null,
  completedMilestones: [],
  // Long-term asset system (Plan 1 Task 7)
  assets: [],
  liabilities: [],
  crowdfundCampaigns: [],
  rngSeed: 12345
}

// ── Per-fixture overrides ──────────────────────────────────────────────────
// Each fixture describes:
//   state:   deep-merged into BASE_STATE (only overridden keys needed)
//   waitFor: Playwright locator expression evaluated after page load
//   capture: optional extra steps before screenshot (async function receiving page)
const FIXTURES = {
  menu: {
    description: 'Main menu (fresh start)',
    state: { currentScene: 'MENU' },
    waitFor: async page =>
      page
        .getByRole('heading', { name: /neurotoxic/i })
        .waitFor({ state: 'visible' })
  },

  overworld: {
    description: 'Overworld map with moderate resources',
    state: { currentScene: 'OVERWORLD', player: { money: 480, fame: 350 } },
    waitFor: async page => {
      // Try multiple selectors for robustness
      try {
        return await page
          .getByRole('heading', { name: /tour plan|overworld/i })
          .waitFor({ state: 'visible', timeout: 15000 })
      } catch {
        // Fallback: wait for SVG map (core overworld element)
        return await page
          .locator('svg')
          .first()
          .waitFor({ state: 'visible', timeout: 2000 })
      }
    }
  },

  pregig: {
    description: 'PreGig preparation screen',
    state: {
      currentScene: 'PREGIG',
      // `currentGig` is the Venue object (see src/types/map.d.ts): the scene
      // reads `currentGig.id`/`.name`/`.capacity`, NOT `venueId`/`venueName`.
      // Using the wrong keys leaves `currentGig.id` undefined and PreGig never
      // mounts, so the fixture must mirror the real Venue shape.
      currentGig: {
        id: 'goldgrube',
        name: 'Goldgrube',
        capacity: 120,
        pay: 80,
        difficulty: 2,
        songId: null
      },
      activeEvent: null,
      pendingEvents: [],
      // Flag to prevent event triggering in screenshot fixtures
      isScreenshotMode: true
    },
    waitFor: async page => {
      try {
        return await page
          .getByRole('heading', { name: /preparation|pregig/i })
          .waitFor({ state: 'visible', timeout: 15000 })
      } catch {
        // Fallback: the "Start Show" CTA is the stable anchor for PreGig
        return await page
          .getByRole('button', { name: /start show/i })
          .waitFor({ state: 'visible', timeout: 2000 })
      }
    },
    capture: async page => {
      // Entering PreGig can roll a chain of random event modals over the prep
      // screen (resolving one may surface a consequence/next event). Clear up to
      // a few of them — numbered options or a CONTINUE button — then wait for the
      // PreGig heading underneath. Resolution keeps us in the PREGIG scene.
      for (let i = 0; i < 5; i++) {
        const dialog = page.getByRole('dialog').first()
        if (!(await dialog.isVisible({ timeout: 800 }).catch(() => false)))
          break
        const numbered = dialog
          .locator('button')
          .filter({ hasText: /\[\d\]/ })
          .first()
        const cont = dialog.getByRole('button', { name: /continue/i }).first()
        if (await numbered.isVisible().catch(() => false)) {
          await numbered.click().catch(() => {})
        } else if (await cont.isVisible().catch(() => false)) {
          await cont.click().catch(() => {})
        } else {
          break
        }
        await page.waitForTimeout(400)
      }
      await page
        .getByRole('heading', { name: /preparation/i })
        .waitFor({ state: 'visible', timeout: 5000 })
        .catch(() => {})
    }
  },

  postgig: {
    description: 'Post-gig report screen after a successful gig',
    state: {
      currentScene: 'POSTGIG',
      currentGig: {
        venueId: 'goldgrube',
        venueName: 'Goldgrube',
        songId: '01 Kranker Schrank',
        setlist: ['01 Kranker Schrank'],
        capacity: 120,
        basePay: 80,
        nodeId: 'node_2_1'
      },
      lastGigStats: {
        venueName: 'Goldgrube',
        earnings: 95,
        crowdScore: 0.72,
        harmonyChange: 3,
        fameEarned: 120,
        perfectHits: 14,
        missedHits: 2,
        songTitle: 'Kranker Schrank',
        bonuses: [],
        penalties: []
      },
      activeEvent: null,
      pendingEvents: []
    },
    waitFor: async page => {
      // POSTGIG shows a brief "TALLYING RECEIPTS…" state before the report.
      // Anchor on POSTGIG-specific UI (report heading or its continue CTA) —
      // NOT generic "Fame/Day" text, which also appears on the OVERWORLD HUD
      // and would false-pass if navigation ever failed.
      await page
        .getByRole('heading', { name: /gig report|postgig/i })
        .or(
          page.getByRole('button', {
            name: /continue to socials|back to (tour|overworld)/i
          })
        )
        .first()
        .waitFor({ state: 'visible', timeout: 15000 })
      // NOTE: injected POSTGIG shows the report *shell* ("TALLYING RECEIPTS…" +
      // "BACK TO OVERWORLD"); the populated figures are computed by the live
      // END_GIG flow, which state-injection + changeScene bypasses. For a fully
      // rendered gig report, capture POSTGIG via the live golden-path flow
      // (screenshot-game-flow.js) instead. Short settle for the scene shell:
      await page.waitForTimeout(600)
    }
  },

  gameover: {
    description: 'Game over screen (bankrupt)',
    state: {
      currentScene: 'GAMEOVER',
      player: { money: 0, fame: 0, day: 14 },
      band: { harmony: 1 }
    },
    waitFor: async page =>
      // The GAMEOVER heading reads "SOLD OUT" / "THE TOUR HAS ENDED PREMATURELY"
      // (the literal "GAME OVER" string is only a toast). Anchor on the real
      // heading or the final-stats panel, never generic "day/stats" text.
      page
        .getByRole('heading', { name: /sold out|tour has ended|game over/i })
        .or(page.getByText(/final statistics|load last save/i).first())
        .first()
        .waitFor({ state: 'visible', timeout: 15000 })
  },

  gig: {
    description: 'GIG scene with PixiJS canvas',
    state: {
      currentScene: 'GIG',
      currentGig: {
        venueId: 'goldgrube',
        venueName: 'Goldgrube',
        songId: '01 Kranker Schrank',
        setlist: ['01 Kranker Schrank'],
        capacity: 120,
        basePay: 80,
        nodeId: 'node_2_1'
      }
    },
    waitFor: async page => {
      // Check if "SYSTEM LOCKED" overlay is present (audio-locking scenario)
      try {
        const lockedOverlay = await page.evaluate(() => {
          const bodyText = document.body.innerText || ''
          return bodyText.includes('SYSTEM LOCKED')
        })
        if (lockedOverlay) {
          throw new Error(
            'GIG scene is locked - audio playback failed to initialize'
          )
        }
      } catch (err) {
        if (err.message?.includes('SYSTEM LOCKED')) throw err
        // Ignore evaluation errors, continue to canvas check
      }

      try {
        // GIG scene has PixiJS canvas - wait for it to be visible
        return await page
          .locator('canvas')
          .waitFor({ state: 'visible', timeout: 15000 })
      } catch {
        // Fallback: wait for gig UI overlay (if canvas slow to render)
        return await page
          .getByRole('button', { name: /skip|continue|escape/i })
          .first()
          .waitFor({ state: 'visible', timeout: 3000 })
      }
    }
  },

  clinic: {
    description: 'Clinic scene',
    state: {
      currentScene: 'CLINIC',
      player: { money: 800, fame: 500 }
    },
    waitFor: async page => {
      // Clinic has no unique heading — wait for networkidle then stabilize
      try {
        await page.waitForLoadState('networkidle', { timeout: 5000 })
      } catch (err) {
        // Only tolerate timeout; rethrow navigation/connection errors
        if (err.name === 'TimeoutError') {
          console.log('    (networkidle timed out, continuing)')
        } else {
          throw err
        }
      }
      // Wait for the clinic UI to be interactive (fallback to heading or section)
      try {
        await page
          .getByRole('heading', { name: /clinic|doctor/i })
          .waitFor({ state: 'visible', timeout: 2000 })
      } catch {
        // If no heading found, wait for a generic element to stabilize
        await page.waitForLoadState('domcontentloaded')
      }
    }
  },

  'band-hq': {
    description: 'Main menu with Band HQ modal open',
    state: { currentScene: 'MENU' },
    waitFor: async page =>
      page
        .getByRole('heading', { name: /neurotoxic/i })
        .waitFor({ state: 'visible', timeout: 10000 }),
    capture: async page => {
      await page.getByRole('button', { name: /band hq/i }).click()
      // Wait for the Band HQ modal to fully render
      await page
        .getByRole('heading', { name: /band hq/i })
        .waitFor({ state: 'visible', timeout: 5000 })
      // Verify modal content is interactive (matches "LEAVE [ESC]" button)
      await page
        .getByRole('button', { name: /leave|esc/i })
        .first()
        .waitFor({ state: 'visible', timeout: 2000 })
    }
  },

  'event-modal': {
    description: 'Overworld with an active event modal open',
    state: {
      currentScene: 'OVERWORLD',
      activeEvent: {
        id: 'van_breakdown',
        category: 'travel',
        titleKey: 'events:van_breakdown.title',
        descKey: 'events:van_breakdown.desc',
        options: [
          {
            id: 'fix',
            labelKey: 'events:van_breakdown.fix',
            cost: { money: 80 }
          },
          {
            id: 'limp',
            labelKey: 'events:van_breakdown.limp',
            effect: { vanCondition: -20 }
          }
        ]
      }
    },
    waitFor: async page =>
      page
        .getByRole('dialog')
        .waitFor({ state: 'visible', timeout: 8000 })
        .catch(() =>
          page
            .getByRole('heading', { name: /tour plan/i })
            .waitFor({ state: 'visible', timeout: 8000 })
        )
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function deepMerge(base, override) {
  const result = { ...base }
  for (const key of Object.keys(override ?? {})) {
    if (
      override[key] !== null &&
      typeof override[key] === 'object' &&
      !Array.isArray(override[key]) &&
      base[key] !== null &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(base[key], override[key])
    } else {
      result[key] = override[key]
    }
  }
  return result
}

async function injectAndCapture(fixtureName, outFile) {
  const fixture = FIXTURES[fixtureName]
  if (!fixture) {
    const available = Object.keys(FIXTURES).join(', ')
    console.error(`Unknown fixture "${fixtureName}". Available: ${available}`)
    process.exit(1)
  }

  const saveState = deepMerge(BASE_STATE, fixture.state ?? {})
  const globalSettings = { tutorialSeen: true, crtEnabled: true }

  await mkdir(OUT_DIR, { recursive: true })

  const browser = await launchBrowserWithFallback({
    headless: HEADLESS
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  })
  const page = await context.newPage()

  // Capture console messages for debugging
  page.on('console', msg =>
    console.log(`[Browser] ${msg.type()}: ${msg.text()}`)
  )

  try {
    // Inject state before the app loads by going to a blank page first,
    // setting localStorage, then navigating to the app.
    await page.goto('about:blank')

    // We need the origin to exist before setting localStorage.
    // Navigate to the app just enough to establish the origin.
    await page.goto(BASE_URL, { waitUntil: 'commit' })

    await page.evaluate(
      ({ saveKey, settingsKey, save, settings }) => {
        localStorage.setItem(saveKey, JSON.stringify(save))
        localStorage.setItem(settingsKey, JSON.stringify(settings))
        // Marker tells GameStateProvider to hydrate from localStorage on next mount
        localStorage.setItem('neurotoxic_inject_marker', 'true')
      },
      {
        saveKey: SAVE_KEY,
        settingsKey: GLOBAL_SETTINGS_KEY,
        save: saveState,
        settings: globalSettings
      }
    )

    // Now reload to let the game pick up the injected state
    await page.reload({ waitUntil: 'domcontentloaded' })
    // Attempt networkidle, but app may be functional even if it times out
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 })
    } catch (err) {
      // Only tolerate timeout; rethrow navigation/connection errors
      if (err.name === 'TimeoutError') {
        console.log('    (networkidle timed out, continuing)')
      } else {
        throw err
      }
    }

    // handleLoadGame forces OVERWORLD on hydration; switch to the fixture's
    // intended scene before waiting for its UI.
    await navigateToFixtureScene(page, fixtureName)

    // Wait for the scene to be ready
    await fixture.waitFor(page)
    // Let Framer Motion transitions settle (no condition to wait for — purely visual)
    await page.waitForTimeout(400)

    // Run any extra capture steps
    if (fixture.capture) {
      await fixture.capture(page)
    }

    const dest = outFile ?? `${OUT_DIR}/${fixtureName}.png`
    // Extended timeout (120s) for font loading and network-constrained environments
    await page.screenshot({ path: dest, timeout: 120000 })
    console.log(`✓ ${fixtureName} → ${dest}`)
  } finally {
    await browser.close()
  }
}

// ── Public API (importable from Playwright tests) ──────────────────────────

/**
 * Inject a named fixture save into the page's localStorage.
 * Call this AFTER page.goto() has established the origin, before your actual navigation.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} fixtureName  One of: menu | overworld | pregig | gig | postgig | gameover | clinic | band-hq | event-modal
 */
export async function injectSave(page, fixtureName) {
  const fixture = FIXTURES[fixtureName]
  if (!fixture) {
    throw new Error(
      `Unknown fixture "${fixtureName}". Available: ${Object.keys(FIXTURES).join(', ')}`
    )
  }
  const saveState = deepMerge(BASE_STATE, fixture.state ?? {})
  await page.evaluate(
    ({ saveKey, settingsKey, save, settings }) => {
      localStorage.setItem(saveKey, JSON.stringify(save))
      localStorage.setItem(settingsKey, JSON.stringify(settings))
      // Marker tells GameStateProvider to hydrate from localStorage on next mount
      localStorage.setItem('neurotoxic_inject_marker', 'true')
    },
    {
      saveKey: SAVE_KEY,
      settingsKey: GLOBAL_SETTINGS_KEY,
      save: saveState,
      settings: { tutorialSeen: true, crtEnabled: true }
    }
  )
}

/**
 * The scene a fixture intends to display (defaults to OVERWORLD).
 * @param {{ state?: { currentScene?: string } }} fixture
 * @returns {string}
 */
function fixtureScene(fixture) {
  return fixture.state?.currentScene ?? 'OVERWORLD'
}

/**
 * Navigate to a fixture's intended scene after injection.
 *
 * `handleLoadGame` always resets `currentScene` to OVERWORLD, so injected
 * POSTGIG/GAMEOVER/PREGIG/CLINIC/MENU states land on OVERWORLD. This switches to
 * the target scene via the DEV-only `window.gameState.changeScene()` API (exposed
 * only when `import.meta.env.DEV` — i.e. under `pnpm run dev`). No-op for OVERWORLD
 * fixtures and overworld overlays (e.g. event-modal) that render on OVERWORLD.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} fixtureName
 */
export async function navigateToFixtureScene(page, fixtureName) {
  const fixture = FIXTURES[fixtureName]
  if (!fixture) throw new Error(`Unknown fixture "${fixtureName}"`)
  const target = fixtureScene(fixture)
  if (target === 'OVERWORLD') return

  await page.waitForFunction(
    () => typeof window.gameState?.changeScene === 'function',
    { timeout: 10000 }
  )
  await page.evaluate(scene => {
    window.gameState.changeScene(scene)
  }, target)
}

/**
 * Wait for the scene matching the given fixture to be visible.
 * @param {import('@playwright/test').Page} page
 * @param {string} fixtureName
 */
export async function waitForFixtureScene(page, fixtureName) {
  const fixture = FIXTURES[fixtureName]
  if (!fixture) throw new Error(`Unknown fixture "${fixtureName}"`)
  await fixture.waitFor(page)
}

// ── CLI entry point ────────────────────────────────────────────────────────
// Guard against running when imported as a module (e.g., from screenshot-all-scenes.js)

import { fileURLToPath } from 'node:url'

const isMain = process.argv[1] === fileURLToPath(import.meta.url)

if (isMain) {
  const [, , fixtureName, outFile] = process.argv

  if (!fixtureName) {
    console.log('Usage: screenshot-state-inject.js <fixture> [outfile.png]')
    console.log('\nAvailable fixtures:')
    for (const [key, f] of Object.entries(FIXTURES)) {
      console.log(`  ${key.padEnd(16)} ${f.description}`)
    }
    process.exit(0)
  }

  injectAndCapture(fixtureName, outFile).catch(err => {
    console.error(err)
    process.exit(1)
  })
}
