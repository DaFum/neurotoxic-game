import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import {
  validateHealMember,
  validateEnhanceMember
} from '../../src/utils/clinicLogicUtils'

describe('clinicLogicUtils', () => {
  describe('validateHealMember', () => {
    it('returns valid when member exists and player has enough money', () => {
      const member = { id: 'm1', stamina: 50, mood: 50, traits: {}, relationships: {} }
      const result = validateHealMember(member, 100, 50)
      assert.deepStrictEqual(result, { isValid: true })
    })

    it('returns silent invalid when member is null', () => {
      const result = validateHealMember(null, 100, 50)
      assert.deepStrictEqual(result, { isValid: false, silent: true })
    })

    it('returns silent invalid when member is undefined', () => {
      const result = validateHealMember(undefined, 100, 50)
      assert.deepStrictEqual(result, { isValid: false, silent: true })
    })

    it('returns error when player does not have enough money', () => {
      const member = { id: 'm1', stamina: 50, mood: 50, traits: {}, relationships: {} }
      const result = validateHealMember(member, 40, 50)
      assert.strictEqual(result.isValid, false)
      assert.strictEqual(result.errorKey, 'ui:clinic.not_enough_money')
      assert.strictEqual(result.defaultMessage, 'Not enough money.')
    })
  })

  describe('validateEnhanceMember', () => {
    it('returns valid when member exists, no trait and player has enough fame', () => {
      const member = { id: 'm1', stamina: 50, mood: 50, traits: {}, relationships: {} }
      const result = validateEnhanceMember(member, 'cool_trait', 100, 50)
      assert.deepStrictEqual(result, { isValid: true })
    })

    it('returns silent invalid when member is null', () => {
      const result = validateEnhanceMember(null, 'cool_trait', 100, 50)
      assert.deepStrictEqual(result, { isValid: false, silent: true })
    })

    it('returns silent invalid when member already has the trait', () => {
      const member = { id: 'm1', stamina: 50, mood: 50, traits: { cool_trait: true }, relationships: {} }
      const result = validateEnhanceMember(member, 'cool_trait', 100, 50)
      assert.deepStrictEqual(result, { isValid: false, silent: true })
    })

    it('returns error when player does not have enough fame', () => {
      const member = { id: 'm1', stamina: 50, mood: 50, traits: {}, relationships: {} }
      const result = validateEnhanceMember(member, 'cool_trait', 40, 50)
      assert.strictEqual(result.isValid, false)
      assert.strictEqual(result.errorKey, 'ui:clinic.not_enough_fame')
      assert.strictEqual(result.defaultMessage, 'Not enough fame. The void demands sacrifice.')
    })
  })
})
