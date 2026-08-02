import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import {
  validateHealMember,
  validateEnhanceMember
} from '../../src/utils/clinicLogicUtils'

const VALID_MEMBER = {
  id: 'm1',
  stamina: 50,
  mood: 50,
  traits: {},
  relationships: {}
}
const SILENT_INVALID = { isValid: false, silent: true }

describe('clinicLogicUtils', () => {
  describe('validateHealMember', () => {
    it('returns valid when member exists and player has enough money', () => {
      assert.deepStrictEqual(validateHealMember(VALID_MEMBER, 100, 50), {
        isValid: true
      })
    })
    ;[null, undefined].forEach(member => {
      it(`returns silent invalid when member is ${member}`, () => {
        assert.deepStrictEqual(
          validateHealMember(member, 100, 50),
          SILENT_INVALID
        )
      })
    })

    it('returns error when player does not have enough money', () => {
      assert.deepStrictEqual(validateHealMember(VALID_MEMBER, 40, 50), {
        isValid: false,
        silent: false,
        errorKey: 'ui:clinic.not_enough_money',
        defaultMessage: 'Not enough money.'
      })
    })
  })

  describe('validateEnhanceMember', () => {
    it('returns valid when member exists, no trait and player has enough fame', () => {
      assert.deepStrictEqual(
        validateEnhanceMember(VALID_MEMBER, 'cool_trait', 100, 50),
        { isValid: true }
      )
    })

    const silentCases = [
      { label: 'member is null', member: null, trait: 'cool_trait' },
      {
        label: 'member already has the trait',
        member: { ...VALID_MEMBER, traits: { cool_trait: true } },
        trait: 'cool_trait'
      }
    ]

    silentCases.forEach(({ label, member, trait }) => {
      it(`returns silent invalid when ${label}`, () => {
        assert.deepStrictEqual(
          validateEnhanceMember(member, trait, 100, 50),
          SILENT_INVALID
        )
      })
    })

    it('returns error when player does not have enough fame', () => {
      assert.deepStrictEqual(
        validateEnhanceMember(VALID_MEMBER, 'cool_trait', 40, 50),
        {
          isValid: false,
          silent: false,
          errorKey: 'ui:clinic.not_enough_fame',
          defaultMessage: 'Not enough fame. The void demands sacrifice.'
        }
      )
    })
  })
})
