#!/usr/bin/env node
/**
 * screenshot-all-scenes.js
 *
 * Captures a screenshot of every reachable Neurotoxic game scene in one pass.
 * Uses the full golden-path flow: INTRO → MENU → OVERWORLD → TRAVEL → PREGIG
 *   → PRE_GIG_MINIGAME → GIG (auto-fail) → POSTGIG → back to OVERWORLD.
 *
 * After the golden path, GAMEOVER and CLINIC are captured via state injection
 * (these scenes cannot be reliably reached through normal gameplay flow).
 *
 * Usage:
 *   node .claude/skills/playwright-screenshot/scripts/screenshot-all-scenes.js
 *
 * Options (env vars):
 *   BASE_URL=http://localhost:5173   App URL (default)
 *   OUT_DIR=screenshots/scenes       Output directory (default)
 *   HEADLESS=true                    Run headless (default true)
 *   SLOWMO=0                         Playwright slowMo in ms (default 0)
 */

import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { launchBrowserWithFallback } from './browser-launcher.js'
import { injectSave } from './screenshot-state-inject.js'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const OUT_DIR = resolve(process.env.OUT_DIR ?? 'screenshots/scenes')
const HEADLESS = process.env.HEADLESS !== 'false'
const SLOWMO = Number(process.env.SLOWMO ?? 0)

async function snap(page, name) {
  const file = `${OUT_DIR}/${name}.png`
  await page.screenshot({ path: file, timeout: 60000 })
  console.log(`  ✓ ${name}.png`)
  return file
}

