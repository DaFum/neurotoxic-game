export async function skipToMenu(page) {
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Try to skip intro if button appears
    try {
      // Wait for either the skip button OR the menu to be visible
      const skipBtn = page.getByRole('button', { name: /skip/i })
      const menuHeader = page.getByRole('heading', { name: /neurotoxic/i })

      // Race to see what appears first
      await Promise.race([
        skipBtn.waitFor({ state: 'visible', timeout: 5000 }),
        menuHeader.waitFor({ state: 'visible', timeout: 5000 })
      ])

      if (await skipBtn.isVisible()) {
        await skipBtn.click()
      }
    } catch (e) {
      // Ignore visibility check errors (might have loaded straight to menu)
    }

    // Ensure we are actually on the menu
    await page.getByRole('heading', { name: /neurotoxic/i }).waitFor({
      state: 'visible',
      timeout: 10000
    })
  } catch (error) {
    console.log('Error in skipToMenu:', error.message)
    throw error // Don't swallow navigation errors
  }
}
