import { test, expect } from '@playwright/test'
import { skipToMenu } from './helpers.js'

test.describe('Audio System', () => {
  test('Volume preference persistence', async ({ page }) => {
    // 1. Set volume in localStorage before load
    await page.goto('/') // Initialize context
    await page.evaluate(() => {
      localStorage.setItem('neurotoxic_vol_music', '0.42')
    })

    // 2. Reload app
    await page.reload()
    await skipToMenu(page)

    // 3. Open Band HQ (Settings)
    await page.getByRole('button', { name: /band hq/i }).click()

    // 4. Navigate to SETTINGS tab
    const bandHqTabs = page.getByRole('tablist', { name: /band hq sections/i })
    await bandHqTabs.getByRole('tab', { name: /^settings$/i }).click()

    // 5. Verify the slider or internal state reflects the stored value.
    // Check if we can select by label text if available.

    const musicSlider = page.getByRole('slider', { name: /music volume/i })

    // Verify visibility first
    await expect(musicSlider).toBeVisible()

    // Check value
    const firstVal = await musicSlider.inputValue()
    expect(parseFloat(firstVal)).toBeCloseTo(0.42, 1)
  })
})
