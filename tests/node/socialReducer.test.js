import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import {
  handleUpdateSocial,
  handleAddVenueBlacklist,
  handleUnblacklistVenue,
  getUnblacklistCost,
  handlePirateBroadcast
} from '../../src/context/reducers/socialReducer'
import { ALLOWED_TRENDS } from '../../src/data/socialTrends'
import { formatCurrency } from '../../src/utils/numberUtils'

describe('socialReducer', () => {
  let baseState

  beforeEach(() => {
    baseState = {
      social: {
        loyalty: 0,
        trend: 'none',
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

    it('should clamp direct loyalty updates', () => {
      const nextHigh = handleUpdateSocial(baseState, { loyalty: 150 })
      const nextLow = handleUpdateSocial(baseState, { loyalty: -10 })

      assert.strictEqual(nextHigh.social.loyalty, 100)
      assert.strictEqual(nextLow.social.loyalty, 0)
    })

    it('should clamp functional loyalty updates', () => {
      baseState.social.loyalty = 95
      const nextState = handleUpdateSocial(baseState, prev => ({
        loyalty: prev.loyalty + 10
      }))

      assert.strictEqual(nextState.social.loyalty, 100)
    })

    it('should ignore invalid trend updates', () => {
      const payload = { trend: 'invalid_trend', loyalty: 20 }
      const nextState = handleUpdateSocial(baseState, payload)

      assert.strictEqual(nextState.social.trend, 'none') // unchanged
      assert.strictEqual(nextState.social.loyalty, 20)
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
        activeDeals: []
      }
      const payload = {
        trend: ALLOWED_TRENDS[1],
        loyalty: 50,
        activeDeals: [{ id: 'deal1', remainingGigs: 5 }]
      }
      const nextState = handleUpdateSocial(baseState, payload)

      assert.strictEqual(nextState.social.trend, ALLOWED_TRENDS[1])
      assert.strictEqual(nextState.social.loyalty, 50)
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

    it('should filter deals with non-finite remainingGigs (NaN/Infinity)', () => {
      const payload = {
        activeDeals: [
          { id: 'valid1', remainingGigs: 3 },
          { id: 'nan', remainingGigs: Number.NaN }, // invalid
          { id: 'inf', remainingGigs: Number.POSITIVE_INFINITY } // invalid
        ]
      }
      const nextState = handleUpdateSocial(baseState, payload)

      assert.strictEqual(nextState.social.activeDeals.length, 1)
      assert.strictEqual(nextState.social.activeDeals[0].id, 'valid1')
    })

    it('should reject non-array activeDeals', () => {
      const payload = { activeDeals: 'not-an-array' }
      const nextState = handleUpdateSocial(baseState, payload)

      assert.deepStrictEqual(nextState.social.activeDeals, [])
    })
  })

  describe('brand deal break on controversy', () => {
    it('voids active deals and emits failure when crossing the threshold', () => {
      const state = {
        social: {
          loyalty: 0,
          controversyLevel: 50,
          activeDeals: [{ id: 'd1', remainingGigs: 3 }]
        },
        venueBlacklist: [],
        toasts: [],
        activeQuests: []
      }
      const next = handleUpdateSocial(state, { controversyLevel: 90 })
      assert.deepStrictEqual(next.social.activeDeals, [])
      assert.ok(
        next.toasts.some(
          t => t.type === 'error' && t.messageKey === 'ui:toast.dealsBroken'
        )
      )
    })

    it('does not re-void when already above the threshold (no crossing)', () => {
      const state = {
        social: {
          loyalty: 0,
          controversyLevel: 90,
          activeDeals: [{ id: 'd1', remainingGigs: 3 }]
        },
        venueBlacklist: [],
        toasts: [],
        activeQuests: []
      }
      const next = handleUpdateSocial(state, { loyalty: 5 })
      assert.strictEqual(next.social.activeDeals.length, 1)
      assert.ok(!next.toasts.some(t => t.messageKey === 'ui:toast.dealsBroken'))
    })
  })

  describe('handleAddVenueBlacklist', () => {
    it('should add to venueBlacklist and show error toast if loyalty < 30', () => {
      baseState.social.loyalty = 10
      const nextState = handleAddVenueBlacklist(baseState, {
        venueId: 'venue_123',
        toastId: 'test_toast_id'
      })

      assert.ok(nextState.venueBlacklist.includes('venue_123'))
      assert.strictEqual(nextState.social.loyalty, 10) // unchanged
      assert.ok(
        nextState.toasts.some(
          t => t.type === 'error' && t.messageKey === 'ui:toast.blacklisted'
        )
      )
    })

    it('should prevent blacklisting and deduct 15 loyalty if loyalty >= 30', () => {
      baseState.social.loyalty = 30
      const nextState = handleAddVenueBlacklist(baseState, {
        venueId: 'venue_123',
        toastId: 'test_toast_id'
      })

      assert.ok(!nextState.venueBlacklist.includes('venue_123'))
      assert.strictEqual(nextState.social.loyalty, 15) // 30 - 15
      assert.ok(
        nextState.toasts.some(
          t => t.type === 'info' && t.messageKey === 'ui:toast.fans_defended'
        )
      )
    })

    it('should blacklist at loyalty exactly 29', () => {
      baseState.social.loyalty = 29
      const nextState = handleAddVenueBlacklist(baseState, {
        venueId: 'venue_edge',
        toastId: 'test_toast_venue_edge'
      })

      assert.ok(nextState.venueBlacklist.includes('venue_edge'))
      assert.strictEqual(nextState.social.loyalty, 29)
    })

    it('should preserve existing blacklist entries', () => {
      baseState.venueBlacklist = ['existing_venue']
      baseState.social.loyalty = 10
      const nextState = handleAddVenueBlacklist(baseState, {
        venueId: 'new_venue',
        toastId: 'test_toast_new_venue'
      })

      assert.strictEqual(nextState.venueBlacklist.length, 2)
      assert.ok(nextState.venueBlacklist.includes('existing_venue'))
      assert.ok(nextState.venueBlacklist.includes('new_venue'))
    })

    it('should handle undefined venueBlacklist gracefully', () => {
      delete baseState.venueBlacklist
      baseState.social.loyalty = 10
      const nextState = handleAddVenueBlacklist(baseState, {
        venueId: 'venue_123',
        toastId: 'test_toast_id'
      })

      assert.ok(Array.isArray(nextState.venueBlacklist))
      assert.ok(nextState.venueBlacklist.includes('venue_123'))
    })

    it('should not mutate original state', () => {
      baseState.social.loyalty = 50
      const originalLoyalty = baseState.social.loyalty
      const originalBlacklist = [...baseState.venueBlacklist]

      handleAddVenueBlacklist(baseState, {
        venueId: 'venue_test',
        toastId: 'test_toast_venue_test'
      })

      assert.strictEqual(baseState.social.loyalty, originalLoyalty)
      assert.deepStrictEqual(baseState.venueBlacklist, originalBlacklist)
    })

    it('should handle boundary at exactly 30 loyalty', () => {
      // At 30, should defend
      baseState.social.loyalty = 30
      let nextState = handleAddVenueBlacklist(baseState, {
        venueId: 'venue_test',
        toastId: 'test_toast_venue_test'
      })
      assert.ok(!nextState.venueBlacklist.includes('venue_test'))
      assert.strictEqual(nextState.social.loyalty, 15)

      // At 29, should blacklist
      baseState.social.loyalty = 29
      nextState = handleAddVenueBlacklist(baseState, {
        venueId: 'venue_test',
        toastId: 'test_toast_venue_test'
      })
      assert.ok(nextState.venueBlacklist.includes('venue_test'))
      assert.strictEqual(nextState.social.loyalty, 29)
    })

    it('should handle multiple venues in blacklist', () => {
      baseState.social.loyalty = 10
      baseState.venueBlacklist = ['venue_1', 'venue_2']
      const nextState = handleAddVenueBlacklist(baseState, {
        venueId: 'venue_3',
        toastId: 'test_toast_venue_3'
      })

      assert.strictEqual(nextState.venueBlacklist.length, 3)
      assert.ok(nextState.venueBlacklist.includes('venue_3'))
    })

    it('should assign the provided deterministic toast ID', () => {
      baseState.social.loyalty = 10
      const nextState1 = handleAddVenueBlacklist(baseState, {
        venueId: 'venue_1',
        toastId: 'test_toast_venue_1'
      })

      // Toast ID should match the provided payload
      assert.strictEqual(nextState1.toasts[0].id, 'test_toast_venue_1')
    })

    it('should include venue label in blacklist toast message', () => {
      baseState.social.loyalty = 10
      const nextState = handleAddVenueBlacklist(baseState, {
        venueId: 'club_berlin',
        toastId: 'test_toast_club_berlin'
      })

      const toast = nextState.toasts.find(t => t.type === 'error')
      assert.strictEqual(toast.options.venueLabel, 'venues:club_berlin.name')
    })
  })

  describe('handleUnblacklistVenue', () => {
    const VENUE = 'stendal_adler' // real venue id; capacity 120

    const makeState = (money, blacklist) => ({
      player: { money },
      social: { loyalty: 0 },
      venueBlacklist: blacklist,
      toasts: [],
      activeQuests: []
    })

    it('removes the venue and deducts the amends cost when affordable', () => {
      const cost = getUnblacklistCost(VENUE)
      const state = makeState(cost + 100, [VENUE, 'other_venue'])
      const next = handleUnblacklistVenue(state, {
        venueId: VENUE,
        toastId: 'amends_toast'
      })

      assert.ok(!next.venueBlacklist.includes(VENUE))
      assert.ok(next.venueBlacklist.includes('other_venue'))
      assert.strictEqual(next.player.money, 100)
      assert.ok(
        next.toasts.some(
          t => t.type === 'success' && t.messageKey === 'ui:toast.amendsMade'
        )
      )
    })

    it('refuses and keeps money when the player cannot afford it', () => {
      const cost = getUnblacklistCost(VENUE)
      const state = makeState(cost - 1, [VENUE])
      const next = handleUnblacklistVenue(state, {
        venueId: VENUE,
        toastId: 'amends_toast'
      })

      assert.ok(next.venueBlacklist.includes(VENUE))
      assert.strictEqual(next.player.money, cost - 1)
      assert.ok(
        next.toasts.some(
          t =>
            t.type === 'error' && t.messageKey === 'ui:toast.amendsTooExpensive'
        )
      )
    })

    it('returns state unchanged when the venue is not blacklisted', () => {
      const state = makeState(9999, ['someone_else'])
      const next = handleUnblacklistVenue(state, {
        venueId: VENUE,
        toastId: 'amends_toast'
      })
      assert.strictEqual(next, state)
    })

    it('scales the amends cost with venue capacity', () => {
      // stendal_adler capacity 120 => 250 + 120*2 = 490
      assert.strictEqual(getUnblacklistCost(VENUE), 490)
      // unknown venue falls back to the base cost
      assert.strictEqual(getUnblacklistCost('does_not_exist'), 250)
    })
  })

  describe('handleUpdateSocial - additional edge cases', () => {
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

  describe('handlePirateBroadcast', () => {
    let mockState
    beforeEach(() => {
      mockState = {
        player: { money: 1000, fame: 50, day: 42 },
        band: { harmony: 100 },
        social: {
          zealotry: 20,
          controversyLevel: 10,
          lastPirateBroadcastDay: null
        },
        toasts: []
      }
    })

    it('should abort if funds or harmony are insufficient', () => {
      mockState.player.money = 100
      const payload = { cost: 200, harmonyCost: 10 }

      const nextState = handlePirateBroadcast(mockState, payload)
      assert.strictEqual(nextState, mockState)

      mockState.player.money = 1000
      mockState.band.harmony = 5
      const nextState2 = handlePirateBroadcast(mockState, payload)
      assert.strictEqual(nextState2, mockState)
    })

    it('should correctly deduct costs and apply gains', () => {
      const payload = {
        cost: 200,
        fameGain: 150,
        zealotryGain: 15,
        controversyGain: 20,
        harmonyCost: 10
      }

      const nextState = handlePirateBroadcast(mockState, payload)

      assert.strictEqual(nextState.player.money, 800)
      assert.strictEqual(nextState.player.fame, 200)
      assert.strictEqual(nextState.band.harmony, 90)
      assert.strictEqual(nextState.social.zealotry, 35)
      assert.strictEqual(nextState.social.controversyLevel, 30)
      assert.strictEqual(nextState.social.lastPirateBroadcastDay, 42)
    })

    it('should clamp values appropriately', () => {
      const payload = {
        cost: 200,
        fameGain: 150,
        zealotryGain: 90,
        controversyGain: 100,
        harmonyCost: 100
      }

      const nextState = handlePirateBroadcast(mockState, payload)

      assert.strictEqual(nextState.player.money, 800)
      assert.strictEqual(nextState.band.harmony, 1) // clamped
      assert.strictEqual(nextState.social.zealotry, 100)
      assert.strictEqual(nextState.social.controversyLevel, 100)
    })

    it('should handle successToast payload correctly', () => {
      const payload = {
        cost: 200,
        fameGain: 150,
        zealotryGain: 15,
        controversyGain: 20,
        harmonyCost: 10,
        successToast: { message: 'ui:pirate_radio.success', type: 'success' }
      }

      const nextState = handlePirateBroadcast(mockState, payload)

      assert.strictEqual(nextState.toasts.length, 1)
      const toast = nextState.toasts[0]
      assert.strictEqual(toast.message, 'ui:pirate_radio.success')
      assert.strictEqual(toast.type, 'success')
      assert.deepStrictEqual(toast.options, {
        deltaFame: 150,
        deltaZealotry: 15,
        deltaControversy: 20,
        deltaHarmony: -10,
        cost: formatCurrency(-200, undefined, 'always')
      })
    })
  })
})
