import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { launchBrowserWithFallback } from './.claude/skills/playwright-screenshot/scripts/browser-launcher.js'

const BASE_URL = 'http://localhost:5173'
const OUT_DIR = resolve('screenshots/verified')

const SAVE_KEY = 'neurotoxic_v3_save'
const INJECT_MARKER = 'neurotoxic_inject_marker'
const GLOBAL_SETTINGS_KEY = 'neurotoxic_global_settings'

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

async function injectAndVerify(page, sceneName, currentScene, waitCondition) {
  console.log(`\n→ ${sceneName}`)

  try {
    await page.goto(BASE_URL, { waitUntil: 'commit' })

    // Inject state WITH inject marker
    const state = JSON.parse(JSON.stringify(BASE_STATE))
    state.currentScene = currentScene

    await page.evaluate(
      ({ saveKey, markerKey, globalKey, state }) => {
        window.localStorage.setItem(saveKey, JSON.stringify(state))
        window.localStorage.setItem(markerKey, 'true') // CRITICAL: Tell app to load injected state
        window.localStorage.setItem(
          globalKey,
          JSON.stringify(state.globalSettings)
        )
      },
      {
        saveKey: SAVE_KEY,
        markerKey: INJECT_MARKER,
        globalKey: GLOBAL_SETTINGS_KEY,
        state
      }
    )

    // Reload to load injected state
    await page.reload({ waitUntil: 'commit', timeout: 20000 })
    await page.waitForTimeout(1500)

    // Get scene content preview
    const preview = await page.evaluate(() => {
      const text = document.body.innerText || ''
      return text.substring(0, 200).replace(/\n/g, ' ')
    })

    console.log(`  Content: "${preview}"`)

    // Wait for expected element
    if (waitCondition) {
      await waitCondition(page)
      console.log(`  ✓ Scene detected`)
    }

    // Capture
    await page.screenshot({
      path: `${OUT_DIR}/${sceneName}.png`,
      timeout: 60000
    })
    console.log(`  ✓ Screenshot saved`)
  } catch (err) {
    console.log(`  ✗ Error: ${err.message}`)
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  console.log('🔍 Verifying screenshots with INJECT_MARKER fix...\n')

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
    await injectAndVerify(page, 'menu-verified', 'MENU', p =>
      p.getByRole('heading', { name: /neurotoxic/i }).waitFor({ timeout: 5000 })
    )

    await injectAndVerify(page, 'overworld-verified', 'OVERWORLD', p =>
      p
        .getByRole('heading', { name: /tour plan/i })
        .waitFor({ timeout: 5000 })
        .catch(() => p.locator('svg').first().waitFor({ timeout: 2000 }))
    )

    await injectAndVerify(page, 'pregig-verified', 'PREGIG', p =>
      p
        .getByRole('heading', { name: /preparation/i })
        .waitFor({ timeout: 5000 })
    )

    await injectAndVerify(page, 'postgig-verified', 'POSTGIG', p =>
      p.getByRole('heading', { name: /gig report/i }).waitFor({ timeout: 5000 })
    )

    await injectAndVerify(page, 'gameover-verified', 'GAMEOVER', p =>
      p.getByRole('heading', { name: /game over/i }).waitFor({ timeout: 5000 })
    )

    console.log('\n✅ Verification complete!')
    console.log(`📁 Screenshots saved to: ${OUT_DIR}`)
  } finally {
    await browser.close()
  }
}

main()
