import { describe, it, expect, vi } from 'vitest'
import {
  generateBrandOffers,
  generateRankedBrandOffers,
  negotiateDeal
} from '../../src/utils/brandDealLogic'
import { selectTop3ByScore } from '../../src/utils/topSelection'
import type { SocialEngineGameState, BrandDeal } from '../../src/types/social'
import { buildBrandOffer } from '../../src/utils/brandOfferFlavor/index'
import { mulberry32 } from '../../src/utils/seededRng'
import { seededPostGigOffers } from './brandOffers.seed123.fixture'
import {
  DEAL_NEGOTIATION_SAFE_CHANCE,
  DEAL_NEGOTIATION_PERSUASIVE_CHANCE,
  DEAL_NEGOTIATION_AGGRESSIVE_CHANCE
} from '../../src/context/gameConstants'

// Observe context while retaining real flavor and terms for parity checks.
vi.mock('../../src/utils/brandOfferFlavor/index', async importOriginal => {
  const actual =
    await importOriginal<
      typeof import('../../src/utils/brandOfferFlavor/index')
    >()
  return {
    ...actual,
    buildBrandOffer: vi.fn(actual.buildBrandOffer)
  }
})

// Wrap the real selector so a test can read the score each pool entry gets.
vi.mock('../../src/utils/topSelection', async importOriginal => {
  const actual =
    await importOriginal<typeof import('../../src/utils/topSelection')>()
  return { ...actual, selectTop3ByScore: vi.fn(actual.selectTop3ByScore) }
})

/** Score of the first pool entry, with zero jitter. */
const firstEntryScore = (gameState: SocialEngineGameState): number => {
  const selector = vi.mocked(selectTop3ByScore)
  selector.mockClear()
  generateBrandOffers(gameState, () => 0)
  const call = selector.mock.calls[0]
  if (!call) throw new Error('selectTop3ByScore was not called')
  const [pool, scoreOf] = call
  return scoreOf(pool[0])
}

