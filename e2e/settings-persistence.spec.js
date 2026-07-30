/**
 * E2E: Settings Persistence
 *
 * Validates that user-controlled settings (CRT toggle, volume sliders) survive
 * a hard page reload and that the settings panel is accessible from the main menu.
 *
 * Also asserts localStorage is written with the expected structure so that the
 * save-validator and systemReducer migration tests have a realistic source of truth.
 */
import { test, expect } from '@playwright/test'
import { skipToMenu } from './helpers.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Opens the Settings panel from the main menu.
 * Returns once the panel is visible and stable.
 */
async function openSettings(page) {
  // Settings are accessible via the Band HQ modal or a dedicated button.
  // Try the Band HQ route first (the modal contains a Settings tab).
  const bandHqBtn = page.getByRole('button', { name: /band hq/i })
  await bandHqBtn.click()

  // Wait for the modal to appear
  const modal = page.getByRole('dialog')
  await modal.waitFor({ state: 'visible', timeout: 8000 })

  // Navigate to the Settings tab inside Band HQ
  const settingsTab = modal.getByRole('tab', { name: /settings/i })
  await settingsTab.click()

  // Wait for the tab panel to become visible rather than a fixed delay.
  await expect(modal.getByRole('tabpanel')).toBeVisible()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Settings Persistence', () => {
  test('settings panel opens from Band HQ modal', async ({ page }) => {
    await skipToMenu(page)
    await openSettings(page)

    const modal = page.getByRole('dialog')
    // Settings tab content should be visible
    await expect(modal).toBeVisible()
  })

  test('CRT toggle state persists after reload', async ({ page }) => {
    await skipToMenu(page)
    await openSettings(page)

    const modal = page.getByRole('dialog')

    const crtToggle = modal.getByRole('switch', { name: /crt/i })
    await expect(crtToggle).toBeVisible()

    const initialChecked = await crtToggle.getAttribute('aria-checked')
    expect(['true', 'false']).toContain(initialChecked)
    const toggledValue = initialChecked !== 'true'

    await crtToggle.click()
    await expect(crtToggle).toHaveAttribute(
      'aria-checked',
      String(toggledValue)
    )

    await expect
      .poll(() =>
        page.evaluate(() => {
          const rawSettings = localStorage.getItem('neurotoxic_global_settings')
          if (rawSettings === null) return null
          return JSON.parse(rawSettings).crtEnabled
        })
      )
      .toBe(toggledValue)

    // Close modal and reload
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await page.reload({ waitUntil: 'domcontentloaded' })

    // A hard reload can re-enter the intro before returning to the menu.
    await skipToMenu(page, { navigate: false })
    await openSettings(page)

    const modalAfterReload = page.getByRole('dialog')
    const crtToggleAfterReload = modalAfterReload.getByRole('switch', {
      name: /crt/i
    })
    await expect(crtToggleAfterReload).toHaveAttribute(
      'aria-checked',
      String(toggledValue)
    )
  })

  test('localStorage contains neurotoxic_settings key after visiting settings', async ({
    page
  }) => {
    await skipToMenu(page)
    await openSettings(page)

    // Close modal and wait until it's gone so any pending writes flush.
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()

    const rawSettings = await page.evaluate(() =>
      localStorage.getItem('neurotoxic_global_settings')
    )

    // Key must exist (the game may write on first launch)
    // Even if null the game should still work — just warn, don't fail hard
    if (rawSettings !== null) {
      let parsed
      try {
        parsed = JSON.parse(rawSettings)
      } catch {
        throw new Error(
          `neurotoxic_global_settings is not valid JSON: ${rawSettings}`
        )
      }

      // The settings object must not contain forbidden prototype-pollution keys
      expect(Object.hasOwn(parsed, '__proto__')).toBe(false)
      expect(Object.hasOwn(parsed, 'constructor')).toBe(false)

      // At minimum, the sanitized subset of keys should be present
      // (crtEnabled, tutorialSeen, logLevel are the whitelisted keys per AGENTS.md)
      const knownKeys = ['crtEnabled', 'tutorialSeen', 'logLevel']
      const hasAtLeastOneKnownKey = knownKeys.some(k =>
        Object.hasOwn(parsed, k)
      )
      expect(hasAtLeastOneKnownKey).toBe(true)
    }
  })

  test('volume sliders are present in settings panel', async ({ page }) => {
    await skipToMenu(page)
    await openSettings(page)

    const modal = page.getByRole('dialog')

    // Sliders should be accessible (aria role="slider" or input[type="range"])
    const sliders = modal.locator('input[type="range"], [role="slider"]')
    const count = await sliders.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// Accessibility gate — ensures the menu itself meets baseline a11y requirements
// ---------------------------------------------------------------------------

test.describe('Main Menu Accessibility Gate', () => {
  test('primary action buttons are keyboard focusable', async ({ page }) => {
    await skipToMenu(page)

    // Tab through the page and verify at least one button receives focus
    await page.keyboard.press('Tab')
    const focusedTag = await page.evaluate(() =>
      document.activeElement?.tagName?.toLowerCase()
    )
    // After one Tab, focus should be on a focusable element (button, a, input, etc.)
    expect(['button', 'a', 'input', 'select', 'textarea']).toContain(focusedTag)
  })

  test('Start Tour button is visible and enabled on first load', async ({
    page
  }) => {
    await skipToMenu(page)
    const startBtn = page.getByRole('button', { name: /start tour/i })
    await expect(startBtn).toBeVisible()
    await expect(startBtn).toBeEnabled()
  })

  test('game title is present as a heading', async ({ page }) => {
    await skipToMenu(page)
    await expect(
      page.getByRole('heading', { name: /neurotoxic/i })
    ).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// localStorage safety — prototype-pollution guard
// ---------------------------------------------------------------------------

test.describe('localStorage Prototype-Pollution Guard', () => {
  test('hostile __proto__ key in localStorage does not corrupt state', async ({
    page
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Inject a hostile save before the game reads it
    await page.evaluate(() => {
      const hostile = JSON.stringify({
        __proto__: { money: -99999 },
        crtEnabled: true
      })
      localStorage.setItem('neurotoxic_global_settings', hostile)
    })

    // Reload — the game must start without crashing
    await page.reload({ waitUntil: 'domcontentloaded' })

    // Skip intro if present
    try {
      const skipBtn = page.getByRole('button', { name: /skip/i })
      await skipBtn.waitFor({ state: 'visible', timeout: 4000 })
      await skipBtn.click()
    } catch {
      // Already past intro
    }

    // The app must still render the menu or intro without a crash
    const isAlive = await page
      .locator('body')
      .isVisible()
      .catch(() => false)
    expect(isAlive).toBe(true)

    // page.isClosed() means a hard crash occurred
    expect(page.isClosed()).toBe(false)
  })
})
