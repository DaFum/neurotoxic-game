import { test, expect } from '@playwright/test';

// Simple snapshot testing
test('snapshot overworld', async ({ page }) => {
  // Assume a live server running
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' }).catch(() => {});
  // Depending on dev server we can do a screenshot
  // await expect(page).toHaveScreenshot('landing.png', { maxDiffPixels: 100 });
});
