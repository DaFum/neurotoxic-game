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
  gigEventScoreDelta: 0,
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
  rngSeed: 12345,
  runSeed: 12345,
  // Roguelite Expedition: fixtures start outside a run. Mirrors
  // createDefaultExpeditionState(); no seed of its own (runSeed above owns it).
  expedition: {
    status: 'idle',
    prep: null,
    runId: null,
    routeStep: 0,
    visitedNodeIds: [],
    intelByNodeId: {},
    intelGrants: [],
    scoutReconUsedRouteSteps: [],
    loadout: null,
    startingMoney: 0,
    startingFame: 0,
    protectedCareerCash: 0,
    rewardLedger: [],
    extractionWindowsSeen: [],
    pendingFailure: null,
    outcome: null
  }
}

// ── Per-fixture overrides ──────────────────────────────────────────────────
// Each fixture describes:
//   state:   deep-merged into BASE_STATE (only overridden keys needed)
//   waitFor: Playwright locator expression evaluated after page load
//   capture: optional extra steps before screenshot (async function receiving page)
// Exported so `playwright-screenshot-fixture-validation.test.js` can push each
// fixture through the real `handleLoadGame` + sanitizers. Without that, a
// fixture field the sanitizers do not whitelist is dropped silently and the
// capture succeeds showing the wrong thing.
export const FIXTURES = {
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
      pendingEvents: []
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
    }
  },

  postgig: {
    description: 'Post-gig report screen after a successful gig',
    state: {
      currentScene: 'POSTGIG',
      // Real Venue shape (src/types/map.d.ts): id/name/capacity/pay, not
      // venueId/venueName — sanitizeVenue nulls venues without a string id/name.
      currentGig: {
        id: 'goldgrube',
        name: 'Goldgrube',
        capacity: 120,
        pay: 80,
        difficulty: 2,
        songId: '01 Kranker Schrank'
      },
      // Only the keys `sanitizeLastGigStats` whitelists survive a load. The
      // previous shape (venueName/earnings/crowdScore/…) matched none of them,
      // so the whole object sanitised to null, `deriveFinancials` bailed on
      // `!lastGigStats`, and POSTGIG rendered its "TALLYING RECEIPTS…" shell.
      lastGigStats: {
        score: 8400,
        accuracy: 87,
        misses: 12,
        combo: 12,
        maxCombo: 64,
        health: 78
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

  // ── Minigames ────────────────────────────────────────────────────────────
  // `scenes.config.js` described these long before they were runnable; the
  // capture logic lived in screenshot-comprehensive-full.js with its own copy
  // of the save state, so it drifted from the schema and was never covered by
  // the BASE_STATE validation test. Now they go through the same engine as
  // every other fixture and get the same scene verification.
  'travel-minigame': {
    description: 'Tourbus Terror travel minigame (canvas)',
    state: {
      currentScene: 'TRAVEL_MINIGAME',
      minigame: {
        active: true,
        type: 'TOURBUS',
        targetDestination: 'node_0_1',
        gigId: null,
        equipmentRemaining: 3,
        accumulatedDamage: 0,
        score: 0
      }
    },
    waitFor: async page =>
      page
        .locator('canvas')
        .first()
        .waitFor({ state: 'visible', timeout: 15000 })
  },

  'pre-gig-minigame-roadie': {
    description: 'Roadie Run pre-gig minigame (canvas)',
    state: {
      currentScene: 'PRE_GIG_MINIGAME',
      minigame: {
        active: true,
        type: 'ROADIE',
        targetDestination: null,
        gigId: 'goldgrube',
        equipmentRemaining: 3,
        accumulatedDamage: 0,
        score: 0
      }
    },
    waitFor: async page =>
      page
        .locator('canvas')
        .first()
        .waitFor({ state: 'visible', timeout: 15000 })
  },

  'pre-gig-minigame-kabelsalat': {
    description: 'Kabelsalat pre-gig minigame (DOM board, no canvas)',
    state: {
      currentScene: 'PRE_GIG_MINIGAME',
      minigame: {
        active: true,
        type: 'KABELSALAT',
        targetDestination: null,
        gigId: 'goldgrube',
        equipmentRemaining: 3,
        accumulatedDamage: 0,
        score: 0
      }
    },
    // Kabelsalat renders a DOM board, not a canvas, so the shared canvas wait
    // does not apply. `minigames.kabelsalat.title` is HARDWARE_RIGGING in both
    // locales, so the text anchor is safe here.
    waitFor: async page => {
      await page
        .getByRole('heading', { name: /hardware_rigging/i })
        .first()
        .waitFor({ state: 'visible', timeout: 15000 })
    }
  },

  'pre-gig-minigame-amp': {
    description: 'Amp Calibration pre-gig minigame (canvas)',
    state: {
      currentScene: 'PRE_GIG_MINIGAME',
      minigame: {
        active: true,
        type: 'AMP_CALIBRATION',
        targetDestination: null,
        gigId: 'goldgrube',
        equipmentRemaining: 3,
        accumulatedDamage: 0,
        score: 0
      }
    },
    waitFor: async page =>
      page
        .locator('canvas')
        .first()
        .waitFor({ state: 'visible', timeout: 15000 })
  },

  gig: {
    description: 'GIG scene with PixiJS canvas',
    state: {
      currentScene: 'GIG',
      // Real Venue shape (src/types/map.d.ts): id/name/capacity/pay, not
      // venueId/venueName — sanitizeVenue nulls venues without a string id/name,
      // which would bounce GIG straight back to OVERWORLD.
      currentGig: {
        id: 'goldgrube',
        name: 'Goldgrube',
        capacity: 120,
        pay: 80,
        difficulty: 2,
        songId: '01 Kranker Schrank'
      },
      setlist: ['01 Kranker Schrank']
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

  'band-hq-settings': {
    description: 'Band HQ with the Settings tab open',
    state: { currentScene: 'MENU' },
    waitFor: async page =>
      page
        .getByRole('heading', { name: /neurotoxic/i })
        .waitFor({ state: 'visible', timeout: 10000 }),
    // The only coverage screenshot-comprehensive.js had that this engine
    // lacked. Kept when that script was removed.
    capture: async page => {
      await page.getByRole('button', { name: /band hq/i }).click()
      await page
        .getByRole('heading', { name: /band hq/i })
        .waitFor({ state: 'visible', timeout: 5000 })
      const settingsTab = page
        .getByRole('tab', { name: /settings|einstellungen/i })
        .first()
      await settingsTab.click()
      // Waiting for the tab to be *visible* proved nothing: it was already
      // visible before the click, so the wait resolved even if the click did
      // not switch panels. `aria-selected` is set from the active tab id and
      // is locale-independent, unlike the panel's headings.
      await settingsTab.and(page.locator('[aria-selected="true"]')).waitFor({
        state: 'visible',
        timeout: 5000
      })
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

// Exported for the fixture validation test, so it exercises this merge rather
// than a re-declared copy of it.
export function deepMerge(base, override) {
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

    // Shared with every other runner: waitFor, the capture hook, and the
    // integrity checks. Keeping a second copy here is how the mobile runner
    // drifted out of sync in the first place.
    await prepareFixtureCapture(page, fixtureName)

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

/** Effective opacity a scene must reach before it is worth photographing. */
const OPAQUE_ENOUGH = 0.9

/**
 * Compute how opaque the most-visible on-screen content is, 0..1.
 *
 * Playwright treats `opacity: 0` as visible, so `waitFor({ state: 'visible' })`
 * on a Framer Motion panel resolves while it is still transparent — which
 * produced screenshots that passed every check and were solid black.
 *
 * Only what the camera would actually record counts:
 * - rects are clipped to the viewport, since a screenshot records the viewport
 *   and off-screen text says nothing about what was captured
 * - `visibility: hidden` anywhere up the chain disqualifies an element, which
 *   opacity alone does not catch
 * - global `role="status"` overlays (chatter, toasts) are excluded: they render
 *   on every scene, so counting them would call a blank scene photographable
 *
 * Canvas scenes are measured by their canvas, not by text: the minigames and
 * GIG draw into a canvas and only incidentally have HUD text near it, so a
 * text-only probe would call a perfectly rendered canvas blank.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<number>} Best effective opacity found.
 */
const measureOpacity = page =>
  page.evaluate(() => {
    const effectiveOpacity = el => {
      let opacity = 1
      for (let node = el; node; node = node.parentElement) {
        const style = getComputedStyle(node)
        if (style.visibility === 'hidden' || style.display === 'none') return 0
        const value = Number.parseFloat(style.opacity)
        if (Number.isFinite(value)) opacity *= value
      }
      return opacity
    }

    // Area of the element that actually falls inside the captured viewport.
    const visibleArea = rect => {
      const width = Math.min(rect.right, innerWidth) - Math.max(rect.left, 0)
      const height = Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0)
      return width > 0 && height > 0 ? width * height : 0
    }

    let best = 0

    for (const canvas of document.querySelectorAll('canvas')) {
      if (visibleArea(canvas.getBoundingClientRect()) > 10000) {
        best = Math.max(best, effectiveOpacity(canvas))
      }
    }

    const overlays = [...document.querySelectorAll('[role="status"]')]
    for (const el of document.querySelectorAll('h1,h2,h3,h4,p,span,button')) {
      const text = (el.textContent ?? '').trim()
      if (!text || el.children.length > 0) continue
      if (overlays.some(overlay => overlay.contains(el))) continue
      if (visibleArea(el.getBoundingClientRect()) < 200) continue
      best = Math.max(best, effectiveOpacity(el))
    }

    return best
  })

/**
 * Poll until the scene is opaque enough to photograph.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} [timeout] - Milliseconds to wait for the fade to finish.
 * @returns {Promise<number>} The effective opacity reached.
 */
async function waitForOpaqueRender(page, timeout = 20000) {
  const deadline = Date.now() + timeout
  let opacity = await measureOpacity(page)
  while (opacity < OPAQUE_ENOUGH && Date.now() < deadline) {
    await page.waitForTimeout(200)
    opacity = await measureOpacity(page)
  }
  return opacity
}

/** Fixtures whose whole point is a dialog on top of the scene. */
const FIXTURES_EXPECTING_DIALOG = new Set([
  'band-hq',
  'band-hq-settings',
  'event-modal'
])

/**
 * Fail loudly when the page is not actually showing the fixture's scene.
 *
 * A fixture's `waitFor` anchors on text, which passes even when the scene is
 * covered: Playwright counts an element laid out behind a full-screen overlay
 * as visible. POSTGIG in particular rolls a random event on entry, so the
 * capture silently returned an event modal filed under `postgig.png`. Scene
 * identity is read from `window.gameState.currentScene` instead of copy, so it
 * survives i18n and reworded headings.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} fixtureName
 * @throws {Error} When the wrong scene rendered, or an unexpected dialog covers it.
 */
async function assertCaptureIntegrity(page, fixtureName) {
  const expected = fixtureScene(FIXTURES[fixtureName])
  const actual = await page.evaluate(
    () => window.gameState?.currentScene ?? null
  )

  if (actual !== expected) {
    throw new Error(
      `Fixture "${fixtureName}" expected scene ${expected} but the app is on ` +
        `${actual ?? 'an unknown scene'}. Refusing to write a mislabelled screenshot.`
    )
  }

  // Three pre-gig minigames share PRE_GIG_MINIGAME, so the scene alone cannot
  // tell them apart — a mixed-up type would pass the check above unnoticed.
  const expectedMinigame = FIXTURES[fixtureName].state?.minigame?.type ?? null
  if (expectedMinigame !== null) {
    const actualMinigame = await page.evaluate(
      () => window.gameState?.minigame?.type ?? null
    )
    if (actualMinigame !== expectedMinigame) {
      throw new Error(
        `Fixture "${fixtureName}" expected minigame ${expectedMinigame} but ` +
          `${actualMinigame ?? 'none'} is active.`
      )
    }
  }

  const opacity = await waitForOpaqueRender(page)
  if (opacity < OPAQUE_ENOUGH) {
    throw new Error(
      `Fixture "${fixtureName}" rendered ${expected} but nothing is opaque ` +
        `enough to photograph (best effective opacity ${opacity.toFixed(2)}). ` +
        `The screenshot would be blank.`
    )
  }

  // Geometry alone would repeat the bug the opacity probe exists to fix: a
  // dialog mid-exit is still mounted at `opacity: 0` and would be reported as
  // covering the scene, while a dialog fixture would accept a fully
  // transparent one. Apply the same effective-opacity rule to both directions.
  const dialog = await page.evaluate(() => {
    for (const el of document.querySelectorAll('[role="dialog"]')) {
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) continue
      let opacity = 1
      for (let node = el; node; node = node.parentElement) {
        const style = getComputedStyle(node)
        if (style.visibility === 'hidden' || style.display === 'none') {
          opacity = 0
          break
        }
        const value = Number.parseFloat(style.opacity)
        if (Number.isFinite(value)) opacity *= value
      }
      if (opacity > 0.5) return (el.textContent ?? '').trim().slice(0, 80)
    }
    return null
  })

  // Fixtures that exist to show a dialog must actually have one. Several
  // `waitFor` handlers fall back to the underlying scene when the dialog is
  // slow (`event-modal` falls back to the OVERWORLD heading), and since that
  // is also its target scene, both checks above pass — so skipping this one
  // let a plain Overworld image be written as event-modal.png, which is the
  // exact failure this function exists to stop.
  if (FIXTURES_EXPECTING_DIALOG.has(fixtureName)) {
    if (dialog === null) {
      throw new Error(
        `Fixture "${fixtureName}" is supposed to show a dialog, but none is ` +
          `visible — its waitFor most likely fell back to the bare scene. ` +
          `Refusing to write a screenshot without the overlay.`
      )
    }
    return
  }

  if (dialog !== null) {
    throw new Error(
      `Fixture "${fixtureName}" rendered ${expected}, but a dialog covers it: ` +
        `"${dialog}". The scene is obscured, so the screenshot would not show ` +
        `${expected}. Neutralise the dialog in the fixture state or add the ` +
        `fixture to FIXTURES_EXPECTING_DIALOG if the overlay is intended.`
    )
  }
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

  // waitForFunction signature is (pageFunction, arg?, options?); the options
  // object must be the THIRD argument. Passing it as the second makes it the
  // page-function arg and the timeout is ignored — the wait would then hang if
  // window.gameState is never exposed (e.g. a non-DEV preview/prod build).
  await page.waitForFunction(
    () => typeof window.gameState?.changeScene === 'function',
    undefined,
    { timeout: 10000 }
  )
  // PreGig and PostGig roll a random event when their scene mounts, which used
  // to drop an unrelated modal over the captured scene. `isScreenshotMode` is
  // runtime-only (handleLoadGame resets it), so it has to be set here rather
  // than injected with the save.
  await page.evaluate(() => {
    window.gameState.setScreenshotMode?.(true)
  })

  await page.evaluate(scene => {
    window.gameState.changeScene(scene)
  }, target)
}

/**
 * Wait for the scene matching the given fixture to be visible.
 *
 * @remarks
 * Waiting only. It runs neither the fixture's `capture` hook nor the integrity
 * checks, so a `waitFor` that falls back to the underlying scene will pass
 * here. Prefer {@link prepareFixtureCapture} for anything that then takes a
 * screenshot; reach for this only when you need the wait on its own.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} fixtureName
 */
export async function waitForFixtureScene(page, fixtureName) {
  const fixture = FIXTURES[fixtureName]
  if (!fixture) throw new Error(`Unknown fixture "${fixtureName}"`)
  await fixture.waitFor(page)
}

/**
 * Every fixture name, in declaration order.
 *
 * @remarks
 * Consumers must derive their fixture list from this instead of keeping their
 * own copy — `screenshot-mobile.js` used to hold a hardcoded nine, so newly
 * added fixtures were silently missing from its default run.
 *
 * @returns {string[]} The fixture keys this module knows about.
 */
export const getFixtureNames = () => Object.keys(FIXTURES)

/**
 * Run a fixture's post-navigation steps and verify what rendered.
 *
 * Wraps `waitFor`, the optional `capture` hook, and the integrity checks so
 * every consumer gets identical behaviour. Skipping the `capture` hook is how
 * a viewport-specific runner ends up photographing the menu for a fixture
 * whose whole point is the panel that hook opens.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} fixtureName
 */
export async function prepareFixtureCapture(page, fixtureName) {
  const fixture = FIXTURES[fixtureName]
  if (!fixture) throw new Error(`Unknown fixture "${fixtureName}"`)
  await fixture.waitFor(page)
  if (fixture.capture) await fixture.capture(page)
  await assertCaptureIntegrity(page, fixtureName)
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
