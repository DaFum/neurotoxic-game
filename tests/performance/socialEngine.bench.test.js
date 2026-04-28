import { describe, test, expect } from 'vitest'
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
    generateBrandOffers(gameState)
    const t0 = performance.now();
    for (let i = 0; i < 10000; i++) {
      generateBrandOffers(gameState);
    }
    const t1 = performance.now();
    expect(t1 - t0).toBeLessThan(1000);
  })
})
