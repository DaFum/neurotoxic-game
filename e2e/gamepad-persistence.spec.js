import { test, expect } from '@playwright/test'
import {
  skipToMenu,
  SAVE_KEY,
  buildFixture,
  seedSaveOnce,
  loadSavedGame,
  readRootState,
  getTestHook
} from './helpers.js'

test('controller bindings persist, participate in swaps, and reset', async ({
  page
}) => {
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 16 }, () => ({
      pressed: false,
      value: 0,
      touched: false
    }))
    const pad = {
      index: 0,
      id: 'Xbox test controller',
      mapping: 'standard',
      connected: true,
      buttons,
      axes: [0, 0],
      timestamp: 0
    }
    window.testGamepadButtons = buttons
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => [pad]
    })
  })
  const openSettings = async () => {
    await page.getByRole('button', { name: /band hq/i }).click()
    await page
      .getByRole('dialog')
      .getByRole('tab', { name: /settings/i })
      .click()
    await expect(
      page.getByRole('heading', { name: /^controller$/i })
    ).toBeVisible()
  }
  const press = async button => {
    await page.evaluate(index => {
      window.testGamepadButtons[index].pressed = true
    }, button)
    await page.waitForTimeout(100)
    await page.evaluate(index => {
      window.testGamepadButtons[index].pressed = false
    }, button)
  }
  const saved = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('neurotoxic_global_settings'))
          .gamepadLaneBindings
    )
  await skipToMenu(page)
  await openSettings()
  await page
    .getByRole('button', { name: /^rebind$/i })
    .nth(0)
    .click()
  await expect(page.getByText(/press a button/i)).toBeVisible()
  await press(4)
  await expect.poll(saved).toEqual([4, 0, 1])
  await page.reload()
  await skipToMenu(page, { navigate: false })
  await openSettings()
  await expect(page.getByText(/guitar: button 4/i)).toBeVisible()
  const fixture = await buildFixture(page, 'ordinaryGigFixture')
  const save = JSON.parse(fixture.save)
  delete save.settings.gamepadLaneBindings
  await seedSaveOnce(page, { [SAVE_KEY]: JSON.stringify(save) })
  await loadSavedGame(page)
  await expect
    .poll(async () => (await readRootState(page)).currentScene)
    .toBe('OVERWORLD')
  const tutorial = page.getByRole('region', { name: /tutorial/i })
  if (await tutorial.isVisible())
    await tutorial.getByRole('button', { name: /skip all/i }).click()
  await page
    .locator('.map-node')
    .filter({ has: page.getByRole('img', { name: 'Van', exact: true }) })
    .click()
  await expect
    .poll(async () => (await readRootState(page)).currentScene)
    .toBe('PREGIG')
  await page.getByRole('button', { name: /^start show$/i }).click()
  await page.getByRole('button', { name: /^skip$/i }).click()
  await expect
    .poll(async () => (await readRootState(page)).currentScene)
    .toBe('GIG')
  const rhythm = await getTestHook(page, 'rhythm')
  await expect
    .poll(
      async () => (await rhythm.evaluate(r => r.getSnapshot())).transportState
    )
    .toBe('started')
  await page.evaluate(() => {
    window.testGamepadButtons[4].pressed = true
  })
  await expect
    .poll(
      async () => (await rhythm.evaluate(r => r.getSnapshot())).laneActive[0]
    )
    .toBe(true)
  await page.evaluate(() => {
    window.testGamepadButtons[4].pressed = false
  })
  await expect
    .poll(
      async () => (await rhythm.evaluate(r => r.getSnapshot())).laneActive[0]
    )
    .toBe(false)
  await page.reload()
  await skipToMenu(page, { navigate: false })
  await openSettings()
  await page
    .getByRole('button', { name: /^rebind$/i })
    .nth(1)
    .click()
  await expect(page.getByText(/press a button/i)).toBeVisible()
  await press(4)
  await expect.poll(saved).toEqual([0, 4, 1])
  await page.getByRole('button', { name: /reset to default/i }).click()
  await expect.poll(saved).toEqual([2, 0, 1])
})
