import test, { mock } from 'node:test'
import assert from 'node:assert/strict'

// Mock database
const MOCK_EVENTS = {
  transport: [
    { id: 'event_normal', trigger: 'pre_gig', chance: 1.0 },
    { id: 'event_cooldown', trigger: 'pre_gig', chance: 1.0 },
    { id: 'event_pending', trigger: 'pre_gig', chance: 1.0 }
  ]
}

// Mock logger
const mockLogger = {
  error: mock.fn(),
  debug: mock.fn(),
  info: mock.fn(),
  warn: mock.fn()
}

mock.module('../src/utils/logger.js', {
  namedExports: { logger: mockLogger }
})

mock.module('../src/data/events/index.js', {
  namedExports: { EVENTS_DB: MOCK_EVENTS }
})

const mockSecureRandom = mock.fn(() => 0.5)
mock.module('../src/utils/crypto.js', {
  namedExports: { secureRandom: mockSecureRandom }
})

// Import module under test after mocking
const { eventEngine } = await import('../src/utils/eventEngine.js')

const TEST_EVENT_VAN_BREAKDOWN = {
  id: 'van_breakdown',
  options: [
    {
      label: 'Spare Tire',
      requirements: { item: 'spare_tire' },
      effect: { type: 'stat', stat: 'time', value: -1 }
    },
    { label: 'Wait', effect: { type: 'stat', stat: 'time', value: -3 } }
  ]
}

// Helpers
const buildGameState = (overrides = {}) => ({
  player: { day: 1, money: 100, fame: 50, time: 0 },
  band: { harmony: 50, members: [] },
  social: { viral: 0 },
  eventCooldowns: [],
  pendingEvents: [],
  flags: {},
  ...overrides
})

// Mock random for deterministic testing
const mockRandom = mock.fn(() => 0.5)
global.Math.random = mockRandom

test('eventEngine.filterEvents filters by trigger', () => {
  const events = [
    { id: '1', trigger: 'travel' },
    { id: '2', trigger: 'gig' }
  ]
  const result = eventEngine.filterEvents(events, 'travel', {})
  assert.equal(result.length, 1)
  assert.equal(result[0].id, '1')
})

test('eventEngine.filterEvents respects conditions', () => {
  const events = [
    { id: '1', trigger: 'travel', condition: state => state.player.money > 100 }
  ]
  const state = { player: { money: 50 } }
  const result = eventEngine.filterEvents(events, 'travel', state)
  assert.equal(result.length, 0)
})

test('eventEngine.filterEvents allows trigger:random events at any trigger point', () => {
  const events = [
    { id: 'specific', trigger: 'travel' },
    { id: 'random_one', trigger: 'random' },
    { id: 'other', trigger: 'post_gig' }
  ]
  const result = eventEngine.filterEvents(events, 'travel', {})
  assert.equal(result.length, 2, 'Should include both travel and random events')
  assert.ok(result.some(e => e.id === 'specific'))
  assert.ok(result.some(e => e.id === 'random_one'))
  assert.ok(!result.some(e => e.id === 'other'), 'post_gig event should be excluded')
})

test('eventEngine.selectEvent respects cooldowns', () => {
  const state = buildGameState({ eventCooldowns: ['event_cooldown'] })
  const selected = eventEngine.selectEvent(
    MOCK_EVENTS.transport,
    state,
    'pre_gig'
  )
  // Should skip event_cooldown and pick event_normal or event_pending
  assert.ok(selected.id !== 'event_cooldown')
})

test('eventEngine.selectEvent prioritizes pending events', () => {
  const state = buildGameState({
    pendingEvents: ['event_pending']
  })
  const selected = eventEngine.selectEvent(
    MOCK_EVENTS.transport,
    state,
    'pre_gig'
  )
  assert.equal(selected.id, 'event_pending')
})

test('eventEngine.resolveChoice handles simple effects', () => {
  const option = {
    nextEventId: 'next_event',
    effect: { type: 'resource', resource: 'money', value: -50 }
  }
  const result = eventEngine.resolveChoice(option, {})
  assert.equal(result.value, -50)
})

test('eventEngine.resolveChoice handles skill checks (success)', () => {
  mockSecureRandom.mock.mockImplementationOnce(() => 0.9) // High roll
  const option = {
    nextEventId: 'next_event',
    skillCheck: {
      stat: 'skill',
      threshold: 5,
      success: { type: 'stat', stat: 'fame', value: 10 }
    }
  }
  const state = buildGameState({ band: { members: [{ skill: 8 }] } })

  const result = eventEngine.resolveChoice(option, state)
  assert.equal(result.value, 10)
  assert.equal(result.stat, 'fame')
})

