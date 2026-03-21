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
const BASE_STATE = {
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
  reputationByRegion: {},
  npcs: {},
  unlocks: []
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
      currentGig: {
        venueId: 'goldgrube',
        venueName: 'Goldgrube',
        songId: null,
        setlist: [],
        capacity: 120,
        basePay: 80,
        nodeId: 'node_2_1'
      }
    },
    waitFor: async page => {
      try {
        return await page
          .getByRole('heading', { name: /preparation|pregig/i })
          .waitFor({ state: 'visible', timeout: 15000 })
      } catch {
        // Fallback: wait for gig modifier options (core pregig UI)
        return await page
          .getByRole('heading', { name: /modifier/i })
          .or(
            page
              .locator('button')
              .filter({ hasText: /soundcheck|promo/i })
              .first()
          )
          .waitFor({ state: 'visible', timeout: 2000 })
      }
    }
  },

  postgig: {
    description: 'Post-gig report screen after a successful gig',
    state: {
      currentScene: 'POSTGIG',
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
      }
    },
    waitFor: async page => {
      // Wait for POSTGIG scene to fully load (stats animation + render)
      // First, wait for the scene to transition (30s max)
      let found = false
      const startTime = Date.now()

      while (Date.now() - startTime < 10000 && !found) {
        try {
          // Try heading first
          const isHeading = await page
            .getByRole('heading', { name: /gig report|postgig/i })
            .isVisible({ timeout: 1000 })
            .catch(() => false)
          if (isHeading) return
        } catch {
          // Continue to next attempt
        }

        try {
          // Try finding any text with stats keywords
          const bodyText = await page.evaluate(() => document.body.innerText)
          if (
            bodyText.includes('Earnings') ||
            bodyText.includes('earnings') ||
            bodyText.includes('Crowd') ||
            bodyText.includes('crowd') ||
            bodyText.includes('Fame') ||
            bodyText.includes('fame')
          ) {
            return // Stats are visible
          }
        } catch {
          // Continue
        }

        await page.waitForTimeout(300)
      }

      // If we get here, stats haven't appeared in 10s but page is loaded
      // Just proceed anyway (better to get a partial screenshot than fail)
    }
  },

  gameover: {
    description: 'Game over screen (bankrupt)',
    state: {
      currentScene: 'GAMEOVER',
      player: { money: 0, fame: 0, day: 14 },
      band: { harmony: 1 }
    },
    waitFor: async page => {
      try {
        return await page
          .getByRole('heading', { name: /game over/i })
          .waitFor({ state: 'visible', timeout: 15000 })
      } catch {
        // Fallback: wait for gameover stats section
        return await page
          .locator('[class*="flex"]')
          .filter({ hasText: /bankruptcy|stats|day/i })
          .first()
          .waitFor({ state: 'visible', timeout: 2000 })
      }
    }
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
      try {
        // GIG scene has PixiJS canvas
        return await page
          .locator('canvas')
          .waitFor({ state: 'visible', timeout: 15000 })
      } catch {
        // Fallback: wait for gig UI overlay (fallback if canvas slow to render)
        return await page
          .getByRole('button', { name: /skip|continue|escape/i })
          .first()
          .waitFor({ state: 'visible', timeout: 2000 })
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
      await page.waitForTimeout(500)
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
      await page
        .getByRole('heading', { name: /band hq/i })
        .waitFor({ state: 'visible' })
      await page.waitForTimeout(300)
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

    // Wait for the scene to be ready
    await fixture.waitFor(page)
    await page.waitForTimeout(600) // let Framer Motion transitions settle

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
