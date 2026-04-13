#!/usr/bin/env node
/**
 * screenshot-comprehensive-full.js
 *
 * COMPLETE screenshot capture for ALL Neurotoxic scenes including minigames and modals.
 *
 * Captures:
 * - Core scenes (MENU, OVERWORLD, PREGIG, POSTGIG, GAMEOVER, CLINIC)
 * - All minigame variants (TRAVEL_MINIGAME, PRE_GIQ_MINIGAME x3, GIQ)
 * - UI overlays (BAND HQ tabs, EVENT_MODAL)
 * - Special states
 *
 * CRITICAL: Uses neurotoxic_inject_marker flag for state injection.
 */

/* eslint-disable no-undef */
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { launchBrowserWithFallback } from './browser-launcher.js'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const OUT_DIR = resolve(process.env.OUT_DIR ?? 'screenshots/comprehensive')

// State injection keys
const SAVE_KEY = 'neurotoxic_v3_save'
const GLOBAL_SETTINGS_KEY = 'neurotoxic_global_settings'
const INJECT_MARKER = 'neurotoxic_inject_marker'

// Base state
const BASE_STATE = {
  version: 2,
  currentScene: 'MENU',
  player: {
    playerId: 'fixture-player',
    playerName: 'FIXTURE',
    money: 5000,
    day: 5,
    time: 14,
    location: 'stendal',
    currentNodeId: 'node_0_0',
    lastGigNodeId: null,
    tutorialStep: 99,
    score: 2500,
    fame: 500,
    fameLevel: 2,
    eventsTriggeredToday: 0,
    totalTravels: 3,
    hqUpgrades: [],
    clinicVisits: 0,
    van: { fuel: 80, condition: 75, upgrades: [], breakdownChance: 0.05 },
    passiveFollowers: 10,
    stats: {
      totalDistance: 250,
      conflictsResolved: 0,
      stageDives: 2,
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
        mood: 75,
        stamina: 85,
        traits: [],
        relationships: { marius: 60, lars: 70 }
      },
      {
        id: 'marius',
        name: 'Marius',
        role: 'Bass',
        mood: 70,
        stamina: 90,
        traits: [],
        relationships: { matze: 60, lars: 65 }
      },
      {
        id: 'lars',
        name: 'Lars',
        role: 'Drums',
        mood: 80,
        stamina: 85,
        traits: [],
        relationships: { matze: 70, marius: 65 }
      }
    ],
    harmony: 65,
    energy: 85,
    reputation: { europe: 150, germany: 200, nightlife: 100, festival: 120 }
  },
  inventory: {
    items: [],
    songs: [
      {
        id: 'kranker-schrank',
        title: 'Kranker Schrank',
        learned: true,
        playCount: 5
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
  currentGig: {
    songId: 'kranker-schrank',
    venue: 'Goldgrube',
    crowd: 75,
    baseScore: 500
  },
  lastGigStats: {
    score: 2500,
    misses: 5,
    perfectHits: 95,
    maxCombo: 45,
    peakHype: 85,
    toxicTimeTotal: 180,
    accuracy: 95,
    songStats: []
  },
  globalSettings: { language: 'en', crtEnabled: true }
}

async function injectSave(page, sceneConfig) {
  await page.evaluate(
    ({ saveKey, globalKey, markerKey, baseState, sceneConfig }) => {
      const state = JSON.parse(JSON.stringify(baseState))

      // Apply scene-specific config
      if (sceneConfig.currentScene)
        state.currentScene = sceneConfig.currentScene
      if (sceneConfig.playerOverride)
        Object.assign(state.player, sceneConfig.playerOverride)
      if (sceneConfig.bandOverride)
        Object.assign(state.band, sceneConfig.bandOverride)
      if (sceneConfig.minigameConfig) {
        state.minigame = {
          ...state.minigame,
          ...sceneConfig.minigameConfig
        }
      }
      if (sceneConfig.currentGig) {
        state.currentGig = sceneConfig.currentGig
      }
      if (sceneConfig.lastGigStats) {
        state.lastGigStats = sceneConfig.lastGigStats
      }

      window.localStorage.setItem(saveKey, JSON.stringify(state))
      window.localStorage.setItem(
        globalKey,
        JSON.stringify(state.globalSettings)
      )
      window.localStorage.setItem(markerKey, 'true')
    },
    {
      saveKey: SAVE_KEY,
      globalKey: GLOBAL_SETTINGS_KEY,
      markerKey: INJECT_MARKER,
      baseState: BASE_STATE,
      sceneConfig
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

async function captureCore(page) {
  console.log('\n📍 CORE SCENES\n')

  const scenes = [
    {
      name: 'menu',
      config: { currentScene: 'MENU' },
      wait: p =>
        p
          .getByRole('heading', { name: /neurotoxic/i })
          .waitFor({ timeout: 3000 })
    },
    {
      name: 'overworld',
      config: { currentScene: 'OVERWORLD' },
      wait: p =>
        p
          .getByRole('heading', { name: /tour plan/i })
          .waitFor({ timeout: 3000 })
          .catch(() => p.locator('svg').first().waitFor({ timeout: 2000 }))
    },
    {
      name: 'pregig',
      config: { currentScene: 'PREGIG' },
      wait: p =>
        p
          .getByRole('heading', { name: /preparation/i })
          .waitFor({ timeout: 3000 })
    },
    {
      name: 'postgig',
      config: {
        currentScene: 'POSTGIG',
        currentGig: {
          songId: 'kranker-schrank',
          venue: 'Goldgrube',
          crowd: 75,
          baseScore: 500
        },
        lastGigStats: {
          score: 2500,
          misses: 5,
          perfectHits: 95,
          maxCombo: 45,
          peakHype: 85,
          toxicTimeTotal: 180,
          accuracy: 95,
          songStats: []
        }
      },
      wait: p =>
        p
          .getByRole('heading', { name: /gig report|report/i })
          .waitFor({ timeout: 3000 })
    },
    {
      name: 'gameover',
      config: {
        currentScene: 'GAMEOVER',
        playerOverride: { money: -100, fame: 50, day: 30 }
      },
      wait: p =>
        p
          .getByRole('heading', { name: /sold out|game over/i })
          .waitFor({ timeout: 3000 })
          .catch(() => p.locator('h1').waitFor({ timeout: 2000 }))
    },
    {
      name: 'clinic',
      config: { currentScene: 'CLINIC' },
      wait: p => p.waitForTimeout(800)
    }
  ]

  for (const scene of scenes) {
    console.log(`→ ${scene.name.toUpperCase()}`)
    try {
      await page.goto(BASE_URL, { waitUntil: 'commit' })
      await injectSave(page, scene.config)
      await page.reload({ waitUntil: 'commit', timeout: 30000 })
      await page.waitForTimeout(1000)

      if (scene.wait) {
        await scene.wait(page)
      }

      await snap(page, scene.name, { delay: 600 })
    } catch (err) {
      console.log(`  ✗ ${err.message}`)
    }
  }
}

async function captureMinigames(page) {
  console.log('\n📍 MINIGAMES & GIQ\n')

  const minigames = [
    {
      name: 'travel-minigame',
      config: {
        currentScene: 'TRAVEL_MINIGAME',
        minigameConfig: { active: true, type: 'TOURBUS' }
      },
      wait: p => p.locator('canvas').waitFor({ timeout: 10000 })
    },
    {
      name: 'pre-gig-roadie',
      config: {
        currentScene: 'PRE_GIG_MINIGAME',
        minigameConfig: { active: true, type: 'ROADIE' }
      },
      wait: p => p.locator('canvas').waitFor({ timeout: 10000 })
    },
    {
      name: 'pre-gig-kabelsalat',
      config: {
        currentScene: 'PRE_GIG_MINIGAME',
        minigameConfig: { active: true, type: 'KABELSALAT' }
      },
      wait: p =>
        p
          .locator('div[style*="backgroundImage"]')
          .waitFor({ timeout: 15000 })
          .catch(() => p.waitForTimeout(3000))
    },
    {
      name: 'pre-gig-amp',
      config: {
        currentScene: 'PRE_GIG_MINIGAME',
        minigameConfig: { active: true, type: 'AMP_CALIBRATION' }
      },
      wait: p => p.locator('canvas').waitFor({ timeout: 10000 })
    },
    {
      name: 'gig-scene',
      config: {
        currentScene: 'GIG',
        minigameConfig: { active: false }
      },
      wait: p => p.locator('canvas').waitFor({ timeout: 10000 })
    }
  ]

  for (const minigame of minigames) {
    console.log(`→ ${minigame.name.toUpperCase()}`)
    try {
      await page.goto(BASE_URL, { waitUntil: 'commit' })
      await injectSave(page, minigame.config)
      await page.reload({ waitUntil: 'commit', timeout: 30000 })
      await page.waitForTimeout(1500)

      if (minigame.wait) {
        await minigame.wait(page)
      }

      await snap(page, minigame.name, { delay: 1500 })
    } catch (err) {
      console.log(`  ✗ ${err.message}`)
    }
  }
}

async function captureModals(page) {
  console.log('\n📍 MODALS & OVERLAYS\n')

  // EVENT_MODAL
  console.log('→ EVENT_MODAL')
  try {
    await page.goto(BASE_URL, { waitUntil: 'commit' })
    await injectSave(page, {
      currentScene: 'OVERWORLD'
    })
    await page.reload({ waitUntil: 'commit', timeout: 30000 })
    await page.waitForTimeout(1000)

    // Try to trigger an event
    const eventBtn = page.getByRole('button', { name: /event|check/i })
    const eventVisible = await eventBtn
      .isVisible({ timeout: 2000 })
      .catch(() => false)
    if (eventVisible) {
      await eventBtn.click()
      await page.getByRole('dialog').waitFor({ timeout: 3000 })
      await snap(page, 'event-modal', { delay: 600 })
    } else {
      console.log('  (event button not found)')
    }
  } catch (err) {
    console.log(`  ✗ ${err.message}`)
  }

  // BAND HQ MODALS
  console.log('→ BAND_HQ_MODAL')
  try {
    await page.goto(BASE_URL, { waitUntil: 'commit' })
    await page.waitForTimeout(800)

    const skipBtn = page.getByRole('button', { name: /skip/i })
    if (await skipBtn.isVisible().catch(() => false)) {
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

      // Tabs
      const tabs = [
        'band',
        'merch',
        'gear',
        'character',
        'science',
        'repair',
        'storytelling',
        'settings'
      ]
      for (const tabName of tabs) {
        const tab = page.getByRole('tab', {
          name: new RegExp(tabName, 'i')
        })
        const visible = await tab.isVisible().catch(() => false)
        if (visible) {
          await tab.click()
          await page.waitForTimeout(300)
          await snap(page, `band-hq-${tabName}`, { delay: 200 })
        }
      }

      const closeBtn = page.getByRole('button', {
        name: /close|leave|back|esc/i
      })
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click()
      }
    }
  } catch (err) {
    console.log(`  ✗ ${err.message}`)
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  console.log('🎬 COMPLETE NEUROTOXIC SCREENSHOT CAPTURE\n')
  console.log(`📁 Output: ${OUT_DIR}\n`)
  console.log('Capturing: Core Scenes + Minigames + Modals\n')

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
    await captureCore(page)
    await captureMinigames(page)
    await captureModals(page)

    console.log(`\n✅ Complete capture finished!`)
    console.log(`\n📊 Total screenshots: ${screenshotCount}`)
    console.log(`📁 Location: ${OUT_DIR}\n`)
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

main()
