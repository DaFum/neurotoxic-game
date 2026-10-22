import { test, expect } from '@playwright/test'
import {
  SAVE_KEY,
  buildFixture,
  dismissTutorial,
  evaluateFixtureHelper,
  loadSavedGame,
  raceWithCrash,
  readRootState,
  seedSaveOnce
} from './helpers.js'

test.describe.configure({ retries: 0 })

const GAME_URL = '/?events=off'
const NOT_ENOUGH_MONEY = 'Not enough money for gas and food!'

/** Seeds a fixture once on the app origin and resumes it through Load Game. */
const resumeFixture = async (page, fixtureName) => {
  await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' })
  const fixture = await buildFixture(page, fixtureName)
  await seedSaveOnce(page, { [SAVE_KEY]: fixture.save }, { url: GAME_URL })
  await loadSavedGame(page)
  await expect
    .poll(async () => (await readRootState(page)).currentScene)
    .toBe('OVERWORLD')
  await dismissTutorial(page)
  return fixture
}

/** Connected nodes only: the START node is always a travel button too. */
const travelNodes = page =>
  page.getByRole('button', { name: /travel to/i }).filter({
    hasNot: page.getByRole('img', { name: /map marker: start/i })
  })

const snapshotRun = async page => {
  const state = await readRootState(page)
  return {
    scene: state.currentScene,
    nodeId: state.player.currentNodeId,
    routeStep: state.expedition.routeStep,
    visitedNodeIds: state.expedition.visitedNodeIds,
    money: state.player.money,
    fuel: state.player.van.fuel,
    day: state.player.day,
    memberIds: state.band.members.map(member => member.id ?? member.name)
  }
}

test.describe('Protected Career Cash gates Expedition travel', () => {
  test('refuses a leg the wallet covers but the spendable cash does not', async ({
    page
  }) => {
    await resumeFixture(page, 'protectedCashFixture')

    // The fixture only proves anything if the protected cash is the blocker.
    const quotes = await evaluateFixtureHelper(page, 'quoteConnectedLegs')
    expect(quotes.length).toBeGreaterThan(0)
    for (const quote of quotes) {
      expect(quote.wallet).toBeGreaterThan(quote.totalCost)
      expect(quote.spendable).toBeLessThan(quote.cashRequired)
    }
    const before = await snapshotRun(page)

    const node = travelNodes(page).first()
    const refusal = page.getByText(NOT_ENOUGH_MONEY)
    for (const attempt of [1, 2]) {
      const outcome = await raceWithCrash(page, () => node.click())
      expect(outcome, `click ${attempt}`).toBe('success')
      await expect(refusal).toBeVisible()
      // The toast expires, so the next click has to raise its own.
      await expect(refusal).toHaveCount(0)
    }

    await expect(page.getByText('CONFIRM?')).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: /tourbus terror/i })
    ).toHaveCount(0)
    expect(await snapshotRun(page)).toEqual(before)
    expect(before.scene).toBe('OVERWORLD')
  })

  test('control: the same run with nothing protected travels', async ({
    page
  }) => {
    await resumeFixture(page, 'zeroProtectedCashFixture')

    const quotes = await evaluateFixtureHelper(page, 'quoteConnectedLegs')
    for (const quote of quotes) {
      expect(quote.spendable).toBeGreaterThanOrEqual(quote.cashRequired)
    }

    const node = travelNodes(page).first()
    await node.click()
    await expect(page.getByText('CONFIRM?')).toBeVisible()
    await expect(page.getByText(NOT_ENOUGH_MONEY)).toHaveCount(0)

    await node.click()
    await expect(
      page.getByRole('heading', { name: /tourbus terror/i })
    ).toBeVisible()
  })
})
