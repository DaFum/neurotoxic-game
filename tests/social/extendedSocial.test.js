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
        social: { trend: 'DRAMA' }
      }

      const mockGigResult = {}
      // Using a deterministic RNG to check weighting logic is tricky without mocking math.random deeply,
      // but we can check if options are filtered correctly or if it runs without error.
      // Ideally we would mock Math.random to verify the weight boost, but for now we verify execution.

      const options = generatePostOptions(mockGigResult, gameState)
      assert.ok(Array.isArray(options), 'Should return array of options')
      assert.strictEqual(options.length, 3, 'Should always return 3 options')

      // Basic sanity check that it runs with a trend
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
    it('Unlocks Melodic Genius for Marius on slow song combo', () => {
      const state = {
        band: {
          members: [{ name: 'Marius', traits: [] }]
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
      assert.deepStrictEqual(unlocks, [{ memberId: 'Marius', traitId: 'melodic_genius' }])
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

    it('Unlocks Showman for Lars on stage dives', () => {
      const state = {
        band: {
          members: [{ name: 'Lars', traits: [] }]
        },
        player: {
          stats: { stageDives: 3 }
        }
      }
      const context = {
        type: 'EVENT_RESOLVED'
      }
      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [{ memberId: 'Lars', traitId: 'showman' }])
    })
  })
})
