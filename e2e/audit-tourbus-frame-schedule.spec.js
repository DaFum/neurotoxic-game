import { test, expect } from '@playwright/test'
import {
  SAVE_KEY,
  buildFixture,
  dismissTutorial,
  getTestHook,
  loadSavedGame,
  readRootState,
  seedSaveOnce
} from './helpers.js'

test.describe.configure({ retries: 0 })

// Scope: the claims below hold for a fixed speed, disabled spawning and
// frames of at most 100 ms (the delta clamp). Nothing here asserts that the
// whole simulation is invariant under frame splitting.

const GAME_URL = '/?events=off'
const FIXED_SPEED = 0.12
const BASE_DAMAGE_PER_HIT = 10

/** Walks a fresh run to the Tourbus through the real two-click travel flow. */
const startTourbus = async page => {
  await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' })
  const fixture = await buildFixture(page, 'zeroProtectedCashFixture')
  await seedSaveOnce(page, { [SAVE_KEY]: fixture.save }, { url: GAME_URL })
  await loadSavedGame(page)
  await expect
    .poll(async () => (await readRootState(page)).currentScene)
    .toBe('OVERWORLD')
  await dismissTutorial(page)

  const node = page
    .getByRole('button', { name: /travel to/i })
    .filter({ hasNot: page.getByRole('img', { name: /map marker: start/i }) })
    .first()
  await node.click()
  await expect(page.getByText('CONFIRM?')).toBeVisible()
  await node.click()
  await expect(
    page.getByRole('heading', { name: /tourbus terror/i })
  ).toBeVisible()
}

/**
 * Plays one frame schedule on a fresh Tourbus and reports what it caused.
 *
 * @param browser - Playwright browser; every schedule gets its own context.
 * @param baseURL - App origin for the new context.
 * @param schedule - Frame sizes in ms, or a real arrow key to press.
 * @param layout - Builds the obstacle list from the reported bus lane.
 */
const runSchedule = async (browser, baseURL, schedule, layout) => {
  const context = await browser.newContext({ baseURL })
  try {
    const page = await context.newPage()
    await startTourbus(page)

    const tourbus = await getTestHook(page, 'tourbus')
    const frames = await getTestHook(page, 'tourbusFrames')
    const snapshot = () => tourbus.evaluate(hook => hook.getSnapshot())

    // Automatic frames must stop before the fixture is placed or stepped.
    await frames.evaluate(hook => hook.enableManualFrames())
    const { busLane } = await snapshot()
    await tourbus.evaluate((hook, fixture) => hook.setFixture(fixture), {
      fixedSpeed: FIXED_SPEED,
      spawnEnabled: false,
      obstacles: layout(busLane)
    })
    const baseline = await snapshot()

    let lane = busLane
    for (const step of schedule) {
      if (typeof step === 'number') {
        await frames.evaluate((hook, ms) => hook.stepFrame(ms), step)
        continue
      }
      await page.keyboard.press(step)
      lane += step === 'ArrowLeft' ? -1 : 1
      await expect.poll(async () => (await snapshot()).busLane).toBe(lane)
    }

    const final = await snapshot()
    // The HUD shows what the simulation recorded.
    await expect(page.getByText(/^DAMAGE:\s*\d+%$/)).toHaveText(
      `DAMAGE: ${final.damage}%`
    )
    return {
      damageDelta: final.damage - baseline.damage,
      pickupDelta: final.pickupCount - baseline.pickupCount,
      collidedIds: [...final.collidedIds].sort((a, b) => a - b)
    }
  } finally {
    await context.close()
  }
}

// Obstacle y values sit away from the hit-region edge (85) and the swept
// bottom (95), so no schedule lands exactly on a boundary.
const noInputLayout = lane => {
  const other = (lane + 1) % 3
  return [
    { id: 101, lane, y: 79.4, type: 'OBSTACLE' },
    { id: 102, lane, y: 80.3, type: 'FUEL' },
    // 103 starts 83.8 and travels 12 in one 100 ms frame: it crosses the
    // whole hit region (85 to 95) inside a single frame.
    { id: 103, lane, y: 83.8, type: 'VOID_HAZARD' },
    { id: 104, lane: other, y: 80.2, type: 'OBSTACLE' },
    { id: 105, lane, y: 60, type: 'OBSTACLE' }
  ]
}

// The bus starts in `lane`, presses ArrowLeft at 50 ms of accepted time, and
// meets obstacles in both lanes: 201/204 before the key, 202/203 after it.
const leftKeyLayout = lane => {
  const left = lane - 1
  return [
    { id: 201, lane, y: 82.4, type: 'OBSTACLE' },
    { id: 202, lane: left, y: 76.3, type: 'OBSTACLE' },
    { id: 203, lane: left, y: 77.7, type: 'FUEL' },
    { id: 204, lane, y: 81.9, type: 'VOID_HAZARD' },
    { id: 205, lane: 2, y: 80.7, type: 'OBSTACLE' },
    { id: 206, lane: left, y: 40, type: 'OBSTACLE' }
  ]
}

test.describe('Tourbus frame splitting at a fixed speed with spawning off', () => {
  test.setTimeout(240000)

  test('no input: eight 12.5 ms frames equal one 100 ms frame', async ({
    browser,
    baseURL
  }) => {
    const eightFrames = await runSchedule(
      browser,
      baseURL,
      Array(8).fill(12.5),
      noInputLayout
    )
    const oneFrame = await runSchedule(browser, baseURL, [100], noInputLayout)

    expect(oneFrame).toEqual(eightFrames)
    // Absolute: one in-lane OBSTACLE (no armor or bullbar) plus FUEL and
    // VOID_HAZARD pickups; the other-lane and distant obstacles are untouched.
    expect(oneFrame.damageDelta).toBe(BASE_DAMAGE_PER_HIT)
    expect(oneFrame.pickupDelta).toBe(2)
    expect(oneFrame.collidedIds).toEqual([101, 102, 103])
  })

  test('ArrowLeft at 50 ms: 8x12.5, 2x50 and 10/40/25/25 agree', async ({
    browser,
    baseURL
  }) => {
    const schedules = [
      [12.5, 12.5, 12.5, 12.5, 'ArrowLeft', 12.5, 12.5, 12.5, 12.5],
      [50, 'ArrowLeft', 50],
      [10, 40, 'ArrowLeft', 25, 25]
    ]
    const results = []
    for (const schedule of schedules) {
      results.push(await runSchedule(browser, baseURL, schedule, leftKeyLayout))
    }

    expect(results[1]).toEqual(results[0])
    expect(results[2]).toEqual(results[0])
    // Collisions happen in both lanes: two OBSTACLE hits, FUEL and VOID_HAZARD.
    expect(results[0].damageDelta).toBe(2 * BASE_DAMAGE_PER_HIT)
    expect(results[0].pickupDelta).toBe(2)
    expect(results[0].collidedIds).toEqual([201, 202, 203, 204])
  })
})