test('eventEngine.resolveChoice handles skill checks (failure)', () => {
  mockSecureRandom.mock.mockImplementationOnce(() => 0.1) // Low roll
  const option = {
    nextEventId: 'next_event',
    skillCheck: {
      stat: 'skill',
      threshold: 5,
      failure: { type: 'stat', stat: 'fame', value: -5 }
    }
  }
  const state = buildGameState({ band: { members: [{ skill: 2 }] } })

  const result = eventEngine.resolveChoice(option, state)
  assert.equal(result.value, -5)
})

test('eventEngine.resolveChoice handles luck checks', () => {
  // Luck check uses secureRandom() * 10
  // Threshold 5. Mock random 0.6 -> 6.0 > 5 -> Success
  mockSecureRandom.mock.mockImplementationOnce(() => 0.6)
  const initialCalls = mockSecureRandom.mock.calls.length

  const option = {
    nextEventId: 'next_event',
    skillCheck: {
      stat: 'luck',
      threshold: 5,
      success: { type: 'stat', stat: 'mood', value: 5 }
    }
  }

  const result = eventEngine.resolveChoice(option, {})
  assert.equal(result.value, 5)
  assert.strictEqual(mockSecureRandom.mock.calls.length, initialCalls + 2)
})

test('eventEngine.resolveChoice sets nextEventId', () => {
  const option = {
    nextEventId: 'next_event',
    effect: { type: 'chain', eventId: 'next_event' }
  }
  const result = eventEngine.resolveChoice(option, {})
  assert.equal(result.nextEventId, 'next_event', 'Should propagate nextEventId')
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
  const event = {
    ...TEST_EVENT_VAN_BREAKDOWN,
    options: [...TEST_EVENT_VAN_BREAKDOWN.options]
  }
  const state = buildGameState({
    band: { ...buildGameState().band, inventory: { spare_tire: true } }
  })

  const result = eventEngine.processOptions(event, state)

  assert.ok(result, 'Should return modified event')
  const spareTireOption = result.options.find(
    opt => opt.label === 'Use Spare Tire (Inventory)'
  )
  assert.ok(
    spareTireOption,
    'Should have spare tire option when inventory has it'
  )
})

