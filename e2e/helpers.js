import { expect } from '@playwright/test'

/** localStorage key of the shared save slot (`SAVE_KEY` in `usePersistence.ts`). */
export const SAVE_KEY = 'neurotoxic_v3_save'

/**
 * Navigates to and confirms the app's main menu, skipping the intro and any tutorial when available.
 *
 * @remarks
 * Every step is tolerant by design: the intro skip button and the menu race
 * each other, so the helper must cope with the menu already being present, the
 * skip button never appearing, and the tutorial overlay being absent.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page.
 * @param {{ navigate?: boolean, url?: string }} [options] - Navigation options.
 * @param {boolean} [options.navigate=true] - Whether to navigate to the app first. Pass `false` when the caller already reloaded the page.
 * @param {string} [options.url='/'] - The app URL to navigate to, e.g. `/?seed=2` to pin the DEV map seed.
 */
export async function skipToMenu(page, { navigate = true, url = '/' } = {}) {
  try {
    if (navigate) {
      await page.goto(url, { waitUntil: 'domcontentloaded' })
    }

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
    } catch (_e) {
      // Ignore visibility check errors (might have loaded straight to menu)
    }

    // Ensure we are actually on the menu
    await page.getByRole('heading', { name: /neurotoxic/i }).waitFor({
      state: 'visible',
      timeout: 10000
    })

    // Dismiss tutorial if it appears
    try {
      const skipAllBtn = page.getByRole('button', { name: /skip all/i })
      await skipAllBtn.waitFor({ state: 'visible', timeout: 2000 })
      await skipAllBtn.click()
    } catch (_e) {
      // Tutorial might not appear, ignore
    }
  } catch (error) {
    console.log('Error in skipToMenu:', error.message)
    throw error // Don't swallow navigation errors
  }
}

/**
 * Races an action against a page crash event and a timeout.
 * Attaches listeners BEFORE starting the action to ensure no events are missed.
 * @param {import('@playwright/test').Page} page
 * @param {() => Promise<any>} actionFn - Function that returns the promise to wait for (e.g. () => click()).
 * @param {number} timeoutMs - Timeout in milliseconds.
 * @returns {Promise<'success'|'crash'|'timeout'>} Result of the race.
 */
export async function raceWithCrash(page, actionFn, timeoutMs = 5000) {
  let crashListener
  let closeListener
  let timeoutId

  // Create promises for crash and timeout
  // We explicitly create these BEFORE executing actionFn to catch immediate crashes
  const crashPromise = new Promise(resolve => {
    crashListener = () => resolve('crash')
    closeListener = () => resolve('crash') // target closed behaves like crash for us
    page.on('crash', crashListener)
    page.on('close', closeListener)
  })

  const timeoutPromise = new Promise(resolve => {
    timeoutId = setTimeout(() => resolve('timeout'), timeoutMs)
  })

  try {
    // Execute action wrapped to return success signal
    const successPromise = actionFn()
      .then(() => 'success')
      .catch(err => {
        if (
          err.message.includes('Target closed') ||
          err.message.includes('crash')
        ) {
          return 'crash'
        }
        throw err
      })

    const result = await Promise.race([
      successPromise,
      crashPromise,
      timeoutPromise
    ])
    return result
  } finally {
    // Cleanup
    if (crashListener) page.removeListener('crash', crashListener)
    if (closeListener) page.removeListener('close', closeListener)
    clearTimeout(timeoutId)
  }
}

/**
 * Builds one of the Expedition save fixtures inside the page.
 *
 * @remarks
 * The fixtures import game sources that only Vite can resolve, so they are
 * loaded through the dev server rather than in the Node test process.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page, already on the app origin.
 * @param {string} name - Exported builder in `e2e/fixtures/expeditionFixtures.js`.
 * @returns {Promise<any>} The fixture: its raw `save` string plus the facts a spec asserts on.
 */
