#!/usr/bin/env node
/**
 * screenshot-comprehensive.js
 *
 * COMPREHENSIVE screenshot capture script for ALL Neurotoxic scenes, minigames, and overlays.
 *
 * This script combines:
 * 1. Natural game flow capture (INTRO → MENU → OVERWORLD → MINIGAMES → GIG → POSTGIG)
 * 2. State injection for hard-to-reach scenes (GAMEOVER, CLINIC, EVENT_MODAL)
 * 3. All minigame variants (Tourbus, Roadie Run, Kabelsalat, Amp Calibration)
 * 4. PixiJS canvas scenes
 * 5. UI overlays and modals
 *
 * Usage:
 *   node .claude/skills/playwright-screenshot/scripts/screenshot-comprehensive.js
 *
 * Options (env vars):
 *   BASE_URL=http://localhost:5173      App URL (default)
 *   OUT_DIR=screenshots/comprehensive   Output directory (default)
 *   SKIP_NATURAL_FLOW=false             Skip natural game flow
 *   SKIP_MINIGAMES=false                Skip minigame captures
 *   SKIP_STATE_INJECTION=false          Skip state injection scenes
 *
 * Expected output: 20+ PNG screenshots covering all scenes and minigames
 */

/* eslint-disable no-undef */
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { launchBrowserWithFallback } from './browser-launcher.js'
import { SCENES, FIXTURES, getFixture } from '../scenes.config.js'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const OUT_DIR = resolve(process.env.OUT_DIR ?? 'screenshots/comprehensive')
const SKIP_NATURAL_FLOW = process.env.SKIP_NATURAL_FLOW === 'true'
const SKIP_MINIGAMES = process.env.SKIP_MINIGAMES === 'true'
const SKIP_STATE_INJECTION = process.env.SKIP_STATE_INJECTION === 'true'

// ─────────────────────────────────────────────────────────────────────────
// STATE INJECTION (same as screenshot-state-inject.js)
// ─────────────────────────────────────────────────────────────────────────

const SAVE_KEY = 'neurotoxic_v3_save'
const GLOBAL_SETTINGS_KEY = 'neurotoxic_global_settings'

// Minimal base state (mirrors initialState.js shape)
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
    name: 'Test Band',
    members: [
      {
        id: 'matze',
        name: 'Matze',
        role: 'Guitar',
        mood: 70,
        stamina: 85,
        traits: [],
        relationships: { marius: 50, lars: 50 }
      },
      {
        id: 'marius',
        name: 'Marius',
        role: 'Bass',
        mood: 65,
        stamina: 90,
        traits: [],
        relationships: { matze: 50, lars: 50 }
      },
      {
        id: 'lars',
        name: 'Lars',
        role: 'Drums',
        mood: 75,
        stamina: 80,
        traits: [],
        relationships: { matze: 50, marius: 50 }
      }
    ],
    harmony: 50,
    energy: 80,
    reputation: { europe: 0, germany: 0, nightlife: 0, festival: 0 }
  },
  inventory: {
    items: [],
    songs: [
      {
        id: 'kranker-schrank',
        title: 'Kranker Schrank',
        learned: true,
        playCount: 3
      }
    ]
  },
  gigModifiers: {
    crowd: 'small',
    sound: 'normal',
    equipment: 'standard',
    audience: 'sober'
  },
  minigame: { active: false, type: null, targetDestination: null },
  currentGig: null,
  globalSettings: { language: 'en', crtEnabled: true }
}

/**
 * Inject save state and game settings into localStorage
 */
async function injectSave(page, fixture) {
  await page.evaluate(
    ({ saveKey, globalKey, baseState, fixtureData }) => {
      const state = JSON.parse(JSON.stringify(baseState))

      // Apply fixture overrides
      if (fixtureData.currentScene)
        state.currentScene = fixtureData.currentScene
      if (fixtureData.playerOverride)
        Object.assign(state.player, fixtureData.playerOverride)
      if (fixtureData.bandOverride)
        Object.assign(state.band, fixtureData.bandOverride)
      if (fixtureData.minigameData)
        Object.assign(state.minigame, fixtureData.minigameData)
      if (fixtureData.songId)
        state.currentGig = {
          songId: fixtureData.songId,
          venue: 'Test Venue',
          crowd: 50,
          baseScore: 100
        }

      // Store in localStorage
      window.localStorage.setItem(saveKey, JSON.stringify(state))
      window.localStorage.setItem(
        globalKey,
        JSON.stringify(state.globalSettings)
      )
    },
    {
      saveKey: SAVE_KEY,
      globalKey: GLOBAL_SETTINGS_KEY,
      baseState: BASE_STATE,
      fixtureData: fixture
    }
  )
}

