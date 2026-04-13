#!/usr/bin/env node
/**
 * screenshot-comprehensive.js
 *
 * COMPREHENSIVE screenshot capture script for ALL Neurotoxic scenes, minigames, and overlays.
 *
 * CRITICAL FIX: Added neurotoxic_inject_marker flag for state injection to work.
 * Without this flag, injected state is ignored and app defaults to INTRO.
 * Reference: GameState.jsx line 182-186
 *
 * Usage:
 *   node .claude/skills/playwright-screenshot/scripts/screenshot-comprehensive.js
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

// State injection keys
const SAVE_KEY = 'neurotoxic_v3_save'
const GLOBAL_SETTINGS_KEY = 'neurotoxic_global_settings'
const INJECT_MARKER = 'neurotoxic_inject_marker'

// Base state for fixtures
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
    tutorialStep: 99,
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
 * Inject save state into localStorage with critical INJECT_MARKER flag
 */
async function injectSave(page, fixture) {
  await page.evaluate(
    ({ saveKey, globalKey, markerKey, baseState, fixtureData }) => {
      const state = JSON.parse(JSON.stringify(baseState))

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

      window.localStorage.setItem(saveKey, JSON.stringify(state))
      window.localStorage.setItem(
        globalKey,
        JSON.stringify(state.globalSettings)
      )
      // CRITICAL: Without this flag, app ignores the injected state
      window.localStorage.setItem(markerKey, 'true')
    },
    {
      saveKey: SAVE_KEY,
      globalKey: GLOBAL_SETTINGS_KEY,
      markerKey: INJECT_MARKER,
      baseState: BASE_STATE,
      fixtureData: fixture
    }
  )
}

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

async function captureStateInjected(page) {
  console.log('\n📍 PHASE: STATE INJECTION SCENES\n')

  const fixturesToCapture = [
    { key: 'menu', name: 'MENU' },
    { key: 'overworld', name: 'Overworld' },
    { key: 'pregig', name: 'PreGig' },
    { key: 'postgig', name: 'PostGig' },
    { key: 'gameover', name: 'GameOver' },
    { key: 'clinic', name: 'Clinic' }
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
      await page.waitForTimeout(1000)

      // Scene-specific detection
      let waited = false

      if (key === 'menu') {
        try {
          await page
            .getByRole('heading', { name: /neurotoxic/i })
            .waitFor({ timeout: 3000 })
          waited = true
        } catch (_e) {
          // fallback
          await page.waitForTimeout(500)
          waited = true
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
            .waitFor({ timeout: 2000 })
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

async function captureUIOverlays(page) {
  console.log('\n📍 PHASE: UI OVERLAYS\n')

  console.log('→ Band HQ Modal')
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

      const settingsTab = page.getByRole('tab', {
        name: /settings|gear|cog/i
      })
      const settingsVisible = await settingsTab.isVisible().catch(() => false)
      if (settingsVisible) {
        await settingsTab.click()
        await page.waitForTimeout(400)
        await snap(page, 'band-hq-settings', { delay: 300 })
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

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  console.log('🎬 COMPREHENSIVE Neurotoxic Screenshot Capture\n')
  console.log(`📁 Output: ${OUT_DIR}\n`)
  console.log('✅ CRITICAL FIX: Added neurotoxic_inject_marker flag\n')

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
