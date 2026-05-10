/**
 * Reducer Invariants Test Suite
 *
 * Validates that core state bounds (money ≥ 0, harmony ∈ [1,100],
 * stamina/mood ∈ [0,100], van fuel/condition ∈ [0,100]) are never
 * violated regardless of input to reducer handlers or clamp utilities.
 *
 * Addresses the TODO audit item: "Add reducer-level invariants test suite".
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import {
  clampPlayerMoney,
  clampBandHarmony,
  clampMemberStamina,
  clampMemberMood,
  clampVanFuel,
  clampVanCondition,
  clampPlayerFame,
  calcCancellationRisk,
  BALANCE_CONSTANTS
} from '../../src/utils/gameStateUtils'
import { handleUpdatePlayer } from '../../src/context/reducers/playerReducer'
import { handleUpdateBand } from '../../src/context/reducers/bandReducer'
import { createInitialState } from '../../src/context/initialState'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Checks all core invariants against a state object. Returns an array of
 *  violation strings; empty array means the state is clean. */
function checkInvariants(state) {
  const violations = []
  const { player, band } = state

  if (player.money < 0) violations.push(`money < 0: ${player.money}`)
  if (!Number.isInteger(player.money))
    violations.push(`money not integer: ${player.money}`)
  if (player.fame < 0) violations.push(`fame < 0: ${player.fame}`)
  if (band.harmony < 1 || band.harmony > 100)
    violations.push(`harmony out of [1,100]: ${band.harmony}`)

  for (const member of band.members) {
    if (member.stamina < 0 || member.stamina > (member.staminaMax ?? 100))
      violations.push(`${member.name} stamina out of bounds: ${member.stamina}`)
    if (member.mood < 0 || member.mood > 100)
      violations.push(`${member.name} mood out of bounds: ${member.mood}`)
  }

  if (player.van) {
    if (player.van.fuel < 0 || player.van.fuel > 100)
      violations.push(`van.fuel out of [0,100]: ${player.van.fuel}`)
    if (player.van.condition < 0 || player.van.condition > 100)
      violations.push(`van.condition out of [0,100]: ${player.van.condition}`)
  }

  return violations
}

// ---------------------------------------------------------------------------
// clampPlayerMoney
// ---------------------------------------------------------------------------
describe('clampPlayerMoney', () => {
  const cases = [
    [0, 0],
    [1, 1],
    [500, 500],
    [-1, 0],
    [-9999, 0],
    [0.9, 0],
    [1.7, 1],
    [NaN, 0],
    [Infinity, 0],
    [-Infinity, 0]
  ]

  for (const [input, expected] of cases) {
    it(`clamps ${input} → ${expected}`, () => {
      const result = clampPlayerMoney(input)
      assert.strictEqual(result, expected)
      assert.ok(result >= 0, 'money must be non-negative')
      assert.ok(Number.isInteger(result), 'money must be an integer')
    })
  }
})

// ---------------------------------------------------------------------------
// clampBandHarmony
// ---------------------------------------------------------------------------
describe('clampBandHarmony', () => {
  const cases = [
    [1, 1],
    [50, 50],
    [100, 100],
    [0, 1], // floor is 1, not 0
    [-5, 1],
    [101, 100],
    [200, 100],
    [0.9, 1], // floor + clamp
    [50.8, 50],
    [NaN, 1],
    [Infinity, 1] // Infinity is not finite → returns the NaN-guard value 1
  ]

  for (const [input, expected] of cases) {
    it(`clamps ${input} → ${expected}`, () => {
      const result = clampBandHarmony(input)
      assert.strictEqual(result, expected)
      assert.ok(
        result >= 1 && result <= 100,
        `harmony ${result} outside [1,100]`
      )
    })
  }
})

// ---------------------------------------------------------------------------
// clampMemberStamina
// ---------------------------------------------------------------------------
describe('clampMemberStamina', () => {
  it('clamps below 0 to 0', () => {
    assert.strictEqual(clampMemberStamina(-10), 0)
  })
  it('clamps above staminaMax to staminaMax', () => {
    assert.strictEqual(clampMemberStamina(110, 100), 100)
  })
  it('respects custom staminaMax', () => {
    assert.strictEqual(clampMemberStamina(80, 75), 75)
  })
  it('floors fractional values', () => {
    assert.strictEqual(clampMemberStamina(45.9), 45)
  })
  it('handles NaN → 0', () => {
    assert.strictEqual(clampMemberStamina(NaN), 0)
  })
})

// ---------------------------------------------------------------------------
// clampMemberMood
// ---------------------------------------------------------------------------
describe('clampMemberMood', () => {
  it('clamps below 0 to 0', () => assert.strictEqual(clampMemberMood(-1), 0))
  it('clamps above 100 to 100', () =>
    assert.strictEqual(clampMemberMood(150), 100))
  it('floors fractional values', () =>
    assert.strictEqual(clampMemberMood(60.9), 60))
  it('handles NaN → 0', () => assert.strictEqual(clampMemberMood(NaN), 0))
})

// ---------------------------------------------------------------------------
// clampVanFuel / clampVanCondition
// ---------------------------------------------------------------------------
describe('clampVanFuel', () => {
  it('clamps negative to 0', () => assert.ok(clampVanFuel(-5) >= 0))
  it('clamps above maxFuel to maxFuel', () => {
    const max = 100
    assert.ok(clampVanFuel(200, max) <= max)
  })
  it('handles NaN → 0', () => assert.strictEqual(clampVanFuel(NaN), 0))
})

