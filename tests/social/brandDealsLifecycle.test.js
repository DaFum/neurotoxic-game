import { describe, it } from 'vitest'
import assert from 'node:assert'
import { generateBrandOffers } from '../../src/utils/socialEngine'
import { calculatePostGigStateUpdates } from '../../src/utils/postGig/socialResolution'
import { BRAND_DEALS_BY_ID } from '../../src/data/brandDeals'

describe('Brand Deals Lifecycle Edge Case', () => {
  it('9-Gig-Deal akzeptieren -> nachster Gig -> remainingGigs ist 8 -> generateBrandOffers bekommt 0 Offers', () => {
    // 1. Initial State: Player has 9 remaining gigs on a 9-gig deal
    const dealId = Array.from(BRAND_DEALS_BY_ID.keys())[0]
    const initialDeal = BRAND_DEALS_BY_ID.get(dealId)

    const gameState = {
      player: { money: 100 },
      band: { members: [] },
      social: {
        instagram: 10000,
        trend: 'TECH',
        activeDeals: [{ ...initialDeal, remainingGigs: 9 }]
      }
    }

    // 2. Play the gig, resolving social options
    const option = {
      id: 'some_option',
      platform: 'instagram',
      resolve: () => ({ platform: 'instagram', success: true })
    }
    const result = calculatePostGigStateUpdates({
      option,
      player: gameState.player,
      band: gameState.band,
      social: gameState.social,
      perfScore: 100,
      secureRandomValue: 0.5
    })

    // Check next state active deals
    const nextActiveDeals = result.updatedSocial.activeDeals
    assert.ok(Array.isArray(nextActiveDeals))
    assert.strictEqual(
      nextActiveDeals.length,
      1,
      'Active deal should still exist'
    )
    assert.strictEqual(
      nextActiveDeals[0].remainingGigs,
      8,
      'Remaining gigs should drop to 8'
    )

    // 3. Generate new offers with the next state
    const nextGameState = {
      ...gameState,
      social: {
        ...gameState.social,
        ...result.updatedSocial
      }
    }

    const offers = generateBrandOffers(nextGameState, () => 0.1)

    assert.ok(Array.isArray(offers))
    assert.strictEqual(
      offers.length,
      0,
      'Should generate 0 offers when there is an active deal'
    )
  })
})
