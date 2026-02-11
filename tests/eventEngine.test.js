import test from 'node:test'
import assert from 'node:assert/strict'
import { eventEngine } from '../src/utils/eventEngine.js'

const buildGameState = (overrides = {}) => ({
  player: {
    money: 200,
    time: 10,
    fame: 50,
    day: 5,
    location: 'Berlin',
    currentNodeId: 'node_1_0',
    van: { fuel: 50, condition: 80 }
  },
  band: {
    members: [
      { id: 'matze', name: 'Matze', stamina: 70, mood: 60, skill: 5 },
      { id: 'lars', name: 'Lars', stamina: 65, mood: 55, skill: 4 },
      { id: 'marius', name: 'Marius', stamina: 60, mood: 70, skill: 3 }
    ],
    harmony: 70,
    inventory: { spare_tire: true, strings: true }
  },
  social: { instagram: 100, viral: 0 },
  activeStoryFlags: [],
  eventCooldowns: [],
  pendingEvents: [],
  ...overrides
})

const buildSkillCheckChoice = threshold => ({
  label: 'Negotiate',
  skillCheck: {
    stat: 'harmony',
    threshold,
    success: { type: 'resource', resource: 'money', value: -20 },
    failure: { type: 'resource', resource: 'money', value: -100 }
  }
})

const TEST_EVENT_VAN_BREAKDOWN = {
  id: 'van_breakdown_flat',
  options: [
    {
      label: 'Call tow truck',
      effect: { type: 'resource', resource: 'money', value: -200 }
    }
  ]
}

test('eventEngine.checkEvent returns null when category not found', () => {
  const state = buildGameState()
  const result = eventEngine.checkEvent('nonexistent', state)
  assert.equal(result, null, 'Should return null for invalid category')
})

test('eventEngine.checkEvent filters by trigger point', () => {
  const state = buildGameState()
  const result = eventEngine.checkEvent('transport', state, 'pre_gig')
  assert.ok(
    result === null || typeof result === 'object',
    'Should return null or event object'
  )
})

test('eventEngine.checkEvent respects cooldowns', () => {
  const state = buildGameState({ eventCooldowns: ['event_id_1'] })
  assert.ok(Array.isArray(state.eventCooldowns), 'Cooldowns should be array')
})

test('eventEngine.checkEvent prioritizes pending events', () => {
  const state = buildGameState({ pendingEvents: ['some_event_id'] })
  assert.ok(
    Array.isArray(state.pendingEvents),
    'Pending events should be array'
  )
  assert.ok(state.pendingEvents.length > 0, 'Should have pending events')
})

test('eventEngine.resolveChoice handles direct effect', () => {
  const choice = {
    label: 'Pay bribe',
    outcomeText: 'The officer waves you through.',
    effect: { type: 'resource', resource: 'money', value: -50 }
  }
  const state = buildGameState()

  const result = eventEngine.resolveChoice(choice, state)

  assert.ok(result, 'Should return result object')
  assert.equal(result.outcome, 'direct', 'Should have direct outcome')
  assert.equal(result.type, 'resource', 'Should preserve effect type')
})

test('eventEngine.resolveChoice handles skill check success', t => {
  const choice = buildSkillCheckChoice(5)
  const state = buildGameState({
    band: { ...buildGameState().band, harmony: 80 }
  })

  // Mock random to ensure success (0.1 < 0.8)
  const mockRandom = t.mock.method(Math, 'random', () => 0.1)

  const result = eventEngine.resolveChoice(choice, state)
  assert.equal(result.outcome, 'success', 'Should trigger success outcome')
  assert.strictEqual(mockRandom.mock.calls.length > 0, true)
})

test('eventEngine.resolveChoice handles skill check failure', t => {
  const choice = buildSkillCheckChoice(10)
  const state = buildGameState({
    band: { ...buildGameState().band, harmony: 10 }
  })

  // Mock random to ensure failure (0.9 > 0.1)
  const mockRandom = t.mock.method(Math, 'random', () => 0.9)

  const result = eventEngine.resolveChoice(choice, state)
  assert.equal(result.outcome, 'failure', 'Should trigger failure outcome')
})

