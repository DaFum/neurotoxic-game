export async function skipToMenu(page) {
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Try to skip intro if button appears
    try {
      const skipBtn = page.getByRole('button', { name: /skip/i });
      if (await skipBtn.isVisible({ timeout: 5000 })) {
        await skipBtn.click();
      }
    } catch (e) {
      // Ignore visibility check errors
    }

    // Wait for menu
    await page.waitForTimeout(1000);
  } catch (error) {
    console.log('Error in skipToMenu:', error.message);
  }
}
