import assert from 'node:assert/strict'
import { test, describe } from 'vitest'
import {
  resolveVenue,
  getLocationName,
  checkVenueAccess,
  checkTravelPrerequisites,
  checkTravelResources
} from '../../src/utils/travelUtils'

describe('travelUtils', () => {
  const venuesMap = new Map([
    ['venue_1', { id: 'venue_1', name: 'Venue 1', capacity: 100 }],
    ['venue_2', { id: 'venue_2', name: 'Venue 2', capacity: 200 }]
  ])

  describe('resolveVenue', () => {
    test('resolves venue from ID string', () => {
      assert.strictEqual(
        resolveVenue('venue_1', 'venue_1', venuesMap).id,
        'venue_1'
      )
    })

    test('returns null if ID string not in map', () => {
      assert.strictEqual(resolveVenue('venue_3', 'venue_3', venuesMap), null)
    })

    test('returns venue object if it has capacity', () => {
      const venue = { id: 'venue_1', capacity: 100 }
      assert.strictEqual(resolveVenue(venue, 'venue_1', venuesMap), venue)
    })

    test('resolves from map if venue object lacks capacity', () => {
      assert.strictEqual(
        resolveVenue({ id: 'venue_1' }, 'venue_1', venuesMap).capacity,
        100
      )
    })
  })

  describe('getLocationName', () => {
    test('translates location using provided helpers', () => {
      const result = getLocationName(
        'My Place',
        'venue_1',
        k => k,
        (t, key) => `Translated ${key}`
      )
      assert.strictEqual(result, 'Translated My Place')
    })
  })

  describe('checkVenueAccess', () => {
    const mockGetLocationName = name => name

    test('allows access to START node', () => {
      assert.strictEqual(
        checkVenueAccess({ node: { type: 'START' } }).allowed,
        true
      )
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
    const cases = [
      {
        label: 'allows START node regardless of visibility',
        node: { type: 'START' },
        visibility: 'hidden',
        isConnected: false,
        allowed: true,
        errorKey: undefined
      },
      {
        label: 'denies if not visible',
        node: { type: 'GIG' },
        visibility: 'hidden',
        isConnected: true,
        allowed: false,
        errorKey: 'ui:travel.errors.locationNotVisible'
      },
      {
        label: 'denies if not connected',
        node: { type: 'GIG' },
        visibility: 'visible',
        isConnected: false,
        allowed: false,
        errorKey: 'ui:travel.errors.locationNotConnected'
      },
      {
        label: 'allows if visible and connected',
        node: { type: 'GIG' },
        visibility: 'visible',
        isConnected: true,
        allowed: true,
        errorKey: undefined
      }
    ]

    cases.forEach(
      ({ label, node, visibility, isConnected, allowed, errorKey }) => {
        test(label, () => {
          const result = checkTravelPrerequisites(node, visibility, isConnected)
          assert.strictEqual(result.allowed, allowed)
          if (errorKey) assert.strictEqual(result.errorKey, errorKey)
        })
      }
    )
  })

  describe('checkTravelResources', () => {
    const cases = [
      {
        label: 'denies if not enough money',
        cost: 100,
        fuel: 10,
        money: 50,
        vanFuel: 20,
        allowed: false,
        errorKey: 'ui:travel.errors.notEnoughMoneyForTravel'
      },
      {
        label: 'denies if not enough fuel',
        cost: 100,
        fuel: 30,
        money: 200,
        vanFuel: 20,
        allowed: false,
        errorKey: 'ui:travel.errors.notEnoughFuel'
      },
      {
        label: 'allows if enough resources',
        cost: 100,
        fuel: 10,
        money: 200,
        vanFuel: 20,
        allowed: true,
        errorKey: undefined
      }
    ]

    cases.forEach(
      ({ label, cost, fuel, money, vanFuel, allowed, errorKey }) => {
        test(label, () => {
          const result = checkTravelResources(cost, fuel, {
            money,
            van: { fuel: vanFuel }
          })
          assert.strictEqual(result.allowed, allowed)
          if (errorKey) assert.strictEqual(result.errorKey, errorKey)
        })
      }
    )
  })
})