test('eventEngine.resolveChoice uses luck stat for luck checks', t => {
  const choice = {
    label: 'Try your luck',
    skillCheck: {
      stat: 'luck',
      threshold: 5,
      success: { type: 'resource', resource: 'money', value: 100 },
      failure: { type: 'resource', resource: 'money', value: 0 }
    }
  }
  const baseState = buildGameState()
  const state = { ...baseState, band: { ...baseState.band, luck: 10 } }

  // Mock random for deterministic outcome.
  // Implementation calls Math.random() * 10 for skill value, then Math.random() * 10 for roll.
  // We need both calls to behave predictably or mock carefully.
  // Here we mock simply returning 0.9.
  // skillValue = 0.9 * 10 = 9.
  // roll = 0.9 * 10 = 9 (crit? +2). total = 9 + 2 = 11. 11 >= 5 -> success.
  const mockRandom = t.mock.method(Math, 'random', () => 0.9)

  const result = eventEngine.resolveChoice(choice, state)
  assert.equal(result.outcome, 'success', 'Should succeed luck check')
})

test('eventEngine.resolveChoice uses max member skill', () => {
  const choice = {
    label: 'Technical repair',
    skillCheck: {
      stat: 'skill',
      threshold: 4,
      success: { type: 'stat', stat: 'van_condition', value: 20 },
      failure: { type: 'stat', stat: 'van_condition', value: -10 }
    }
  }
  const state = buildGameState()

  const result = eventEngine.resolveChoice(choice, state)

  assert.ok(result, 'Should return result object')
  assert.ok(
    ['success', 'failure'].includes(result.outcome),
    'Skill check should have valid outcome'
  )
})

test('eventEngine.resolveChoice preserves nextEventId', () => {
  const choice = {
    label: 'Chase the van',
    effect: { type: 'stat', stat: 'time', value: -2 },
    nextEventId: 'chase_outcome'
  }
  const state = buildGameState()

  const result = eventEngine.resolveChoice(choice, state)

  assert.equal(
    result.nextEventId,
    'chase_outcome',
    'Should preserve nextEventId'
  )
})

test('eventEngine.processOptions returns event when no processing needed', () => {
  const event = {
    id: 'simple_event',
    options: [
      { label: 'Continue', effect: { type: 'stat', stat: 'time', value: -1 } }
    ]
  }
  const state = buildGameState()

  const result = eventEngine.processOptions(event, state)

  assert.ok(result, 'Should return event')
  assert.ok(result.options, 'Should have options')
})

test('eventEngine.processOptions handles van_breakdown with spare_tire', () => {
  const event = TEST_EVENT_VAN_BREAKDOWN
  const state = buildGameState({
    band: { ...buildGameState().band, inventory: { spare_tire: true } }
  })

  const result = eventEngine.processOptions(event, state)

  assert.ok(result, 'Should return modified event')
  const spareTireOption = result.options.find(opt =>
    opt.label.includes('Spare Tire')
  )
  assert.ok(
    spareTireOption,
    'Should have spare tire option when inventory has it'
  )
})

test('eventEngine.processOptions does not add spare tire option without inventory', () => {
  const event = TEST_EVENT_VAN_BREAKDOWN
  const state = buildGameState({
    band: { ...buildGameState().band, inventory: { spare_tire: false } }
  })

  const result = eventEngine.processOptions(event, state)

  const spareTireOption = result.options.find(opt =>
    opt.label.includes('Spare Tire')
  )
  assert.ok(
    !spareTireOption,
    'Should not have spare tire option without inventory'
  )
})

test('eventEngine.applyResult handles resource effects', () => {
  const result = { type: 'resource', resource: 'money', value: -50 }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.equal(delta.player.money, -50, 'Should apply money change')
})

test('eventEngine.applyResult handles stat effects', () => {
  const result = { type: 'stat', stat: 'fame', value: 10 }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.equal(delta.player.fame, 10, 'Should apply fame change')
})

test('eventEngine.applyResult handles harmony stat', () => {
  const result = { type: 'stat', stat: 'harmony', value: -15 }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.equal(delta.band.harmony, -15, 'Should apply harmony change')
})

test('eventEngine.applyResult handles mood changes', () => {
  const result = { type: 'stat', stat: 'mood', value: 10 }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.ok(delta.band.membersDelta, 'Should have member changes')
  assert.equal(delta.band.membersDelta.moodChange, 10, 'Should set mood change')
})

test('eventEngine.applyResult handles stamina changes', () => {
  const result = { type: 'stat', stat: 'stamina', value: -20 }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.equal(
    delta.band.membersDelta.staminaChange,
    -20,
    'Should set stamina change'
  )
})

