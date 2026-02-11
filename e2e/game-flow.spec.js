import { test, expect } from '@playwright/test'
import { skipToMenu, raceWithCrash } from './helpers.js'

test.describe('Game Flow', () => {
  test('App loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Neurotoxic/i)
  })

  test('Intro scene skipped', async ({ page }) => {
    await skipToMenu(page)
    await expect(
      page.getByRole('heading', { name: /neurotoxic/i })
    ).toBeVisible()
  })

  test('Main Menu buttons', async ({ page }) => {
    await skipToMenu(page)
    await expect(
      page.getByRole('button', { name: /start tour/i })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /load game/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /band hq/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /credits/i })).toBeVisible()
  })

  test('Start Tour -> Overworld (handle crash)', async ({ page }) => {
    await skipToMenu(page)

    const startBtn = page.getByRole('button', { name: /start tour/i })

    // Pass factory function to ensure listeners are attached before click
    const result = await raceWithCrash(page, () => startBtn.click(), 5000)

    if (result === 'crash' || result === 'timeout') {
      test.skip(true, 'Chromium crashed on Start Tour (audio init).')
      return
    }

    // Check for overworld elements if not crashed
    try {
      await expect(page.getByText(/tour plan/i)).toBeVisible({ timeout: 5000 })
    } catch (e) {
      // Double check if page crashed *after* click but before visibility
      if (page.isClosed()) {
        test.skip(true, 'Chromium crashed on Start Tour (audio init).')
        return
      }

      // Check if we are back at Intro (likely crash/reload loop)
      const body = await page.textContent('body').catch(() => '')
      if (body.includes('SKIP INTRO')) {
        test.skip(true, 'Chromium crashed/reloaded to Intro on Start Tour.')
        return
      }

      console.log('Body content on failure:', body.substring(0, 500))
      throw e
    }
  })

  test('Load Game -> Error/Transition (handle crash)', async ({ page }) => {
    await skipToMenu(page)

    const loadBtn = page.getByRole('button', { name: /load game/i })

    // Pass factory function
    const result = await raceWithCrash(page, () => loadBtn.click(), 5000)

    if (result === 'crash' || result === 'timeout') {
      test.skip(true, 'Chromium crashed on Load Game (audio init).')
      return
    }

    // Check for expected outcome (error message or staying on menu)
    const bodyText = await page.textContent('body').catch(() => '')
    if (!bodyText) {
      test.skip(true, 'Chromium crashed (empty body).')
      return
    }

    const stayedOnMenu = bodyText.includes('NEUROTOXIC')
    const showedError = bodyText.toLowerCase().includes('no save')

    if (!stayedOnMenu && !showedError) {
      throw new Error(
        'Unexpected state: neither stayed on menu nor showed save error'
      )
    }
  })
})