async function waitSettle(page, ms = 400) {
  await page.waitForTimeout(ms)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await launchBrowserWithFallback({
    headless: HEADLESS,
    slowMo: SLOWMO
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  })
  const page = await context.newPage()

  try {
    // ── 1. INTRO ────────────────────────────────────────────────────────────
    console.log('→ INTRO')
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')
    await waitSettle(page, 800)
    await snap(page, '01-intro')

    // ── 2. MENU ─────────────────────────────────────────────────────────────
    console.log('→ MENU')
    const skipBtn = page.getByRole('button', { name: /skip/i })
    const menuHeading = page.getByRole('heading', { name: /neurotoxic/i })

    await Promise.race([
      skipBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {}),
      menuHeading.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {})
    ])

    if (await skipBtn.isVisible()) {
      await skipBtn.click()
    }

    await menuHeading.waitFor({ state: 'visible', timeout: 10000 })

    // Dismiss tutorial if present
    try {
      const skipAll = page.getByRole('button', { name: /skip all/i })
      await skipAll.waitFor({ state: 'visible', timeout: 2000 })
      await skipAll.click()
    } catch (_) {}

    await waitSettle(page)
    await snap(page, '02-menu')

    // ── 3. CREDITS ──────────────────────────────────────────────────────────
    console.log('→ CREDITS')
    await page.getByRole('button', { name: /credits/i }).click()
    await page
      .getByRole('heading', { name: /credits/i })
      .waitFor({ state: 'visible' })
    await waitSettle(page)
    await snap(page, '03-credits')
    await page.getByRole('button', { name: /return/i }).click()
    await menuHeading.waitFor({ state: 'visible' })

    // ── 4. BAND HQ (modal overlay on MENU) ──────────────────────────────────
    console.log('→ BAND HQ modal')
    await page.getByRole('button', { name: /band hq/i }).click()
    await page
      .getByRole('heading', { name: /band hq/i })
      .waitFor({ state: 'visible' })
    await waitSettle(page)
    await snap(page, '04-band-hq-modal')
    await page.getByRole('button', { name: /leave \[esc\]/i }).click()
    await menuHeading.waitFor({ state: 'visible' })

    // ── 5. OVERWORLD ────────────────────────────────────────────────────────
    console.log('→ OVERWORLD')
    await page.getByRole('button', { name: /start tour/i }).click()

    let overworldVisible = false
    try {
      await page.getByRole('heading', { name: /tour plan/i }).waitFor({
        state: 'visible',
        timeout: 8000
      })
      overworldVisible = true
    } catch (_) {
      console.warn(
        '  ⚠ Overworld did not load (possible audio crash) — skipping downstream scenes'
      )
    }

    if (overworldVisible) {
      await waitSettle(page)
      await snap(page, '05-overworld')

      // ── 6. TRAVEL NODE confirmation tooltip ─────────────────────────────
      console.log('→ OVERWORLD (node selected / confirm)')
      const travelNode = page
        .getByRole('button', {
          name: /Travel to (Goldgrube|MTC|Die Distille|Stadtfest|Deichbrand|Wacken)/i
        })
        .first()

      try {
        await travelNode.waitFor({ state: 'visible', timeout: 5000 })
        await travelNode.click()
        await page
          .getByText('CONFIRM?')
          .waitFor({ state: 'visible', timeout: 3000 })
        await waitSettle(page, 200)
        await snap(page, '06-overworld-confirm')

        // ── 7. TRAVEL MINIGAME ─────────────────────────────────────────────
        console.log('→ TRAVEL_MINIGAME')
        await travelNode.click() // confirm travel
        await page
          .getByText('TOURBUS TERROR')
          .waitFor({ state: 'visible', timeout: 10000 })
        await waitSettle(page, 600)
        await snap(page, '07-travel-minigame')

        // Backdoor-complete minigame
        await page.keyboard.press('Shift+P')
        await page.waitForTimeout(500)
        const continueBtn = page.getByRole('button', {
          name: /continue/i,
          exact: true
        })
        await continueBtn.waitFor({ state: 'visible', timeout: 10000 })
        await snap(page, '07b-travel-minigame-complete')
        await continueBtn.click()

        // ── 8. Handle random events ────────────────────────────────────────
        for (let i = 0; i < 3; i++) {
          try {
            const firstOption = page
              .locator('button', { hasText: /^1 / })
              .first()
            await firstOption.waitFor({ state: 'visible', timeout: 2000 })
            await snap(page, `08-event-modal-${i + 1}`)
            await firstOption.click()
            await page.waitForTimeout(800)
          } catch (_) {
            break
          }
        }

        // ── 9. PREGIG ─────────────────────────────────────────────────────
        console.log('→ PREGIG')
        await page.getByRole('heading', { name: /preparation/i }).waitFor({
          state: 'visible',
          timeout: 15000
        })
        await waitSettle(page)
        await snap(page, '09-pregig')

        // Select first song
        const firstSong = page.getByText('01 Kranker Schrank')
        await firstSong.waitFor({ state: 'visible', timeout: 5000 })
        await firstSong.click()
        await waitSettle(page, 200)
        await snap(page, '09b-pregig-setlist-selected')

        // ── 10. PRE_GIG_MINIGAME ──────────────────────────────────────────
        console.log('→ PRE_GIG_MINIGAME')
        await page.getByRole('button', { name: /start show/i }).click()
        // Wait for the canvas to actually be visible before screenshotting
        await page
          .locator('canvas')
          .waitFor({ state: 'visible', timeout: 10000 })
          .catch(() => {})
        await page.waitForTimeout(600) // let Pixi render first frame
        await snap(page, '10-pregig-minigame')

        await page.keyboard.press('Shift+P')
        await page.waitForTimeout(1500)

        const miniContinue = page.getByRole('button', {
          name: /continue/i,
          exact: true
        })
        if (await miniContinue.isVisible()) {
          await snap(page, '10b-pregig-minigame-complete')
          await miniContinue.click()
        }

        // ── 11. GIG (rhythm game canvas + auto-fail for report) ───────────
        console.log('→ GIG (canvas capture, then Shift+P for report)')
        const gigReport = page.getByRole('heading', { name: /gig report/i })
        try {
          // Capture mid-gig canvas while notes are falling
          await page
            .locator('canvas')
            .waitFor({ state: 'visible', timeout: 15000 })
            .catch(() => {})
          await page.waitForTimeout(1500) // let notes render
          await snap(page, '11-gig-canvas')
          await snap(page, '11b-gig-full') // full viewport captures canvas + HUD overlay

          // Use Shift+P backdoor to skip to end instead of waiting 90s for auto-fail
          await page.keyboard.press('Shift+P')
          await gigReport.waitFor({ state: 'visible', timeout: 15000 })
          await waitSettle(page)
          await snap(page, '12-postgig-report')

          // ── 13. POSTGIG social phase ────────────────────────────────────
          console.log('→ POSTGIG (social)')
          await page
            .getByRole('button', { name: /continue to socials/i })
            .click()
          await page
            .getByRole('heading', { name: /post to social media/i })
            .waitFor({
              state: 'visible'
            })
          await waitSettle(page)
          await snap(page, '13-postgig-social')

          await page
            .getByRole('button', { name: /back to tour/i })
            .waitFor({ state: 'visible' })
          await waitSettle(page)
          await snap(page, '13b-postgig-result')

          await page.getByRole('button', { name: /back to tour/i }).click()
          await page
            .getByRole('heading', { name: /tour plan/i })
            .waitFor({ state: 'visible' })
          await snap(page, '14-overworld-after-gig')
        } catch (_) {
          console.warn(
            '  ⚠ GIG/POSTGIG capture failed — gig may still be running'
          )
        }
      } catch (err) {
        console.warn('  ⚠ Travel/Gig flow failed:', err.message)
      }
    }

    // ── 15. GAMEOVER (state injection — cannot be reached via normal gameplay) ──
    console.log('→ GAMEOVER (state inject)')
    try {
      await page.goto(BASE_URL, { waitUntil: 'commit' })
      await injectSave(page, 'gameover')
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle')
      await page
        .getByRole('heading', { name: /game over/i })
        .waitFor({ state: 'visible', timeout: 10000 })
      await waitSettle(page, 400)
      await snap(page, '15-gameover')
    } catch (err) {
      console.warn('  ⚠ GAMEOVER capture failed:', err.message)
    }

    // ── 16. CLINIC (state injection — accessible from specific overworld nodes) ─
    console.log('→ CLINIC (state inject)')
    try {
      await page.goto(BASE_URL, { waitUntil: 'commit' })
      await injectSave(page, 'clinic')
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle')
      await waitSettle(page, 500)
      await snap(page, '16-clinic')
    } catch (err) {
      console.warn('  ⚠ CLINIC capture failed:', err.message)
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    const { readdir } = await import('node:fs/promises')
    const captured = (await readdir(OUT_DIR).catch(() => [])).filter(f =>
      f.endsWith('.png')
    )
    console.log(`\nDone. ${captured.length} screenshot(s) saved to ${OUT_DIR}/`)
    if (captured.length > 0) {
      captured.forEach(f => console.log(`  ${OUT_DIR}/${f}`))
    }
  } finally {
    await browser.close()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
