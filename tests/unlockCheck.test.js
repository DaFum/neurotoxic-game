import { describe, it } from 'node:test'
import assert from 'node:assert'
import { checkTraitUnlocks } from '../src/utils/unlockCheck.js'

describe('checkTraitUnlocks', () => {
  const createMember = (name, traits = [], relationships = {}) => ({
    name,
    traits,
    relationships
  })

  const createState = (
    members,
    playerStats = {},
    social = {},
    bandHarmony = 0
  ) => ({
    band: { members, harmony: bandHarmony },
    player: { stats: playerStats, hqUpgrades: [] },
    social
  })

  // 1. GIG_COMPLETE Scenarios
  describe('GIG_COMPLETE', () => {
    it('unlocks Virtuoso for Matze with 0 misses', () => {
      const matze = createMember('Matze')
      const state = createState([matze])
      const context = {
        type: 'GIG_COMPLETE',
        gigStats: { misses: 0, accuracy: 90, song: {}, maxCombo: 10 }
      }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [
        { memberId: 'Matze', traitId: 'virtuoso' }
      ])
    })

    it('unlocks Perfektionist for Matze with 100% accuracy', () => {
      const matze = createMember('Matze')
      const state = createState([matze])
      const context = {
        type: 'GIG_COMPLETE',
        gigStats: { misses: 5, accuracy: 100, song: {}, maxCombo: 10 }
      }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [
        { memberId: 'Matze', traitId: 'perfektionist' }
      ])
    })

    it('unlocks Blast Machine for Marius with fast song (>160 BPM) and maxCombo > 50', () => {
      const marius = createMember('Marius')
      const state = createState([marius])
      const context = {
        type: 'GIG_COMPLETE',
        gigStats: { song: { bpm: 161 }, maxCombo: 51 }
      }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [
        { memberId: 'Marius', traitId: 'blast_machine' }
      ])
    })

    it('does not unlock Blast Machine for Marius if combo is too low', () => {
      const marius = createMember('Marius')
      const state = createState([marius])
      const context = {
        type: 'GIG_COMPLETE',
        gigStats: { song: { bpm: 161 }, maxCombo: 50 }
      }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [])
    })

    it('unlocks Melodic Genius for Lars with slow song (<120 BPM) and maxCombo > 30', () => {
      const lars = createMember('Lars')
      const state = createState([lars])
      const context = {
        type: 'GIG_COMPLETE',
        gigStats: { song: { bpm: 119 }, maxCombo: 31 }
      }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [
        { memberId: 'Lars', traitId: 'melodic_genius' }
      ])
    })

    it('unlocks Tech Wizard for Matze with technical song (>3 difficulty) and 100% accuracy', () => {
      // Give Matze 'perfektionist' so only 'tech_wizard' is unlocked
      const matze = createMember('Matze', [{ id: 'perfektionist' }])
      const state = createState([matze])
      const context = {
        type: 'GIG_COMPLETE',
        gigStats: { song: { difficulty: 4 }, accuracy: 100 }
      }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [
        { memberId: 'Matze', traitId: 'tech_wizard' }
      ])
    })
  })

  // 2. TRAVEL_COMPLETE Scenarios
  describe('TRAVEL_COMPLETE', () => {
    it('unlocks Road Warrior for Lars with >= 5000 total distance', () => {
      const lars = createMember('Lars')
      const state = createState([lars], { totalDistance: 5000 })
      const context = { type: 'TRAVEL_COMPLETE' }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [
        { memberId: 'Lars', traitId: 'road_warrior' }
      ])
    })

    it('does not unlock Road Warrior for Lars with < 5000 total distance', () => {
      const lars = createMember('Lars')
      const state = createState([lars], { totalDistance: 4999 })
      const context = { type: 'TRAVEL_COMPLETE' }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [])
    })
  })

  // 3. PURCHASE Scenarios
  describe('PURCHASE', () => {
    it('unlocks Party Animal for Marius when buying cheap beer fridge', () => {
      const marius = createMember('Marius')
      const state = createState([marius])
      const context = {
        type: 'PURCHASE',
        item: { id: 'hq_room_cheap_beer_fridge' }
      }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [
        { memberId: 'Marius', traitId: 'party_animal' }
      ])
    })

    it('unlocks Party Animal for Marius when owning cheap beer fridge (via upgrades)', () => {
      const marius = createMember('Marius')
      const state = createState([marius])
      state.player.hqUpgrades = ['hq_room_cheap_beer_fridge']
      const context = { type: 'PURCHASE', item: { id: 'some_other_item' } }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [
        { memberId: 'Marius', traitId: 'party_animal' }
      ])
    })

    it('unlocks Gear Nerd for Matze when gear count >= 5', () => {
      const matze = createMember('Matze')
      const state = createState([matze])
      const context = { type: 'PURCHASE', gearCount: 5 }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [
        { memberId: 'Matze', traitId: 'gear_nerd' }
      ])
    })
  })

  // 4. SOCIAL_UPDATE Scenarios
  describe('SOCIAL_UPDATE', () => {
    it('unlocks Social Manager for Lars when max followers >= 1000', () => {
      const lars = createMember('Lars')
      const state = createState(
        [lars],
        {},
        { instagram: 1000, tiktok: 500, youtube: 200 }
      )
      const context = { type: 'SOCIAL_UPDATE' }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [
        { memberId: 'Lars', traitId: 'social_manager' }
      ])
    })
  })

  // 5. EVENT_RESOLVED Scenarios
  describe('EVENT_RESOLVED', () => {
    it('unlocks Bandleader for Lars when conflicts resolved >= 3', () => {
      const lars = createMember('Lars')
      const state = createState([lars], { conflictsResolved: 3 })
      const context = { type: 'EVENT_RESOLVED' }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [
        { memberId: 'Lars', traitId: 'bandleader' }
      ])
    })

    it('unlocks Showman for Marius when stage dives >= 3', () => {
      const marius = createMember('Marius')
      const state = createState([marius], { stageDives: 3 })
      const context = { type: 'EVENT_RESOLVED' }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [
        { memberId: 'Marius', traitId: 'showman' }
      ])
    })

    it('unlocks Grudge Holder for Matze when any relationship < 30', () => {
      const matze = createMember('Matze', [], { Marius: 29, Lars: 50 })
      const state = createState([matze])
      const context = { type: 'EVENT_RESOLVED' }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [
        { memberId: 'Matze', traitId: 'grudge_holder' }
      ])
    })

    it('unlocks Peacemaker for Lars when band harmony >= 90', () => {
      const lars = createMember('Lars')
      const state = createState([lars], {}, {}, 90)
      const context = { type: 'EVENT_RESOLVED' }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [
        { memberId: 'Lars', traitId: 'peacemaker' }
      ])
    })
  })

  // Edge Cases
  describe('Edge Cases', () => {
    it('does not unlock trait if already owned', () => {
      const matze = createMember('Matze', [
        { id: 'virtuoso' },
        { id: 'perfektionist' }
      ])
      const state = createState([matze])
      const context = {
        type: 'GIG_COMPLETE',
        gigStats: { misses: 0, accuracy: 100, song: {}, maxCombo: 100 }
      }

      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [])
    })

    it('returns empty array if member not found', () => {
      const state = createState([]) // No members
      const context = {
        type: 'GIG_COMPLETE',
        gigStats: { misses: 0 }
      }
      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [])
    })

    it('returns empty array for unknown context type', () => {
      const matze = createMember('Matze')
      const state = createState([matze])
      const context = { type: 'UNKNOWN_TYPE' }
      const unlocks = checkTraitUnlocks(state, context)
      assert.deepStrictEqual(unlocks, [])
    })
  })
})
