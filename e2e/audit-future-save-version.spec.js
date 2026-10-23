import { test, expect } from '@playwright/test'
import { SAVE_KEY, seedSaveOnce, skipToMenu } from './helpers.js'

test.describe.configure({ retries: 0 })

const GAME_URL = '/?events=off'
const NEWER_SLOT = `${SAVE_KEY}.v3`
const SETTINGS_KEY = 'neurotoxic_global_settings'

// Exact payload of tests/context/futureSaveVersion.test.tsx: a build one
// schema ahead, carrying a field this build would drop on a round trip.
const FUTURE_SAVE = JSON.stringify({
  version: 3,
  player: { money: 4321 },
  band: {},
  social: {},
  gameMap: null,
  futureProgress: { chapter: 7, secrets: ['a', 'b'] }
})

const INCOMPATIBLE_MESSAGE =
  'This save was made by a newer version of the game (save version 3, this version supports up to 2). It was left untouched and will not be overwritten; update the game to continue it.'
const FAILURE_MESSAGES = [
  /no save game found/i,
  /save file is corrupt or invalid/i,
  /save file parsing failed/i,
  /could not be upgraded/i
]

const readKey = (page, key) =>
  page.evaluate(storageKey => window.localStorage.getItem(storageKey), key)

/** Keys the rejection path must never create. */
const quarantineAndUnlockKeys = page =>
  page.evaluate(() =>
    Object.keys(window.localStorage)
      .filter(
        key =>
          key.startsWith('neurotoxic:save:quarantine:') ||
          key.startsWith('neurotoxic_unlocks')
      )
      .sort()
  )

const loadGameButton = page => page.getByRole('button', { name: /load game/i })

const openSettings = async page => {
  await page.getByRole('button', { name: /band hq/i }).click()
  const modal = page.getByRole('dialog')
  await expect(modal).toBeVisible()
  await modal.getByRole('tab', { name: /settings/i }).click()
  await expect(modal.getByRole('tabpanel')).toBeVisible()
  return modal
}

const expectRejected = async page => {
  await loadGameButton(page).click()
  await expect(page.getByText(INCOMPATIBLE_MESSAGE)).toBeVisible()
  await expect(page.getByRole('heading', { name: /neurotoxic/i })).toBeVisible()
  await expect(loadGameButton(page)).toBeEnabled()
  for (const failure of FAILURE_MESSAGES) {
    await expect(page.getByText(failure)).toHaveCount(0)
  }
}

test.describe('A save from a newer build is rejected without being touched', () => {
  test('the shared slot survives load, settings and reload byte for byte', async ({
    page
  }) => {
    await seedSaveOnce(page, { [SAVE_KEY]: FUTURE_SAVE }, { url: GAME_URL })
    await skipToMenu(page, { navigate: false })
    expect(await readKey(page, SAVE_KEY), 'after the menu mounted').toBe(
      FUTURE_SAVE
    )
    const keysBefore = await quarantineAndUnlockKeys(page)

    await expectRejected(page)
    expect(await readKey(page, SAVE_KEY), 'right after rejection').toBe(
      FUTURE_SAVE
    )
    expect(await quarantineAndUnlockKeys(page)).toEqual(keysBefore)

    const modal = await openSettings(page)
    const crtToggle = modal.getByRole('switch', { name: /crt/i })
    await expect(crtToggle).toBeVisible()
    const toggled = (await crtToggle.getAttribute('aria-checked')) !== 'true'
    await crtToggle.click()
    await expect(crtToggle).toHaveAttribute('aria-checked', String(toggled))
    await expect
      .poll(
        async () => JSON.parse(await readKey(page, SETTINGS_KEY)).crtEnabled
      )
      .toBe(toggled)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    expect(await readKey(page, SAVE_KEY), 'after the settings change').toBe(
      FUTURE_SAVE
    )

    await page.reload({ waitUntil: 'domcontentloaded' })
    await skipToMenu(page, { navigate: false })
    expect(await readKey(page, SAVE_KEY), 'after reload').toBe(FUTURE_SAVE)
    expect(
      JSON.parse(await readKey(page, SETTINGS_KEY)).crtEnabled,
      'the CRT setting persisted'
    ).toBe(toggled)
    const reopened = await openSettings(page)
    await expect(
      reopened.getByRole('switch', { name: /crt/i })
    ).toHaveAttribute('aria-checked', String(toggled))
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()

    await expectRejected(page)
    expect(await readKey(page, SAVE_KEY), 'after the second load').toBe(
      FUTURE_SAVE
    )
    expect(await quarantineAndUnlockKeys(page)).toEqual(keysBefore)
  })

  test('a save only in the version-3 slot is rejected and left alone', async ({
    page
  }) => {
    await seedSaveOnce(page, { [NEWER_SLOT]: FUTURE_SAVE }, { url: GAME_URL })
    await skipToMenu(page, { navigate: false })
    expect(await readKey(page, NEWER_SLOT), 'after the menu mounted').toBe(
      FUTURE_SAVE
    )
    const keysBefore = await quarantineAndUnlockKeys(page)

    await expectRejected(page)

    expect(await readKey(page, NEWER_SLOT), 'right after rejection').toBe(
      FUTURE_SAVE
    )
    expect(await readKey(page, SAVE_KEY), 'the shared key stays absent').toBe(
      null
    )
    expect(await quarantineAndUnlockKeys(page)).toEqual(keysBefore)
  })
})
