import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import {
  validateHealMember,
  validateEnhanceMember,
  calculateHealAmounts
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

  describe('calculateHealAmounts', () => {
    it('calculates applied amounts within bounds', () => {
      const member = { stamina: 50, staminaMax: 100, mood: 50, traits: {}, relationships: {} }
      const result = calculateHealAmounts(member, 20, 20)
      assert.deepStrictEqual(result, {
        healAmountApplied: 20,
        moodAmountApplied: 20
      })
    })

    it('caps stamina increase to staminaMax', () => {
      const member = { stamina: 80, staminaMax: 100, mood: 50, traits: {}, relationships: {} }
      const result = calculateHealAmounts(member, 50, 0)
      assert.strictEqual(result.healAmountApplied, 20)
    })

    it('caps mood increase to 100', () => {
      const member = { stamina: 50, mood: 90, traits: {}, relationships: {} }
      const result = calculateHealAmounts(member, 0, 50)
      assert.strictEqual(result.moodAmountApplied, 10)
    })

    it('uses default staminaMax of 100 if missing', () => {
      const member = { stamina: 80, mood: 50, traits: {}, relationships: {} }
      const result = calculateHealAmounts(member, 50, 0)
      assert.strictEqual(result.healAmountApplied, 20)
    })

    it('handles staminaMax as a string', () => {
      const member = { stamina: 80, staminaMax: '150', mood: 50, traits: {}, relationships: {} }
      const result = calculateHealAmounts(member, 100, 0)
      assert.strictEqual(result.healAmountApplied, 70)
    })

    it('clamps negative input gains to 0', () => {
      const member = { stamina: 50, mood: 50, traits: {}, relationships: {} }
      const result = calculateHealAmounts(member, -10, -10)
      assert.deepStrictEqual(result, {
        healAmountApplied: 0,
        moodAmountApplied: 0
      })
    })

    it('returns 0 applied if already at max', () => {
      const member = { stamina: 100, staminaMax: 100, mood: 100, traits: {}, relationships: {} }
      const result = calculateHealAmounts(member, 20, 20)
      assert.deepStrictEqual(result, {
        healAmountApplied: 0,
        moodAmountApplied: 0
      })
    })

    it('returns 0 applied if current stamina is above staminaMax', () => {
      const member = { stamina: 120, staminaMax: 100, mood: 50, traits: {}, relationships: {} }
      const result = calculateHealAmounts(member, 20, 0)
      assert.strictEqual(result.healAmountApplied, 0)
    })
  })
})