test('eventEngine.processOptions does not add spare tire option without inventory', () => {
  const event = {
    ...TEST_EVENT_VAN_BREAKDOWN,
    options: [...TEST_EVENT_VAN_BREAKDOWN.options]
  }
  const state = buildGameState({
    band: { ...buildGameState().band, inventory: { spare_tire: false } }
  })

  const result = eventEngine.processOptions(event, state)

  const spareTireOption = result.options.find(
    opt => opt.label === 'Use Spare Tire (Inventory)'
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
  assert.equal(
    delta.player.van.condition,
    0,
    'Should clamp condition to minimum 0'
  )
})

test('eventEngine.applyResult clamps van condition to 0-100 range', () => {
  const overResult = { type: 'stat', stat: 'van_condition', value: 150 }
  const overDelta = eventEngine.applyResult(overResult)
  assert.equal(
    overDelta.player.van.condition,
    100,
    'Should clamp condition to maximum 100'
  )
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

test('eventEngine.applyResult accumulates inventory values across composite effects', () => {
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

test('eventEngine.applyResult handles hype stat as fame', () => {
  const result = { type: 'stat', stat: 'hype', value: 10 }
  const delta = eventEngine.applyResult(result)
  assert.equal(delta.player.fame, 10, 'hype should map to fame')
})

test('eventEngine.applyResult handles crowd_energy stat as fame', () => {
  const result = { type: 'stat', stat: 'crowd_energy', value: 5 }
  const delta = eventEngine.applyResult(result)
  assert.equal(delta.player.fame, 5, 'crowd_energy should map to fame')
})

test('eventEngine.applyResult handles score stat increment', () => {
  const result = { type: 'stat', stat: 'score', value: 100 }
  const delta = eventEngine.applyResult(result)
  assert.equal(delta.score, 100, 'score should increment in top-level score')
})

test('eventEngine.applyResult accumulates fame from mixed stats (fame, hype, crowd_energy)', () => {
  const result = {
    type: 'composite',
    effects: [
      { type: 'stat', stat: 'fame', value: 10 },
      { type: 'stat', stat: 'hype', value: 5 },
      { type: 'stat', stat: 'crowd_energy', value: 3 }
    ]
  }

  const delta = eventEngine.applyResult(result)

  assert.ok(delta, 'Should return delta')
  assert.equal(
    delta.player.fame,
    18,
    'Should accumulate all fame-related stats (10 + 5 + 3)'
  )
})

test('eventEngine.filterEvents dampens random band events when harmony < 30', () => {
  const MOCK_POOL = [
    { id: 'random_one', trigger: 'random', category: 'band', chance: 0.4 },
    { id: 'control_event', trigger: 'random', category: 'other', chance: 0.6 }
  ]

  const state = { band: { harmony: 20 }, activeStoryFlags: [] }

  // When harmony is 20 (which is < 30), chance for 'random_one' becomes 0.4 * 0.5 = 0.2.
  // The 'control_event' has a chance of 0.6.
  //
  // selectEvent logic does Fisher-Yates shuffle.
  // If we set secureRandom to 0.5, we bypass 'random_one' (because 0.5 is not < 0.2),
  // and we select 'control_event' (because 0.5 is < 0.6).
  //
  // However, because of shuffling, we should force it to test 'random_one'.

  // Mock secureRandom to return a small enough value that would normally pass (0.3 < 0.4),
  // but due to dampening (0.2), it will FAIL to select 'random_one'.
  mockSecureRandom.mock.mockImplementation(() => 0.3)

  // Call it multiple times to account for shuffling, we should never see 'random_one'
  for (let i = 0; i < 10; i++) {
    const selectedEvent = eventEngine.selectEvent(MOCK_POOL, state, 'random')
    // It should either select control_event or nothing (null) depending on shuffle order
    // But it should NEVER select random_one
    if (selectedEvent) {
       assert.notEqual(selectedEvent.id, 'random_one')
    }
  }

  // To test the positive case we need to make sure 'random_one' ends up first after the shuffle,
  // or that 'control_event' fails its chance check.
  // The shuffle logic is:
  // for (let i = shuffled.length - 1; i > 0; i--) {
  //   const j = Math.floor(secureRandom() * (i + 1))
  //   ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  // }
  // With length 2, i=1, j = Math.floor(secureRandom() * 2).
  // If secureRandom is 0.5, j=1, no swap.
  // If secureRandom is 0, j=0, they swap.
  // MOCK_POOL has random_one at index 0, control_event at index 1.
  // So they start out as [random_one, control_event].
  // We want random_one to be checked first.
  // If no swap, control_event is at index 1, random_one at 0. So random_one is at 0.
  // But wait, the iteration is 'for (const eligible of shuffled)'. It starts at index 0.
  // So random_one is checked first!
  // If secureRandom is 0.5, j=1. Array remains [random_one, control_event].
  // Then random_one is evaluated. chance = 0.4 * 0.5 = 0.2.
  // secureRandom is 0.5. 0.5 < 0.2 is FALSE. It fails.
  // Then control_event is evaluated. chance = 0.6.
  // secureRandom is 0.5. 0.5 < 0.6 is TRUE. It succeeds.
  //
  // To make random_one succeed, we need a random value < 0.2, say 0.1.
  // But wait! 0.1 means j = Math.floor(0.1 * 2) = 0.
  // They swap! Array becomes [control_event, random_one].
  // Now control_event is checked first.
  // secureRandom is 0.1. 0.1 < 0.6 is TRUE. It succeeds!
  // It never checks random_one.
  //
  // Let's use a dynamic mock that returns 0.9 for the shuffle (so j=1, no swap, array is [random_one, control_event]),
  // and then 0.1 for the chance check!

  let callCount = 0
  mockSecureRandom.mock.mockImplementation(() => {
    callCount++
    if (callCount % 2 === 1) {
       // First call: shuffle (needs to keep random_one at index 0, so j=1, so we need >0.5)
       return 0.9
    } else {
       // Second call: chance check (needs to be < 0.2)
       return 0.1
    }
  })

  const selectedEvent = eventEngine.selectEvent(MOCK_POOL, state, 'random')
  assert.equal(selectedEvent?.id, 'random_one', 'Should still be able to select random_one if random value is very low')

  // Reset mock
  mockSecureRandom.mock.mockImplementation(() => 0.5)
})

test('eventEngine.selectEvent handles condition errors gracefully', () => {
  // Reset previous calls to ensure clean state
  mockLogger.error.mock.resetCalls()

  const throwingEvent = {
    id: 'throwing_event',
    trigger: 'travel',
    condition: () => {
      throw new Error('Condition failed')
    }
  }
  const pool = [throwingEvent]
  const state = buildGameState()

  // Should catch error and filter out event, returning null (or another valid event if present)
  const result = eventEngine.selectEvent(pool, state, 'travel')

  assert.equal(result, null)
  assert.strictEqual(mockLogger.error.mock.calls.length, 1)
  const [channel, message, error] = mockLogger.error.mock.calls[0].arguments
  assert.equal(channel, 'EventEngine')
  assert.match(message, /Condition check failed for event throwing_event/)
  assert.match(error.message, /Condition failed/)
})
