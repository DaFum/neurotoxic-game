import { suite, test } from 'node:test'
import assert from 'node:assert'
import { generateBrandOffers } from '../../src/utils/socialEngine.js'

// Setup Mock Game State with multiple traits and eligible deals
const mockGameState = {
  player: { fame: 5000 },
  band: { members: [{ traits: { social_manager: { id: 'social_manager' } } }] },
  social: {
    instagram: 50000,
    tiktok: 50000,
    youtube: 50000,
    trend: 'DRAMA',
    brandReputation: {
      CORPORATE: 100,
      EVIL: 100,
      SUSTAINABLE: 100,
      INDIE: 100
    },
    activeDeals: []
  }
}

suite('generateBrandOffers Performance', () => {
  const NUM_RUNS = 10000

  test('baseline: select 2 offers from many', () => {
    let start = performance.now()
    for (let i = 0; i < NUM_RUNS; i++) {
      const offers = generateBrandOffers(mockGameState, Math.random)
      assert(offers.length <= 2)
    }
    let end = performance.now()

    console.log(
      `baseline: ${(end - start).toFixed(3)}ms for ${NUM_RUNS} iterations`
    )
  })
})
