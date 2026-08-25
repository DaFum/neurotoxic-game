#!/usr/bin/env node
/**
 * screenshot-mobile.js
 *
 * Captures each injectable scene at a mobile viewport (iPhone-class:
 * 390x844, DPR 3, isMobile + touch) by reusing the injection helpers from
 * screenshot-state-inject.js. Output: screenshots/mobile/<fixture>.png
 *
 * Usage:
 *   node .claude/skills/playwright-screenshot/scripts/screenshot-mobile.js [fixture ...]
 *   (no args = all fixtures)
 */

import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { launchBrowserWithFallback } from './browser-launcher.js'
import {
  injectSave,
  navigateToFixtureScene,
  getFixtureNames,
  prepareFixtureCapture
} from './screenshot-state-inject.js'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const OUT_DIR = resolve(process.env.OUT_DIR ?? 'screenshots/mobile')
const HEADLESS = process.env.HEADLESS !== 'false'

const MOBILE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
}

async function captureFixture(browser, fixtureName) {
  const context = await browser.newContext(MOBILE)
  const page = await context.newPage()
  try {
    await page.goto('about:blank')
    await page.goto(BASE_URL, { waitUntil: 'commit' })
    await injectSave(page, fixtureName)
    await page.reload({ waitUntil: 'domcontentloaded' })
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 })
    } catch (err) {
      if (err.name !== 'TimeoutError') throw err
    }
    await navigateToFixtureScene(page, fixtureName)
    // Shared with the desktop runner: waitFor, the fixture's own capture hook,
    // and the scene/minigame/opacity checks. Reimplementing any of it here is
    // how band-hq used to be hand-rolled and band-hq-settings would have
    // photographed the bare menu.
    await prepareFixtureCapture(page, fixtureName)
    await page.waitForTimeout(500)
    const dest = `${OUT_DIR}/${fixtureName}.png`
    await page.screenshot({ path: dest, timeout: 120000 })
    console.log(`✓ ${fixtureName} → ${dest}`)
    return true
  } catch (err) {
    console.error(`✗ ${fixtureName}: ${err.message}`)
    // capture whatever rendered for triage
    await page
      .screenshot({ path: `${OUT_DIR}/${fixtureName}-FAILED.png` })
      .catch(() => {})
    return false
  } finally {
    await context.close()
  }
}

async function main() {
  const requested = process.argv.slice(2)
  const fixtures = requested.length ? requested : getFixtureNames()
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await launchBrowserWithFallback({ headless: HEADLESS })
  const failed = []
  try {
    for (const f of fixtures) {
      const ok = await captureFixture(browser, f)
      if (!ok) failed.push(f)
    }
  } finally {
    await browser.close()
  }
  console.log(`\n📁 Mobile screenshots saved to: ${OUT_DIR}`)
  // Fail the run so CI / scripts don't mistake a partial capture for success.
  if (failed.length) {
    console.error(
      `\n✗ ${failed.length} fixture(s) failed: ${failed.join(', ')}`
    )
    process.exitCode = 1
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
