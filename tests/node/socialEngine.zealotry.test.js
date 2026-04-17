import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  calculateZealotryEffects,
  generateBrandOffers
} from '../../src/utils/socialEngine'

describe('calculateZealotryEffects', () => {
  it('should calculate passive income properly', () => {
    assert.strictEqual(calculateZealotryEffects(0).passiveIncome, 0)
    assert.strictEqual(calculateZealotryEffects(10).passiveIncome, 12)
    assert.strictEqual(calculateZealotryEffects(50).passiveIncome, 60)
    assert.strictEqual(calculateZealotryEffects(100).passiveIncome, 120)
  })

  it('should calculate raid probability properly', () => {
    assert.strictEqual(calculateZealotryEffects(0).raidProbability, 0)
    assert.strictEqual(calculateZealotryEffects(10).raidProbability, 0.008)
    assert.strictEqual(calculateZealotryEffects(50).raidProbability, 0.04)
    assert.strictEqual(calculateZealotryEffects(100).raidProbability, 0.08)
  })
})

describe('generateBrandOffers with Zealotry', () => {
  it('should filter out deals that strictly require less zealotry', () => {
    const gameStateLowZealotry = {
      social: {
        instagram: 10000,
        trend: 'MUSIC',
        zealotry: 10
      },
      band: {
        members: [{ traits: { virtuoso: { id: 'virtuoso' } } }]
      }
    }

    let shredDealLow
    for (let i = 0; i < 100; i++) {
      const offers = generateBrandOffers(gameStateLowZealotry, Math.random)
      const found = offers.find(o => o.id === 'guitar_brand_shred')
      if (found) shredDealLow = found
    }
    assert.ok(shredDealLow, 'Should find ShredMaster deal when zealotry is low')

    const gameStateHighZealotry = {
      social: {
        instagram: 10000,
        trend: 'MUSIC',
        zealotry: 30
      },
      band: {
        members: [{ traits: { virtuoso: { id: 'virtuoso' } } }]
      }
    }

    let shredDealHigh
    for (let i = 0; i < 100; i++) {
      const offers = generateBrandOffers(gameStateHighZealotry, Math.random)
      const found = offers.find(o => o.id === 'guitar_brand_shred')
      if (found) shredDealHigh = found
    }
    assert.strictEqual(
      shredDealHigh,
      undefined,
      'Should NOT find ShredMaster deal when zealotry is high (> 20)'
    )
  })
})
