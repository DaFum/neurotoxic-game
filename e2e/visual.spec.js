import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test('MainMenu loads correctly', async ({ page }) => {
    // Navigate to the app (assuming it runs on localhost:5173 by default)
    await page.goto('/')

    // Wait for the main menu or intro to load
    await page.waitForLoadState('networkidle')

    // Take a screenshot of the main page and compare it
    // In a real setup, this compares against a baseline image
    expect(await page.screenshot()).toMatchSnapshot('main-menu-baseline.png', {
      maxDiffPixelRatio: 0.1
    })
  })
})