export async function buildFixture(page, name) {
  return page.evaluate(async fixtureName => {
    const fixtures = await import('/e2e/fixtures/expeditionFixtures.js')
    const build = fixtures[fixtureName]
    if (typeof build !== 'function') {
      throw new Error(`Unknown e2e fixture: ${fixtureName}`)
    }
    return build()
  }, name)
}

/**
 * Evaluates a fixture helper (for example `quoteTravel`) against the live root state.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page.
 * @param {string} name - Exported helper in `e2e/fixtures/expeditionFixtures.js`.
 * @param {unknown[]} args - Arguments after the root state.
 * @returns {Promise<any>} The helper's JSON-serializable result.
 */
export async function evaluateFixtureHelper(page, name, ...args) {
  return page.evaluate(
    async ([helperName, helperArgs]) => {
      const fixtures = await import('/e2e/fixtures/expeditionFixtures.js')
      if (typeof fixtures[helperName] !== 'function') {
        throw new Error(`Unknown e2e fixture helper: ${helperName}`)
      }
      if (!window.gameState) {
        throw new Error('window.gameState is missing: is this a DEV build?')
      }
      return fixtures[helperName](window.gameState, ...helperArgs)
    },
    [name, args]
  )
}

/**
 * Writes raw values into localStorage once, on the app origin, then reloads.
 *
 * @remarks
 * Seeding happens exactly once through the page, never through
 * `addInitScript`: an init script would rewrite the value on every reload and
 * hide exactly the persistence behavior the specs observe.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page.
 * @param {Record<string, string>} entries - Storage key to raw string value.
 * @param {{ url?: string }} [options] - App URL to seed on; defaults to the events-off game.
 */
export async function seedSaveOnce(
  page,
  entries,
  { url = '/?events=off' } = {}
) {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.evaluate(values => {
    for (const [key, value] of Object.entries(values)) {
      window.localStorage.setItem(key, value)
    }
  }, entries)
  await page.reload({ waitUntil: 'domcontentloaded' })
}

/**
 * Loads the seeded save through the real **Load Game** menu button.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page, already on the app origin.
 */
export async function loadSavedGame(page) {
  await skipToMenu(page, { navigate: false })
  const loadButton = page.getByRole('button', { name: /load game/i })
  await loadButton.click()
}

/**
 * Reads the root game state from the DEV-only `window.gameState` getter.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page.
 * @returns {Promise<any>} A structured copy of the root state.
 */
export async function readRootState(page) {
  return page.evaluate(() => {
    if (!window.gameState) {
      throw new Error('window.gameState is missing: is this a DEV build?')
    }
    return window.gameState
  })
}

/**
 * Waits for a DEV test hook and returns a handle to it.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page.
 * @param {'rhythm'|'tourbus'|'tourbusFrames'} name - Hook key on `window.neurotoxicTestHooks`.
 * @param {{ timeout?: number }} [options] - How long to wait for the owner to register it.
 * @returns {Promise<import('@playwright/test').JSHandle>} Handle to the hook object.
 */
export async function getTestHook(page, name, { timeout = 10000 } = {}) {
  try {
    return await page.waitForFunction(
      hookName => window.neurotoxicTestHooks?.[hookName],
      name,
      { timeout }
    )
  } catch (error) {
    throw new Error(
      `Test hook "${name}" was not registered within ${timeout}ms: the ` +
        `component that owns it is not mounted, or this is not a DEV build. ` +
        `(${error.message})`,
      { cause: error }
    )
  }
}

/**
 * Dismisses the first-visit tutorial a freshly loaded Overworld shows.
 *
 * @remarks
 * A fresh browser context always shows it on the first Overworld visit, so
 * its presence is asserted rather than tolerated. Call it only on that first
 * visit: once skipped, the tutorial does not return after a reload.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page, on the Overworld.
 */
export async function dismissTutorial(page) {
  const tutorial = page.getByRole('region', { name: /tutorial/i })
  await expect(tutorial).toBeVisible()
  await tutorial.getByRole('button', { name: /skip all/i }).click()
  await expect(tutorial).toHaveCount(0)
}
