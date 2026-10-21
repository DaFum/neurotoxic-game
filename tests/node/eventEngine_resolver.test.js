import test from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveEventChoice,
  isOptionAffordable
} from '../../src/utils/eventEngine'

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

const protectedRun = (money, protectedCareerCash) => ({
  ...buildState(),
  player: { ...buildState().player, money },
  expedition: { status: 'active', protectedCareerCash }
})

test('a paid option is rejected when only protected cash could pay for it', () => {
  const choice = {
    label: 'Buy coffee',
    condition: state => state.player.money >= 45,
    effect: { type: 'resource', resource: 'money', value: -45 }
  }
  // €1,000 total but €990 protected: only €10 is spendable.
  assert.equal(
    resolveEventChoice(choice, protectedRun(1000, 990)).result.outcome,
    'rejected'
  )
  // Enough spendable cash resolves normally.
  assert.notEqual(
    resolveEventChoice(choice, protectedRun(1000, 900)).result.outcome,
    'rejected'
  )
  // Outside a run the full balance counts.
  assert.notEqual(
    resolveEventChoice(choice, buildState()).result.outcome,
    'rejected'
  )
})

test('an unconditioned penalty still resolves when protected cash blocks the debit', () => {
  const fine = {
    label: 'Pay fine',
    effect: { type: 'resource', resource: 'money', value: -200 }
  }
  assert.notEqual(
    resolveEventChoice(fine, protectedRun(1000, 990)).result?.outcome,
    'rejected'
  )
})

const paidOption = (label, cost, extra = {}) => ({
  label,
  effect: { type: 'resource', resource: 'money', value: -cost },
  ...extra
})

const eventWith = (options, money, protectedCareerCash) => ({
  ...protectedRun(money, protectedCareerCash),
  activeEvent: { id: 'evt', options }
})

test('an option that charges money is refused when only protected cash could pay', () => {
  const repair = paidOption('Pay for repair', 50)
  const walkAway = {
    label: 'Walk away',
    effect: { type: 'stat', stat: 'mood', value: -5 }
  }
  // €1,000 total, €990 protected: only €10 is spendable.
  const state = eventWith([repair, walkAway], 1000, 990)

  assert.equal(isOptionAffordable(repair, state), false)
  assert.equal(resolveEventChoice(repair, state).result.outcome, 'rejected')
  // The free sibling stays available.
  assert.equal(isOptionAffordable(walkAway, state), true)
})

test('an option that charges money resolves when spendable cash covers it', () => {
  const repair = paidOption('Pay for repair', 50)
  const state = eventWith([repair, { label: 'Skip' }], 1000, 900)
  assert.equal(isOptionAffordable(repair, state), true)
  assert.notEqual(resolveEventChoice(repair, state).result.outcome, 'rejected')
})

test('every option stays payable when none could be chosen, so the event cannot lock', () => {
  const fine = paidOption('Pay the fine', 200)
  const bribe = paidOption('Bribe', 300)
  const state = eventWith([fine, bribe], 1000, 990)

  assert.equal(isOptionAffordable(fine, state), true)
  assert.equal(isOptionAffordable(bribe, state), true)
})

test('a costly option is not refused outside a run or without protected cash', () => {
  const repair = paidOption('Pay for repair', 500)
  const state = {
    ...buildState(),
    activeEvent: { id: 'evt', options: [repair, { label: 'Skip' }] }
  }
  assert.equal(isOptionAffordable(repair, state), true)
  assert.equal(
    isOptionAffordable(repair, eventWith([repair, { label: 'Skip' }], 10, 0)),
    true
  )
})

test('a percentage cost is priced against the real balance', () => {
  const theft = {
    label: 'Pay off the thief',
    effect: {
      type: 'percentage_resource',
      resource: 'money',
      percentage: -40,
      min: -500
    }
  }
  const walkAway = { label: 'Walk away' }
  // 40% of €1,000 is €400, far above the €10 that is spendable.
  const state = eventWith([theft, walkAway], 1000, 990)
  assert.equal(isOptionAffordable(theft, state), false)
  assert.equal(resolveEventChoice(theft, state).result.outcome, 'rejected')
  // With enough spendable cash the same option is fine.
  assert.equal(
    isOptionAffordable(theft, eventWith([theft, walkAway], 1000, 500)),
    true
  )
})
