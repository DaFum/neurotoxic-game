import { test, expect } from '@playwright/test'
import {
  SAVE_KEY,
  buildFixture,
  dismissTutorial,
  getTestHook,
  loadSavedGame,
  raceWithCrash,
  readRootState,
  seedSaveOnce
} from './helpers.js'

test.describe.configure({ retries: 0 })

const GAME_URL = '/?events=off'
const LEFT_LANE = 0

const rhythmSnapshot = async hook =>
  hook.evaluate(rhythm => rhythm.getSnapshot())

test.describe('A lane released while paused stays released after resume', () => {
  test('ArrowLeft held, paused, released, resumed: lane 0 stays inactive', async ({
    page
  }) => {
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' })
    const fixture = await buildFixture(page, 'ordinaryGigFixture')
    await seedSaveOnce(page, { [SAVE_KEY]: fixture.save }, { url: GAME_URL })
    await loadSavedGame(page)
    await expect
      .poll(async () => (await readRootState(page)).currentScene)
      .toBe('OVERWORLD')
    await dismissTutorial(page)

    // Enter the gig through the real PreGig controls.
    await page
      .locator('.map-node')
      .filter({ has: page.getByRole('img', { name: 'Van', exact: true }) })
      .click()
    await expect
      .poll(async () => (await readRootState(page)).currentScene)
      .toBe('PREGIG')
    const startShow = page.getByRole('button', { name: /^start show$/i })
    await expect(startShow).toBeEnabled()
    await startShow.click()
    await page.getByRole('button', { name: /^skip$/i }).click()
    await expect
      .poll(async () => (await readRootState(page)).currentScene)
      .toBe('GIG')

    const rhythm = await getTestHook(page, 'rhythm')
    await expect
      .poll(async () => (await rhythmSnapshot(rhythm)).transportState)
      .toBe('started')

    await page.keyboard.down('ArrowLeft')
    await expect
      .poll(async () => (await rhythmSnapshot(rhythm)).laneActive[LEFT_LANE])
      .toBe(true)

    await page.keyboard.press('Escape')
    const pauseDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: /^paused$/i })
    })
    await expect(pauseDialog).toBeVisible()
    await expect
      .poll(async () => (await rhythmSnapshot(rhythm)).userPaused)
      .toBe(true)

    // Released while the gig is paused: the lane has to drop right away.
    await page.keyboard.up('ArrowLeft')
    await expect
      .poll(async () => (await rhythmSnapshot(rhythm)).laneActive[LEFT_LANE])
      .toBe(false)

    const outcome = await raceWithCrash(page, () =>
      pauseDialog.getByRole('button', { name: /^resume$/i }).click()
    )
    expect(outcome).toBe('success')
    await expect(pauseDialog).toHaveCount(0)
    await expect
      .poll(async () => {
        const snapshot = await rhythmSnapshot(rhythm)
        return !snapshot.userPaused && snapshot.transportState === 'started'
      })
      .toBe(true)

    // Gig time keeps advancing for a bounded window; every sample in it must
    // show the lane inactive and no hit scored by the key that was let go.
    const resumed = await rhythmSnapshot(rhythm)
    const samples = []
    await expect
      .poll(
        async () => {
          const snapshot = await rhythmSnapshot(rhythm)
          samples.push(snapshot)
          return snapshot.gigTimeMs - resumed.gigTimeMs
        },
        { timeout: 15000, intervals: [100] }
      )
      .toBeGreaterThanOrEqual(1500)
    expect(samples.length).toBeGreaterThan(1)
    for (const snapshot of samples) {
      expect(snapshot.laneActive[LEFT_LANE]).toBe(false)
      expect(snapshot.hits).toBeLessThanOrEqual(resumed.hits)
    }
  })
})
