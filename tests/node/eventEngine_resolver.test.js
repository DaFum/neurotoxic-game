import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveEventChoice } from '../../src/utils/eventEngine'

const buildState = () => ({
  player: {
    money: 200,
    time: 10,
    fame: 2,
    day: 1,
    van: { fuel: 50, condition: 80 }
  },
  band: {
    members: [{ id: 'alpha', stamina: 6, mood: 50 }],
    harmony: 60,
    inventory: {}
  },
  social: {
    instagram: 0,
    viral: 0
  }
})

test('resolveEventChoice returns delta for direct effects', () => {
  const choice = {
    label: 'Pay fine',
    outcomeText: 'You pay the fine.',
    effect: { type: 'resource', resource: 'money', value: -40 }
  }

  const { delta, outcomeText, description, result } = resolveEventChoice(
    choice,
    buildState()
  )

  assert.equal(outcomeText, 'You pay the fine.')
  assert.equal(description, '')
  assert.equal(result.outcome, 'direct')
  assert.equal(delta.player.money, -40)
})

test('resolveEventChoice handles missing choices safely', () => {
  const { delta, outcomeText, description, result } = resolveEventChoice(
    null,
    buildState()
  )

  assert.equal(outcomeText, '')
  assert.equal(description, '')
  assert.equal(result, null)
  assert.equal(delta, null)
})

test('resolveEventChoice rejects non-finite cooldown durations', () => {
  const cooldownFor = value =>
    resolveEventChoice(
      {
        label: 'Wait',
        outcomeText: 'Later.',
        effect: { type: 'cooldown', eventId: 'some_event', value }
      },
      buildState()
    ).delta.flags.addCooldown

  assert.equal(cooldownFor(3), 'some_event:4')
  // `typeof value === 'number'` accepts these, and the resulting
  // `some_event:Infinity` / `:NaN` entry is rejected by every cooldown reader —
  // a cooldown that neither applies nor expires. Fall back to permanent.
  assert.equal(cooldownFor(Number.POSITIVE_INFINITY), 'some_event')
  assert.equal(cooldownFor(Number.NaN), 'some_event')
})
