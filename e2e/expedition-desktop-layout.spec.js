import { test, expect } from '@playwright/test'
import { resume } from './helpers.js'

/**
 * Verifies that required and visible optional run control/log sections
 * are not covered by the fixed menu toggle and remain reachable by hit-testing.
 */
async function verifySectionCoverageAndReachability(page) {
  // Required sections for this fixture
  await expect(page.getByTestId('expedition-service-panel')).toBeVisible()
  await expect(page.locator('.event-log')).toBeVisible()

  const sectionLocators = [
    {
      name: 'obligations',
      loc: page.getByTestId('expedition-active-obligations')
    },
    { name: 'intel', loc: page.getByTestId('expedition-intel-panel') },
    { name: 'service', loc: page.getByTestId('expedition-service-panel') },
    { name: 'eventLog', loc: page.locator('.event-log') }
  ]

  for (const { loc } of sectionLocators) {
    if ((await loc.count()) > 0 && (await loc.first().isVisible())) {
      await loc.first().scrollIntoViewIfNeeded()

      const isCoveredByToggle = await loc.first().evaluate(el => {
        const menu = document.querySelector('.ow-menu')
        if (!menu) return false
        const menuR = menu.getBoundingClientRect()
        const elR = el.getBoundingClientRect()
        return (
          elR.left < menuR.right &&
          elR.right > menuR.left &&
          elR.top < menuR.bottom &&
          elR.bottom > menuR.top
        )
      })
      expect(isCoveredByToggle).toBe(false)

      const isReachable = await loc.first().evaluate(el => {
        const menu = document.querySelector('.ow-menu')
        const isPointerNone = getComputedStyle(el).pointerEvents === 'none'
        const r = el.getBoundingClientRect()
        const x = r.left + Math.min(r.width / 2, 50)
        const y = r.top + Math.min(r.height / 2, 20)
        if (x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) {
          return false
        }
        const hit = document.elementFromPoint(x, y)
        if (!hit) return false
        if (menu && menu.contains(hit)) return false
        if (isPointerNone) return true
        return el.contains(hit)
      })
      expect(isReachable).toBe(true)
    }
  }
}

test.describe('Expedition Desktop Layout & Draft Placement', () => {
  test.use({ viewport: { width: 1920, height: 945 } })

  test('desktop pending draft renders above map, menu remains fixed and radio scrolls with header', async ({
    page
  }) => {
    await resume(page, 'pendingDraftEquipmentFixture', 'de')

    // Wait for node layout stability
    let previous = ''
    await expect
      .poll(
        async () => {
          const current = await page.locator('.map-node').evaluateAll(nodes =>
            JSON.stringify(
              nodes.map(node => {
                const r = node.getBoundingClientRect()
                return [r.left, r.top, r.width, r.height]
              })
            )
          )
          const stable = current === previous
          previous = current
          return stable
        },
        { intervals: [150], timeout: 10000 }
      )
      .toBe(true)

    const draft = page.getByTestId('expedition-run-draft-offer')
    await expect(draft).toBeVisible()

    // Verify draft card is above map in layout order
    const draftBox = await draft.boundingBox()
    const mapBoxInitial = await page.locator('.map-wrap').boundingBox()
    expect(draftBox).not.toBeNull()
    expect(mapBoxInitial).not.toBeNull()
    expect(draftBox.y).toBeGreaterThanOrEqual(0)
    expect(draftBox.y).toBeLessThan(mapBoxInitial.y)
    expect(draftBox.y + draftBox.height).toBeLessThanOrEqual(945)

    const candidateButtons = draft.getByRole('button')
    const candidateCount = await candidateButtons.count()
    expect(candidateCount).toBeGreaterThan(0)

    for (let i = 0; i < candidateCount; i++) {
      const button = candidateButtons.nth(i)
      await expect(button).toBeVisible()
      const isCandidateReachable = await button.evaluate(el => {
        const r = el.getBoundingClientRect()
        const x = r.left + r.width / 2
        const y = r.top + r.height / 2
        if (x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) {
          return false
        }
        const hit = document.elementFromPoint(x, y)
        return hit !== null && el.contains(hit)
      })
      expect(isCandidateReachable).toBe(true)
    }

    // Verify radio rectangle does not intersect map node buttons or draft card
    const radio = page.getByTestId('overworld-radio')
    await expect(radio).toBeVisible()

    const intersects = (a, b) =>
      a.left < b.right &&
      a.right > b.left &&
      a.top < b.bottom &&
      a.bottom > b.top

    const radioRect = await radio.evaluate(el => {
      const r = el.getBoundingClientRect()
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
    })
    const draftRect = await draft.evaluate(el => {
      const r = el.getBoundingClientRect()
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
    })
    expect(intersects(radioRect, draftRect)).toBe(false)

    const nodeRects = await page.locator('.map-node').evaluateAll(nodes =>
      nodes.map(n => {
        const r = n.getBoundingClientRect()
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
      })
    )
    for (const nodeR of nodeRects) {
      expect(intersects(radioRect, nodeR)).toBe(false)
    }

    // Record menu toggle rectangle & initial radio rectangle
    const menuToggle = page.locator('.ow-menu button').last()
    await expect(menuToggle).toBeVisible()
    const initialToggleBox = await menuToggle.boundingBox()
    const initialRadioBox = await radio.boundingBox()

    // Scroll .scene--expedition to its maximum scrollTop
    const scrollDelta = await page.evaluate(() => {
      const scene = document.querySelector('.scene--expedition')
      if (!scene) return 0
      const target = scene.scrollHeight - scene.clientHeight
      scene.scrollTop = target
      return scene.scrollTop
    })
    expect(scrollDelta).toBeGreaterThan(0)

    // Verify toggle rectangle does not change and remains at bottom-right viewport edge
    const scrolledToggleBox = await menuToggle.boundingBox()
    expect(scrolledToggleBox.x).toBeCloseTo(initialToggleBox.x, 0)
    expect(scrolledToggleBox.y).toBeCloseTo(initialToggleBox.y, 0)

    // Verify radio moves up by scroll delta
    const scrolledRadioBox = await radio.boundingBox()
    expect(scrolledRadioBox.y).toBeCloseTo(initialRadioBox.y - scrollDelta, 0)

    // Verify after scroll that no visible map node, crew status card, or run-control button intersects radio
    const scrolledIntersections = await page.evaluate(() => {
      const radioEl = document.querySelector('[data-testid="overworld-radio"]')
      if (!radioEl) return true
      const r = radioEl.getBoundingClientRect()
      const checkOverlap = (a, b) =>
        a.left < b.right &&
        a.right > b.left &&
        a.top < b.bottom &&
        a.bottom > b.top

      const targets = [
        ...document.querySelectorAll('.map-node'),
        ...document.querySelectorAll('[data-testid="expedition-crew-status"]'),
        ...document.querySelectorAll('.expedition-run-controls button')
      ]
      return targets.some(el => {
        const b = el.getBoundingClientRect()
        return b.width > 0 && b.height > 0 && checkOverlap(r, b)
      })
    })
    expect(scrolledIntersections).toBe(false)

    // Scroll obligations, intel, service, and EventLog into view and check reachability and menu non-coverage
    await verifySectionCoverageAndReachability(page)

    // Select a draft candidate and capture its trait ID from data-testid
    const candidateBtn = draft.getByRole('button').first()
    const candidateTestId = await candidateBtn.getAttribute('data-testid')
    const selectedTraitId =
      candidateTestId?.replace('expedition-run-draft-', '') ?? null
    expect(selectedTraitId).not.toBeNull()

    await candidateBtn.click()
    await expect(page.getByTestId('expedition-run-draft-offer')).toHaveCount(0)

    // Verify map is now the first in-flow item
    const mapBox = await page.locator('.map-wrap').boundingBox()
    const serviceBox = await page
      .getByTestId('expedition-service-panel')
      .boundingBox()
    expect(mapBox.y).toBeLessThan(serviceBox.y)

    // Save, reload, and verify that selected trait persists in state
    await page.evaluate(() => window.gameState.saveGame())
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /spiel laden|load game/i }).click()
    await expect(page.getByTestId('expedition-service-panel')).toBeVisible()
    await expect(page.getByTestId('expedition-run-draft-offer')).toHaveCount(0)

    const savedTraits = await page.evaluate(
      () => window.gameState.expedition.runDraftTraitIds
    )
    expect(savedTraits).toContain(selectedTraitId)
  })
})

