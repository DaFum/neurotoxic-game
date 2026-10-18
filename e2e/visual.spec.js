import { test, expect } from '@playwright/test'
import { skipToMenu } from './helpers.js'

test.describe('Visual smoke tests', () => {
  test('MainMenu renders its stable primary hierarchy', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await skipToMenu(page)

    const title = page.getByRole('heading', { name: /neurotoxic/i })
    const startTour = page.getByRole('button', { name: /start tour/i })

    await expect(title).toBeVisible()
    await expect(startTour).toBeVisible()

    const [titleBox, startTourBox] = await Promise.all([
      title.boundingBox(),
      startTour.boundingBox()
    ])

    expect(titleBox).not.toBeNull()
    expect(startTourBox).not.toBeNull()
    expect(titleBox.width).toBeGreaterThan(0)
    expect(titleBox.height).toBeGreaterThan(0)
    expect(startTourBox.width).toBeGreaterThan(0)
    expect(startTourBox.height).toBeGreaterThan(0)
    expect(startTourBox.y).toBeGreaterThan(titleBox.y)
  })

  test('MainMenu CTA stays reachable without horizontal overflow', async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await skipToMenu(page)

    const startTour = page.getByRole('button', { name: /start tour/i })
    await expect(startTour).toBeVisible()
    await startTour.scrollIntoViewIfNeeded()

    const box = await startTour.boundingBox()
    const viewport = page.viewportSize()
    expect(box).not.toBeNull()
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)

    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    )
    expect(overflowX).toBeLessThanOrEqual(0)
  })

  test('MainMenu is operable by keyboard alone', async ({ page }) => {
    await skipToMenu(page)

    // The first Tab can land on the document before the first control.
    const tabbedNames = []
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      tabbedNames.push(
        await page.evaluate(() => {
          const el = document.activeElement
          return el?.tagName === 'BUTTON' ? el.textContent?.trim() : null
        })
      )
    }
    expect(tabbedNames.some(name => /start tour/i.test(name ?? ''))).toBe(true)
  })
})
