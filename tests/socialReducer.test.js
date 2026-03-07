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
  })
})
