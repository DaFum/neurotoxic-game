#!/usr/bin/env node
/* eslint-disable no-undef */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const OUT_DIR = resolve(process.env.OUT_DIR ?? 'screenshots/scenes')
const CHROMIUM_PATH =
  '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome'

async function snap(page, name) {
  const file = `${OUT_DIR}/${name}.png`
  await page.screenshot({ path: file, timeout: 60000 })
  console.log(`  ✓ ${name}.png`)
  return file
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  console.log('🎬 Launching Chromium from cache...')
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
    viewport: { width: 1280, height: 720 }
  })

  const page = await context.newPage()

  try {
    console.log('\n📸 Capturing scenes...\n')

    // INTRO
    console.log('Scene 1: INTRO')
    await page.goto(BASE_URL, { waitUntil: 'commit' })
    await page.waitForTimeout(1000)
    await snap(page, '01-intro')

    // MENU (skip tutorial)
    console.log('Scene 2: MENU')
    try {
      const skipBtn = page.getByRole('button', { name: /skip/i })
      if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipBtn.click()
      }
    } catch (_error) {
      console.log('    Skip button not found or error, continuing...')
    }
    await page.waitForTimeout(2000)
    await snap(page, '02-menu')

    console.log('\n✅ Screenshots captured successfully!')
    console.log('  Generated:')
    console.log('    - screenshots/scenes/01-intro.png')
    console.log('    - screenshots/scenes/02-menu.png')
    console.log(
      '\n💡 Note: Full game flow capture requires interactive navigation.'
    )
    console.log(
      '   For a complete tour, run the game manually or use the full screenshot script.'
    )
  } catch (error) {
    console.error('❌ Error capturing scenes:', error.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

main()
