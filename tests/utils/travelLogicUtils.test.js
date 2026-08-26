import assert from 'node:assert/strict'
import { test, describe } from 'vitest'
import { resolveVenue } from '../../src/utils/travelUtils'

describe('travelUtils', () => {
  describe('resolveVenue', () => {
    test('does not accept inherited capacity as a resolved venue shape', () => {
      const inheritedCapacityVenue = Object.create({ capacity: 250 })
      inheritedCapacityVenue.name = 'Prototype Hall'
      const fallbackVenue = { id: 'venue_1', name: 'Real Hall', capacity: 120 }
      const venuesMap = new Map([['venue_1', fallbackVenue]])

      const result = resolveVenue(inheritedCapacityVenue, 'venue_1', venuesMap)

      assert.strictEqual(result, fallbackVenue)
    })
  })
})