// ─────────────────────────────────────────────────────────────────────────
// SCREENSHOT UTILITIES
// ─────────────────────────────────────────────────────────────────────────

let screenshotCount = 0

async function snap(page, name, opts = {}) {
  const { delay = 500, timeout = 60000, waitFor = null } = opts

  screenshotCount++
  const paddedNum = String(screenshotCount).padStart(2, '0')
  const filename = `${paddedNum}-${name}.png`
  const filepath = `${OUT_DIR}/${filename}`

  try {
    if (waitFor) {
      await waitFor(page)
    }

    await page.waitForTimeout(delay)
    await page.screenshot({ path: filepath, timeout })

    console.log(`  ✓ ${filename}`)
    return filepath
  } catch (error) {
    console.log(`  ✗ ${filename} (${error.message})`)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────
// SCENE NAVIGATION & CAPTURE
// ─────────────────────────────────────────────────────────────────────────

/**
 * Capture natural game flow (no state injection)
 */
async function captureNaturalFlow(page) {
  console.log('\n📍 PHASE 1: NATURAL GAME FLOW\n')

  // 01. INTRO
  console.log('→ INTRO')
  await page.goto(BASE_URL, { waitUntil: 'commit' })
  await snap(page, 'intro', { delay: 1000 })

  // 02. MENU (skip intro)
  console.log('→ MENU')
  try {
    const skipBtn = page.getByRole('button', { name: /skip/i })
    if (await skipBtn.isVisible().catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(800)
    }
  } catch (_e) {
    // continue
  }
  await page.waitForTimeout(500)
  await snap(page, 'menu', { delay: 800 })

  // 03. BAND IDENTITY (required before game)
  console.log('→ Band Identity Modal')
  try {
    const input = page.locator('input[type="text"]')
    const isVisible = await input.isVisible().catch(() => false)
    if (isVisible) {
      await input.fill('Test Band')
      const confirmBtn = page.getByRole('button', { name: /confirm/i })
      await confirmBtn.click()
      await input.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {})
    }
  } catch (_e) {
    // continue
  }

  // 04. CREDITS (from MENU)
  console.log('→ CREDITS')
  try {
    const creditsBtn = page.getByRole('button', { name: /credits/i })
    await creditsBtn.click({ timeout: 5000 })
    await snap(page, 'credits', { delay: 800 })
    const returnBtn = page.getByRole('button', { name: /return/i })
    await returnBtn.click()
    await page.waitForTimeout(600)
  } catch (_e) {
    console.log('    (skipped)')
  }

  // 05. BAND HQ MODAL (from MENU)
  console.log('→ BAND HQ Modal')
  try {
    const bandHqBtn = page.getByRole('button', { name: /band hq/i })
    await bandHqBtn.click({ timeout: 5000 })
    await snap(page, 'band-hq-modal', { delay: 800 })
    const leaveBtn = page.getByRole('button', { name: /leave|close/i })
    await leaveBtn.click()
    await page.waitForTimeout(600)
  } catch (_e) {
    console.log('    (skipped)')
  }

  // 06. OVERWORLD
  console.log('→ OVERWORLD')
  try {
    const startBtn = page.getByRole('button', { name: /start tour/i })
    await startBtn.click({ timeout: 5000 })
    await page
      .getByRole('heading', { name: /tour plan|overworld/i })
      .waitFor({ timeout: 5000 })
    await snap(page, 'overworld', { delay: 1200 })
  } catch (_e) {
    console.log('    (skipped)')
    return // Can't continue without OVERWORLD
  }

  // 07. PREGIG
  console.log('→ PREGIG')
  try {
    // Try to select a node and start travel
    const nodes = page.getByRole('button', {
      name: /Travel to (Goldgrube|MTC|Die Distille|Stadtfest|Deichbrand|Wacken)/i
    })
    const nodeVisible = await nodes
      .first()
      .waitFor({ state: 'visible', timeout: 2000 })
      .then(() => true)
      .catch(() => false)

    if (nodeVisible) {
      await nodes.first().click()
      await page.waitForTimeout(300)

      // Start travel (confirm)
      await nodes.first().click()
      await page.waitForTimeout(500)

      // Wait for TRAVEL_MINIGAME canvas
      const canvasVisible = await page
        .locator('canvas')
        .waitFor({ timeout: 5000 })
        .then(() => true)
        .catch(() => false)

      if (canvasVisible && !SKIP_MINIGAMES) {
        // We're in travel minigame, skip it
        await page.keyboard.press('Shift+P')
        await page
          .locator('canvas')
          .waitFor({ state: 'hidden', timeout: 3000 })
          .catch(() => {})
        await page.waitForTimeout(800)
      }
    }

    // Now wait for PREGIG
    await page
      .getByRole('heading', { name: /preparation|modifier/i })
      .waitFor({ timeout: 5000 })
    await snap(page, 'pregig', { delay: 1200 })
  } catch (_e) {
    console.log(`    (skipped: ${_e.message})`)
  }

  // 08. PRE_GIQ_MINIGAME
  console.log('→ PRE_GIQ MINIGAME')
  try {
    const startBtn = page.getByRole('button', { name: /start show/i })
    const visible = await startBtn
      .waitFor({ state: 'visible', timeout: 2000 })
      .then(() => true)
      .catch(() => false)
    if (visible) {
      await startBtn.click()
      await page.locator('canvas').waitFor({ timeout: 15000 })
      await snap(page, 'pre-gig-minigame', { delay: 1500 })
      // Skip minigame
      await page.keyboard.press('Shift+P')
      await page
        .locator('canvas')
        .waitFor({ state: 'hidden', timeout: 3000 })
        .catch(() => {})
    }
  } catch (_e) {
    console.log(`    (skipped: ${_e.message})`)
  }

  // 09. GIG (PixiJS canvas)
  console.log('→ GIG Scene')
  try {
    await page.locator('canvas').waitFor({ timeout: 15000 })
    await snap(page, 'gig-scene', { delay: 2000 })
    // Skip gig
    await page.keyboard.press('Shift+P')
    await page
      .locator('canvas')
      .waitFor({ state: 'hidden', timeout: 3000 })
      .catch(() => {})
  } catch (_e) {
    console.log(`    (skipped: ${_e.message})`)
  }

  // 10. POSTGIG
  console.log('→ POSTGIG')
  try {
    await page
      .getByRole('heading', { name: /gig report/i })
      .waitFor({ timeout: 5000 })
    await snap(page, 'postgig', { delay: 1000 })
  } catch (_e) {
    console.log(`    (skipped: ${_e.message})`)
  }
}

/**
 * Capture minigame variants via state injection
 */
async function captureMinigames(page) {
  console.log('\n📍 PHASE 2: MINIGAME VARIANTS\n')

  const minigames = [
    {
      key: 'travel-minigame',
      name: 'TRAVEL_MINIGAME (Tourbus)'
    },
    {
      key: 'pre-gig-minigame-roadie',
      name: 'PRE_GIQ_MINIGAME (Roadie Run)'
    },
    {
      key: 'pre-gig-minigame-kabelsalat',
      name: 'PRE_GIQ_MINIGAME (Kabelsalat)'
    },
    {
      key: 'pre-gig-minigame-amp',
      name: 'PRE_GIQ_MINIGAME (Amp Calibration)'
    },
    {
      key: 'gig',
      name: 'GIG Scene'
    }
  ]

  for (const { key, name } of minigames) {
    console.log(`→ ${name}`)
    try {
      const fixture = getFixture(key)
      if (!fixture) {
        console.log(`    (fixture '${key}' not found)`)
        continue
      }

      // Inject state
      await page.goto(BASE_URL, { waitUntil: 'commit' })
      await injectSave(page, fixture)
      await page.reload({ waitUntil: 'commit', timeout: 30000 })
      await page.waitForTimeout(1000)

      // All minigames and gig use canvas
      const canvasVisible = await page
        .locator('canvas')
        .waitFor({ timeout: 10000 })
        .then(() => true)
        .catch(() => false)

      if (canvasVisible) {
        await snap(page, key, { delay: 1500 })
      } else {
        console.log(`    (canvas not visible)`)
      }
    } catch (err) {
      console.log(`    (failed: ${err.message})`)
    }
  }
}

/**
 * Capture scenes via state injection (hard-to-reach scenes)
 */
async function captureStateInjected(page) {
  console.log('\n📍 PHASE 3: STATE INJECTION SCENES\n')

  const fixturesToCapture = [
    { key: 'overworld', name: 'Overworld (injected)' },
    { key: 'pregig', name: 'PreGig (injected)' },
    { key: 'postgig', name: 'PostGig (injected)' },
    { key: 'gameover', name: 'GameOver' },
    { key: 'clinic', name: 'Clinic' },
    { key: 'event-modal', name: 'Event Modal (Overworld)' }
  ]

  for (const { key, name } of fixturesToCapture) {
    console.log(`→ ${name}`)
    try {
      const fixture = getFixture(key)
      if (!fixture) {
        console.log(`    (fixture '${key}' not found)`)
        continue
      }

      await page.goto(BASE_URL, { waitUntil: 'commit' })
      await injectSave(page, fixture)
      await page.reload({ waitUntil: 'commit', timeout: 30000 })

      // Scene-specific wait strategies
      let waited = false

      if (key === 'event-modal') {
        try {
          await page.getByRole('dialog').waitFor({ timeout: 3000 })
          waited = true
        } catch (_e) {
          console.log(`    (dialog not found)`)
        }
      } else if (key === 'overworld') {
        try {
          await page
            .getByRole('heading', { name: /tour plan|overworld/i })
            .waitFor({ timeout: 3000 })
          waited = true
        } catch (_e) {
          await page
            .locator('svg')
            .first()
            .waitFor({ timeout: 3000 })
            .catch(() => {})
          waited = true
        }
      } else {
        await page.waitForTimeout(800)
        waited = true
      }

      if (waited) {
        await snap(page, key, { delay: 600 })
      }
    } catch (err) {
      console.log(`    (failed: ${err.message})`)
    }
  }
}

/**
 * Capture additional UI overlays and states
 */
async function captureUIOverlays(page) {
  console.log('\n📍 PHASE 4: UI OVERLAYS & SPECIAL STATES\n')

  console.log('→ Band HQ Full + Tabs')
  try {
    await page.goto(BASE_URL, { waitUntil: 'commit' })
    await page.waitForTimeout(800)

    const skipBtn = page.getByRole('button', { name: /skip/i })
    const skipVisible = await skipBtn.isVisible().catch(() => false)
    if (skipVisible) {
      await skipBtn.click()
      await page.waitForTimeout(800)
    }

    const bandHqBtn = page.getByRole('button', { name: /band hq/i })
    const btnVisible = await bandHqBtn
      .isVisible({ timeout: 3000 })
      .catch(() => false)
    if (btnVisible) {
      await bandHqBtn.click()
      await page.waitForTimeout(600)
      await snap(page, 'band-hq-full', { delay: 400 })

      // Settings tab
      const settingsTab = page.getByRole('tab', {
        name: /settings|gear|cog/i
      })
      const settingsVisible = await settingsTab.isVisible().catch(() => false)
      if (settingsVisible) {
        await settingsTab.click()
        await page.waitForTimeout(400)
        await snap(page, 'band-hq-settings', { delay: 300 })
      }

      // Characters tab
      const charactersTab = page.getByRole('tab', {
        name: /character|member|band/i
      })
      const charVisible = await charactersTab.isVisible().catch(() => false)
      if (charVisible) {
        await charactersTab.click()
        await page.waitForTimeout(400)
        await snap(page, 'band-hq-characters', { delay: 300 })
      }

      const closeBtn = page.getByRole('button', {
        name: /close|leave|back|esc/i
      })
      const closeVisible = await closeBtn.isVisible().catch(() => false)
      if (closeVisible) {
        await closeBtn.click()
      }
    }
  } catch (err) {
    console.log(`    (skipped: ${err.message})`)
  }
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  console.log('🎬 COMPREHENSIVE Neurotoxic Screenshot Capture\n')
  console.log(`📁 Output: ${OUT_DIR}\n`)
  console.log(
    `Settings: Skip Natural=${SKIP_NATURAL_FLOW} | Skip Minigames=${SKIP_MINIGAMES} | Skip Injection=${SKIP_STATE_INJECTION}\n`
  )

  const browser = await launchBrowserWithFallback({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--mute-audio',
      '--disable-webgl'
    ]
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  })

  const page = await context.newPage()

  try {
    if (!SKIP_NATURAL_FLOW) {
      await captureNaturalFlow(page)
    }

    if (!SKIP_MINIGAMES) {
      await captureMinigames(page)
    }

    if (!SKIP_STATE_INJECTION) {
      await captureStateInjected(page)
      await captureUIOverlays(page)
    }

    console.log(`\n✅ Comprehensive capture complete!`)
    console.log(`\n📊 Total screenshots: ${screenshotCount}`)
    console.log(`📁 Saved to: ${OUT_DIR}\n`)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

main()
