import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hasTrait, bandHasTrait } from '../../src/utils/traitUtils'

describe('Trait Logic', () => {
  describe('hasTrait', () => {
    it('returns true if member has the trait', () => {
      const member = {
        name: 'Test',
        traits: { test_trait: { id: 'test_trait' } }
      }
      assert.strictEqual(hasTrait(member, 'test_trait'), true)
    })

    const hasTraitFalseCases = [
      {
        label: 'member does not have the trait',
        member: {
          name: 'Test',
          traits: { other_trait: { id: 'other_trait' } }
        },
        traitId: 'test_trait'
      },
      {
        label: 'member has no traits',
        member: { name: 'Test' },
        traitId: 'test_trait'
      },
      {
        label: 'member traits is not an object',
        member: { name: 'Test', traits: 'test_trait' },
        traitId: 'test_trait'
      },
      {
        label: 'traitId is undefined',
        member: { name: 'Test', traits: { test_trait: { id: 'test_trait' } } },
        traitId: undefined
      },
      { label: 'member is undefined', member: undefined, traitId: 'test_trait' }
    ]

    hasTraitFalseCases.forEach(({ label, member, traitId }) => {
      it(`returns false if ${label}`, () => {
        assert.strictEqual(hasTrait(member, traitId), false)
      })
    })
  })

  describe('bandHasTrait', () => {
    it('returns true if any member has the trait', () => {
      const band = {
        members: [
          { name: 'A', traits: {} },
          { name: 'B', traits: { target_trait: { id: 'target_trait' } } }
        ]
      }
      assert.strictEqual(bandHasTrait(band, 'target_trait'), true)
    })

    const bandHasTraitFalseCases = [
      {
        label: 'no member has the trait',
        band: {
          members: [
            { name: 'A', traits: {} },
            { name: 'B', traits: { other: { id: 'other' } } }
          ]
        },
        traitId: 'target_trait'
      },
      {
        label: 'band has no members',
        band: { members: [] },
        traitId: 'target_trait'
      },
      {
        label: 'band.members is not an array',
        band: {
          members: {
            memberA: { traits: { target_trait: { id: 'target_trait' } } }
          }
        },
        traitId: 'target_trait'
      },
      {
        label: 'traitId is undefined',
        band: {
          members: [
            { name: 'B', traits: { target_trait: { id: 'target_trait' } } }
          ]
        },
        traitId: undefined
      },
      { label: 'band is undefined', band: undefined, traitId: 'target_trait' }
    ]

    bandHasTraitFalseCases.forEach(({ label, band, traitId }) => {
      it(`returns false if ${label}`, () => {
        assert.strictEqual(bandHasTrait(band, traitId), false)
      })
    })
  })
})
