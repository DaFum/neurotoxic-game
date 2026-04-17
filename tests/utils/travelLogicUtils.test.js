import assert from 'node:assert/strict'
import { test, describe } from 'vitest'
import { getTravelArrivalUpdates } from '../../src/utils/travelLogicUtils'

describe('travelLogicUtils', () => {
  describe('getTravelArrivalUpdates', () => {
    test('calculates basic travel updates correctly', () => {
      const player = {
        money: 1000,
        van: { fuel: 50, condition: 80 },
        location: 'StartLocation',
        currentNodeId: 'node_0',
        totalTravels: 5
      }
      const band = { harmony: 50 }
      const node = { id: 'node_1', venue: 'venues:city_club.name' }
      const fuelLiters = 10
      const totalCost = 100

      const result = getTravelArrivalUpdates({
        player,
        band,
        node,
        fuelLiters,
        totalCost
      })

      assert.strictEqual(result.nextPlayer.money, 900)
      assert.strictEqual(result.nextPlayer.van.fuel, 40)
      assert.strictEqual(result.nextPlayer.van.condition, 80)
      assert.strictEqual(result.nextPlayer.location, 'city')
      assert.strictEqual(result.nextPlayer.currentNodeId, 'node_1')
      assert.strictEqual(result.nextPlayer.totalTravels, 6)
      assert.strictEqual(result.nextBand, null)
    })

    test('handles harmony regeneration when enabled', () => {
      const player = { money: 1000, van: { fuel: 50 } }
      const band = { harmony: 50, harmonyRegenTravel: true }
      const node = { id: 'node_1', venue: 'venue_1' }

      const result = getTravelArrivalUpdates({
        player,
        band,
        node,
        fuelLiters: 5,
        totalCost: 50
      })

      assert.strictEqual(result.nextBand.harmony, 55)
    })

    test('clamps next money and fuel to non-negative', () => {
      const player = { money: 50, van: { fuel: 5 } }
      const band = {}
      const node = { id: 'node_1', venue: 'venue_1' }

      const result = getTravelArrivalUpdates({
        player,
        band,
        node,
        fuelLiters: 10,
        totalCost: 100
      })

      assert.strictEqual(result.nextPlayer.money, 0)
      assert.strictEqual(result.nextPlayer.van.fuel, 0)
    })

    test('handles missing optional properties using defaults', () => {
      const player = {}
      const band = null
      const node = { id: 'node_1' }

      const result = getTravelArrivalUpdates({
        player,
        band,
        node,
        fuelLiters: 10,
        totalCost: 100
      })

      assert.strictEqual(result.nextPlayer.money, 0)
      assert.strictEqual(result.nextPlayer.van.fuel, 0)
      assert.strictEqual(result.nextPlayer.location, 'Unknown')
      assert.strictEqual(result.nextPlayer.totalTravels, 1)
      assert.strictEqual(result.nextBand, null)
    })

    test('clamps harmony when regenerating', () => {
      const player = { money: 1000, van: { fuel: 50 } }
      const band = { harmony: 98, harmonyRegenTravel: true }
      const node = { id: 'node_1', venue: 'venue_1' }

      const result = getTravelArrivalUpdates({
        player,
        band,
        node,
        fuelLiters: 5,
        totalCost: 50
      })

      assert.strictEqual(result.nextBand.harmony, 100)
    })
  })
})
