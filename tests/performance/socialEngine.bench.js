import { describe, test } from 'vitest'
import { generateBrandOffers } from '../../src/utils/socialEngine'

describe('Social Engine Performance', () => {
  test('generateBrandOffers performance loop', () => {
    const gameState = {
      social: {
        instagram: 10000,
        tiktok: 10000,
        youtube: 10000,
        trend: 'TECH',
        brandReputation: {}
      },
      band: {
        members: [{ traits: { party_animal: { id: 'party_animal' } } }],
        traits: {}
      }
    }
    const iterations = 10000
    for (let i = 0; i < iterations; i++) {
      generateBrandOffers(gameState)
    }
  })
})
