import { test, expect } from '@playwright/test'
import { skipToMenu } from './helpers.js'

test.describe('Visual smoke tests', () => {
  test('MainMenu renders its stable primary hierarchy', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await skipToMenu(page)

    const title = page.getByRole('heading', { name: /neurotoxic/i })
    const startTour = page.getByRole('button', { name: /start tour/i })

    await expect(title).toBeVisible()
    await expect(startTour).toBeVisible()

    const [titleBox, startTourBox] = await Promise.all([
      title.boundingBox(),
      startTour.boundingBox()
    ])

    expect(titleBox).not.toBeNull()
    expect(startTourBox).not.toBeNull()
    expect(titleBox.width).toBeGreaterThan(0)
    expect(titleBox.height).toBeGreaterThan(0)
    expect(startTourBox.width).toBeGreaterThan(0)
    expect(startTourBox.height).toBeGreaterThan(0)
    expect(startTourBox.y).toBeGreaterThan(titleBox.y)
  })

  test('MainMenu CTA stays reachable without horizontal overflow', async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await skipToMenu(page)

    const startTour = page.getByRole('button', { name: /start tour/i })
    await expect(startTour).toBeVisible()
    await startTour.scrollIntoViewIfNeeded()

    const box = await startTour.boundingBox()
    const viewport = page.viewportSize()
    expect(box).not.toBeNull()
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)

    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    )
    expect(overflowX).toBeLessThanOrEqual(0)
  })

  test('MainMenu is operable by keyboard alone', async ({ page }) => {
    await skipToMenu(page)

    // The first Tab can land on the document before the first control.
    let startTourFocused = false
    for (let i = 0; i < 5 && !startTourFocused; i++) {
      await page.keyboard.press('Tab')
      startTourFocused = await page.evaluate(
        () =>
          document.activeElement?.tagName === 'BUTTON' &&
          /start tour/i.test(document.activeElement.textContent ?? '')
      )
    }
    expect(startTourFocused).toBe(true)

    // Keyboard activation, not just focus: a fresh profile gets the name prompt.
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('Tour Prep title is not covered by the HUD', async ({ page }) => {
    await skipToMenu(page)
    await page.getByRole('button', { name: /start expedition/i }).click()
    const title = page.getByRole('heading', { name: /tour prep/i })
    await expect(title).toBeVisible()
    await page.waitForTimeout(500)

    const covered = await title.evaluate(el => {
      const r = el.getBoundingClientRect()
      const top = document.elementFromPoint(r.left + 8, r.top + r.height / 2)
      return !(top === el || el.contains(top))
    })
    expect(covered).toBe(false)
  })

  test('Expedition status tiles are not covered by the radio widget', async ({
    page
  }) => {
    await skipToMenu(page)
    await page.getByRole('button', { name: /start expedition/i }).click()
    await page.getByRole('heading', { name: /tour prep/i }).waitFor()
    const startTour = page.getByRole('button', { name: /start tour/i })
    await startTour.scrollIntoViewIfNeeded()
    await startTour.click()
    await page
      .getByText(/tour plan/i)
      .first()
      .waitFor()
    await page.waitForTimeout(800)

    const covered = await page.evaluate(() => {
      const label = [...document.querySelectorAll('div,span,p')].find(
        el => el.children.length === 0 && /^FUEL$/i.test(el.textContent?.trim())
      )
      const tile = label?.parentElement
      if (!tile) return null
      // Desktop lays the strip below the fold; only scroll when it is off
      // screen, so the phone layout is measured at its natural position.
      const first = tile.getBoundingClientRect()
      if (first.top < 0 || first.bottom > window.innerHeight) {
        tile.scrollIntoView({ block: 'nearest' })
      }
      const r = tile.getBoundingClientRect()
      const top = document.elementFromPoint(
        r.left + r.width / 2,
        r.top + r.height / 2
      )
      return !(top === tile || tile.contains(top))
    })
    expect(covered).toBe(false)
  })

  test('Event outcome keeps CONTINUE visible and clickable', async ({
    page
  }) => {
    await skipToMenu(page)
    await page.getByRole('button', { name: /start tour/i }).click()
    // A fresh profile gets a name prompt first.
    const prompt = page.getByRole('dialog')
    if (await prompt.isVisible({ timeout: 3000 }).catch(() => false)) {
      const input = prompt.getByRole('textbox').first()
      if (await input.count()) await input.fill('Tester')
      await prompt.getByRole('button', { name: /confirm/i }).click()
    }
    await page
      .getByText(/tour plan/i)
      .first()
      .waitFor()

    // DEV-only hook: open a real, content-heavy event without playing to it.
    // The module path is passed in, not written as an import literal: only the
    // dev server can resolve it, so a static scan would flag it as unresolved.
    await page.evaluate(async eventsModulePath => {
      const { EVENTS_DB } = await import(eventsModulePath)
      const all = Array.isArray(EVENTS_DB)
        ? EVENTS_DB.flat()
        : Object.values(EVENTS_DB).flat()
      window.gameState.setActiveEvent(
        all.find(e => e.id === 'consequences_bandmate_scandal')
      )
    }, '/src/data/events/index.ts')
    const dialog = page.locator(
      '[role="dialog"][aria-labelledby="event-title"]'
    )
    await expect(dialog).toBeVisible()
    await page.keyboard.press('1')

    const next = dialog.getByRole('button', { name: /continue/i })
    await expect(next).toBeVisible()

    // Poll until the dialog's entry animation settles, rather than a fixed delay.
    await expect
      .poll(() =>
        next.evaluate(el => {
          const r = el.getBoundingClientRect()
          const top = document.elementFromPoint(
            r.left + r.width / 2,
            r.top + r.height / 2
          )
          return {
            hidden: !(top === el || el.contains(top)),
            insideViewport: r.top >= 0 && r.bottom <= window.innerHeight
          }
        })
      )
      .toEqual({ hidden: false, insideViewport: true })
  })

  test('Tour Prep HUD panels do not overlap and band details collapse on phones', async ({
    page
  }) => {
    await skipToMenu(page)
    await page.getByRole('button', { name: /start expedition/i }).click()
    await page.getByRole('heading', { name: /tour prep/i }).waitFor()
    await expect(page.getByText(/band status/i).first()).toBeVisible()

    const rects = await page.evaluate(() => {
      const panels = [...document.querySelectorAll('div')].filter(el =>
        el.className.toString().includes('border-2')
      )
      const band = panels.find(el =>
        /BAND STATUS/i.test(el.firstElementChild?.textContent ?? '')
      )
      const player = panels.find(
        el =>
          /Day \d+/.test(el.textContent ?? '') &&
          el !== band &&
          !band?.contains(el)
      )
      const box = el => {
        const r = el?.getBoundingClientRect()
        return (
          r && { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
        )
      }
      // Content spilling out of the card is how the readouts got cut off.
      const spill = player
        ? Math.max(
            0,
            ...[...player.querySelectorAll('*')].map(
              c =>
                c.getBoundingClientRect().right -
                player.getBoundingClientRect().right
            )
          )
        : -1
      return { band: box(band), player: box(player), spill }
    })
    expect(rects.spill).toBeLessThanOrEqual(1)
    expect(rects.band).toBeTruthy()
    expect(rects.player).toBeTruthy()
    const overlaps =
      rects.player.left < rects.band.right &&
      rects.band.left < rects.player.right &&
      rects.player.top < rects.band.bottom &&
      rects.band.top < rects.player.bottom
    expect(overlaps).toBe(false)

    const toggle = page.getByRole('button', { name: /band details/i })
    const member = page.getByText('Matze', { exact: true }).first()
    const isPhone = page.viewportSize().width < 640
    if (isPhone) {
      await expect(member).toBeHidden()
      await toggle.click()
      await expect(member).toBeVisible()
    } else {
      await expect(toggle).toBeHidden()
      await expect(member).toBeVisible()
    }
  })

  test('Expedition map and resources fit the first screen', async ({
    page
  }) => {
    await skipToMenu(page)
    await page.getByRole('button', { name: /start expedition/i }).click()
    await page.getByRole('heading', { name: /tour prep/i }).waitFor()
    const startTour = page.getByRole('button', { name: /start tour/i })
    await startTour.scrollIntoViewIfNeeded()
    await startTour.click()
    await page
      .getByText(/tour plan/i)
      .first()
      .waitFor()
    await expect(page.locator('.map-wrap')).toBeVisible()
    await expect(page.getByTestId('expedition-status-strip')).toBeVisible()
    // The Expedition strip already carries the resources; no second line.
    await expect(page.getByTestId('overworld-phone-resources')).toHaveCount(0)

    const m = await page.evaluate(() => {
      const map = document.querySelector('.map-wrap').getBoundingClientRect()
      const strip = document
        .querySelector('[data-testid="expedition-status-strip"]')
        .getBoundingClientRect()
      const visible = Math.max(
        0,
        Math.min(map.bottom, window.innerHeight) - Math.max(map.top, 0)
      )
      return { visible, stripBottom: strip.bottom, vh: window.innerHeight }
    })
    const { width } = page.viewportSize()
    if (width < 390) {
      // Smallest phones: secondary HUD blocks sit below the map, so a real
      // slice of it is on screen next to the resource strip.
      expect(m.visible).toBeGreaterThanOrEqual(200)
    }
    if (width < 641) {
      // Phone: the fixed menu bar never covers the shortcuts help button once
      // it is scrolled to.
      const help = page.getByRole('button', { name: /keyboard shortcuts/i })
      await help.scrollIntoViewIfNeeded()
      const helpBox = await help.boundingBox()
      const menuBox = await page
        .getByRole('button', { name: /open menu/i })
        .boundingBox()
      if (helpBox === null || menuBox === null) {
        throw new Error('Expected both HUD buttons to be visible')
      }
      expect(helpBox.y + helpBox.height).toBeLessThanOrEqual(menuBox.y)
    }
    if (width >= 1024) {
      // Desktop: the resource strip is on screen without scrolling.
      expect(m.stripBottom).toBeLessThanOrEqual(m.vh)
    } else if (width >= 390 && width < 641) {
      // Phone: at least a third of the first screen shows the map.
      expect(m.visible).toBeGreaterThanOrEqual(m.vh / 3)
    }
  })

  test('Career map is usable on the first phone screen', async ({ page }) => {
    // Seed 2 has a dense start cluster at 320px (the Distillery and Stendal
    // Town Festival labels stacked before the phone label rules).
    await skipToMenu(page, { url: '/?seed=2' })
    await page.getByRole('button', { name: /start tour/i }).click()
    // A fresh profile gets a name prompt first.
    const prompt = page.getByRole('dialog')
    if (await prompt.isVisible({ timeout: 3000 }).catch(() => false)) {
      const input = prompt.getByRole('textbox').first()
      if (await input.count()) await input.fill('Tester')
      await prompt.getByRole('button', { name: /confirm/i }).click()
    }
    await page
      .getByText(/tour plan/i)
      .first()
      .waitFor()
    await expect(page.locator('.map-wrap')).toBeVisible()
    await page.waitForTimeout(800)

    const { width } = page.viewportSize()
    test.skip(width >= 641, 'Phone layout only')

    const m = await page.evaluate(() => {
      const map = document.querySelector('.map-wrap').getBoundingClientRect()
      const menuBar = [...document.querySelectorAll('.ow-menu button')]
        .pop()
        .getBoundingClientRect()
      // Map the player can actually see and tap: on screen and above the fixed
      // OPEN MENU bar.
      const usable = Math.max(
        0,
        Math.min(map.bottom, menuBar.top, window.innerHeight) -
          Math.max(map.top, 0)
      )
      const labels = [...document.querySelectorAll('.map-node span.uppercase')]
        .map(el => el.getBoundingClientRect())
        .filter(r => r.width > 0 && r.height > 0)
      let overlaps = 0
      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          const a = labels[i]
          const b = labels[j]
          if (
            a.left < b.right &&
            b.left < a.right &&
            a.top < b.bottom &&
            b.top < a.bottom
          ) {
            overlaps++
          }
        }
      }
      const hud = [...document.querySelectorAll('button')]
        .find(b =>
          /keyboard shortcuts/i.test(b.getAttribute('aria-label') ?? '')
        )
        ?.getBoundingClientRect()
      const strip = document
        .querySelector('[data-testid="overworld-phone-resources"]')
        ?.getBoundingClientRect()
      return {
        usable,
        mapTop: map.top,
        hudTop: hud?.top ?? Infinity,
        stripBottom: strip?.bottom ?? Infinity,
        overlaps
      }
    })
    // The map comes before the status blocks, so it is not pushed below the
    // fold (it used to leave ~100px at 320x568, all of it under the menu bar).
    expect(m.usable).toBeGreaterThanOrEqual(200)
    expect(m.mapTop).toBeLessThan(m.hudTop)
    // Cash, fuel and condition stay on the first screen, above the map, even
    // though the full status card now sits below it.
    expect(m.stripBottom).toBeLessThanOrEqual(m.mapTop)
    // Visible node labels in the start cluster never stack on each other.
    expect(m.overlaps).toBe(0)
  })

  test('Phone node tooltip stays inside the map', async ({ page }) => {
    // Seed 1 puts a travel target at the map's left edge, where the centred
    // tooltip used to run 29-38px out of view.
    await skipToMenu(page, { url: '/?seed=1' })
    await page.getByRole('button', { name: /start tour/i }).click()
    const prompt = page.getByRole('dialog')
    if (await prompt.isVisible({ timeout: 3000 }).catch(() => false)) {
      const input = prompt.getByRole('textbox').first()
      if (await input.count()) await input.fill('Tester')
      await prompt.getByRole('button', { name: /confirm/i }).click()
    }
    await page
      .getByText(/tour plan/i)
      .first()
      .waitFor()
    await page.waitForTimeout(800)

    const { width } = page.viewportSize()
    test.skip(width >= 641, 'Phone layout only')

    // The first clickable node is the current one; tapping the next one asks
    // for travel confirmation and leaves its tooltip open.
    await page.locator('.map-node.clickable[role="button"]').nth(1).tap()
    const tooltip = page.locator('.map-node div[class*="bg-void-black/90"]', {
      hasText: /Cap:|ui:map|Pay:/
    })
    await expect(tooltip.first()).toBeVisible()

    const box = await tooltip.first().boundingBox()
    const mapBox = await page.locator('.map-wrap').boundingBox()
    if (box === null || mapBox === null) {
      throw new Error('Expected the tooltip and the map to be visible')
    }
    expect(box.x).toBeGreaterThanOrEqual(mapBox.x)
    expect(box.x + box.width).toBeLessThanOrEqual(mapBox.x + mapBox.width)
  })

  test('Expedition cash is never truncated on phones', async ({ page }) => {
    await skipToMenu(page)
    await page.getByRole('button', { name: /start expedition/i }).click()
    await page.getByRole('heading', { name: /tour prep/i }).waitFor()
    const startTour = page.getByRole('button', { name: /start tour/i })
    await startTour.scrollIntoViewIfNeeded()
    await startTour.click()
    await expect(page.getByTestId('expedition-status-strip')).toBeVisible()

    // DEV-only hook: a seven-figure balance is the worst case for the cell.
    await page.evaluate(() =>
      window.gameState.updatePlayer({ money: 12345678 })
    )
    const cash = page.getByTestId('expedition-hud-cash')
    await expect(cash).toContainText('12')

    const clipped = await cash.evaluate(el => {
      const value = el.querySelectorAll('span')[1]
      return value.scrollWidth > value.clientWidth
    })
    const { width } = page.viewportSize()
    if (width < 641) expect(clipped).toBe(false)
  })
})
