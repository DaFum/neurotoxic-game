import assert from 'node:assert/strict'
import test from 'node:test'
import { eventEngine } from '../../src/utils/eventEngine'

const moodEffect = value => ({ type: 'stat', stat: 'mood', value })
const staminaEffect = value => ({ type: 'stat', stat: 'stamina', value })

test('composite events accumulate repeated mood effects instead of keeping the last', () => {
  const delta = eventEngine.applyResult(
    { type: 'composite', effects: [moodEffect(10), moodEffect(-4)] },
    {}
  )
  assert.equal(delta.band.membersDelta.moodChange, 6)
})

test('composite events accumulate repeated stamina effects', () => {
  const delta = eventEngine.applyResult(
    { type: 'composite', effects: [staminaEffect(-5), staminaEffect(-3)] },
    {}
  )
  assert.equal(delta.band.membersDelta.staminaChange, -8)
})

test('mood and stamina effects in one composite keep both channels', () => {
  const delta = eventEngine.applyResult(
    {
      type: 'composite',
      effects: [moodEffect(5), staminaEffect(-2), moodEffect(5)]
    },
    {}
  )
  assert.equal(delta.band.membersDelta.moodChange, 10)
  assert.equal(delta.band.membersDelta.staminaChange, -2)
})

test('a single mood effect is unchanged and a non-finite value adds nothing', () => {
  const single = eventEngine.applyResult(
    { type: 'composite', effects: [moodEffect(7)] },
    {}
  )
  assert.equal(single.band.membersDelta.moodChange, 7)
  const bad = eventEngine.applyResult(
    { type: 'composite', effects: [moodEffect(7), moodEffect(Number.NaN)] },
    {}
  )
  assert.equal(bad.band.membersDelta.moodChange, 7)
})

test('relationship effects reject coerced values', () => {
  for (const value of ['10', true, [5], null, undefined, Number.NaN]) {
    const delta = eventEngine.applyResult(
      {
        type: 'composite',
        effects: [
          { type: 'relationship', member1: 'Matze', member2: 'Lars', value }
        ]
      },
      {}
    )
    assert.equal(delta.band.relationshipChange, undefined, String(value))
  }
})

const moneyEffect = value => ({ type: 'resource', resource: 'money', value })
const percentMoney = percentage => ({
  type: 'percentage_resource',
  resource: 'money',
  percentage
})

// A percentage money effect is taken of spendable cash plus whatever the
// composite has already added or removed, then clamped like a fixed amount.
const percentageCompositeCases = [
  {
    label: 'a percentage after a debit is taken of what is left',
    state: { player: { money: 100 } },
    effects: [moneyEffect(-100), percentMoney(-50), moneyEffect(80)],
    expected: -20
  },
  {
    label: 'a percentage after a gain includes the gain',
    state: { player: { money: 100 } },
    effects: [moneyEffect(100), percentMoney(-50)],
    expected: 0
  },
  {
    label: 'two percentage losses compound',
    state: { player: { money: 100 } },
    effects: [percentMoney(-50), percentMoney(-50)],
    expected: -75
  },
  {
    label: 'during a run the percentage ignores protected cash',
    state: {
      player: { money: 500 },
      expedition: { status: 'active', protectedCareerCash: 900 }
    },
    effects: [moneyEffect(100), percentMoney(-50)],
    expected: 50
  }
]

for (const { label, state, effects, expected } of percentageCompositeCases) {
  test(`percentage money in a composite: ${label}`, () => {
    const delta = eventEngine.applyResult(
      { type: 'composite', effects },
      {},
      state
    )
    assert.equal(delta.player.money, expected)
  })
}
