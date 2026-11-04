import { expect, test } from '@playwright/test'
import {
  SAVE_KEY,
  buildFixture,
  dismissTutorial,
  loadSavedGame,
  readRootState,
  seedSaveOnce,
  skipToMenu
} from './helpers.js'

test('loading an older save keeps the tutorial skipped in global preferences', async ({
  page
}) => {
  await page.goto('/?events=off', { waitUntil: 'domcontentloaded' })
  const fixture = await buildFixture(page, 'ordinaryGigFixture')
  expect(JSON.parse(fixture.save).settings.tutorialSeen).toBe(false)
  await seedSaveOnce(page, { [SAVE_KEY]: fixture.save })
  await loadSavedGame(page)
  await expect
    .poll(async () => (await readRootState(page)).currentScene)
    .toBe('OVERWORLD')
  expect((await readRootState(page)).settings.tutorialSeen).toBe(true)

  await dismissTutorial(page)

  await expect(page.getByRole('region', { name: /tutorial/i })).toHaveCount(0)
  expect((await readRootState(page)).settings.tutorialSeen).toBe(true)
})

test('an unseen tutorial is still shown, dismissed and persisted', async ({
  page
}) => {
  await skipToMenu(page)
  await page.evaluate(() => {
    window.gameState.updatePlayer({ tutorialStep: 0 })
    window.gameState.updateSettings({ tutorialSeen: false })
  })
  await expect
    .poll(async () => {
      const state = await readRootState(page)
      return {
        seen: state.settings.tutorialSeen,
        step: state.player.tutorialStep
      }
    })
    .toEqual({ seen: false, step: 0 })
  const tutorial = page.getByRole('region', { name: /tutorial/i })
  await expect(tutorial).toBeVisible()

  await dismissTutorial(page)

  await expect(tutorial).toHaveCount(0)
  expect((await readRootState(page)).settings.tutorialSeen).toBe(true)
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('neurotoxic_global_settings'))
          .tutorialSeen
    )
  ).toBe(true)
})
