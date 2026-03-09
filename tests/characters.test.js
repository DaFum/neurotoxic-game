import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CHARACTERS } from '../src/data/characters.js'

describe('characters.js', () => {
  describe('CHARACTERS data structure', () => {
    it('exports CHARACTERS object', () => {
      assert.ok(CHARACTERS)
      assert.strictEqual(typeof CHARACTERS, 'object')
    })

    it('contains all three band members', () => {
      assert.ok(CHARACTERS.MATZE)
      assert.ok(CHARACTERS.MARIUS)
      assert.ok(CHARACTERS.LARS)
    })
  })

  describe('MATZE character', () => {
    it('has required fields', () => {
      const matze = CHARACTERS.MATZE
      assert.strictEqual(matze.name, 'Matze')
      assert.strictEqual(matze.role, 'Guitar')
      assert.ok(matze.baseStats)
      assert.ok(matze.relationships)
      assert.ok(Array.isArray(matze.traits))
      assert.ok(matze.equipment)
    })

    it('has valid base stats', () => {
      const stats = CHARACTERS.MATZE.baseStats
      assert.strictEqual(stats.skill, 8)
      assert.strictEqual(stats.stamina, 7)
      assert.strictEqual(stats.charisma, 5)
      assert.strictEqual(stats.technical, 9)
      assert.strictEqual(stats.improv, 6)
    })

    it('has relationships with other members', () => {
      const rel = CHARACTERS.MATZE.relationships
      assert.strictEqual(rel.Marius, 50)
      assert.strictEqual(rel.Lars, 50)
    })

    it('has all documented traits', () => {
      const traits = CHARACTERS.MATZE.traits
      assert.strictEqual(traits.length, 5)

      const traitIds = traits.map(t => t.id)
      assert.ok(traitIds.includes('perfektionist'))
      assert.ok(traitIds.includes('gear_nerd'))
      assert.ok(traitIds.includes('virtuoso'))
      assert.ok(traitIds.includes('tech_wizard'))
      assert.ok(traitIds.includes('grudge_holder'))
    })

    it('traits have required structure', () => {
      CHARACTERS.MATZE.traits.forEach(trait => {
        assert.ok(trait.id, 'Trait must have id')
        assert.ok(trait.name, 'Trait must have name')
        assert.ok(trait.desc, 'Trait must have desc')
        assert.ok(trait.effect, 'Trait must have effect')
        assert.ok(trait.unlockHint, 'Trait must have unlockHint')
      })
    })

    it('has equipment details', () => {
      const eq = CHARACTERS.MATZE.equipment
      assert.strictEqual(eq.guitar, 'Gibson Les Paul Custom')
      assert.strictEqual(eq.amp, 'Mesa Boogie Dual Rectifier')
    })

    it('perfektionist trait has correct properties', () => {
      const trait = CHARACTERS.MATZE.traits.find(t => t.id === 'perfektionist')
      assert.strictEqual(trait.name, 'Perfektionist')
      assert.strictEqual(trait.effect, 'score_bonus_high_acc')
      assert.ok(trait.desc.includes('Score'))
    })

    it('gear_nerd trait has correct properties', () => {
      const trait = CHARACTERS.MATZE.traits.find(t => t.id === 'gear_nerd')
      assert.strictEqual(trait.name, 'Gear Nerd')
      assert.strictEqual(trait.effect, 'discount_equip')
      assert.ok(trait.desc.includes('Equipment'))
    })
  })

  describe('MARIUS character', () => {
    it('has required fields', () => {
      const marius = CHARACTERS.MARIUS
      assert.strictEqual(marius.name, 'Marius')
      assert.strictEqual(marius.role, 'Drums')
      assert.ok(marius.baseStats)
      assert.ok(marius.relationships)
      assert.ok(Array.isArray(marius.traits))
      assert.ok(marius.equipment)
    })

    it('has valid base stats', () => {
      const stats = CHARACTERS.MARIUS.baseStats
      assert.strictEqual(stats.skill, 9)
      assert.strictEqual(stats.stamina, 8)
      assert.strictEqual(stats.charisma, 7)
      assert.strictEqual(stats.technical, 7)
      assert.strictEqual(stats.improv, 9)
    })

    it('has relationships with other members', () => {
      const rel = CHARACTERS.MARIUS.relationships
      assert.strictEqual(rel.Matze, 50)
      assert.strictEqual(rel.Lars, 50)
    })

    it('has all documented traits', () => {
      const traits = CHARACTERS.MARIUS.traits
      assert.strictEqual(traits.length, 4)

      const traitIds = traits.map(t => t.id)
      assert.ok(traitIds.includes('party_animal'))
      assert.ok(traitIds.includes('blast_machine'))
      assert.ok(traitIds.includes('showman'))
      assert.ok(traitIds.includes('clumsy'))
    })

    it('traits have required structure', () => {
      CHARACTERS.MARIUS.traits.forEach(trait => {
        assert.ok(trait.id, 'Trait must have id')
        assert.ok(trait.name, 'Trait must have name')
        assert.ok(trait.desc, 'Trait must have desc')
        assert.ok(trait.effect, 'Trait must have effect')
        assert.ok(trait.unlockHint, 'Trait must have unlockHint')
      })
    })

    it('has equipment details', () => {
      const eq = CHARACTERS.MARIUS.equipment
      assert.strictEqual(eq.set, 'Pearl Export')
      assert.strictEqual(eq.cymbals, 'Zildjian/Sabian Mix')
    })

    it('blast_machine trait has correct properties', () => {
      const trait = CHARACTERS.MARIUS.traits.find(t => t.id === 'blast_machine')
      assert.strictEqual(trait.name, 'Blast Beat Machine')
      assert.strictEqual(trait.effect, 'score_bonus_fast')
      assert.ok(trait.desc.includes('fast'))
    })

    it('showman trait has correct properties', () => {
      const trait = CHARACTERS.MARIUS.traits.find(t => t.id === 'showman')
      assert.strictEqual(trait.name, 'Showman')
      assert.strictEqual(trait.effect, 'viral_bonus_show')
      assert.ok(trait.desc.includes('Virality'))
    })
  })

  describe('LARS character', () => {
    it('has required fields', () => {
      const lars = CHARACTERS.LARS
      assert.strictEqual(lars.name, 'Lars')
      assert.strictEqual(lars.role, 'Bass/Vocals')
      assert.ok(lars.baseStats)
      assert.ok(lars.relationships)
      assert.ok(Array.isArray(lars.traits))
      assert.ok(lars.equipment)
    })

    it('has valid base stats', () => {
      const stats = CHARACTERS.LARS.baseStats
      assert.strictEqual(stats.skill, 7)
      assert.strictEqual(stats.stamina, 6)
      assert.strictEqual(stats.charisma, 8)
      assert.strictEqual(stats.technical, 7)
      assert.strictEqual(stats.composition, 7)
    })

    it('has relationships with other members', () => {
      const rel = CHARACTERS.LARS.relationships
      assert.strictEqual(rel.Matze, 50)
      assert.strictEqual(rel.Marius, 50)
    })

    it('has all documented traits', () => {
      const traits = CHARACTERS.LARS.traits
      assert.strictEqual(traits.length, 5)

      const traitIds = traits.map(t => t.id)
      assert.ok(traitIds.includes('bandleader'))
      assert.ok(traitIds.includes('social_manager'))
      assert.ok(traitIds.includes('road_warrior'))
      assert.ok(traitIds.includes('melodic_genius'))
      assert.ok(traitIds.includes('peacemaker'))
    })

    it('traits have required structure', () => {
      CHARACTERS.LARS.traits.forEach(trait => {
        assert.ok(trait.id, 'Trait must have id')
        assert.ok(trait.name, 'Trait must have name')
        assert.ok(trait.desc, 'Trait must have desc')
        assert.ok(trait.effect, 'Trait must have effect')
        assert.ok(trait.unlockHint, 'Trait must have unlockHint')
      })
    })

    it('has equipment details', () => {
      const eq = CHARACTERS.LARS.equipment
      assert.strictEqual(eq.bass, 'Ibanez SR505')
      assert.strictEqual(eq.amp, 'Ampeg SVT-3 Pro')
    })

    it('bandleader trait has correct properties', () => {
      const trait = CHARACTERS.LARS.traits.find(t => t.id === 'bandleader')
      assert.strictEqual(trait.name, 'Bandleader')
      assert.strictEqual(trait.effect, 'conflict_solver')
      assert.ok(trait.desc.includes('conflict'))
    })

    it('social_manager trait has correct properties', () => {
      const trait = CHARACTERS.LARS.traits.find(t => t.id === 'social_manager')
      assert.strictEqual(trait.name, 'Social Nerd')
      assert.strictEqual(trait.effect, 'viral_bonus')
      assert.ok(trait.desc.includes('Viral'))
    })

    it('road_warrior trait has correct properties', () => {
      const trait = CHARACTERS.LARS.traits.find(t => t.id === 'road_warrior')
      assert.strictEqual(trait.name, 'Road Warrior')
      assert.strictEqual(trait.effect, 'fuel_discount')
      assert.ok(trait.desc.includes('Fuel'))
    })
  })

  describe('data consistency', () => {
    it('all members have unique names', () => {
      const names = [
        CHARACTERS.MATZE.name,
        CHARACTERS.MARIUS.name,
        CHARACTERS.LARS.name
      ]
      const uniqueNames = new Set(names)
      assert.strictEqual(uniqueNames.size, 3)
    })

    it('all members have unique roles', () => {
      const roles = [
        CHARACTERS.MATZE.role,
        CHARACTERS.MARIUS.role,
        CHARACTERS.LARS.role
      ]
      const uniqueRoles = new Set(roles)
      assert.strictEqual(uniqueRoles.size, 3)
    })

    it('all trait IDs are unique across all members', () => {
      const allTraitIds = [
        ...CHARACTERS.MATZE.traits.map(t => t.id),
        ...CHARACTERS.MARIUS.traits.map(t => t.id),
        ...CHARACTERS.LARS.traits.map(t => t.id)
      ]
      const uniqueIds = new Set(allTraitIds)
      assert.strictEqual(uniqueIds.size, allTraitIds.length)
    })

    it('all trait effects are unique', () => {
      const allEffects = [
        ...CHARACTERS.MATZE.traits.map(t => t.effect),
        ...CHARACTERS.MARIUS.traits.map(t => t.effect),
        ...CHARACTERS.LARS.traits.map(t => t.effect)
      ]
      const uniqueEffects = new Set(allEffects)
      assert.strictEqual(uniqueEffects.size, allEffects.length)
    })

    it('relationships are symmetric', () => {
      // Matze's relationship with Marius should match Marius's with Matze
      assert.strictEqual(
        CHARACTERS.MATZE.relationships.Marius,
        CHARACTERS.MARIUS.relationships.Matze
      )

      // Matze's relationship with Lars should match Lars's with Matze
      assert.strictEqual(
        CHARACTERS.MATZE.relationships.Lars,
        CHARACTERS.LARS.relationships.Matze
      )

      // Marius's relationship with Lars should match Lars's with Marius
      assert.strictEqual(
        CHARACTERS.MARIUS.relationships.Lars,
        CHARACTERS.LARS.relationships.Marius
      )
    })

    it('all base stats are positive numbers', () => {
      Object.values(CHARACTERS).forEach(character => {
        Object.values(character.baseStats).forEach(stat => {
          assert.ok(typeof stat === 'number', 'Stat must be a number')
          assert.ok(stat > 0, 'Stat must be positive')
        })
      })
    })

    it('all relationship values are between 0 and 100', () => {
      Object.values(CHARACTERS).forEach(character => {
        Object.values(character.relationships).forEach(rel => {
          assert.ok(rel >= 0 && rel <= 100, 'Relationship must be 0-100')
        })
      })
    })
  })

  describe('trait implementation status', () => {
    it('blast_machine is implemented', () => {
      const trait = CHARACTERS.MARIUS.traits.find(t => t.id === 'blast_machine')
      assert.ok(trait)
      assert.strictEqual(trait.effect, 'score_bonus_fast')
    })

    it('perfektionist is implemented', () => {
      const trait = CHARACTERS.MATZE.traits.find(t => t.id === 'perfektionist')
      assert.ok(trait)
      assert.strictEqual(trait.effect, 'score_bonus_high_acc')
    })

    it('gear_nerd is implemented', () => {
      const trait = CHARACTERS.MATZE.traits.find(t => t.id === 'gear_nerd')
      assert.ok(trait)
      assert.strictEqual(trait.effect, 'discount_equip')
    })

    it('bandleader is implemented', () => {
      const trait = CHARACTERS.LARS.traits.find(t => t.id === 'bandleader')
      assert.ok(trait)
      assert.strictEqual(trait.effect, 'conflict_solver')
    })

    it('social_manager is implemented', () => {
      const trait = CHARACTERS.LARS.traits.find(t => t.id === 'social_manager')
      assert.ok(trait)
      assert.strictEqual(trait.effect, 'viral_bonus')
    })
  })
})