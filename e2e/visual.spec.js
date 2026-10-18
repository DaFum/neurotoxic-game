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
    let startTourFocused = false
    for (let i = 0; i < 5 && !startTourFocused; i++) {
      await page.keyboard.press('Tab')
      startTourFocused = await page.evaluate(
        () =>
          document.activeElement?.tagName === 'BUTTON' &&
          /start tour/i.test(document.activeElement.textContent ?? '')
      )
    }
    expect(startTourFocused).toBe(true)

    // Keyboard activation, not just focus: a fresh profile gets the name prompt.
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('Tour Prep title is not covered by the HUD', async ({ page }) => {
    await skipToMenu(page)
    await page.getByRole('button', { name: /start expedition/i }).click()
    const title = page.getByRole('heading', { name: /tour prep/i })
    await expect(title).toBeVisible()
    await page.waitForTimeout(500)

    const covered = await title.evaluate(el => {
      const r = el.getBoundingClientRect()
      const top = document.elementFromPoint(r.left + 8, r.top + r.height / 2)
      return !(top === el || el.contains(top))
    })
    expect(covered).toBe(false)
  })

  test('Expedition status tiles are not covered by the radio widget', async ({
    page
  }) => {
    await skipToMenu(page)
    await page.getByRole('button', { name: /start expedition/i }).click()
    await page.getByRole('heading', { name: /tour prep/i }).waitFor()
    const startTour = page.getByRole('button', { name: /start tour/i })
    await startTour.scrollIntoViewIfNeeded()
    await startTour.click()
    await page
      .getByText(/tour plan/i)
      .first()
      .waitFor()
    await page.waitForTimeout(800)

    const covered = await page.evaluate(() => {
      const label = [...document.querySelectorAll('div,span,p')].find(
        el => el.children.length === 0 && /^FUEL$/i.test(el.textContent?.trim())
      )
      const tile = label?.parentElement
      if (!tile) return null
      // Desktop lays the strip below the fold; only scroll when it is off
      // screen, so the phone layout is measured at its natural position.
      const first = tile.getBoundingClientRect()
      if (first.top < 0 || first.bottom > window.innerHeight) {
        tile.scrollIntoView({ block: 'nearest' })
      }
      const r = tile.getBoundingClientRect()
      const top = document.elementFromPoint(
        r.left + r.width / 2,
        r.top + r.height / 2
      )
      return !(top === tile || tile.contains(top))
    })
    expect(covered).toBe(false)
  })
})
