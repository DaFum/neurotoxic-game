import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  CLINIC_GRAFT_COST,
  GAME_CONSTANTS
} from '../../src/context/gameConstants.ts'
import {
  handleBloodBankDonate,
  handleClinicEnhance,
  handleClinicHeal,
  handleGraftNeuroOverclock
} from '../../src/context/reducers/clinicReducer.ts'

describe('handleGraftNeuroOverclock - payload guard', () => {
  it('returns state unchanged (no throw) for payloadless or non-object dispatches', () => {
    const state = {
      player: { money: 99999 },
      band: { members: [{ id: 'm1', health: 100, traits: {} }] }
    }
    for (const hostile of [undefined, null, 'm1', 7, true]) {
      assert.strictEqual(handleGraftNeuroOverclock(state, hostile), state)
    }
  })
})

describe('clinic money gates use spendable Expedition cash (#3464)', () => {
  const runState = money => ({
    player: { money, fame: 0, clinicVisits: 0 },
    band: {
      members: [
        { id: 'm1', stamina: 10, staminaMax: 100, mood: 10, traits: {} }
      ]
    },
    expedition: { status: 'active', protectedCareerCash: 900 }
  })

  it('refuses a heal only protected cash could pay', () => {
    const state = runState(1000)
    const next = handleClinicHeal(state, {
      memberId: 'm1',
      type: 'heal',
      staminaGain: 20,
      moodGain: 10
    })
    assert.strictEqual(next, state)
  })

  it('debits a paid heal from the raw balance, not the spendable slice', () => {
    // Protected cash (300) is below what the heal costs: the heal is allowed
    // and must leave the protected slice alone.
    const run = {
      ...runState(1000),
      expedition: { status: 'active', protectedCareerCash: 300 }
    }
    const payload = {
      memberId: 'm1',
      type: 'heal',
      staminaGain: 20,
      moodGain: 10
    }
    const outsideRun = handleClinicHeal(
      { ...run, expedition: undefined },
      payload
    )
    const cost = 1000 - outsideRun.player.money
    assert.ok(cost > 0)

    const inRun = handleClinicHeal(run, payload)
    assert.notStrictEqual(inRun, run)
    assert.equal(inRun.player.money, 1000 - cost)
  })

  it('leaves money untouched on a fame-only enhance during a run', () => {
    const run = {
      ...runState(1000),
      player: { money: 1000, fame: 500, clinicVisits: 0 },
      expedition: { status: 'active', protectedCareerCash: 300 }
    }
    const next = handleClinicEnhance(run, {
      memberId: 'm1',
      type: 'enhance',
      trait: 'cyber_lungs'
    })
    assert.notStrictEqual(next, run)
    assert.equal(next.player.money, 1000)
  })

  it('refuses the Neuro-Overclock graft when only protected cash could pay', () => {
    const state = runState(CLINIC_GRAFT_COST + 100)
    assert.strictEqual(
      handleGraftNeuroOverclock(state, { memberId: 'm1' }),
      state
    )
  })
})

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

const BLOOD = GAME_CONSTANTS.BLOOD_BANK

describe('handleBloodBankDonate — affordability guard', () => {
  it('rejects donation when harmony cannot pay the cost', () => {
    const state = makeClinicState({ harmony: BLOOD.BLOOD_HARMONY_COST })
    const result = handleBloodBankDonate(state, { kind: 'blood' })
    assert.strictEqual(result, state)
  })

  it('rejects donation when a member cannot survive the stamina drain', () => {
    // A member must keep 10 stamina after the drain.
    const state = makeClinicState({
      memberStamina: BLOOD.BLOOD_STAMINA_COST + 9
    })
    const result = handleBloodBankDonate(state, { kind: 'blood' })
    assert.strictEqual(result, state)
    assert.strictEqual(result.player.money, state.player.money)
    assert.deepStrictEqual(result.toasts, state.toasts)
  })

  it('applies donation when band can afford harmony and stamina costs', () => {
    const state = makeClinicState({
      harmony: 50,
      memberStamina: 80,
      money: 100
    })
    const result = handleBloodBankDonate(state, { kind: 'blood' })
    assert.notStrictEqual(result, state)
    assert.strictEqual(result.player.money, 100 + BLOOD.BLOOD_BASE_MONEY)
    assert.strictEqual(result.band.harmony, 50 - BLOOD.BLOOD_HARMONY_COST)
    assert.strictEqual(
      result.social.controversyLevel,
      BLOOD.BLOOD_CONTROVERSY_GAIN
    )
    assert.strictEqual(
      result.band.members[0].stamina,
      80 - BLOOD.BLOOD_STAMINA_COST
    )
  })

  it('scales the payout with the fame level, from the reducer', () => {
    const state = {
      ...makeClinicState({ money: 0 }),
      player: { money: 0, fameLevel: 5 }
    }
    // floor(100 * (1 + 5 * 0.2)) = 200
    assert.strictEqual(
      handleBloodBankDonate(state, { kind: 'blood' }).player.money,
      200
    )
  })

  it('pays the marrow donation its own price and payout', () => {
    const state = makeClinicState({ harmony: 90, memberStamina: 100 })
    const result = handleBloodBankDonate(state, { kind: 'marrow' })
    assert.strictEqual(
      result.player.money,
      state.player.money + BLOOD.MARROW_BASE_MONEY
    )
    assert.strictEqual(result.band.harmony, 90 - BLOOD.MARROW_HARMONY_COST)
  })
})

describe('handleBloodBankDonate — the payload cannot set its own amounts', () => {
  it('ignores a forged payout, price and drain next to a valid kind', () => {
    const state = makeClinicState({
      harmony: 50,
      memberStamina: 80,
      money: 100
    })
    const result = handleBloodBankDonate(state, {
      kind: 'blood',
      moneyGain: 1e9,
      harmonyCost: 0,
      staminaCost: 0,
      controversyGain: 0
    })
    assert.strictEqual(result.player.money, 100 + BLOOD.BLOOD_BASE_MONEY)
    assert.strictEqual(result.band.harmony, 50 - BLOOD.BLOOD_HARMONY_COST)
  })

  it('refuses a missing, unknown or non-record payload without changing state', () => {
    const state = makeClinicState()
    for (const hostile of [
      undefined,
      null,
      'blood',
      7,
      {},
      { kind: 'plasma' },
      { kind: '__proto__' },
      { kind: ['blood'] },
      { moneyGain: 300, harmonyCost: 10, staminaCost: 5, controversyGain: 2 }
    ]) {
      assert.strictEqual(handleBloodBankDonate(state, hostile), state)
    }
  })
})
