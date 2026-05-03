import test from 'node:test'
import assert from 'node:assert/strict'
import { generateRivalBand, moveRivalBand, calculateRivalImpact } from '../../src/utils/rivalEngine.js'

test('rivalEngine', async (t) => {
  await t.test('moveRivalBand', async (t) => {
    await t.test('returns same band if gameMap is empty', () => {
      const band = { id: 'rival', currentLocationId: 'A' }
      const newBand = moveRivalBand(band, null)
      assert.deepEqual(newBand, band)
    })

    await t.test('returns same band based on stay chance', () => {
      const band = { id: 'rival', currentLocationId: 'A' }
      const gameMap = { nodes: { A: { id: 'A', type: 'GIG' }, B: { id: 'B', type: 'GIG' } }, connections: [{ from: 'A', to: 'B' }] }
      // RNG returns 0.1, RIVAL_STAY_CHANCE is usually 0.3, so it should stay
      const newBand = moveRivalBand(band, gameMap, () => 0.1)
      assert.deepEqual(newBand, band)
    })

    await t.test('moves to connected gig node', () => {
      const band = { id: 'rival', currentLocationId: 'A' }
      const gameMap = { nodes: { A: { id: 'A', type: 'GIG' }, B: { id: 'B', type: 'GIG' }, C: { id: 'C', type: 'REST' } }, connections: [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }] }
      // RNG returns 0.9, > 0.3, so it moves
      // Connected GIG nodes: B
      const newBand = moveRivalBand(band, gameMap, () => 0.9)
      assert.equal(newBand.currentLocationId, 'B')
    })

    await t.test('moves to random gig node if no connected gig nodes', () => {
      const band = { id: 'rival', currentLocationId: 'A' }
      const gameMap = { nodes: { A: { id: 'A', type: 'GIG' }, B: { id: 'B', type: 'GIG' }, C: { id: 'C', type: 'REST' } }, connections: [{ from: 'A', to: 'C' }] }
      // RNG returns 0.9, > 0.3, so it moves
      // No connected GIG nodes. Possible GIG nodes: A, B. RNG is 0.9, picks index 1 (B)
      const newBand = moveRivalBand(band, gameMap, () => 0.9)
      assert.equal(newBand.currentLocationId, 'B')
    })

    await t.test('moves to random gig node if starting without location', () => {
      const band = { id: 'rival', currentLocationId: null }
      const gameMap = { nodes: { A: { id: 'A', type: 'GIG' }, B: { id: 'B', type: 'GIG' }, C: { id: 'C', type: 'REST' } }, connections: [{ from: 'A', to: 'B' }] }
      // Possible GIG nodes: A, B. RNG is 0.9, picks index 1 (B)
      const newBand = moveRivalBand(band, gameMap, () => 0.9)
      assert.equal(newBand.currentLocationId, 'B')
    })
  })

  await t.test('calculateRivalImpact', async (t) => {
    await t.test('returns 0 impact if not same location', () => {
      const impact = calculateRivalImpact({ day: 1 }, { currentLocationId: 'A', powerLevel: 10 }, 'B')
      assert.equal(impact.impactLevel, 0)
      assert.equal(impact.sameLocation, false)
    })

    await t.test('returns correct impact if same location', () => {
      // playerExpectedPower = Math.max(1, Math.floor(10 / 5) + 1) = 3
      // impactLevel = Math.max(0.5, Math.min(2.0, 6 / 3)) = 2.0
      const impact = calculateRivalImpact({ day: 10 }, { currentLocationId: 'A', powerLevel: 6 }, 'A')
      assert.equal(impact.impactLevel, 2.0)
      assert.equal(impact.sameLocation, true)
    })
  })
})
