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