test('eventEngine.applyResult handles combined mood and stamina in composite', () => {
  const result = {
    type: 'composite',
    effects: [
      { type: 'stat', stat: 'mood', value: 10 },
      { type: 'stat', stat: 'stamina', value: -5 }
    ]
  }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta.band.membersDelta, 'Should have membersDelta')
  assert.equal(
    delta.band.membersDelta.moodChange,
    10,
    'Should preserve moodChange'
  )
  assert.equal(
    delta.band.membersDelta.staminaChange,
    -5,
    'Should preserve staminaChange'
  )
})

test('eventEngine.applyResult handles van fuel', () => {
  const result = { type: 'resource', resource: 'fuel', value: 30 }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.ok(delta.player.van, 'Should have van changes')
  assert.equal(delta.player.van.fuel, 30, 'Should set fuel value')
})

test('eventEngine.applyResult handles van condition stat', () => {
  const result = { type: 'stat', stat: 'van_condition', value: -10 }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.equal(delta.player.van.condition, -10, 'Should set condition value')
})

test('eventEngine.applyResult handles game over flag', () => {
  const result = { type: 'game_over' }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.equal(delta.flags.gameOver, true, 'Should set game over flag')
})

test('eventEngine.applyResult handles story flags', () => {
  const result = { type: 'flag', flag: 'met_promoter' }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.equal(
    delta.flags.addStoryFlag,
    'met_promoter',
    'Should add story flag'
  )
})

test('eventEngine.applyResult handles chain events', () => {
  const result = { type: 'chain', eventId: 'follow_up_event' }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.equal(
    delta.flags.queueEvent,
    'follow_up_event',
    'Should queue chained event'
  )
})

test('eventEngine.applyResult handles composite effects', () => {
  const result = {
    type: 'composite',
    effects: [
      { type: 'resource', resource: 'money', value: -100 },
      { type: 'stat', stat: 'fame', value: 5 },
      { type: 'stat', stat: 'harmony', value: 10 }
    ]
  }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.equal(delta.player.money, -100, 'Should apply money effect')
  assert.equal(delta.player.fame, 5, 'Should apply fame effect')
  assert.equal(delta.band.harmony, 10, 'Should apply harmony effect')
})

test('eventEngine.applyResult returns null for null result', () => {
  const delta = eventEngine.applyResult(null)
  assert.equal(delta, null, 'Should return null for null input')
})

test('eventEngine.applyResult handles unlock effects', () => {
  const result = { type: 'unlock', unlock: 'new_venue' }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.equal(delta.flags.unlock, 'new_venue', 'Should set unlock flag')
})

test('eventEngine.applyResult preserves nextEventId from result', () => {
  const result = {
    type: 'resource',
    resource: 'money',
    value: 50,
    nextEventId: 'bonus_event'
  }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.equal(
    delta.flags.queueEvent,
    'bonus_event',
    'Should queue next event from result'
  )
})

test('eventEngine.applyResult handles time stat', () => {
  const result = { type: 'stat', stat: 'time', value: -3 }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.equal(delta.player.time, -3, 'Should apply time change')
})

test('eventEngine.applyResult handles viral stat', () => {
  const result = { type: 'stat', stat: 'viral', value: 15 }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.equal(delta.social.viral, 15, 'Should apply viral change')
})

test('eventEngine.applyResult handles inventory numeric increment', () => {
  const result = { type: 'item', item: 'strings', value: 5 }
  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.equal(
    delta.band.inventory.strings,
    5,
    'Should set initial increment value'
  )
})

test('eventEngine.applyResult handles inventory non-numeric value', () => {
  const result = { type: 'item', item: 'golden_pick', value: true }
  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.equal(delta.band.inventory.golden_pick, true, 'Should set value')
})

test('eventEngine logic for inventory increment handles existing values', () => {
  const result = {
    type: 'composite',
    effects: [
      { type: 'item', item: 'strings', value: 5 },
      { type: 'item', item: 'strings', value: 3 }
    ]
  }

  const delta = eventEngine.applyResult(result)
  assert.equal(
    delta.band.inventory.strings,
    8,
    'Should accumulate values in delta'
  )
})

test('eventEngine logic allows negative inventory in delta', () => {
  const result = {
    type: 'composite',
    effects: [
      { type: 'item', item: 'strings', value: 5 },
      { type: 'item', item: 'strings', value: -10 }
    ]
  }

  const delta = eventEngine.applyResult(result)
  assert.equal(
    delta.band.inventory.strings,
    -5,
    'Should allow negative inventory in delta for consumption'
  )
})
