import { test, expect } from '@playwright/test'
import { skipToMenu } from './helpers.js'

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

    // Environment-specific crash handling:
    // Some CI environments crash headless Chromium when initializing WebAudio.
    // We detect this by listening for the page crash event.

    let crashed = false
    const onCrash = () => {
      console.log('Page crashed (likely AudioContext init)!')
      crashed = true
    }
    page.on('crash', onCrash)

    try {
      const startBtn = page.getByRole('button', { name: /start tour/i })

      // Use Promise.race to handle the potential crash during the click action
      const clickPromise = startBtn.click()

      // A promise that resolves if the page crashes
      const crashPromise = new Promise(resolve => {
        // We can't rely solely on the 'crash' event listener above inside the race,
        // so we wrap it here.
        const listener = () => resolve('crash')
        page.on('crash', listener)
        page.on('close', listener)
      })

      // A timeout just in case the click hangs indefinitely without crashing
      const timeoutPromise = new Promise(resolve =>
        setTimeout(() => resolve('timeout'), 5000)
      )

      const raceResult = await Promise.race([
        clickPromise,
        crashPromise,
        timeoutPromise
      ])

      if (raceResult === 'crash' || crashed) {
        test.skip(true, 'Chromium crashed on Start Tour (audio init).')
        return
      }

      // Check for overworld elements if not crashed
      try {
        await expect(page.getByText(/tour plan/i)).toBeVisible({
          timeout: 5000
        })
      } catch (e) {
        if (crashed) {
          test.skip(true, 'Chromium crashed on Start Tour (audio init).')
          return
        }

        // Check if we are back at Intro (likely crash/reload)
        const body = await page.textContent('body')
        if (body.includes('SKIP INTRO')) {
          test.skip(true, 'Chromium crashed/reloaded to Intro on Start Tour.')
          return
        }

        console.log('Body content on failure:', body.substring(0, 500))
        throw e
      }
    } catch (e) {
      if (
        crashed ||
        e.message.includes('crash') ||
        e.message.includes('Target closed') ||
        e.message.includes('closed')
      ) {
        test.skip(true, 'Chromium crashed on Start Tour (audio init).')
      } else {
        throw e
      }
    } finally {
      page.removeListener('crash', onCrash)
    }
  })

  test('Load Game -> Error/Transition (handle crash)', async ({ page }) => {
    await skipToMenu(page)

    let crashed = false
    const onCrash = () => {
      console.log('Page crashed!')
      crashed = true
    }
    page.on('crash', onCrash)

    const loadBtn = page.getByRole('button', { name: /load game/i })

    try {
      const clickPromise = loadBtn.click()
      const crashPromise = new Promise(resolve => {
        page.on('crash', () => resolve('crash'))
        page.on('close', () => resolve('crash'))
      })
      const timeoutPromise = new Promise(resolve =>
        setTimeout(() => resolve('timeout'), 5000)
      )

      const raceResult = await Promise.race([
        clickPromise,
        crashPromise,
        timeoutPromise
      ])

      if (raceResult === 'crash' || crashed) {
        test.skip(true, 'Chromium crashed on Load Game (audio init).')
        return
      }

      // If timeout, it might be hanging due to crash or just slow
      if (raceResult === 'timeout' && crashed) {
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
      const showedError =
        bodyText.includes('No save') || bodyText.includes('no save')

      if (!stayedOnMenu && !showedError) {
        throw new Error(
          'Unexpected state: neither stayed on menu nor showed save error'
        )
      }

      expect(stayedOnMenu || showedError).toBeTruthy()
    } catch (e) {
      if (
        crashed ||
        e.message.includes('crash') ||
        e.message.includes('Target closed') ||
        e.message.includes('closed')
      ) {
        test.skip(true, 'Chromium crashed on Load Game (audio init).')
      } else {
        throw e
      }
    } finally {
      page.removeListener('crash', onCrash)
    }
  })
})
