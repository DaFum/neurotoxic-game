const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE dimensions
    isMobile: true,
  });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  } catch (err) {
    console.error('Make sure dev server is running on port 5173');
    process.exit(1);
  }

  await page.waitForTimeout(2000);

  const verificationDir = path.join(__dirname, 'verification');
  if (!fs.existsSync(verificationDir)){
    fs.mkdirSync(verificationDir);
  }

  await page.screenshot({ path: path.join(verificationDir, 'mobile_menu.png'), fullPage: true });

  await browser.close();
  console.log('Screenshot saved to verification/mobile_menu.png');
})();
