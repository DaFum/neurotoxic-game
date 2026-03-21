#!/usr/bin/env node
/* eslint-disable no-undef */
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { launchBrowserWithFallback } from './browser-launcher.js'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const OUT_DIR = resolve(process.env.OUT_DIR ?? 'screenshots/scenes')

async function snap(page, name, delay = 500) {
  const file = `${OUT_DIR}/${name}.png`
  await page.waitForTimeout(delay)
  await page.screenshot({ path: file, timeout: 60000 })
  console.log(`  ✓ ${name}.png`)
  return file
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  console.log('🎬 Launching Chromium...')
  const browser = await launchBrowserWithFallback({
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
    console.log('\n📸 Capturing complete game flow...\n')

    // 01. INTRO
    console.log('→ INTRO')
    await page.goto(BASE_URL, { waitUntil: 'commit' })
    await snap(page, '01-intro', 1000)

    // 02. MENU
    console.log('→ MENU')
    try {
      const skipBtn = page.getByRole('button', { name: /skip/i })
      if (await skipBtn.isVisible().catch(() => false)) {
        await skipBtn.click()
        await page.waitForTimeout(800)
      }
    } catch (_e) {
      // continue
    }
    await snap(page, '02-menu')

    // 03. SET BAND IDENTITY (required before game)
    console.log('→ Setting band identity...')
    try {
      const input = page.locator('input[type="text"]')
      const isVisible = await input.isVisible().catch(() => false)
      if (isVisible) {
        await input.fill('Test Band')
        const confirmBtn = page.getByRole('button', { name: /confirm/i })
        await confirmBtn.click()
        // Wait for modal to actually close instead of fixed delay
        try {
          await input.waitFor({ state: 'hidden', timeout: 3000 })
        } catch {
          // If still visible, retry
          console.log('    (retrying identity confirmation)')
          await input.fill('Test Band 2')
          await confirmBtn.click()
          await input.waitFor({ state: 'hidden', timeout: 3000 })
        }
      }
    } catch (_e) {
      console.log('    (skipped - no identity modal)')
    }

    // 04. CREDITS
    console.log('→ CREDITS')
    try {
      const creditsBtn = page.getByRole('button', { name: /credits/i })
      await creditsBtn.click({ timeout: 5000 })
      await snap(page, '04-credits', 800)
      const returnBtn = page.getByRole('button', { name: /return/i })
      await returnBtn.click()
      await page.waitForTimeout(600)
    } catch (_e) {
      console.log('    (skipped)')
    }

    // 05. BAND HQ MODAL
    console.log('→ BAND HQ modal')
    try {
      const bandHqBtn = page.getByRole('button', { name: /band hq/i })
      await bandHqBtn.click({ timeout: 5000 })
      await snap(page, '05-band-hq-modal', 800)
      const leaveBtn = page.getByRole('button', { name: /leave|esc/i })
      await leaveBtn.click()
      await page.waitForTimeout(600)
    } catch (_e) {
      console.log('    (skipped)')
    }

    // 06. OVERWORLD
    console.log('→ OVERWORLD')
    try {
      const startBtn = page.getByRole('button', { name: /start tour/i })
      await startBtn.click({ timeout: 5000 })
      // Verify we're in OVERWORLD by waiting for tour plan heading
      const heading = page.getByRole('heading', {
        name: /tour plan|overworld/i
      })
      await heading.waitFor({ timeout: 5000 })
      await snap(page, '06-overworld', 1200)
    } catch (_e) {
      console.log('    (skipped)')
    }

    // 07. OVERWORLD - SELECT NODE
    console.log('→ OVERWORLD node selection')
    try {
      const node = page.getByRole('button', {
        name: /Travel to (Goldgrube|MTC|Die Distille|Stadtfest|Deichbrand|Wacken)/i
      })
      const visible = await node
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
      if (visible) {
        await node.first().click()
        await snap(page, '07-overworld-node-select', 800)
      }
    } catch (_e) {
      console.log('    (skipped)')
    }

    // 08. TRAVEL MINIGAME
    console.log('→ TRAVEL MINIGAME')
    try {
      const node = page.getByRole('button', {
        name: /Travel to (Goldgrube|MTC|Die Distille|Stadtfest|Deichbrand|Wacken)/i
      })
      const visible = await node
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
      if (visible) {
        await node.first().click()
        await page.locator('canvas').waitFor({ timeout: 10000 })
        await snap(page, '08-travel-minigame', 1000)
        await page.keyboard.press('Shift+P')
        await page.waitForTimeout(800)
      }
    } catch (_e) {
      console.log('    (skipped)')
    }

    // 09. PREGIG
    console.log('→ PREGIG')
    try {
      const continueBtn = page.getByRole('button', { name: /continue/i })
      const visible = await continueBtn
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
      if (visible) {
        await continueBtn.first().click()
        await snap(page, '09-pregig', 1200)
      }
    } catch (_e) {
      console.log('    (skipped)')
    }

    // 10. GIG (canvas)
    console.log('→ GIG scene')
    try {
      const startBtn = page.getByRole('button', { name: /start show/i })
      const visible = await startBtn
        .isVisible({ timeout: 2000 })
        .catch(() => false)
      if (visible) {
        await startBtn.click()
        await page.locator('canvas').waitFor({ timeout: 15000 })
        await snap(page, '10-gig-canvas', 2000)
        await page.keyboard.press('Shift+P')
        await page.waitForTimeout(800)
      }
    } catch (_e) {
      console.log('    (skipped)')
    }

    // 11. POSTGIG
    console.log('→ POSTGIG')
    try {
      const heading = page.getByRole('heading', { name: /gig report/i })
      await heading.waitFor({ timeout: 5000 })
      await snap(page, '11-postgig', 1000)
    } catch (_e) {
      console.log('    (skipped)')
    }

    console.log('\n✅ Scene capture complete!')
    console.log(`\n📁 Screenshots saved to: ${OUT_DIR}`)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

main()
