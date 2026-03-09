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

    it('should handle boundary at exactly 30 loyalty', () => {
      // At 30, should defend
      baseState.social.loyalty = 30
      let nextState = handleAddVenueBlacklist(baseState, 'venue_test')
      assert.ok(!nextState.venueBlacklist.includes('venue_test'))
      assert.strictEqual(nextState.social.loyalty, 15)

      // At 29, should blacklist
      baseState.social.loyalty = 29
      nextState = handleAddVenueBlacklist(baseState, 'venue_test')
      assert.ok(nextState.venueBlacklist.includes('venue_test'))
      assert.strictEqual(nextState.social.loyalty, 29)
    })

    it('should handle multiple venues in blacklist', () => {
      baseState.social.loyalty = 10
      baseState.venueBlacklist = ['venue_1', 'venue_2']
      const nextState = handleAddVenueBlacklist(baseState, 'venue_3')

      assert.strictEqual(nextState.venueBlacklist.length, 3)
      assert.ok(nextState.venueBlacklist.includes('venue_3'))
    })

    it('should generate toast IDs based on timestamp', () => {
      baseState.social.loyalty = 10
      const nextState1 = handleAddVenueBlacklist(baseState, 'venue_1')

      // Toast ID should be a string representation of a timestamp
      assert.strictEqual(typeof nextState1.toasts[0].id, 'string')
      assert.ok(nextState1.toasts[0].id.length > 0)
      assert.ok(/^\d+$/.test(nextState1.toasts[0].id)) // Should be numeric string
    })

    it('should include venue label in blacklist toast message', () => {
      baseState.social.loyalty = 10
      const nextState = handleAddVenueBlacklist(baseState, 'club_berlin')

      const toast = nextState.toasts.find(t => t.type === 'error')
      assert.ok(toast.message.includes('venues:club_berlin.name'))
    })
  })

  describe('handleUpdateSocial - additional edge cases', () => {
    it('should accept valid boolean sponsorActive', () => {
      const payload = { sponsorActive: true }
      const nextState = handleUpdateSocial(baseState, payload)

      assert.strictEqual(nextState.social.sponsorActive, true)
    })

    it('should validate activeDeals is an array', () => {
      const payload = { activeDeals: 'not-an-array' }
      const nextState = handleUpdateSocial(baseState, payload)

      assert.deepStrictEqual(nextState.social.activeDeals, [])
    })

    it('should handle null payload', () => {
      const nextState = handleUpdateSocial(baseState, null)
      assert.strictEqual(nextState, baseState)
    })

    it('should handle undefined payload', () => {
      const nextState = handleUpdateSocial(baseState, undefined)
      assert.strictEqual(nextState, baseState)
    })

    it('should merge multiple valid fields', () => {
      const payload = {
        trend: ALLOWED_TRENDS[0],
        loyalty: 50,
        sponsorActive: true,
        activeDeals: [{ id: 'deal1', remainingGigs: 2 }]
      }
      const nextState = handleUpdateSocial(baseState, payload)

      assert.strictEqual(nextState.social.trend, ALLOWED_TRENDS[0])
      assert.strictEqual(nextState.social.loyalty, 50)
      assert.strictEqual(nextState.social.sponsorActive, true)
      assert.strictEqual(nextState.social.activeDeals.length, 1)
    })

    it('should preserve existing social fields not in payload', () => {
      baseState.social.instagram = 100
      baseState.social.tiktok = 50
      const payload = { loyalty: 25 }
      const nextState = handleUpdateSocial(baseState, payload)

      assert.strictEqual(nextState.social.instagram, 100)
      assert.strictEqual(nextState.social.tiktok, 50)
      assert.strictEqual(nextState.social.loyalty, 25)
    })

    it('should validate deal structure with missing id', () => {
      const payload = {
        activeDeals: [
          { remainingGigs: 3 }, // Missing id
          { id: 'valid', remainingGigs: 2 }
        ]
      }
      const nextState = handleUpdateSocial(baseState, payload)

      assert.strictEqual(nextState.social.activeDeals.length, 1)
      assert.strictEqual(nextState.social.activeDeals[0].id, 'valid')
    })

    it('should validate deal structure with non-number remainingGigs', () => {
      const payload = {
        activeDeals: [
          { id: 'deal1', remainingGigs: 'three' }, // Invalid type
          { id: 'deal2', remainingGigs: 5 }
        ]
      }
      const nextState = handleUpdateSocial(baseState, payload)

      assert.strictEqual(nextState.social.activeDeals.length, 1)
      assert.strictEqual(nextState.social.activeDeals[0].id, 'deal2')
    })
  })
})