import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { handleBloodBankDonate } from '../../src/context/reducers/clinicReducer.ts'

/**
 * Builds a minimal GameState suitable for blood-bank tests.
 *
 * @param {object} overrides
 * @param {number} [overrides.harmony=50] - Band harmony
 * @param {number} [overrides.memberStamina=80] - Stamina for each member
 * @param {number} [overrides.money=500] - Player money
 */
function makeClinicState({
  harmony = 50,
  memberStamina = 80,
  money = 500
} = {}) {
  return {
    player: { money },
    band: {
      harmony,
      members: [
        { id: 'member1', stamina: memberStamina, staminaMax: 100 },
        { id: 'member2', stamina: memberStamina, staminaMax: 100 }
      ]
    },
    social: { controversyLevel: 0 },
    toasts: []
  }
}

describe('handleBloodBankDonate — affordability guard', () => {
  it('rejects donation when harmony cannot pay the cost', () => {
    const state = makeClinicState({ harmony: 5 })
    const result = handleBloodBankDonate(state, {
      moneyGain: 300,
      harmonyCost: 10,
      staminaCost: 5,
      controversyGain: 2
    })
    assert.strictEqual(result, state)
  })

  it('rejects donation when a member cannot survive the stamina drain', () => {
    // memberStamina(12) < staminaCost(5) + 10 = 15
    const state = makeClinicState({ memberStamina: 12 })
    const result = handleBloodBankDonate(state, {
      moneyGain: 300,
      harmonyCost: 1,
      staminaCost: 5,
      controversyGain: 0
    })
    assert.strictEqual(result, state)
    assert.strictEqual(result.player.money, state.player.money)
    assert.deepStrictEqual(result.toasts, state.toasts)
  })

  it('applies donation when band can afford harmony and stamina costs', () => {
    // harmony(50) > harmonyCost(10), memberStamina(80) >= staminaCost(5)+10=15
    const state = makeClinicState({
      harmony: 50,
      memberStamina: 80,
      money: 100
    })
    const result = handleBloodBankDonate(state, {
      moneyGain: 300,
      harmonyCost: 10,
      staminaCost: 5,
      controversyGain: 2
    })
    assert.notStrictEqual(result, state)
    assert.strictEqual(result.player.money, 400)
    assert.strictEqual(result.band.harmony, 40)
  })
})
