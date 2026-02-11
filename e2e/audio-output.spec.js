import { test, expect } from '@playwright/test';
import { skipToMenu } from './helpers.js';

test.describe('Audio System', () => {
  test('Volume preference persistence', async ({ page }) => {
    // 1. Set volume in localStorage before load
    await page.goto('/'); // Initialize context
    await page.evaluate(() => {
        localStorage.setItem('neurotoxic_vol_music', '0.42');
    });

    // 2. Reload app
    await page.reload();
    await skipToMenu(page);

    // 3. Open Band HQ (Settings)
    await page.getByRole('button', { name: /band hq/i }).click();

    // 4. Verify the slider or internal state reflects the stored value.
    // Since locating the slider might be fragile, we can check if the app wrote back to localStorage
    // or if we can access the state via a global if exposed (it's not).

    // However, if AudioManager loaded correctly, it would have set its internal state to 0.42.
    // When we change it, it updates localStorage.

    // Let's try to change the volume via UI if possible.
    // We look for an input[type="range"].
    const sliders = page.locator('input[type="range"]');
    await expect(sliders).toHaveCount(2); // Music and SFX

    const musicSlider = sliders.first(); // Assuming Music is first
    const val = await musicSlider.inputValue();

    expect(parseFloat(val)).toBeCloseTo(0.42, 1);
  });
});
