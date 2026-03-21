import { describe, it } from 'node:test'
import assert from 'node:assert'
import { hasTrait, bandHasTrait } from '../src/utils/traitLogic.js'

describe('Trait Logic', () => {
  describe('hasTrait', () => {
    it('returns true if member has the trait', () => {
      const member = {
        name: 'Test',
        traits: [{ id: 'test_trait' }]
      }
      assert.strictEqual(hasTrait(member, 'test_trait'), true)
    })

    it('returns false if member does not have the trait', () => {
      const member = {
        name: 'Test',
        traits: [{ id: 'other_trait' }]
      }
      assert.strictEqual(hasTrait(member, 'test_trait'), false)
    })

    it('returns false if member has no traits', () => {
      const member = { name: 'Test' }
      assert.strictEqual(hasTrait(member, 'test_trait'), false)
    })

    it('returns false if member traits is not an array', () => {
      const member = { name: 'Test', traits: 'test_trait' }
      assert.strictEqual(hasTrait(member, 'test_trait'), false)
    })

    it('returns false if traitId is undefined', () => {
      const member = {
        name: 'Test',
        traits: [{ id: 'test_trait' }]
      }
      assert.strictEqual(hasTrait(member, undefined), false)
    })

    it('returns false if traits are malformed (missing id)', () => {
      const member = {
        name: 'Test',
        traits: [{ name: 'test_trait' }]
      }
      assert.strictEqual(hasTrait(member, 'test_trait'), false)
    })

    it('returns false if member is undefined', () => {
      assert.strictEqual(hasTrait(undefined, 'test_trait'), false)
    })
  })

  describe('bandHasTrait', () => {
    it('returns true if any member has the trait', () => {
      const band = {
        members: [
          { name: 'A', traits: [] },
          { name: 'B', traits: [{ id: 'target_trait' }] }
        ]
      }
      assert.strictEqual(bandHasTrait(band, 'target_trait'), true)
    })

    it('returns false if no member has the trait', () => {
      const band = {
        members: [
          { name: 'A', traits: [] },
          { name: 'B', traits: [{ id: 'other' }] }
        ]
      }
      assert.strictEqual(bandHasTrait(band, 'target_trait'), false)
    })

    it('returns false if band has no members', () => {
      const band = { members: [] }
      assert.strictEqual(bandHasTrait(band, 'target_trait'), false)
    })

    it('returns false if band.members is not an array', () => {
      const band = {
        members: { memberA: { traits: [{ id: 'target_trait' }] } }
      }
      assert.strictEqual(bandHasTrait(band, 'target_trait'), false)
    })

    it('returns false if traitId is undefined', () => {
      const band = {
        members: [{ name: 'B', traits: [{ id: 'target_trait' }] }]
      }
      assert.strictEqual(bandHasTrait(band, undefined), false)
    })

    it('returns false if band is undefined', () => {
      assert.strictEqual(bandHasTrait(undefined, 'target_trait'), false)
    })
  })
})
