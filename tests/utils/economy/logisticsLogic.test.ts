import { test, describe } from 'vitest'
import assert from 'node:assert/strict'
import { calculateFuelCost } from '../../../src/utils/economy/logisticsLogic'

describe('logisticsLogic', () => {
  describe('calculateFuelCost', () => {
    test('basic calculation with distance 100', () => {
      const result = calculateFuelCost(100)
      assert.deepEqual(result, { fuelLiters: 10, fuelCost: 17 })
    })

    test('negative distance returns { fuelLiters: 0, fuelCost: 0 }', () => {
      const result = calculateFuelCost(-50)
      assert.deepEqual(result, { fuelLiters: 0, fuelCost: 0 })
    })

    test('applies van_tuning upgrade to reduce fuel consumption by 20%', () => {
      const playerState = { van: { upgrades: ['van_tuning'] } } as any
      const result = calculateFuelCost(100, playerState)
      assert.deepEqual(result, { fuelLiters: 8, fuelCost: 14 })
    })

    test('applies road_warrior band trait to reduce fuel consumption by 15%', () => {
      const bandState = {
        members: [
          { traits: [{ id: 'road_warrior' }] }
        ]
      } as any
      const result = calculateFuelCost(100, null, bandState)
      assert.deepEqual(result, { fuelLiters: 8.5, fuelCost: 14 })
    })

    test('applies fuelMultiplier of 0.5 from asset modifiers', () => {
      const assetModifiers = { fuelMultiplier: 0.5 } as any
      const result = calculateFuelCost(100, null, null, assetModifiers)
      assert.deepEqual(result, { fuelLiters: 5, fuelCost: 8 })
    })

    test('combines van_tuning, road_warrior, and fuelMultiplier multiplicatively', () => {
      const playerState = { van: { upgrades: ['van_tuning'] } } as any
      const bandState = {
        members: [
          { traits: [{ id: 'road_warrior' }] }
        ]
      } as any
      const assetModifiers = { fuelMultiplier: 0.5 } as any

      const result = calculateFuelCost(100, playerState, bandState, assetModifiers)

      // Expected liters: 10 * 0.8 * 0.85 * 0.5 = 3.4
      // Expected cost: Math.floor(3.4 * 1.75) = Math.floor(5.95) = 5
      assert.deepEqual(result, { fuelLiters: 3.4, fuelCost: 5 })
    })
  })
})
