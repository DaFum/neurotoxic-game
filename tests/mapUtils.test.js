import { test, describe, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

// Mocks
const mockCalculateTravelExpenses = mock.fn()
const mockCalculateRefuelCost = mock.fn()

// Mock module before import
mock.module('../src/utils/economyEngine.js', {
  namedExports: {
    calculateTravelExpenses: mockCalculateTravelExpenses,
    calculateRefuelCost: mockCalculateRefuelCost
  }
})

// Import module under test
const { isConnected, getNodeVisibility, checkSoftlock } = await import(
  '../src/utils/mapUtils.js'
)

describe('mapUtils', () => {
  describe('isConnected', () => {
    const gameMap = {
      connections: [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' }
      ]
    }

    test('returns true if nodes are directly connected', () => {
      assert.equal(isConnected(gameMap, 'A', 'B'), true)
    })

    test('returns false if nodes are not directly connected', () => {
      assert.equal(isConnected(gameMap, 'A', 'C'), false)
    })

    test('returns false if map is missing', () => {
      assert.equal(isConnected(null, 'A', 'B'), false)
    })
  })

  describe('getNodeVisibility', () => {
    test('returns visible for current layer', () => {
      assert.equal(getNodeVisibility(1, 1), 'visible')
    })

    test('returns visible for next layer', () => {
      assert.equal(getNodeVisibility(2, 1), 'visible')
    })

    test('returns dimmed for layer + 2', () => {
      assert.equal(getNodeVisibility(3, 1), 'dimmed')
    })

    test('returns hidden for layer + 3 or more', () => {
      assert.equal(getNodeVisibility(4, 1), 'hidden')
    })
  })

  describe('checkSoftlock', () => {
    const gameMap = {
      nodes: {
        A: { id: 'A', type: 'REST' },
        B: { id: 'B', type: 'GIG' }
      },
      connections: [{ from: 'A', to: 'B' }]
    }

    beforeEach(() => {
      mockCalculateTravelExpenses.mock.resetCalls()
      mockCalculateRefuelCost.mock.resetCalls()
    })

    test('returns false if map or player invalid', () => {
      assert.equal(checkSoftlock(null, { currentNodeId: 'A' }), false)
      assert.equal(checkSoftlock(gameMap, {}), false)
    })

    test('returns false if player can reach a neighbor', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 10
      }))
      const player = { currentNodeId: 'A', van: { fuel: 20 }, money: 0 }

      assert.equal(checkSoftlock(gameMap, player), false)
    })

    test('returns false if player cannot reach neighbor but can refuel', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 30
      }))
      mockCalculateRefuelCost.mock.mockImplementation(() => 50)
      const player = { currentNodeId: 'A', van: { fuel: 20 }, money: 100 }

      assert.equal(checkSoftlock(gameMap, player), false)
    })

    test('returns true if player cannot reach neighbor and cannot refuel', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 30
      }))
      mockCalculateRefuelCost.mock.mockImplementation(() => 50)
      const player = { currentNodeId: 'A', van: { fuel: 20 }, money: 40 }

      assert.equal(checkSoftlock(gameMap, player), true)
    })

    test('returns false if current node is GIG even if stranded otherwise', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 30
      }))
      mockCalculateRefuelCost.mock.mockImplementation(() => 50)
      const gigMap = {
        nodes: {
            A: { id: 'A', type: 'GIG' }, // Current is GIG
            B: { id: 'B' }
        },
        connections: [{ from: 'A', to: 'B' }]
      }
      const player = { currentNodeId: 'A', van: { fuel: 20 }, money: 40 }

      assert.equal(checkSoftlock(gigMap, player), false)
    })
  })
})
