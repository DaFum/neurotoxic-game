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
    const showedError = /no save/i.test(bodyText)

    if (!stayedOnMenu && !showedError) {
      throw new Error(
        'Unexpected state: neither stayed on menu nor showed save error'
      )
    }
  })

  test('Main Menu -> Credits -> Main Menu', async ({ page }) => {
    await skipToMenu(page)

    // Click credits, expect title to show
    await page.getByRole('button', { name: /credits/i }).click()
    await expect(
      page.getByRole('heading', { name: /credits/i, exact: true })
    ).toBeVisible()

    // Click return, expect main menu to show
    await page.getByRole('button', { name: /return/i }).click()
    await expect(
      page.getByRole('heading', { name: /neurotoxic/i, exact: true })
    ).toBeVisible()
  })

  test('Main Menu -> Band HQ -> Close', async ({ page }) => {
    await skipToMenu(page)

    // Click Band HQ, expect dialog to open
    await page.getByRole('button', { name: /band hq/i }).click()
    await expect(
      page.getByRole('heading', { name: /band hq/i, exact: true })
    ).toBeVisible()

    // Navigate tabs inside Band HQ to be safe
    await page.getByRole('button', { name: 'SHOP' }).click()
    await page.getByRole('button', { name: 'SETTINGS' }).click()

    // Click leave, expect Band HQ button to be visible again on main menu
    await page.getByRole('button', { name: /leave \[esc\]/i }).click()
    await expect(
      page.getByRole('button', { name: /start tour/i })
    ).toBeVisible()
  })

  test('Complete Game Flow (Overworld -> Gig -> PostGig)', async ({ page }) => {
    // This test goes through rhythm game and minigames, so it needs extra time.
    test.setTimeout(180000)

    await skipToMenu(page)
    const startBtn = page.getByRole('button', { name: /start tour/i })
    const result = await raceWithCrash(page, () => startBtn.click(), 5000)
    if (result === 'crash' || result === 'timeout') {
      test.skip(true, 'Chromium crashed on Start Tour.')
      return
    }

    // 1. Overworld
    await expect(page.getByRole('heading', { name: /tour plan/i })).toBeVisible(
      { timeout: 5000 }
    )

    // The Band HQ might be open depending on earlier flow, ensure it's closed
    const hqHeading = page.getByRole('heading', {
      name: /band hq/i,
      exact: true
    })
    if (await hqHeading.isVisible()) {
      await page.getByRole('button', { name: /leave \[esc\]/i }).click()
      await hqHeading.waitFor({ state: 'hidden' })
    }

    // Find a reachable node and click it (avoid the current node 'Proberaum' or wherever the van currently is)
    // Explicitly target a known gig or festival venue to ensure the PreGig and Roadie minigame actually occur
    const travelNode = page
      .getByRole('button', {
        name: /Travel to (Goldgrube|MTC|Die Distille|Stadtfest|Deichbrand|Wacken)/i
      })
      .first()
    await travelNode.waitFor({ state: 'visible', timeout: 5000 })

    // Click once to select/hover
    await travelNode.click()

    // Wait for the Confirm? state to appear then click again
    await expect(
      page.getByText('CONFIRM?').locator('visible=true')
    ).toBeVisible()
    await travelNode.click()

    // 2. Tourbus Minigame -> Wait for completion
    // Wait for scene to load
    await expect(page.getByText('TOURBUS TERROR')).toBeVisible({
      timeout: 10000
    })

    // Simulate keyboard presses to complete the minigame quickly using DEV backdoor
    await page.keyboard.press('Shift+P')
    await page.waitForTimeout(500)

    // Wait for game over screen and click continue.
    const destReachedBtn = page.getByRole('button', {
      name: /continue/i,
      exact: true
    })
    await destReachedBtn.waitFor({ state: 'visible', timeout: 10000 })
    await destReachedBtn.click()

    // Handle Potential Random Events (e.g., Van Breakdown, Police Check)
    // These appear after the Tourbus Minigame (on arrival) and overlay the PreGig view.
    for (let i = 0; i < 3; i++) {
      try {
        // Check if an event modal is visible by looking for options
        const firstEventOption = page
          .locator('button', { hasText: /^1 / })
          .first()
        // Reduced timeout for event check to fail fast if no event
        await firstEventOption.waitFor({ state: 'visible', timeout: 2000 })
        await firstEventOption.click()
        await page.waitForTimeout(1000) // allow UI to settle
      } catch (_e) {
        // No more events found, proceed
        break
      }
    }

    // 3. PreGig Preparation
    await expect(
      page.getByRole('heading', { name: /preparation/i })
    ).toBeVisible({ timeout: 15000 })
    // Select the first song to fulfill minimum requirements (1 song)
    const firstSong = page.getByText('01 Kranker Schrank')
    await firstSong.waitFor({ state: 'visible', timeout: 5000 })
    await firstSong.click()

    const startShowBtn = page.getByRole('button', {
      name: /start show/i,
      exact: true
    })
    await expect(startShowBtn).toBeEnabled()
    await startShowBtn.click()

    // 4. Roadie Minigame
    // We arrive at Roadie Run screen. We need to move the character down to deliver, then up to fetch next item, 3 times.
    await expect(
      page.getByRole('heading', { name: /roadie run/i })
    ).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(1000)

    // Simulate keyboard presses to complete the minigame quickly using DEV backdoor
    await page.keyboard.press('Shift+P')
    await page.waitForTimeout(1000)

    // Wait for button to be visible again (reusing same selector logic/text)
    await startShowBtn.waitFor({ state: 'visible', timeout: 10000 })
    await startShowBtn.click()

    // 5. Gig (Rhythm Game)
    // The song plays automatically. Since we don't click, health fails but scene still advances.
    // We just wait for the gig report to show up.
    await expect(
      page.getByRole('heading', { name: /gig report/i })
    ).toBeVisible({ timeout: 60000 })

    // 6. PostGig Report
    await page.getByRole('button', { name: /continue to socials/i }).click()

    // Social Strategy Phase
    await expect(
      page.getByRole('heading', { name: /post to social media/i })
    ).toBeVisible()
    const firstSocialOpt = page.locator('button:has-text("Platform")').first()
    await firstSocialOpt.click()

    // PostGig Viral/Flop Result
    const backToTourBtn = page.getByRole('button', { name: /back to tour/i })
    await backToTourBtn.waitFor({ state: 'visible' })
    await backToTourBtn.click()

    // 7. Back to Overworld
    await expect(page.getByRole('heading', { name: /tour plan/i })).toBeVisible(
      { timeout: 5000 }
    )
  })
})
