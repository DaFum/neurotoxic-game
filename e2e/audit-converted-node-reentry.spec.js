import { test, expect } from '@playwright/test'
import {
  SAVE_KEY,
  buildFixture,
  dismissTutorial,
  loadSavedGame,
  readRootState,
  seedSaveOnce
} from './helpers.js'

test.describe.configure({ retries: 0 })

const GAME_URL = '/?events=off'

/** The map node the van stands on: the only one that renders the van. */
const currentNode = page =>
  page.locator('.map-node').filter({
    has: page.getByRole('img', { name: 'Van', exact: true })
  })

const seedAndLoad = async (page, fixtureName) => {
  await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' })
  const fixture = await buildFixture(page, fixtureName)
  await seedSaveOnce(page, { [SAVE_KEY]: fixture.save }, { url: GAME_URL })
  await loadSavedGame(page)
  await expect
    .poll(async () => (await readRootState(page)).currentScene)
    .toBe('OVERWORLD')
  return fixture
}

const snapshotRun = async page => {
  const state = await readRootState(page)
  return {
    scene: state.currentScene,
    day: state.player.day,
    money: state.player.money,
    fuel: state.player.van.fuel,
    nodeId: state.player.currentNodeId,
    routeStep: state.expedition.routeStep,
    arrivedOverlay: state.expedition.arrivedOverlay,
    currentGig: state.currentGig
  }
}

test.describe('Re-entering a node a Nemesis shortcut converted', () => {
  test('shows the location toast and never books the show', async ({
    page
  }) => {
    const fixture = await seedAndLoad(page, 'convertedNodeFixture')
    await dismissTutorial(page)

    // The seeded overlay survived sanitizing and still names the current node.
    const loaded = await snapshotRun(page)
    expect(loaded.nodeId).toBe(fixture.nodeId)
    expect(loaded.arrivedOverlay).toEqual({
      nodeId: fixture.nodeId,
      subtype: 'RIVAL_ENCOUNTER',
      source: 'nemesis_shortcut'
    })

    // Reload without reseeding: the save on disk is what resumes.
    await page.reload({ waitUntil: 'domcontentloaded' })
    await loadSavedGame(page)
    await expect
      .poll(async () => (await readRootState(page)).currentScene)
      .toBe('OVERWORLD')
    const resumed = await snapshotRun(page)
    expect(resumed.arrivedOverlay).toEqual(loaded.arrivedOverlay)
    expect(resumed.nodeId).toBe(fixture.nodeId)

    await currentNode(page).click()

    await expect(
      page.getByText(`You are at ${fixture.locationName}.`)
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: /pre-?gig/i })).toHaveCount(
      0
    )
    const after = await snapshotRun(page)
    expect(after).toEqual(resumed)
    expect(after.currentGig).toBeNull()
  })

  test('control: an ordinary unplayed gig node opens PreGig', async ({
    page
  }) => {
    const fixture = await seedAndLoad(page, 'ordinaryGigFixture')
    await dismissTutorial(page)

    const before = await snapshotRun(page)
    expect(before.nodeId).toBe(fixture.nodeId)
    expect(before.arrivedOverlay).toBeNull()
    expect(before.currentGig).toBeNull()

    await currentNode(page).click()

    await expect
      .poll(async () => (await readRootState(page)).currentScene)
      .toBe('PREGIG')
    expect((await readRootState(page)).currentGig).not.toBeNull()
  })
})
