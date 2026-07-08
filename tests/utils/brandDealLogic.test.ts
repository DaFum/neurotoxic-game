import { describe, it, expect, vi } from 'vitest'
import {
  generateBrandOffers,
  negotiateDeal
} from '../../src/utils/brandDealLogic'
import {
  SocialEngineGameState,
  BrandDeal,
  BrandOffer
} from '../../src/types/social'
import {
  DEAL_NEGOTIATION_SAFE_CHANCE,
  DEAL_NEGOTIATION_PERSUASIVE_CHANCE,
  DEAL_NEGOTIATION_AGGRESSIVE_CHANCE
} from '../../src/context/gameConstants'

// We will mock buildBrandOffer to easily test what gets passed to it
vi.mock('../../src/utils/brandOfferFlavor', async importOriginal => {
  const actual =
    await importOriginal<typeof import('../../src/utils/brandOfferFlavor')>()
  return {
    ...actual,
    buildBrandOffer: vi.fn((deal, ctx) => ({ ...deal, _testCtx: ctx }))
  }
})

describe('brandDealLogic', () => {
  describe('generateBrandOffers', () => {
    it('returns empty array if there are active deals', () => {
      const gameState = {
        social: {
          activeDeals: [{ id: 'deal1' }]
        },
        band: {}
      } as unknown as SocialEngineGameState

      const offers = generateBrandOffers(gameState, Math.random)
      expect(offers).toEqual([])
    })

    it('processes follower counts and handles NaNs gracefully', () => {
      const gameState = {
        social: {
          activeDeals: [],
          instagram: 1000,
          tiktok: NaN,
          youtube: undefined,
          trend: 'TECH'
        },
        band: {}
      } as unknown as SocialEngineGameState

      const rng = () => 0.5 // Stable rng
      const offers = generateBrandOffers(gameState, rng) as (BrandOffer & {
        _testCtx: { totalFollowers: number }
      })[]

      // We expect it to process 1000 followers and output up to 3 offers
      expect(offers.length).toBeGreaterThan(0)
      expect(offers.length).toBeLessThanOrEqual(3)

      // Ensure the generated offers contain the expected follower count
      expect(offers[0]._testCtx.totalFollowers).toBe(1000)
    })

    it('returns up to 3 distinct deals', () => {
      const gameState = {
        social: { instagram: 500000 },
        band: {}
      } as unknown as SocialEngineGameState

      const offers = generateBrandOffers(gameState, () => 0.5)
      expect(offers.length).toBe(3)

      const ids = offers.map(o => o.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(3) // All 3 must be unique
    })
  })

  describe('negotiateDeal', () => {
    const mockDeal = {
      id: 'test_deal',
      offer: { upfront: 1000, perGig: 100, duration: 5 }
    } as unknown as BrandDeal

    it('handles SAFE strategy with success', () => {
      const gameState = { band: {}, social: {} } as SocialEngineGameState
      // Test at exact threshold minus epsilon, clamped to valid [0, 1) range
      const rng = () => Math.max(0, DEAL_NEGOTIATION_SAFE_CHANCE - 0.01)

      const result = negotiateDeal(mockDeal, 'SAFE', gameState, rng)

      expect(result.success).toBe(true)
      expect(result.status).toBe('ACCEPTED')
      expect(result.deal?.offer.upfront).toBe(1100) // 1000 * 1.1 = 1100
      expect(result.feedback).toBe('Modest increase secured.')
    })

    it('handles SAFE strategy with failure', () => {
      const gameState = { band: {}, social: {} } as SocialEngineGameState
      // Test at exact threshold plus epsilon, clamped to valid [0, 1) range
      const rng = () => Math.min(0.99, DEAL_NEGOTIATION_SAFE_CHANCE + 0.01)

      const result = negotiateDeal(mockDeal, 'SAFE', gameState, rng)

      expect(result.success).toBe(false)
      expect(result.status).toBe('FAILED')
      expect(result.deal?.offer.upfront).toBe(1000) // No change
      expect(result.feedback).toBe('They refused to budge.')
    })

    it('handles PERSUASIVE strategy with success', () => {
      const gameState = { band: {}, social: {} } as SocialEngineGameState
      // Test at exact threshold minus epsilon, clamped to valid [0, 1) range
      const rng = () => Math.max(0, DEAL_NEGOTIATION_PERSUASIVE_CHANCE - 0.01)

      const result = negotiateDeal(mockDeal, 'PERSUASIVE', gameState, rng)

      expect(result.success).toBe(true)
      expect(result.status).toBe('ACCEPTED')
      expect(result.deal?.offer.upfront).toBe(1200) // 1000 * 1.2
      expect(result.deal?.offer.perGig).toBe(110) // 100 * 1.1
    })

    it('handles PERSUASIVE strategy with success when perGig is absent', () => {
      const gameState = { band: {}, social: {} } as SocialEngineGameState
      const mockDealNoPerGig = {
        id: 'test_deal_no_pergig',
        offer: { upfront: 1000, duration: 5 }
      } as unknown as BrandDeal
      // Test at exact threshold minus epsilon, clamped to valid [0, 1) range
      const rng = () => Math.max(0, DEAL_NEGOTIATION_PERSUASIVE_CHANCE - 0.01)

      const result = negotiateDeal(
        mockDealNoPerGig,
        'PERSUASIVE',
        gameState,
        rng
      )

      expect(result.success).toBe(true)
      expect(result.status).toBe('ACCEPTED')
      expect(result.deal?.offer.upfront).toBe(1200) // 1000 * 1.2
      expect(result.deal?.offer.perGig).toBeUndefined()
    })

    it('handles PERSUASIVE strategy with failure', () => {
      const gameState = { band: {}, social: {} } as SocialEngineGameState
      // Test at exact threshold plus epsilon, clamped to valid [0, 1) range
      const rng = () =>
        Math.min(0.99, DEAL_NEGOTIATION_PERSUASIVE_CHANCE + 0.01)

      const result = negotiateDeal(mockDeal, 'PERSUASIVE', gameState, rng)

      expect(result.success).toBe(false)
      expect(result.status).toBe('ACCEPTED') // Status is ACCEPTED but worse terms
      expect(result.deal?.offer.upfront).toBe(900) // 1000 * 0.9
    })

    it('handles AGGRESSIVE strategy with success', () => {
      const gameState = { band: {}, social: {} } as SocialEngineGameState
      // Test at exact threshold minus epsilon, clamped to valid [0, 1) range
      const rng = () => Math.max(0, DEAL_NEGOTIATION_AGGRESSIVE_CHANCE - 0.01)

      const result = negotiateDeal(mockDeal, 'AGGRESSIVE', gameState, rng)

      expect(result.success).toBe(true)
      expect(result.status).toBe('ACCEPTED')
      expect(result.deal?.offer.upfront).toBe(1500) // 1000 * 1.5
    })

    it('handles AGGRESSIVE strategy with failure (REVOKED)', () => {
      const gameState = { band: {}, social: {} } as SocialEngineGameState
      // Test at exact threshold plus epsilon, clamped to valid [0, 1) range
      const rng = () =>
        Math.min(0.99, DEAL_NEGOTIATION_AGGRESSIVE_CHANCE + 0.01)

      const result = negotiateDeal(mockDeal, 'AGGRESSIVE', gameState, rng)

      expect(result.success).toBe(false)
      expect(result.status).toBe('REVOKED')
      expect(result.deal).toBeNull() // Deal should be null
    })

    it('applies modifier: rival proximity penalty', () => {
      const gameState = {
        band: {},
        player: { currentNodeId: 'loc1' },
        rivalBand: { currentLocationId: 'loc1' }
      } as SocialEngineGameState

      // We will just verify it runs without crashing, and success chance is lower
      const result = negotiateDeal(mockDeal, 'SAFE', gameState, () => 0.79)
      expect(result.success).toBe(false)
    })

    it('applies modifier: social_manager trait', () => {
      const gameState = {
        band: {
          members: [{ traits: { social_manager: { id: 'social_manager' } } }]
        }
      } as unknown as SocialEngineGameState

      // Manager gives +0.1 to SAFE, so chance is 0.9. (Base 0.8)
      const result = negotiateDeal(mockDeal, 'SAFE', gameState, () => 0.85)
      expect(result.success).toBe(true)
    })

    it('applies modifier: isFamous', () => {
      const gameState = {
        band: {},
        player: { fame: 2000 } // > 1000 is famous
      } as unknown as SocialEngineGameState

      // Fame gives +0.2 to AGGRESSIVE. Base is 0.3. Total 0.5.
      const result = negotiateDeal(
        mockDeal,
        'AGGRESSIVE',
        gameState,
        () => 0.45
      )
      expect(result.success).toBe(true)
    })

    it('throws error on invalid strategy', () => {
      const gameState = { band: {}, social: {} } as SocialEngineGameState
      expect(() => {
        negotiateDeal(
          mockDeal,
          'INVALID' as 'SAFE' | 'PERSUASIVE' | 'AGGRESSIVE',
          gameState
        )
      }).toThrow('Unknown strategy: INVALID')
    })
  })
})
