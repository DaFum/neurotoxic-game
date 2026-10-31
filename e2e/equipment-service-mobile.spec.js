import { test, expect } from '@playwright/test'
import { resume, buildFixture, seedSaveOnce, SAVE_KEY, readRootState } from './helpers.js'

const tabTo = async (page, locator) => {
  await page.evaluate(() => document.activeElement.blur())
  for (let i = 0; i < 100; i++) {
    await page.keyboard.press('Tab')
    if (await locator.evaluate(el => el === document.activeElement)) return
  }
  throw new Error('Target was not reached by Tab')
}

for (const [width, height] of [
  [320, 568],
  [390, 844]
]) {
  test(`mobile ${width}: route visible and radio scrolls without covering resources`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width, height })
    await resume(page, 'normalEquipmentFixture', 'de')
    const service = page.getByTestId('expedition-service-panel')
    const toggle = page.getByTestId('expedition-service-toggle')
    const map = page.locator('.map-wrap')
    const radio = page.getByTestId('overworld-radio')
    await expect(service).toHaveAttribute('data-urgent', 'false')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    const mapBox = await map.boundingBox()
    const serviceBox = await service.boundingBox()
    const menuBox = await page.locator('.ow-menu').boundingBox()
    expect(menuBox.y - mapBox.y).toBeGreaterThanOrEqual(44)
    expect(mapBox.y).toBeLessThan(serviceBox.y)
    const node = map.getByRole('button').first()
    await expect(node).toBeVisible()
    await node.focus()
    await expect(node).toBeFocused()
    await page.screenshot({ path: testInfo.outputPath(`compact-${width}.png`) })
    const initialRadioY = (await radio.boundingBox()).y
    for (const y of [80, 160]) {
      await page.locator('.scene').evaluate((scene, offset) => {
        scene.scrollTop = offset
      }, y)
      expect(
        await page.locator('.scene').evaluate(scene => scene.scrollTop)
      ).toBe(y)
      expect((await radio.boundingBox()).y).toBeCloseTo(initialRadioY - y, 0)
      const overlaps = await page.evaluate(() => {
        const r = document
          .querySelector('[data-testid="overworld-radio"]')
          .getBoundingClientRect()
        return [
          ...document.querySelector('[data-testid="expedition-status-strip"]')
            .children
        ].some(item => {
          const b = item.getBoundingClientRect()
          return (
            r.left < b.right &&
            r.right > b.left &&
            r.top < b.bottom &&
            r.bottom > b.top
          )
        })
      })
      expect(overlaps).toBe(false)
    }
    await expect(radio).toBeAttached()
    await tabTo(page, toggle)
    await page.keyboard.press('Enter')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(
      service.getByRole('button', { name: /ausschlachten/i })
    ).toHaveCount(0)
    await page.screenshot({
      path: testInfo.outputPath(`expanded-${width}.png`)
    })
  })
}

for (const language of ['de', 'en']) {
  test(`recovery exposes localized donor action in ${language}`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await resume(page, 'recoveryEquipmentFixture', language)
    const service = page.getByTestId('expedition-service-panel')
    await expect(service).toHaveAttribute('data-urgent', 'true')
    await expect(
      service.getByText(
        /service options are expanded|serviceoptionen sind geöffnet/i
      )
    ).toBeVisible()
    const donor = service.getByRole('button', {
      name:
        language === 'de'
          ? /Instrumente für PA ausschlachten/
          : /Cannibalize Instruments for PA/
    })
    await expect(donor).toBeVisible()
    expect((await service.boundingBox()).y).toBeLessThan(
      (await page.locator('.map-wrap').boundingBox()).y
    )
    await donor.scrollIntoViewIfNeeded()
    await page.screenshot({
      path: testInfo.outputPath(`recovery-${language}.png`)
    })
    await donor.click()
    await expect
      .poll(() =>
        page.evaluate(() => window.gameState.expedition.technicalCondition.pa)
      )
      .toBe(55)
    expect(
      await page.evaluate(
        () => window.gameState.expedition.technicalCondition.instruments
      )
    ).toBe(67)
  })
}

test('zero condition recovery is immediately expanded', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await resume(page, 'zeroEquipmentFixture', 'en')
  await expect(page.getByTestId('expedition-service-panel')).toHaveAttribute(
    'data-urgent',
    'true'
  )
  const recovery = page.getByTestId(
    'expedition-service-accept-technical-failure'
  )
  await expect(recovery).toBeVisible()
  await tabTo(page, recovery)
  await expect(recovery).toBeFocused()
})

test('desktop keeps the radio above a reachable route', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await resume(page, 'normalEquipmentFixture', 'en')
  const radio = page.getByTestId('overworld-radio')
  const map = page.locator('.map-wrap')
  const radioBox = await radio.boundingBox()
  const mapBox = await map.boundingBox()
  expect(radioBox.y + radioBox.height).toBeLessThan(mapBox.y)
  await expect(map.getByRole('button').first()).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('desktop.png') })
})

