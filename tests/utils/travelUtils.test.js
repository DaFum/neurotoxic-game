import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import {
  resolveVenue,
  getLocationName,
  checkVenueAccess,
  checkTravelPrerequisites,
  checkTravelResources
} from '../../src/utils/travelUtils.js'

describe('travelUtils', () => {
  const venuesMap = new Map([
    ['venue_1', { id: 'venue_1', name: 'Venue 1', capacity: 100 }],
    ['venue_2', { id: 'venue_2', name: 'Venue 2', capacity: 200 }]
  ])

  describe('resolveVenue', () => {
    test('resolves venue from ID string', () => {
      const result = resolveVenue('venue_1', 'venue_1', venuesMap)
      assert.strictEqual(result.id, 'venue_1')
    })

    test('returns null if ID string not in map', () => {
      const result = resolveVenue('venue_3', 'venue_3', venuesMap)
      assert.strictEqual(result, null)
    })

    test('returns venue object if it has capacity', () => {
      const venue = { id: 'venue_1', capacity: 100 }
      const result = resolveVenue(venue, 'venue_1', venuesMap)
      assert.strictEqual(result, venue)
    })

    test('resolves from map if venue object lacks capacity', () => {
      const venue = { id: 'venue_1' }
      const result = resolveVenue(venue, 'venue_1', venuesMap)
      assert.strictEqual(result.capacity, 100)
    })
  })

  describe('getLocationName', () => {
    test('translates location using provided helpers', () => {
      const t = k => k
      const translateLocation = (t, key) => `Translated ${key}`
      const result = getLocationName(
        'My Place',
        'venue_1',
        t,
        translateLocation
      )
      assert.strictEqual(result, 'Translated My Place')
    })
  })

  describe('checkVenueAccess', () => {
    const mockGetLocationName = name => name

    test('allows access to START node', () => {
      const result = checkVenueAccess({ node: { type: 'START' } })
      assert.strictEqual(result.allowed, true)
    })

    test('denies access if venue data is invalid', () => {
      const result = checkVenueAccess({
        node: { type: 'GIG', venue: 'invalid' },
        venuesMap: new Map(),
        getLocationName: mockGetLocationName
      })
      assert.strictEqual(result.allowed, false)
      assert.strictEqual(result.errorKey, 'ui:errors.invalidVenueData')
    })

    test('denies access if venue is blacklisted', () => {
      const result = checkVenueAccess({
        node: { type: 'GIG', venue: { id: 'venue_1', name: 'Black' } },
        venueBlacklist: ['venue_1'],
        venuesMap,
        getLocationName: mockGetLocationName
      })
      assert.strictEqual(result.allowed, false)
      assert.strictEqual(
        result.errorKey,
        'ui:travel.errors.bookingRefusedBlacklisted'
      )
    })

    test('denies access in proveYourselfMode if capacity > 150', () => {
      const result = checkVenueAccess({
        node: { type: 'GIG', venue: { id: 'venue_2', name: 'Big' } },
        player: { stats: { proveYourselfMode: true } },
        venuesMap,
        getLocationName: mockGetLocationName
      })
      assert.strictEqual(result.allowed, false)
      assert.strictEqual(
        result.errorKey,
        'ui:travel.errors.proveYourselfVenueTooBig'
      )
    })

    test('denies access if regional reputation is too low', () => {
      const result = checkVenueAccess({
        node: { type: 'GIG', venue: { id: 'REGION_venue_1', name: 'Rep' } },
        reputationByRegion: { REGION: -31 },
        venuesMap: new Map([
          [
            'REGION_venue_1',
            { id: 'REGION_venue_1', name: 'Rep', capacity: 50 }
          ]
        ]),
        getLocationName: mockGetLocationName
      })
      assert.strictEqual(result.allowed, false)
      assert.strictEqual(
        result.errorKey,
        'ui:travel.errors.bookingRefusedRegionalReputation'
      )
    })

    test('allows access if all checks pass', () => {
      const result = checkVenueAccess({
        node: { type: 'GIG', venue: { id: 'venue_1', name: 'Ok' } },
        venuesMap,
        getLocationName: mockGetLocationName
      })
      assert.strictEqual(result.allowed, true)
      assert.strictEqual(result.resolvedVenue.id, 'venue_1')
    })
  })

  describe('checkTravelPrerequisites', () => {
    test('allows START node regardless of visibility', () => {
      const result = checkTravelPrerequisites(
        { type: 'START' },
        'hidden',
        false
      )
      assert.strictEqual(result.allowed, true)
    })

    test('denies if not visible', () => {
      const result = checkTravelPrerequisites({ type: 'GIG' }, 'hidden', true)
      assert.strictEqual(result.allowed, false)
      assert.strictEqual(result.errorKey, 'ui:travel.errors.locationNotVisible')
    })

    test('denies if not connected', () => {
      const result = checkTravelPrerequisites({ type: 'GIG' }, 'visible', false)
      assert.strictEqual(result.allowed, false)
      assert.strictEqual(
        result.errorKey,
        'ui:travel.errors.locationNotConnected'
      )
    })

    test('allows if visible and connected', () => {
      const result = checkTravelPrerequisites({ type: 'GIG' }, 'visible', true)
      assert.strictEqual(result.allowed, true)
    })
  })

  describe('checkTravelResources', () => {
    test('denies if not enough money', () => {
      const result = checkTravelResources(100, 10, {
        money: 50,
        van: { fuel: 20 }
      })
      assert.strictEqual(result.allowed, false)
      assert.strictEqual(
        result.errorKey,
        'ui:travel.errors.notEnoughMoneyForTravel'
      )
    })

    test('denies if not enough fuel', () => {
      const result = checkTravelResources(100, 30, {
        money: 200,
        van: { fuel: 20 }
      })
      assert.strictEqual(result.allowed, false)
      assert.strictEqual(result.errorKey, 'ui:travel.errors.notEnoughFuel')
    })

    test('allows if enough resources', () => {
      const result = checkTravelResources(100, 10, {
        money: 200,
        van: { fuel: 20 }
      })
      assert.strictEqual(result.allowed, true)
    })
  })
})
