const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  console.log('Navigating to local app...');
  await page.goto('http://localhost:5173');

  // Skip Intro
  console.log('Skipping intro...');
  await page.getByRole('button', { name: /SKIP INTRO/i }).click();

  // Start Tour
  console.log('Starting tour...');
  await page.getByRole('button', { name: /START TOUR/i }).click();

  // Skip Tutorial
  console.log('Skipping tutorial...');
  const skipTutBtn = page.getByRole('button', { name: /SKIP ALL/i });
  await skipTutBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if (await skipTutBtn.isVisible()) {
    await skipTutBtn.click();
  }

  console.log('Injecting debug command to force KABELSALAT minigame...');
  await page.evaluate(() => {
    window.__E2E_DEBUG_COMMAND = { type: 'START_KABELSALAT_MINIGAME', payload: { gigId: 'test-gig' } };
  });

  // Wait for the minigame scene to render
  console.log('Waiting for Kabelsalat minigame to render...');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'verification.png' });
  console.log('Screenshot saved to verification.png');

  await browser.close();
})();