for (const [width, height] of [
  [1920, 945],
  [1280, 800],
  [800, 900]
]) {
  test(`desktop header geometry and bounds (${width}x${height})`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/?events=off', { waitUntil: 'domcontentloaded' })
    const fixture = await buildFixture(page, 'normalEquipmentFixture')
    await seedSaveOnce(
      page,
      { [SAVE_KEY]: fixture.save, i18nextLng: 'de' },
      { url: '/?events=off' }
    )
    const skip = page.getByRole('button', { name: /skip all|alle überspringen/i })
    if (await skip.first().isVisible()) await skip.first().click()
    await page.getByRole('button', { name: /load game|spiel laden/i }).click()

    await expect
      .poll(async () => (await readRootState(page)).currentScene)
      .toBe('OVERWORLD')
    await expect(page.getByTestId('expedition-service-panel')).toBeVisible()

    const radio = page.getByTestId('overworld-radio')
    const title = page.locator('.ow-title')
    const status = page.locator('.ow-status')
    const map = page.locator('.map-wrap')

    await expect(radio).toBeVisible()
    await expect(title).toBeVisible()
    await expect(status).toBeVisible()
    await expect(map).toBeVisible()

    const measureBoxes = async () => {
      await page.evaluate(() => {
        const scene = document.querySelector('.scene')
        if (scene) scene.scrollTop = 0
        window.scrollTo(0, 0)
      })
      const [rBox, tBox, sBox, mBox] = await Promise.all([
        radio.boundingBox(),
        title.boundingBox(),
        status.boundingBox(),
        map.boundingBox()
      ])
      return { rBox, tBox, sBox, mBox }
    }

    let settledBoxes = null
    await expect
      .poll(
        async () => {
          const first = await measureBoxes()
          const second = await measureBoxes()
          if (!first.rBox || !first.tBox || !first.sBox || !first.mBox) return false
          if (!second.rBox || !second.tBox || !second.sBox || !second.mBox) return false
          const isIdentical =
            first.rBox.x === second.rBox.x &&
            first.rBox.y === second.rBox.y &&
            first.rBox.width === second.rBox.width &&
            first.rBox.height === second.rBox.height &&
            first.tBox.x === second.tBox.x &&
            first.tBox.y === second.tBox.y &&
            first.tBox.width === second.tBox.width &&
            first.tBox.height === second.tBox.height &&
            first.sBox.x === second.sBox.x &&
            first.sBox.y === second.sBox.y &&
            first.sBox.width === second.sBox.width &&
            first.sBox.height === second.sBox.height &&
            first.mBox.x === second.mBox.x &&
            first.mBox.y === second.mBox.y &&
            first.mBox.width === second.mBox.width &&
            first.mBox.height === second.mBox.height
          if (isIdentical) {
            settledBoxes = first
            return true
          }
          return false
        },
        { timeout: 10000, intervals: [100] }
      )
      .toBe(true)

    const { rBox, tBox, sBox, mBox } = settledBoxes

    // Positive dimensions
    expect(rBox.width).toBeGreaterThan(0)
    expect(rBox.height).toBeGreaterThan(0)
    expect(tBox.width).toBeGreaterThan(0)
    expect(tBox.height).toBeGreaterThan(0)
    expect(sBox.width).toBeGreaterThan(0)
    expect(sBox.height).toBeGreaterThan(0)
    expect(mBox.width).toBeGreaterThan(0)
    expect(mBox.height).toBeGreaterThan(0)

    // Log measured boxes for reporting
    console.log(
      `[Measured boxes ${width}x${height}] radio: ${JSON.stringify(rBox)}, title: ${JSON.stringify(tBox)}, status: ${JSON.stringify(sBox)}, map: ${JSON.stringify(mBox)}`
    )

    // Assert vertical layout relationships
    expect(rBox.y + rBox.height + 10).toBeLessThanOrEqual(tBox.y)
    expect(tBox.y + tBox.height).toBeLessThanOrEqual(sBox.y)
    expect(tBox.y + tBox.height).toBeLessThanOrEqual(mBox.y)
    expect(sBox.y + sBox.height).toBeLessThanOrEqual(mBox.y)
  })
}

test('a pending draft remains ahead of the route on mobile', async ({
  page
}) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await resume(page, 'pendingDraftEquipmentFixture', 'en')
  const draft = page.getByTestId('expedition-run-draft-offer')
  await expect(draft).toBeVisible()
  expect((await draft.boundingBox()).y).toBeLessThan(
    (await page.locator('.map-wrap').boundingBox()).y
  )
  await draft.getByRole('button').first().click()
  await expect(draft).toHaveCount(0)
})