describe('clampVanCondition', () => {
  it('clamps negative to 0', () => assert.ok(clampVanCondition(-1) >= 0))
  it('clamps above 100 to 100', () => assert.ok(clampVanCondition(200) <= 100))
  it('floors fractional values', () =>
    assert.strictEqual(clampVanCondition(75.9), 75))
  it('handles NaN → 0', () => assert.strictEqual(clampVanCondition(NaN), 0))
})

// ---------------------------------------------------------------------------
// calcCancellationRisk
// ---------------------------------------------------------------------------
describe('calcCancellationRisk', () => {
  it('returns 1 when harmony is exactly 1', () => {
    assert.strictEqual(calcCancellationRisk(1), 1)
  })
  it('returns the chance when harmony is below threshold', () => {
    const risk = calcCancellationRisk(
      BALANCE_CONSTANTS.LOW_HARMONY_THRESHOLD - 1
    )
    assert.strictEqual(risk, BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE)
  })
  it('returns 0 when harmony is at or above threshold', () => {
    assert.strictEqual(
      calcCancellationRisk(BALANCE_CONSTANTS.LOW_HARMONY_THRESHOLD),
      0
    )
    assert.strictEqual(calcCancellationRisk(100), 0)
  })
  it('result is always in [0, 1]', () => {
    for (const h of [1, 5, 14, 15, 50, 100]) {
      const risk = calcCancellationRisk(h)
      assert.ok(
        risk >= 0 && risk <= 1,
        `risk ${risk} out of [0,1] for harmony ${h}`
      )
    }
  })
})

// ---------------------------------------------------------------------------
// handleUpdatePlayer — adversarial boundary inputs
// ---------------------------------------------------------------------------
describe('handleUpdatePlayer invariants', () => {
  let state

  beforeEach(() => {
    state = createInitialState()
  })

  it('clamps money to 0 when given negative value', () => {
    const next = handleUpdatePlayer(state, { money: -9999 })
    assert.ok(
      next.player.money >= 0,
      `money must be >= 0, got ${next.player.money}`
    )
    const violations = checkInvariants(next)
    assert.deepEqual(violations, [])
  })

  it('keeps money non-negative on large delta overflow', () => {
    const next = handleUpdatePlayer(state, { money: Number.MAX_SAFE_INTEGER })
    assert.ok(next.player.money >= 0)
    const violations = checkInvariants(next)
    assert.deepEqual(violations, [])
  })

  it('rejects forbidden prototype keys in payload', () => {
    const payload = Object.create(null)
    payload['__proto__'] = { money: -1000 }
    payload.money = 100
    // isForbiddenKey check should reject '__proto__' — state unchanged
    const next = handleUpdatePlayer(state, payload)
    assert.strictEqual(next, state)
  })

  it('ignores NaN money', () => {
    const next = handleUpdatePlayer(state, { money: NaN })
    // NaN is clamped to 0 by clampPlayerMoney
    assert.ok(Number.isFinite(next.player.money))
    const violations = checkInvariants(next)
    assert.deepEqual(violations, [])
  })

  it('functional update cannot push money below 0', () => {
    state = handleUpdatePlayer(state, { money: 10 })
    const next = handleUpdatePlayer(state, prev => ({
      money: prev.money - 9999
    }))
    assert.ok(next.player.money >= 0)
    const violations = checkInvariants(next)
    assert.deepEqual(violations, [])
  })
})

// ---------------------------------------------------------------------------
// handleUpdateBand — harmony boundary inputs
// ---------------------------------------------------------------------------
describe('handleUpdateBand invariants', () => {
  let state

  beforeEach(() => {
    state = createInitialState()
  })

  it('clamps harmony below 1 to 1', () => {
    const next = handleUpdateBand(state, { harmony: 0 })
    assert.strictEqual(next.band.harmony, 1)
    const violations = checkInvariants(next)
    assert.deepEqual(violations, [])
  })

  it('clamps harmony above 100 to 100', () => {
    const next = handleUpdateBand(state, { harmony: 150 })
    assert.strictEqual(next.band.harmony, 100)
    const violations = checkInvariants(next)
    assert.deepEqual(violations, [])
  })

  it('clamps harmony to 1 on NaN input', () => {
    const next = handleUpdateBand(state, { harmony: NaN })
    assert.strictEqual(next.band.harmony, 1)
    const violations = checkInvariants(next)
    assert.deepEqual(violations, [])
  })

  it('boundary: harmony at exactly 1 stays 1', () => {
    const next = handleUpdateBand(state, { harmony: 1 })
    assert.strictEqual(next.band.harmony, 1)
  })

  it('boundary: harmony at exactly 100 stays 100', () => {
    const next = handleUpdateBand(state, { harmony: 100 })
    assert.strictEqual(next.band.harmony, 100)
  })

  it('rejects array payloads', () => {
    const next = handleUpdateBand(state, [{ harmony: 50 }])
    assert.strictEqual(next, state)
  })

  it('rejects null payload', () => {
    const next = handleUpdateBand(state, null)
    assert.strictEqual(next, state)
  })
})

// ---------------------------------------------------------------------------
// Full-state invariant sweep over createInitialState
// ---------------------------------------------------------------------------
describe('createInitialState invariants', () => {
  it('fresh state passes all invariant checks', () => {
    const state = createInitialState()
    const violations = checkInvariants(state)
    assert.deepEqual(
      violations,
      [],
      `Initial state violations: ${violations.join('; ')}`
    )
  })
})
