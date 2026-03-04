import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to local dev server
  await page.goto('http://localhost:5173/');

  // Skip intro
  console.log('Skipping intro...');
  await page.waitForSelector('text="SKIP INTRO"');
  await page.click('text="SKIP INTRO"');

  // Skip tutorial if present
  try {
    const skipAll = await page.waitForSelector('text="SKIP ALL"', { timeout: 2000 });
    if (skipAll) {
      console.log('Skipping tutorial...');
      await skipAll.click();
    }
  } catch (e) {
    console.log('No tutorial skip button found.');
  }

  // Open Band HQ
  console.log('Opening Band HQ...');
  await page.waitForSelector('button:has-text("BAND HQ")');
  await page.click('button:has-text("BAND HQ")');

  // Wait for the modal to be visible
  await page.waitForSelector('text="BAND HQ"');
  await page.waitForTimeout(1000); // Let UI settle

  // Click on UPGRADES tab
  console.log('Switching to UPGRADES tab...');
  await page.locator('button:has-text("UPGRADES")').click();

  await page.waitForTimeout(1000); // Let UPGRADES load

  // Click on HQ tab if there are sub-tabs (like VAN and HQ)
  console.log('Switching to HQ tab...');
  try {
     // sometimes the subtabs are 'HQ' and 'VAN'
     await page.locator('button:has-text("HQ")').click();
     await page.waitForTimeout(1000);
  } catch (e) {
     console.log('No sub-HQ tab found, proceeding...');
  }

  console.log('Taking screenshot...');
  await page.screenshot({ path: '/home/jules/verification/hq_upgrades.png' });

  console.log('Verification Complete.');
  await browser.close();
})();
