import { describe, bench } from 'vitest'
import { generateBrandOffers } from '../../src/utils/socialEngine'

describe('Social Engine Performance', () => {
  bench('generateBrandOffers performance loop', () => {
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
    generateBrandOffers(gameState)
  }, { iterations: 10000 })
  })
})
