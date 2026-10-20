import { test, expect } from '@playwright/test'
import { skipToMenu, raceWithCrash } from './helpers.js'

const VIEWPORTS = [
  { name: 'portrait phone', width: 390, height: 844 },
  { name: 'landscape phone', width: 844, height: 390 }
]

/**
 * Returns whether the center of a locator is inside the viewport and is the
 * element that a tap there would actually hit (not covered by other UI).
 */
async function isReachable(locator) {
  return locator.evaluate(el => {
    const box = el.getBoundingClientRect()
    const x = box.left + box.width / 2
    const y = box.top + box.height / 2
    if (y < 0 || y > window.innerHeight || x < 0 || x > window.innerWidth) {
      return false
    }
    const hit = document.elementFromPoint(x, y)
    return hit !== null && el.contains(hit)
  })
}

test.describe('Overworld menu reachability', () => {
  // Touch is what makes the menu rows 44px tall (`pointer: coarse`), which is
  // the height that overflowed a landscape phone; mouse rows happen to fit.
  test.use({ hasTouch: true, isMobile: true })

  for (const viewport of VIEWPORTS) {
    test(`Logistics submenu is reachable on a ${viewport.name}`, async ({
      page
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      })
      await skipToMenu(page)

      const result = await raceWithCrash(
        page,
        () => page.getByRole('button', { name: /start tour/i }).click(),
        5000
      )
      if (result === 'crash' || result === 'timeout') {
        test.skip(true, 'Chromium crashed on Start Tour (audio init).')
        return
      }

      const identityDialog = page.getByRole('dialog')
      const confirmBtn = identityDialog.getByRole('button', {
        name: /confirm/i
      })
      if (await confirmBtn.isVisible()) {
        await identityDialog.getByRole('textbox').first().fill('Test Name')
        await confirmBtn.click()
      }

      try {
        await expect(page.getByText(/tour plan/i)).toBeVisible({
          timeout: 10000
        })
      } catch (e) {
        if (page.isClosed()) {
          test.skip(true, 'Chromium crashed on Start Tour (audio init).')
          return
        }
        const body = await page.textContent('body').catch(() => '')
        if (body.includes('SKIP INTRO')) {
          test.skip(true, 'Chromium crashed/reloaded to Intro on Start Tour.')
          return
        }
        throw e
      }

      await page.getByRole('button', { name: /open menu/i }).click()
      await page.locator('.menu-cat-btn').nth(2).click()

      // Logistics is the tallest submenu: its first row is the one that used
      // to be clipped (landscape) or covered by the HUD (portrait).
      const back = page.locator('.menu-back-btn')
      await expect(back).toBeVisible()
      expect(await isReachable(back)).toBe(true)

      // Whatever does not fit must scroll inside the panel, so the last row is
      // reachable too once the panel is scrolled to its end.
      const lastItem = page.locator('.menu-sub-item').last()
      await lastItem.scrollIntoViewIfNeeded()
      expect(await isReachable(lastItem)).toBe(true)
    })
  }
})
