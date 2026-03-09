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
const { isConnected, getNodeVisibility, checkSoftlock, normalizeVenueId } =
  await import('../src/utils/mapUtils.js')

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

    test('returns false for reverse connection if map is directed', () => {
      assert.equal(isConnected(gameMap, 'B', 'A'), false)
    })

    test('returns false if source and target are the same but no self-connection exists', () => {
      assert.equal(isConnected(gameMap, 'A', 'A'), false)
    })

    test('returns false if gameMap.connections is empty', () => {
      assert.equal(isConnected({ connections: [] }, 'A', 'B'), false)
    })

    test('returns false if fromNodeId or targetNodeId is missing', () => {
      assert.equal(isConnected(gameMap, null, 'B'), false)
      assert.equal(isConnected(gameMap, 'A', null), false)
      assert.equal(isConnected(gameMap, null, null), false)
    })

    test('throws TypeError if gameMap.connections is missing', () => {
      assert.throws(() => isConnected({}, 'A', 'B'), TypeError)
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

    test('handles missing van object gracefully', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 10
      }))
      const player = { currentNodeId: 'A', money: 100 }

      // Should not crash, fuel defaults to 0
      const result = checkSoftlock(gameMap, player)
      assert.ok(typeof result === 'boolean')
    })

    test('passes band state to calculateTravelExpenses', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 10
      }))
      const player = { currentNodeId: 'A', van: { fuel: 20 }, money: 100 }
      const band = { members: [] }

      checkSoftlock(gameMap, player, band)

      const calls = mockCalculateTravelExpenses.mock.calls
      assert.ok(calls.length > 0)
      // Fourth argument should be the band
      assert.equal(calls[0].arguments[3], band)
    })
  })

  describe('normalizeVenueId', () => {
    test('returns null for null or undefined input', () => {
      assert.equal(normalizeVenueId(null), null)
      assert.equal(normalizeVenueId(undefined), null)
    })

    test('extracts ID from object with id property', () => {
      const venue = { id: 'club_toxic', name: 'Toxic Club' }
      assert.equal(normalizeVenueId(venue), 'club_toxic')
    })

    test('extracts ID from object with name property', () => {
      const venue = { name: 'club_toxic' }
      assert.equal(normalizeVenueId(venue), 'club_toxic')
    })

    test('returns string directly if venue is a string', () => {
      assert.equal(normalizeVenueId('club_toxic'), 'club_toxic')
    })

    test('strips legacy venues: namespace prefix', () => {
      const venue = { id: 'venues:club_toxic.name' }
      assert.equal(normalizeVenueId(venue), 'club_toxic')
    })

    test('strips .name suffix from legacy format', () => {
      const venueId = 'venues:club_toxic.name'
      assert.equal(normalizeVenueId(venueId), 'club_toxic')
    })

    test('handles string without legacy format', () => {
      assert.equal(normalizeVenueId('club_toxic'), 'club_toxic')
    })

    test('handles object with legacy formatted id', () => {
      const venue = { id: 'venues:arena_metal.name', name: 'Metal Arena' }
      assert.equal(normalizeVenueId(venue), 'arena_metal')
    })

    test('prefers id over name when both exist', () => {
      const venue = { id: 'club_a', name: 'club_b' }
      assert.equal(normalizeVenueId(venue), 'club_a')
    })

    test('returns null for non-string, non-object input', () => {
      assert.equal(normalizeVenueId(123), null)
      assert.equal(normalizeVenueId(true), null)
      assert.equal(normalizeVenueId([]), null)
    })

    test('handles empty object', () => {
      assert.equal(normalizeVenueId({}), null)
    })

    test('handles object with non-string id', () => {
      const venue = { id: 123 }
      assert.equal(normalizeVenueId(venue), null)
    })

    test('strips only venues: prefix, not other prefixes', () => {
      const venueId = 'other:club_toxic.name'
      assert.equal(normalizeVenueId(venueId), 'other:club_toxic.name')
    })

    test('handles venues: prefix without .name suffix', () => {
      const venueId = 'venues:club_toxic'
      // Should only strip .name, leaving venues:club_toxic as is
      assert.equal(normalizeVenueId(venueId), 'club_toxic')
    })

    test('handles .name suffix without venues: prefix', () => {
      const venueId = 'club_toxic.name'
      // Should only strip venues: prefix, leaving club_toxic.name as is
      assert.equal(normalizeVenueId(venueId), 'club_toxic')
    })

    test('handles multiple .name in string', () => {
      const venueId = 'venues:club.name.name'
      assert.equal(normalizeVenueId(venueId), 'club.name')
    })
  })
})
