import { defineConfig, devices } from '@playwright/test'

// Allow overriding executable path via env var, otherwise let Playwright use default
const launchOptions = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--mute-audio',
    '--disable-webgl'
  ]
}

if (process.env.CHROME_PATH) {
  launchOptions.executablePath = process.env.CHROME_PATH
}

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    headless: true,
    ignoreHTTPSErrors: true,
    launchOptions
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe'
  }
})
