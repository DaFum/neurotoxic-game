import { existsSync } from 'node:fs'
import process from 'node:process'
import { chromium } from 'playwright'

const DEFAULT_CI_CHROMIUM_PATH =
  '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome'

export const CHROMIUM_PATH =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  (existsSync(DEFAULT_CI_CHROMIUM_PATH) ? DEFAULT_CI_CHROMIUM_PATH : undefined)

export const GAME_VIEWPORT = { width: 1280, height: 720 }

export async function launchGameBrowser() {
  const browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--mute-audio',
      '--disable-webgl'
    ]
  })

  const context = await browser.newContext({
    viewport: GAME_VIEWPORT
  })

  const page = await context.newPage()

  return { browser, context, page }
}