test.describe('Expedition 640px Breakpoint Layout', () => {
  test.use({ viewport: { width: 640, height: 945 } })

  test('pending draft and radio/menu layout behave correctly at 640px', async ({
    page
  }) => {
    await resume(page, 'pendingDraftEquipmentFixture', 'de')

    let previous = ''
    await expect
      .poll(
        async () => {
          const current = await page.locator('.map-node').evaluateAll(nodes =>
            JSON.stringify(
              nodes.map(node => {
                const r = node.getBoundingClientRect()
                return [r.left, r.top, r.width, r.height]
              })
            )
          )
          const stable = current === previous
          previous = current
          return stable
        },
        { intervals: [150], timeout: 10000 }
      )
      .toBe(true)

    const draft = page.getByTestId('expedition-run-draft-offer')
    await expect(draft).toBeVisible()

    const draftBox = await draft.boundingBox()
    const mapBox = await page.locator('.map-wrap').boundingBox()
    expect(draftBox).not.toBeNull()
    expect(mapBox).not.toBeNull()
    expect(draftBox.y).toBeGreaterThanOrEqual(0)
    expect(draftBox.y).toBeLessThan(mapBox.y)

    const candidateButtons = draft.getByRole('button')
    const candidateCount = await candidateButtons.count()
    expect(candidateCount).toBeGreaterThan(0)

    for (let i = 0; i < candidateCount; i++) {
      const button = candidateButtons.nth(i)
      await expect(button).toBeVisible()
    }

    const radio = page.getByTestId('overworld-radio')
    await expect(radio).toBeVisible()

    const menuToggle = page.locator('.ow-menu button').last()
    await expect(menuToggle).toBeVisible()
    const initialToggleBox = await menuToggle.boundingBox()

    const scrollDelta = await page.evaluate(() => {
      const scene = document.querySelector('.scene--expedition')
      if (!scene) return 0
      const target = scene.scrollHeight - scene.clientHeight
      scene.scrollTop = target
      return scene.scrollTop
    })
    expect(scrollDelta).toBeGreaterThan(0)

    const scrolledToggleBox = await menuToggle.boundingBox()
    expect(scrolledToggleBox.x).toBeCloseTo(initialToggleBox.x, 0)
    expect(scrolledToggleBox.y).toBeCloseTo(initialToggleBox.y, 0)

    // Check section coverage & reachability at 640px
    await verifySectionCoverageAndReachability(page)
  })
})
