import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'

import {
  handleUpdateSocial,
  handleAddVenueBlacklist
} from '../src/context/reducers/socialReducer.js'
import { ALLOWED_TRENDS } from '../src/data/socialTrends.js'

describe('socialReducer', () => {
  let baseState

  beforeEach(() => {
    baseState = {
      social: {
        loyalty: 0,
        trend: 'none',
        sponsorActive: false,
        activeDeals: []
      },
      venueBlacklist: [],
      toasts: []
    }
  })

  describe('handleUpdateSocial', () => {
    it('should correctly apply simple object updates', () => {
      const payload = { trend: ALLOWED_TRENDS[0] }
      const nextState = handleUpdateSocial(baseState, payload)

      assert.strictEqual(nextState.social.trend, ALLOWED_TRENDS[0])
    })

    it('should support functional updates', () => {
      baseState.social.loyalty = 10
      const payload = prev => ({ loyalty: prev.loyalty + 5 })
      const nextState = handleUpdateSocial(baseState, payload)

      assert.strictEqual(nextState.social.loyalty, 15)
    })

    it('should ignore invalid trend updates', () => {
      const payload = { trend: 'invalid_trend', loyalty: 20 }
      const nextState = handleUpdateSocial(baseState, payload)

      assert.strictEqual(nextState.social.trend, 'none') // unchanged
      assert.strictEqual(nextState.social.loyalty, 20)
    })

    it('should ignore invalid sponsorActive updates', () => {
      const payload = { sponsorActive: 'yes' } // must be boolean
      const nextState = handleUpdateSocial(baseState, payload)

      assert.strictEqual(nextState.social.sponsorActive, false) // unchanged
    })

    it('should filter invalid deals from activeDeals', () => {
      const payload = {
        activeDeals: [
          { id: 'valid1', remainingGigs: 3 },
          { id: 'invalid1' }, // missing remainingGigs
          'invalid2' // not an object
        ]
      }
      const nextState = handleUpdateSocial(baseState, payload)

      assert.strictEqual(nextState.social.activeDeals.length, 1)
      assert.strictEqual(nextState.social.activeDeals[0].id, 'valid1')
    })

    it('should return unchanged state if payload is not an object/function', () => {
      const nextState = handleUpdateSocial(baseState, 'string_payload')
      assert.strictEqual(nextState, baseState)
    })

    it('should merge multiple valid updates correctly', () => {
      baseState.social = {
        trend: 'none',
        loyalty: 10,
        sponsorActive: false,
        activeDeals: []
      }
      const payload = {
        trend: ALLOWED_TRENDS[1],
        loyalty: 50,
        sponsorActive: true,
        activeDeals: [{ id: 'deal1', remainingGigs: 5 }]
      }
      const nextState = handleUpdateSocial(baseState, payload)

      assert.strictEqual(nextState.social.trend, ALLOWED_TRENDS[1])
      assert.strictEqual(nextState.social.loyalty, 50)
      assert.strictEqual(nextState.social.sponsorActive, true)
      assert.strictEqual(nextState.social.activeDeals.length, 1)
      assert.strictEqual(nextState.social.activeDeals[0].id, 'deal1')
    })

    it('should not mutate original state', () => {
      const originalSocial = { ...baseState.social }
      const payload = { loyalty: 100 }

      handleUpdateSocial(baseState, payload)

      assert.deepStrictEqual(baseState.social, originalSocial)
    })

    it('should handle null payload gracefully', () => {
      const nextState = handleUpdateSocial(baseState, null)
      assert.strictEqual(nextState, baseState)
    })

    it('should handle undefined payload gracefully', () => {
      const nextState = handleUpdateSocial(baseState, undefined)
      assert.strictEqual(nextState, baseState)
    })

    it('should validate activeDeals is array and filter invalid entries', () => {
      const payload = {
        activeDeals: [
          { id: 'valid1', remainingGigs: 3 },
          { id: 'valid2', remainingGigs: 1 },
          { id: 'invalid', remainingGigs: 'not-a-number' }, // invalid
          { remainingGigs: 2 }, // missing id
          null // invalid
        ]
      }
      const nextState = handleUpdateSocial(baseState, payload)

      assert.strictEqual(nextState.social.activeDeals.length, 2)
      assert.strictEqual(nextState.social.activeDeals[0].id, 'valid1')
      assert.strictEqual(nextState.social.activeDeals[1].id, 'valid2')
    })

    it('should reject non-array activeDeals', () => {
      const payload = { activeDeals: 'not-an-array' }
      const nextState = handleUpdateSocial(baseState, payload)

      assert.deepStrictEqual(nextState.social.activeDeals, [])
    })

    it('should accept valid sponsorActive boolean values', () => {
      const nextState1 = handleUpdateSocial(baseState, { sponsorActive: true })
      assert.strictEqual(nextState1.social.sponsorActive, true)

      const nextState2 = handleUpdateSocial(baseState, { sponsorActive: false })
      assert.strictEqual(nextState2.social.sponsorActive, false)
    })
  })

  describe('handleAddVenueBlacklist', () => {
    it('should add to venueBlacklist and show error toast if loyalty < 30', () => {
      baseState.social.loyalty = 10
      const nextState = handleAddVenueBlacklist(baseState, 'venue_123')

      assert.ok(nextState.venueBlacklist.includes('venue_123'))
      assert.strictEqual(nextState.social.loyalty, 10) // unchanged
      assert.ok(
        nextState.toasts.some(
          t => t.type === 'error' && t.message.includes('ui:toast.blacklisted')
        )
      )
    })

    it('should prevent blacklisting and deduct 15 loyalty if loyalty >= 30', () => {
      baseState.social.loyalty = 30
      const nextState = handleAddVenueBlacklist(baseState, 'venue_123')

      assert.ok(!nextState.venueBlacklist.includes('venue_123'))
      assert.strictEqual(nextState.social.loyalty, 15) // 30 - 15
      assert.ok(
        nextState.toasts.some(
          t => t.type === 'info' && t.message === 'ui:toast.fans_defended'
        )
      )
    })

    it('should blacklist at loyalty exactly 29', () => {
      baseState.social.loyalty = 29
      const nextState = handleAddVenueBlacklist(baseState, 'venue_edge')

      assert.ok(nextState.venueBlacklist.includes('venue_edge'))
      assert.strictEqual(nextState.social.loyalty, 29)
    })

    it('should preserve existing blacklist entries', () => {
      baseState.venueBlacklist = ['existing_venue']
      baseState.social.loyalty = 10
      const nextState = handleAddVenueBlacklist(baseState, 'new_venue')

      assert.strictEqual(nextState.venueBlacklist.length, 2)
      assert.ok(nextState.venueBlacklist.includes('existing_venue'))
      assert.ok(nextState.venueBlacklist.includes('new_venue'))
    })

    it('should handle undefined venueBlacklist gracefully', () => {
      delete baseState.venueBlacklist
      baseState.social.loyalty = 10
      const nextState = handleAddVenueBlacklist(baseState, 'venue_123')

      assert.ok(Array.isArray(nextState.venueBlacklist))
      assert.ok(nextState.venueBlacklist.includes('venue_123'))
    })

    it('should not mutate original state', () => {
      baseState.social.loyalty = 50
      const originalLoyalty = baseState.social.loyalty
      const originalBlacklist = [...baseState.venueBlacklist]

      handleAddVenueBlacklist(baseState, 'venue_test')

      assert.strictEqual(baseState.social.loyalty, originalLoyalty)
      assert.deepStrictEqual(baseState.venueBlacklist, originalBlacklist)
    })
  })
})
