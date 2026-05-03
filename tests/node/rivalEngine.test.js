import test from 'node:test'
import assert from 'node:assert/strict'
import { moveRivalBand } from '../../src/utils/rivalEngine.js'

test('rivalEngine', async t => {
  await t.test('moveRivalBand', async t => {
    await t.test('returns same band if gameMap is empty', () => {
      const band = { id: 'rival', currentLocationId: 'A' }
      const newBand = moveRivalBand(band, null)
      assert.deepEqual(newBand, band)
    })

    await t.test('returns same band based on stay chance', () => {
      const band = { id: 'rival', currentLocationId: 'A' }
      const gameMap = {
        nodes: { A: { id: 'A', type: 'GIG' }, B: { id: 'B', type: 'GIG' } },
        connections: [{ from: 'A', to: 'B' }]
      }
      // RNG returns 0.1, RIVAL_STAY_CHANCE is usually 0.3, so it should stay
      const newBand = moveRivalBand(band, gameMap, () => 0.1)
      assert.deepEqual(newBand, band)
    })

    await t.test('moves to connected gig node', () => {
      const band = { id: 'rival', currentLocationId: 'A' }
      const gameMap = {
        nodes: {
          A: { id: 'A', type: 'GIG' },
          B: { id: 'B', type: 'GIG' },
          C: { id: 'C', type: 'REST' }
        },
        connections: [
          { from: 'A', to: 'B' },
          { from: 'A', to: 'C' }
        ]
      }
      // RNG returns 0.9, > 0.3, so it moves
      // Connected GIG nodes: B
      const newBand = moveRivalBand(band, gameMap, () => 0.9)
      assert.equal(newBand.currentLocationId, 'B')
    })

    await t.test('moves to random gig node if no connected gig nodes', () => {
      const band = { id: 'rival', currentLocationId: 'A' }
      const gameMap = {
        nodes: {
          A: { id: 'A', type: 'GIG' },
          B: { id: 'B', type: 'GIG' },
          C: { id: 'C', type: 'REST' }
        },
        connections: [{ from: 'A', to: 'C' }]
      }
      // RNG returns 0.9, > 0.3, so it moves
      // No connected GIG nodes. Possible GIG nodes: A, B. RNG is 0.9, picks index 1 (B)
      const newBand = moveRivalBand(band, gameMap, () => 0.9)
      assert.equal(newBand.currentLocationId, 'B')
    })

    await t.test(
      'moves to random gig node if starting without location',
      () => {
        const band = { id: 'rival', currentLocationId: null }
        const gameMap = {
          nodes: {
            A: { id: 'A', type: 'GIG' },
            B: { id: 'B', type: 'GIG' },
            C: { id: 'C', type: 'REST' }
          },
          connections: [{ from: 'A', to: 'B' }]
        }
        // Possible GIG nodes: A, B. RNG is 0.9, picks index 1 (B)
        const newBand = moveRivalBand(band, gameMap, () => 0.9)
        assert.equal(newBand.currentLocationId, 'B')
      }
    )
  })
})
