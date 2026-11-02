import { expect, test } from '@playwright/test'
import { buildFixture } from './helpers.js'

test('fixture building survives a navigation during its import', async ({
  page
}) => {
  await page.goto('/?events=off', { waitUntil: 'domcontentloaded' })
  let releaseImport
  let notifyImport
  const importStarted = new Promise(resolve => {
    notifyImport = resolve
  })
  const importBlocked = new Promise(resolve => {
    releaseImport = resolve
  })
  let first = true
  await page.route('**/e2e/fixtures/expeditionFixtures.js*', async route => {
    if (first) {
      first = false
      notifyImport()
      await importBlocked
    }
    await route.continue().catch(() => {})
  })
  const fixturePromise = buildFixture(page, 'seedOneStartFixture')
  // Attach a handler immediately so an early rejection is still observed.
  const outcome = fixturePromise.then(
    value => ({ value }),
    error => ({ error })
  )
  await importStarted
  await page.reload({ waitUntil: 'domcontentloaded' })
  releaseImport()
  const result = await outcome
  if (result.error) throw result.error
  expect(result.value.save).toBeTruthy()
})

test('fixture builder errors remain visible', async ({ page }) => {
  await page.goto('/?events=off', { waitUntil: 'domcontentloaded' })
  await expect(buildFixture(page, 'noSuchFixture')).rejects.toThrow(
    'Unknown e2e fixture: noSuchFixture'
  )
})
