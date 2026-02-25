import { describe, it, before, after, mock } from 'node:test'
import assert from 'node:assert'
import {
  generateDailyTrend,
  generatePostOptions,
  calculateSocialGrowth,
  calculateViralityScore,
  generateBrandOffers
} from '../../src/utils/socialEngine.js'
import { checkTraitUnlocks } from '../../src/utils/unlockCheck.js'
import { CHARACTERS } from '../../src/data/characters.js'

describe('Extended Social & Trait Systems', () => {
  describe('Trend System', () => {
    it('generateDailyTrend returns a valid trend string', () => {
      const validTrends = ['NEUTRAL', 'DRAMA', 'TECH', 'MUSIC', 'WHOLESOME']
      const trend = generateDailyTrend()
      assert.ok(validTrends.includes(trend), `Trend ${trend} should be valid`)
    })

    it('generatePostOptions boosts trending categories', () => {
      const gameState = {
        player: { money: 1000 },
        band: { members: [], harmony: 80 },
        social: { trend: 'DRAMA' } // Trend is DRAMA
      }

      const mockGigResult = {}

      // Mock Math.random to deterministically pick weighted options
      // Weights: Normal = 1.0, Trending = 11.0 (1.0 + 10.0 bonus)
      // We want to verify that DRAMA options are prioritized.

      // Since sorting is b._weight - a._weight, highly weighted items appear first.
      // We can inspect if the returned options include DRAMA items more often or at top.
      // But generatePostOptions randomizes inside the map: weight * rng().

      // Let's force rng to return 0.99 for everyone so raw weight dominates.
      const mockRng = () => 0.99

      const options = generatePostOptions(mockGigResult, gameState, mockRng)

      assert.ok(Array.isArray(options), 'Should return array of options')
      assert.strictEqual(options.length, 3, 'Should always return 3 options')

      // The first option should likely be a DRAMA option because of the massive weight boost (11 vs 1)
      // Assuming at least one Drama option is available in POST_OPTIONS
      const firstOption = options[0]
      // Note: POST_OPTIONS must have Drama items. 'drama_leaked_dms' is one.
      assert.strictEqual(firstOption.category, 'Drama', 'Top weighted option should be the trending category (Drama)')
    })
  })

  describe('Brand Deals', () => {
    it('generateBrandOffers returns eligible deals', () => {
      const gameState = {
        social: { instagram: 10000, trend: 'TECH' },
        band: { members: [{ traits: [{ id: 'party_animal' }] }] }
      }

      // RNG mock that always returns 0 (success for 30% check)
      const mockRng = () => 0.1

      const offers = generateBrandOffers(gameState, mockRng)
      assert.ok(Array.isArray(offers), 'Should return array')

      // With these stats, Energy Drink (requires 2000 followers, TECH trend, party_animal) should be eligible
      const energyDeal = offers.find(o => o.id === 'energy_drink_cx')
      assert.ok(energyDeal, 'Should offer Energy Drink deal')
    })

    it('generateBrandOffers filters ineligible deals', () => {
      const gameState = {
        social: { instagram: 0, trend: 'NEUTRAL' },
        band: { members: [] }
      }

      const mockRng = () => 0.1
      const offers = generateBrandOffers(gameState, mockRng)
      assert.strictEqual(offers.length, 0, 'Should return no offers for poor band')
    })
  })

  describe('Cancel Culture', () => {
    it('calculateSocialGrowth applies negative growth on high controversy', () => {
      // Normal growth
      const normal = calculateSocialGrowth('instagram', 80, 1000, false, 0, 0)
      assert.ok(normal > 0, 'Should grow normally')

      // Cancel culture (Controversy 90)
      const canceled = calculateSocialGrowth('instagram', 80, 1000, false, 90, 0)
      assert.ok(canceled < 0, `Should have negative growth with high controversy, got ${canceled}`)
    })
  })

  describe('Showman Trait', () => {
    it('Showman trait boosts virality score', () => {
      const baseScore = calculateViralityScore(80, [], {}, { members: [] })

      const bandWithShowman = {
        members: [{ traits: [{ id: 'showman' }] }]
      }
      const showmanScore = calculateViralityScore(80, [], {}, bandWithShowman)

      assert.ok(showmanScore > baseScore, 'Showman should boost virality score')
    })
  })

  describe('New Trait Unlocks', () => {
    it('Unlocks Melodic Genius for Lars on slow song combo', () => {
      const state = {
        band: {
          members: [{ name: 'Lars', traits: [] }]
        }
      }
      const context = {
        type: 'GIG_COMPLETE',
        gigStats: {
          maxCombo: 31,
          song: { bpm: 100 }
        }
      }
      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [{ memberId: 'Lars', traitId: 'melodic_genius' }])
    })

    it('Unlocks Tech Wizard for Matze on technical song accuracy', () => {
      const state = {
        band: {
          members: [{ name: 'Matze', traits: [] }]
        }
      }
      const context = {
        type: 'GIG_COMPLETE',
        gigStats: {
          accuracy: 100,
          song: { difficulty: 4 }
        }
      }
      const unlocks = checkTraitUnlocks(state, context)
      const hasTechWizard = unlocks.some(u => u.memberId === 'Matze' && u.traitId === 'tech_wizard')
      assert.ok(hasTechWizard, 'Should unlock tech_wizard')
    })

    it('Unlocks Showman for Marius on stage dives', () => {
      const state = {
        band: {
          members: [{ name: 'Marius', traits: [] }]
        },
        player: {
          stats: { stageDives: 3 }
        }
      }
      const context = {
        type: 'EVENT_RESOLVED'
      }
      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [{ memberId: 'Marius', traitId: 'showman' }])
    })
  })
})
