import { test, expect } from '@playwright/test'
import { SAVE_KEY, buildFixture, seedSaveOnce } from './helpers.js'

const resume = async (page, name, language) => {
  await page.goto('/?events=off', { waitUntil: 'domcontentloaded' })
  const fixture = await buildFixture(page, name)
  await seedSaveOnce(
    page,
    { [SAVE_KEY]: fixture.save, i18nextLng: language },
    { url: '/?events=off' }
  )
  const skip = page.getByRole('button', { name: /skip all|alle überspringen/i })
  if (await skip.first().isVisible()) await skip.first().click()
  await page.getByRole('button', { name: /load game|spiel laden/i }).click()
  await expect(page.getByTestId('expedition-service-panel')).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'reduce' })
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
    await toggle.scrollIntoViewIfNeeded()
    await toggle.focus()
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
    await expect(page.getByTestId('expedition-service-toggle')).toHaveAttribute(
      'aria-expanded',
      'true'
    )
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
  await expect(page.getByTestId('expedition-service-toggle')).toHaveAttribute(
    'aria-expanded',
    'true'
  )
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
