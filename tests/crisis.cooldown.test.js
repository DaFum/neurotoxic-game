import test from 'node:test'
import assert from 'node:assert/strict'
import { CRISIS_EVENTS } from '../src/data/events/crisis.js'

test('crisis_police_raid_zealotry includes a cooldown effect', () => {
  const event = CRISIS_EVENTS.find(e => e.id === 'crisis_police_raid_zealotry')
  assert.ok(event, 'crisis_police_raid_zealotry event should exist')

  event.options.forEach((opt, idx) => {
    assert.strictEqual(
      opt.effect.type,
      'composite',
      `Option ${idx + 1} effect should be composite`
    )

    const hasCooldown = opt.effect.effects.some(
      eff => eff.type === 'cooldown' && eff.eventId === 'crisis_police_raid_zealotry'
    )
    assert.ok(
      hasCooldown,
      `Option ${idx + 1} effect should include a cooldown for crisis_police_raid_zealotry`
    )
  })
})

test('crisis_poor_performance does NOT include a cooldown effect', () => {
  const event = CRISIS_EVENTS.find(e => e.id === 'crisis_poor_performance')
  assert.ok(event, 'crisis_poor_performance event should exist')

  // Option 1 has skillCheck
  const opt1 = event.options[0]
  const opt1SuccessEffects = opt1.skillCheck.success.effects || []
  const opt1FailureEffects = opt1.skillCheck.failure.effects || []

  assert.ok(
    !opt1SuccessEffects.some(eff => eff.type === 'cooldown'),
    'Option 1 success effect should NOT include a cooldown'
  )
  assert.ok(
    !opt1FailureEffects.some(eff => eff.type === 'cooldown'),
    'Option 1 failure effect should NOT include a cooldown'
  )

  // Option 2 has direct effect
  const opt2 = event.options[1]
  const opt2Effects = opt2.effect.effects || []
  assert.ok(
    !opt2Effects.some(eff => eff.type === 'cooldown'),
    'Option 2 effect should NOT include a cooldown'
  )
})

test('crisis_mass_unfollow does NOT include a cooldown effect', () => {
  const event = CRISIS_EVENTS.find(e => e.id === 'crisis_mass_unfollow')
  assert.ok(event, 'crisis_mass_unfollow event should exist')

  const opt1 = event.options[0]
  const opt1Effects = opt1.effect.effects || []
  assert.ok(
    !opt1Effects.some(eff => eff.type === 'cooldown'),
    'Option 1 effect should NOT include a cooldown'
  )
})
