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
    console.log('\n📸 Capturing all scenes...\n')

    // 01. INTRO
    console.log('→ Scene 1: INTRO')
    await page.goto(BASE_URL, { waitUntil: 'commit' })
    await page.waitForTimeout(1000)
    await snap(page, '01-intro')

    // 02. MENU (skip tutorial)
    console.log('→ Scene 2: MENU')
    try {
      const skipBtn = page.getByRole('button', { name: /skip/i })
      if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipBtn.click()
        await page.waitForTimeout(800)
      }
    } catch (_error) {
      // continue
    }
    await snap(page, '02-menu')

    // 03. CREDITS
    console.log('→ Scene 3: CREDITS')
    try {
      const creditsBtn = page.getByRole('button', { name: /credits/i })
      await creditsBtn.click({ timeout: 5000 })
      await page.waitForTimeout(1200)
      await snap(page, '03-credits')
      const returnBtn = page.getByRole('button', { name: /return/i })
      await returnBtn.click()
      await page.waitForTimeout(600)
    } catch (_error) {
      console.log('    (skipped)')
    }

    // 04. BAND HQ MODAL
    console.log('→ Scene 4: BAND HQ modal')
    try {
      const bandHqBtn = page.getByRole('button', { name: /band hq/i })
      await bandHqBtn.click({ timeout: 5000 })
      await page.waitForTimeout(1200)
      await snap(page, '04-band-hq-modal')
      const leaveBtn = page.getByRole('button', { name: /leave/i })
      await leaveBtn.click()
      await page.waitForTimeout(600)
    } catch (_error) {
      console.log('    (skipped)')
    }

    // 05. OVERWORLD
    console.log('→ Scene 5: OVERWORLD')
    try {
      const startBtn = page.getByRole('button', { name: /start tour/i })
      await startBtn.click({ timeout: 5000 })
      await page.waitForTimeout(2000)
      await snap(page, '05-overworld')
    } catch (_error) {
      console.log('    (skipped)')
    }

    // 06. OVERWORLD - CONFIRM TRAVEL
    console.log('→ Scene 6: OVERWORLD confirm')
    try {
      const node = page.getByRole('button', {
        name: /Travel to (Goldgrube|MTC|Die Distille|Stadtfest|Deichbrand|Wacken)/i
      })
      await node.first().click({ timeout: 5000 })
      await page.waitForTimeout(800)
      await snap(page, '06-overworld-confirm')
    } catch (_error) {
      console.log('    (skipped)')
    }

    // 07. TRAVEL MINIGAME
    console.log('→ Scene 7: TRAVEL MINIGAME')
    try {
      const node = page.getByRole('button', {
        name: /Travel to (Goldgrube|MTC|Die Distille|Stadtfest|Deichbrand|Wacken)/i
      })
      await node.first().click({ timeout: 5000 })
      await page.locator('canvas').waitFor({ timeout: 10000 })
      await page.waitForTimeout(1000)
      await snap(page, '07-travel-minigame')
      // Skip via Shift+P
      await page.keyboard.press('Shift+P')
      await page.waitForTimeout(800)
    } catch (_error) {
      console.log('    (skipped)')
    }

    // 08. PREGIG
    console.log('→ Scene 8: PREGIG')
    try {
      const continueBtn = page.getByRole('button', { name: /continue/i })
      await continueBtn.first().click({ timeout: 5000 })
      await page.waitForTimeout(1500)
      await snap(page, '08-pregig')
    } catch (_error) {
      console.log('    (skipped)')
    }

    // 09. GIG
    console.log('→ Scene 9: GIG (canvas)')
    try {
      const startBtn = page.getByRole('button', { name: /start show/i })
      await startBtn.click({ timeout: 5000 })
      await page.locator('canvas').waitFor({ timeout: 15000 })
      await page.waitForTimeout(2000)
      await snap(page, '09-gig')
      // Skip via Shift+P
      await page.keyboard.press('Shift+P')
      await page.waitForTimeout(800)
    } catch (_error) {
      console.log('    (skipped)')
    }

    // 10. POSTGIG
    console.log('→ Scene 10: POSTGIG')
    try {
      await page.waitForTimeout(1500)
      await snap(page, '10-postgig')
    } catch (_error) {
      console.log('    (skipped)')
    }

    await mkdir(OUT_DIR, { recursive: true }).catch(() => [])
    console.log('\n✅ Scene capture complete!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

main()