/** Score penalty a co-located rival of the given power applies to an offer. */
const rivalPenaltyFor = (powerLevel: number): number => {
  const base = {
    social: { instagram: 1000 },
    band: {},
    player: { currentNodeId: 'loc1' }
  } as unknown as SocialEngineGameState
  const withRival = {
    ...base,
    rivalBand: { currentLocationId: 'loc1', powerLevel }
  } as unknown as SocialEngineGameState
  return firstEntryScore(base) - firstEntryScore(withRival)
}

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
      vi.mocked(buildBrandOffer).mockClear()
      const offers = generateBrandOffers(gameState, rng)

      // We expect it to process 1000 followers and output up to 3 offers
      expect(offers.length).toBeGreaterThan(0)
      expect(offers.length).toBeLessThanOrEqual(3)

      // Ensure the generated offers contain the expected follower count
      expect(vi.mocked(buildBrandOffer).mock.calls[0]?.[1].totalFollowers).toBe(
        1000
      )
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

    it('scales the rival penalty with power and caps it at 20 from power 10', () => {
      expect(rivalPenaltyFor(10)).toBe(20)
      expect(rivalPenaltyFor(15)).toBe(20)
    })

    it('floors negative and non-finite rival power at a zero penalty', () => {
      expect(rivalPenaltyFor(-5)).toBe(0)
      expect(rivalPenaltyFor(NaN)).toBe(0)
      expect(rivalPenaltyFor(Infinity)).toBe(0)
    })
  })

  describe('generateRankedBrandOffers', () => {
    const state = {
      social: {
        instagram: 1000,
        tiktok: 0,
        youtube: 0,
        trend: 'TECH',
        zealotry: 40,
        controversyLevel: 0,
        activeDeals: [],
        brandReputation: { INDIE: 100 }
      },
      band: {}
    } as unknown as SocialEngineGameState

    it('ranks at least four distinct offers deterministically for Expedition', () => {
      const ranked = generateRankedBrandOffers(state, mulberry32(123), {
        minPoolSize: 4
      })
      expect(ranked.length).toBeGreaterThanOrEqual(4)
      expect(new Set(ranked.map(offer => offer.id)).size).toBe(ranked.length)
      expect(ranked).toEqual(
        generateRankedBrandOffers(state, mulberry32(123), { minPoolSize: 4 })
      )
    })

    it('keeps the first three identical to post-gig offers including flavor and terms', () => {
      for (const {
        instagram,
        offers: expectedPostGig
      } of seededPostGigOffers) {
        const gameState = {
          ...state,
          social: { ...state.social, instagram }
        }
        const postGig = generateBrandOffers(gameState, mulberry32(123))
        const ranked = generateRankedBrandOffers(gameState, mulberry32(123), {
          minPoolSize: 3
        })
        // Independent baseline catches RNG drift shared by both generators.
        expect(postGig).toEqual(expectedPostGig)
        expect(postGig).toHaveLength(3)
        expect(new Set(postGig.map(offer => offer.id)).size).toBe(3)
        expect(ranked.slice(0, 3)).toEqual(postGig)
        expect(postGig.every(offer => offer.flavor && offer.offer)).toBe(true)
        expect(generateRankedBrandOffers(gameState, mulberry32(123))).toEqual(
          ranked
        )
      }
    })

    it('keeps catalog admission order on equal scores', () => {
      const gameState = {
        ...state,
        social: { ...state.social, instagram: 500000, brandReputation: {} }
      }
      vi.mocked(buildBrandOffer).mockClear()
      const postGig = generateBrandOffers(gameState, () => 0)
      const ranked = generateRankedBrandOffers(gameState, () => 0, {
        minPoolSize: 3
      })
      expect(ranked.slice(0, 3)).toEqual(postGig)
    })

    it('returns no offers and consumes no RNG while a deal is active', () => {
      const rng = vi.fn(mulberry32(123))
      const active = {
        ...state,
        social: { ...state.social, activeDeals: [{ id: 'local_pawn_shop' }] }
      } as unknown as SocialEngineGameState
      expect(
        generateRankedBrandOffers(active, rng, { minPoolSize: 4 })
      ).toEqual([])
      expect(rng).not.toHaveBeenCalled()
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
      expect(result.feedbackKey).toBe('ui:deals.feedback.safeSuccess')
      expect(result).not.toHaveProperty('feedback')
    })

    it('handles SAFE strategy with failure', () => {
      const gameState = { band: {}, social: {} } as SocialEngineGameState
      // Test at exact threshold plus epsilon, clamped to valid [0, 1) range
      const rng = () => Math.min(0.99, DEAL_NEGOTIATION_SAFE_CHANCE + 0.01)

      const result = negotiateDeal(mockDeal, 'SAFE', gameState, rng)

      expect(result.success).toBe(false)
      expect(result.status).toBe('FAILED')
      expect(result.deal?.offer.upfront).toBe(1000) // No change
      expect(result.feedbackKey).toBe('ui:deals.feedback.safeFailure')
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
      expect(result.feedbackKey).toBe('ui:deals.feedback.persuasiveSuccess')
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
      expect(result.feedbackKey).toBe('ui:deals.feedback.persuasiveFailure')
    })

    it('handles AGGRESSIVE strategy with success', () => {
      const gameState = { band: {}, social: {} } as SocialEngineGameState
      // Test at exact threshold minus epsilon, clamped to valid [0, 1) range
      const rng = () => Math.max(0, DEAL_NEGOTIATION_AGGRESSIVE_CHANCE - 0.01)

      const result = negotiateDeal(mockDeal, 'AGGRESSIVE', gameState, rng)

      expect(result.success).toBe(true)
      expect(result.status).toBe('ACCEPTED')
      expect(result.deal?.offer.upfront).toBe(1500) // 1000 * 1.5
      expect(result.feedbackKey).toBe('ui:deals.feedback.aggressiveSuccess')
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
      expect(result.feedbackKey).toBe('ui:deals.feedback.aggressiveFailure')
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
