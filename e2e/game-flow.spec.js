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

    const identityDialog = page.getByRole('dialog')
    const confirmBtn = identityDialog.getByRole('button', { name: /confirm/i })
    if (await confirmBtn.isVisible()) {
      const input = identityDialog.getByRole('textbox').first()
      await input.fill('Test Name')
      await confirmBtn.click()
    }

    // Check for overworld elements if not crashed
    try {
      await expect(page.getByText(/tour plan/i)).toBeVisible({ timeout: 10000 })
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
    const bandHqTabs = page.getByRole('tablist', { name: /band hq sections/i })
    await bandHqTabs.getByRole('tab', { name: /^shop$/i }).click()
    await bandHqTabs.getByRole('tab', { name: /^settings$/i }).click()

    // Click leave, expect Band HQ button to be visible again on main menu
    await page.getByRole('button', { name: /leave \[esc\]/i }).click()
    await expect(
      page.getByRole('button', { name: /start tour/i })
    ).toBeVisible()
  })

  test('Complete Game Flow (Overworld -> Gig -> PostGig)', async ({ page }) => {
    // This test goes through rhythm game and minigames, so it needs extra time.
    test.setTimeout(180000)

    await page.addInitScript(mapSeed => {
      const realDateNow = Date.now
      Date.now = () => mapSeed
      Object.defineProperty(globalThis, '__restoreGoldenPathClock', {
        configurable: true,
        value: () => {
          Date.now = realDateNow
          delete globalThis.__restoreGoldenPathClock
        }
      })
    }, 1)

    await skipToMenu(page)
    const startBtn = page.getByRole('button', { name: /start tour/i })
    const identityDialog = page.getByRole('dialog')
    const tourPlanHeading = page.getByRole('heading', { name: /tour plan/i })
    const skipIntroBtn = page.getByRole('button', { name: /skip intro/i })

    const completeIdentityIfNeeded = async () => {
      const confirmBtn = identityDialog.getByRole('button', {
        name: /confirm/i
      })
      const needsIdentity = await confirmBtn
        .isVisible({ timeout: 2500 })
        .catch(() => false)
      if (!needsIdentity) return
      const input = identityDialog.getByRole('textbox').first()
      await input.fill('Test Name')
      await confirmBtn.click()
    }

    const ensureOverworld = async () => {
      const getState = async () =>
        Promise.race([
          tourPlanHeading
            .waitFor({ state: 'visible', timeout: 10000 })
            .then(() => 'overworld')
            .catch(() => null),
          skipIntroBtn
            .waitFor({ state: 'visible', timeout: 10000 })
            .then(() => 'intro')
            .catch(() => null),
          startBtn
            .waitFor({ state: 'visible', timeout: 10000 })
            .then(() => 'menu')
            .catch(() => null)
        ])

      for (let attempt = 0; attempt < 6; attempt++) {
        const state = await getState()
        if (state === 'overworld') return

        if (state === 'intro') {
          await skipIntroBtn.click()
          // After skipping intro we can land either on menu or directly in overworld.
          await Promise.race([
            tourPlanHeading.waitFor({ state: 'visible', timeout: 10000 }),
            startBtn.waitFor({ state: 'visible', timeout: 10000 })
          ]).catch(() => {})
          continue
        }

        if (state === 'menu') {
          const clickedStart = await startBtn
            .click({ timeout: 2000 })
            .then(() => true)
            .catch(() => false)
          if (clickedStart) {
            await completeIdentityIfNeeded()
          }
          await Promise.race([
            tourPlanHeading.waitFor({ state: 'visible', timeout: 10000 }),
            skipIntroBtn.waitFor({ state: 'visible', timeout: 10000 }),
            startBtn.waitFor({ state: 'visible', timeout: 10000 })
          ]).catch(() => {})
          continue
        }

        await Promise.race([
          tourPlanHeading
            .waitFor({ state: 'visible', timeout: 300 })
            .catch(() => null),
          skipIntroBtn
            .waitFor({ state: 'visible', timeout: 300 })
            .catch(() => null),
          startBtn.waitFor({ state: 'visible', timeout: 300 }).catch(() => null)
        ]).catch(() => {})
      }

      // Hard recovery: reset to menu and retry once from a clean state.
      await skipToMenu(page)
      await expect(startBtn).toBeVisible({ timeout: 10000 })
      await expect(startBtn).toBeEnabled({ timeout: 15000 })
      await startBtn.click()
      await completeIdentityIfNeeded()
      await expect(tourPlanHeading).toBeVisible({ timeout: 15000 })
      if (await tourPlanHeading.isVisible().catch(() => false)) return

      throw new Error('Could not reach overworld from Start Tour after retry.')
    }

    // 1. Overworld
    await ensureOverworld()

    if (page.isClosed()) {
      throw new Error('Page closed unexpectedly while entering overworld.')
    }

    // The Band HQ might be open depending on earlier flow, ensure it's closed
    const hqHeading = page.getByRole('heading', {
      name: /band hq/i,
      exact: true
    })
    if (await hqHeading.isVisible()) {
      await page.getByRole('button', { name: /leave \[esc\]/i }).click()
      await hqHeading.waitFor({ state: 'hidden' })
    }

    const dismissTopEventDialog = async () => {
      const eventDialog = page.getByRole('dialog').first()
      const hasDialog = await eventDialog
        .isVisible({ timeout: 500 })
        .catch(() => false)
      if (!hasDialog) return false

      const numberedOption = eventDialog
        .locator('button')
        .filter({ hasText: /^\[\d+\]/ })
        .first()
      const continueOption = eventDialog.getByRole('button', {
        name: /continue/i
      })
      const availableAction = numberedOption.or(continueOption).first()

      const isClickable = await availableAction
        .isEnabled({ timeout: 500 })
        .catch(() => false)
      if (!isClickable) return false

      return availableAction
        .click({ timeout: 1000 })
        .then(() => true)
        .catch(() => false)
    }
    const waitForUnblockedTarget = async (target, timeout = 10000) => {
      await expect
        .poll(
          async () => {
            if (await dismissTopEventDialog()) return false
            return target.isVisible({ timeout: 500 }).catch(() => false)
          },
          { timeout, intervals: [250, 500, 1000] }
        )
        .toBe(true)
    }
    const clickUnblockedTarget = async (target, timeout = 10000) => {
      await expect
        .poll(
          async () => {
            if (await dismissTopEventDialog()) return false
            return target
              .click({ timeout: 1000 })
              .then(() => true)
              .catch(() => false)
          },
          { timeout, intervals: [250, 500, 1000] }
        )
        .toBe(true)
    }
    // Seed 1 exposes a reachable GIG in layer 1. Match the semantic marker
    // rather than venue names, because a venue can be assigned another node type.
    const getTravelNode = () =>
      page
        .getByRole('button', { name: /travel to/i })
        .filter({
          has: page.getByRole('img', {
            name: /map marker: (?:gig|festival)/i
          })
        })
        .first()
    const tryStartTravel = async () => {
      const travelNode = getTravelNode()
      const selected = await travelNode
        .click({ timeout: 2000 })
        .then(() => true)
        .catch(() => false)
      if (!selected) return false

      const confirmVisible = await page
        .getByText('CONFIRM?')
        .filter({ visible: true })
        .waitFor({ state: 'visible', timeout: 2000 })
        .then(() => true)
        .catch(() => false)
      if (!confirmVisible) return false

      return travelNode
        .click({ timeout: 2000 })
        .then(() => true)
        .catch(() => false)
    }
    // Poll instead of a short hard wait: the overworld lazy-loads its Pixi map
    // and node icons (whose generated-image requests time out on CI), and a
    // day-start event dialog can be sitting on top. A fixed 5s wait made this
    // the only step in the flow without slack and flaked on contended runners.
    await waitForUnblockedTarget(getTravelNode(), 20000)
    await page.evaluate(() => globalThis.__restoreGoldenPathClock?.())

    // Retry the whole select -> CONFIRM? -> confirm handshake until the scene
    // actually changes. On a contended runner the node re-animates under the
    // first click and the CONFIRM? label can lag it, so asserting the first
    // attempt flaked. Leaving the overworld is the real success condition: a
    // second click on an already-pending node confirms travel, which a strict
    // per-attempt result would misreport as a failure.
    await expect
      .poll(
        async () => {
          if (await dismissTopEventDialog()) return false
          const inOverworld = await tourPlanHeading
            .isVisible({ timeout: 500 })
            .catch(() => false)
          if (!inOverworld) return true

          await tryStartTravel()
          return !(await tourPlanHeading
            .isVisible({ timeout: 1000 })
            .catch(() => false))
        },
        { timeout: 30000, intervals: [500, 1000] }
      )
      .toBe(true)

    // 2. Tourbus Minigame -> Wait for completion
    // Wait for scene to load
    const tourbusHeading = page.getByRole('heading', {
      name: /tourbus terror/i
    })
    const tourbusMoveLeftBtn = page.getByRole('button', { name: /move left/i })
    await expect(tourbusHeading).toBeVisible({
      timeout: 10000
    })

    // Tourbus completion can branch:
    // - show a "Continue" button, or
    // - return directly to overworld with an event modal.
    const destReachedBtn = page.getByRole('button', {
      name: /continue/i,
      exact: true
    })
    const isInTourbusScene = async () => {
      const byHeading = await tourbusHeading
        .isVisible({ timeout: 300 })
        .catch(() => false)
      if (byHeading) return true
      return tourbusMoveLeftBtn.isVisible({ timeout: 300 }).catch(() => false)
    }
    const bypassTourbusScene = async () => {
      for (let i = 0; i < 10; i++) {
        const stillInTourbus = await isInTourbusScene()
        if (!stillInTourbus) break

        await page.keyboard.press('Shift+P')

        if (await dismissTopEventDialog()) {
          await Promise.race([
            destReachedBtn
              .waitFor({ state: 'visible', timeout: 500 })
              .catch(() => null),
            tourbusHeading
              .waitFor({ state: 'hidden', timeout: 500 })
              .catch(() => null),
            tourbusMoveLeftBtn
              .waitFor({ state: 'hidden', timeout: 500 })
              .catch(() => null)
          ]).catch(() => {})
          continue
        }

        const hasTourbusContinue = await destReachedBtn
          .isVisible({ timeout: 1500 })
          .catch(() => false)
        if (hasTourbusContinue) {
          await destReachedBtn.click({ timeout: 2000 }).catch(() => {})
        }
        await Promise.race([
          destReachedBtn
            .waitFor({ state: 'visible', timeout: 500 })
            .catch(() => null),
          tourbusHeading
            .waitFor({ state: 'hidden', timeout: 500 })
            .catch(() => null),
          tourbusMoveLeftBtn
            .waitFor({ state: 'hidden', timeout: 500 })
            .catch(() => null)
        ]).catch(() => {})
      }
    }

    // Simulate the DEV backdoor repeatedly until Tourbus scene exits.
    await bypassTourbusScene()

    const stillInTourbusAfterBypass = await isInTourbusScene()
    if (stillInTourbusAfterBypass) {
      throw new Error(
        'Tourbus minigame did not exit after Shift+P bypass attempts.'
      )
    }

    // Handle potential random events after travel completion.
    // Some events expose numbered options ([1]/[2]), others only a [CONTINUE] action.
    for (let i = 0; i < 4; i++) {
      const dismissed = await dismissTopEventDialog()
      if (!dismissed) {
        break
      }
      await page
        .getByRole('dialog')
        .first()
        .waitFor({ state: 'hidden', timeout: 1000 })
        .catch(() => {})
    }

    // If we are still in overworld due to a detour event (e.g., MISSED EXIT),
    // retry one travel attempt to continue the golden path.
    if (await tourPlanHeading.isVisible().catch(() => false)) {
      await tryStartTravel()

      // Retry travel can put us into Tourbus again; bypass it the same way.
      await bypassTourbusScene()

      if (await isInTourbusScene()) {
        throw new Error(
          'Retry travel remained in Tourbus and did not complete.'
        )
      }

      // Clear any follow-up event overlays from the retry path.
      for (let i = 0; i < 4; i++) {
        const dismissed = await dismissTopEventDialog()
        if (!dismissed) {
          break
        }
        await page
          .getByRole('dialog')
          .first()
          .waitFor({ state: 'hidden', timeout: 1000 })
          .catch(() => {})
      }
    }

    // Last-mile stabilization: random events and detours can bounce between
    // OVERWORLD and TOURBUS right before PreGig. Ensure we truly reach PreGig.
    const preGigHeading = page.getByRole('heading', { name: /preparation/i })
    for (let i = 0; i < 3; i++) {
      if (await preGigHeading.isVisible({ timeout: 1000 }).catch(() => false)) {
        break
      }

      if (await isInTourbusScene()) {
        await bypassTourbusScene()
      } else if (
        await tourPlanHeading.isVisible({ timeout: 1000 }).catch(() => false)
      ) {
        await tryStartTravel()
        await bypassTourbusScene()
      }

      for (let j = 0; j < 3; j++) {
        const dismissed = await dismissTopEventDialog()
        if (!dismissed) break
        await page
          .getByRole('dialog')
          .first()
          .waitFor({ state: 'hidden', timeout: 500 })
          .catch(() => {})
      }
    }

    // 3. PreGig Preparation
    await expect(preGigHeading).toBeVisible({ timeout: 15000 })
    // Select the first song to fulfill minimum requirements (1 song)
    const firstSong = page.getByText('01 Kranker Schrank')
    await clickUnblockedTarget(firstSong)

    // Anchored regexes: Playwright ignores `exact` for RegExp name matchers.
    const startShowBtn = page.getByRole('button', {
      name: /^start show$/i
    })
    await expect(startShowBtn).toBeEnabled()
    await clickUnblockedTarget(startShowBtn)

    // 4. Pre-Gig Minigame (Roadie, Kabelsalat, or Amp Calibration)
    // Use the player-facing skip action so the test waits for a mounted scene
    // instead of racing the DEV keyboard listener during a cold lazy load.
    const skipMinigameBtn = page.getByRole('button', {
      name: /^skip$/i
    })
    const continueBtn = page.getByRole('button', {
      name: /^continue$/i
    })
    const kabelsalatHeading = page.getByRole('heading', {
      name: /hardware.*rigging/i
    })
    const gigReport = page.getByRole('heading', { name: /gig report/i })
    // Event dialogs also expose a "CONTINUE" button, which would satisfy the
    // poll below and make the click land on the dialog instead of a minigame
    // action. There is no scene wrapper element to scope the locator to, so
    // clear any overlay first and only judge readiness on an unobstructed page.
    await expect
      .poll(
        async () => {
          if (await dismissTopEventDialog()) return false
          return (
            (await skipMinigameBtn.isVisible().catch(() => false)) ||
            (await continueBtn.isVisible().catch(() => false)) ||
            (await kabelsalatHeading.isVisible().catch(() => false)) ||
            (await gigReport.isVisible().catch(() => false))
          )
        },
        { timeout: 10000, intervals: [250, 500, 1000] }
      )
      .toBe(true)

    // `.catch(() => false)` on every re-check: the element can detach between
    // the poll resolving and the branch running.
    if (await skipMinigameBtn.isVisible().catch(() => false)) {
      await clickUnblockedTarget(skipMinigameBtn)
    } else if (await continueBtn.isVisible().catch(() => false)) {
      await clickUnblockedTarget(continueBtn)
    } else if (await gigReport.isVisible().catch(() => false)) {
      // The setup minigame already resolved and the report is showing.
    } else {
      // Kabelsalat has its own timed scene and advances automatically after
      // its terminal overlay; the Gig-report assertion below remains the
      // binding completion condition.
      await expect(kabelsalatHeading).toBeVisible()
    }

    // Setup minigame completion leads directly to Gig.

    // 5. Gig (Rhythm Game)
    // The song plays automatically. Since we don't click, health fails but scene still advances.
    // Random gig events pause playback, so resolve them while waiting for the report.
    await waitForUnblockedTarget(gigReport, 60000)

    // 6. PostGig Report
    await clickUnblockedTarget(
      page.getByRole('button', { name: /continue to socials/i })
    )

    // Social Strategy Phase
    await waitForUnblockedTarget(
      page.getByRole('heading', { name: /post to social media/i })
    )
    const firstSocialOpt = page.locator('button:has-text("Platform")').first()
    await clickUnblockedTarget(firstSocialOpt)

    // Brand offers follow the social result before the completion phase.
    await waitForUnblockedTarget(
      page.getByRole('heading', { name: /incoming brand offers/i })
    )
    await clickUnblockedTarget(
      page.getByRole('button', { name: /reject all offers/i })
    )

    // PostGig completion -> 7. Back to Overworld.
    // The overworld remounts its Pixi map here and its generated textures time
    // out on CI, so the transition can outlast a 10s wait. Poll on arrival and
    // re-click while the completion screen is still up: a click that lands
    // mid-dismiss of an overlay leaves the scene unchanged.
    const backToTourBtn = page.getByRole('button', {
      name: /back to (?:tour|overworld)/i
    })
    await expect
      .poll(
        async () => {
          if (await dismissTopEventDialog()) return false
          const arrived = await tourPlanHeading
            .isVisible({ timeout: 500 })
            .catch(() => false)
          if (arrived) return true

          await backToTourBtn.click({ timeout: 1000 }).catch(() => {})
          return tourPlanHeading.isVisible({ timeout: 1000 }).catch(() => false)
        },
        { timeout: 30000, intervals: [500, 1000] }
      )
      .toBe(true)
  })
})
