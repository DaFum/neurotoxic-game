/**
 * Attempts to skip the intro video/scene to reach the main menu.
 * Handles potential race conditions between the skip button appearing and the menu loading.
 * @param {import('@playwright/test').Page} page
 */
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

/**
 * Races a promise against a page crash event and a timeout.
 * Cleans up listeners and timeouts to avoid leaks.
 * @param {import('@playwright/test').Page} page
 * @param {Promise<any>} actionPromise - The promise to wait for (e.g. click()).
 * @param {number} timeoutMs - Timeout in milliseconds.
 * @returns {Promise<'success'|'crash'|'timeout'>} Result of the race.
 */
export async function raceWithCrash(page, actionPromise, timeoutMs = 5000) {
  let crashListener
  let closeListener
  let timeoutId

  // Create promises for crash and timeout
  const crashPromise = new Promise(resolve => {
    crashListener = () => resolve('crash')
    closeListener = () => resolve('crash') // target closed behaves like crash for us
    page.on('crash', crashListener)
    page.on('close', closeListener)
  })

  const timeoutPromise = new Promise(resolve => {
    timeoutId = setTimeout(() => resolve('timeout'), timeoutMs)
  })

  // Wrap action to return specific success signal
  const successPromise = actionPromise.then(() => 'success').catch(err => {
      // If the action failed because of a crash/close, let the crashPromise handle it if possible.
      // But usually, if the page crashes, click() throws "Target closed".
      if (err.message.includes('Target closed') || err.message.includes('crash')) {
          return 'crash'
      }
      throw err
  })

  try {
    const result = await Promise.race([successPromise, crashPromise, timeoutPromise])
    return result
  } finally {
    // Cleanup
    if (crashListener) page.removeListener('crash', crashListener)
    if (closeListener) page.removeListener('close', closeListener)
    clearTimeout(timeoutId)
  }
}
