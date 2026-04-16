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

mock.module('../../src/utils/logger.js', {
  namedExports: {
    logger: mockLogger,
    LOG_LEVELS: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, NONE: 4 },
    Logger: class Logger {}
  }
})

mock.module('../../src/data/events/index.js', {
  namedExports: { EVENTS_DB: MOCK_EVENTS }
})

const mockSecureRandom = mock.fn(() => 0.5)
mock.module('../../src/utils/crypto.js', {
  namedExports: {
    secureRandom: mockSecureRandom,
    getSafeRandom: mockSecureRandom,
    getSafeUUID: () => 'mock-uuid-test'
  }
})

// Import module under test after mocking
const { eventEngine, resolveEventChoice } =
  await import('../../src/utils/eventEngine.js')

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
  assert.ok(
    !result.some(e => e.id === 'other'),
    'post_gig event should be excluded'
  )
})

test('eventEngine.filterEvents handles condition errors and logs them via handleError', () => {
  mockLogger.error.mock.resetCalls()
  const throwingEvent = {
    id: 'crash_event',
    trigger: 'random',
    condition: () => {
      throw new Error('Filter failed')
    }
  }

  const result = eventEngine.filterEvents([throwingEvent], 'random', {})

  assert.deepEqual(
    result,
    [],
    'Should filter out the event that throws an error'
  )
  assert.strictEqual(mockLogger.error.mock.calls.length, 1)
  const [channel, message, error] = mockLogger.error.mock.calls[0].arguments
  assert.equal(channel, 'EventEngine')
  assert.ok(message.includes('Condition check failed for event crash_event'))
  assert.match(error.message, /Filter failed/)
})

test('eventEngine.selectEvent dampens random band events when harmony < 30', () => {
  const MOCK_POOL = [
    { id: 'random_one', trigger: 'random', category: 'band', chance: 0.4 },
    { id: 'control_event', trigger: 'random', category: 'other', chance: 0.6 }
  ]

  const state = { band: { harmony: 20 }, activeStoryFlags: [] }

  // Mock secureRandom with a sequence:
  //  - First call > 0.5 so the Fisher-Yates shuffle does not swap the two elements
  //  - Second call = 0.3 so 'random_one' would normally pass its 0.4 chance
  //    but should be rejected due to harmony dampening (effective 0.2)
  //  - Third call = 0.3 so 'control_event' can still be selected with its 0.6 chance
  const secureRandomSequence = [0.6, 0.3, 0.3]
  let secureRandomIndex = 0
  mockSecureRandom.mock.mockImplementation(() => {
    const value =
      secureRandomSequence[secureRandomIndex % secureRandomSequence.length]
    secureRandomIndex += 1
    return value
  })

  try {
    let controlEventSeen = false
    // Call it multiple times to account for shuffling, we should never see 'random_one'
    for (let i = 0; i < 10; i++) {
      const selectedEvent = eventEngine.selectEvent(MOCK_POOL, state, 'random')
      // It should either select control_event or nothing (null) depending on shuffle order
      // But it should NEVER select random_one
      if (selectedEvent) {
        assert.notEqual(selectedEvent.id, 'random_one')
        if (selectedEvent.id === 'control_event') {
          controlEventSeen = true
        }
      }
    }

    // Sanity check that the test actually exercised a successful selection
    assert.equal(controlEventSeen, true)
  } finally {
    // Reset mock
    mockSecureRandom.mock.mockImplementation(() => 0.5)
  }
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

test('resolveEventChoice throws on error during resolution', () => {
  const badOption = {
    get effect() {
      throw new Error('Choice resolution error')
    }
  }

  assert.throws(() => {
    resolveEventChoice(badOption, {})
  }, /Choice resolution error/)
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
    id: 'van_breakdown_tire',
    options: [...TEST_EVENT_VAN_BREAKDOWN.options]
  }
  const state = buildGameState({
    band: { ...buildGameState().band, inventory: { spare_tire: true } }
  })

  const result = eventEngine.processOptions(event, state)

  assert.ok(result, 'Should return modified event')
  const spareTireOption = result.options.find(
    opt => opt.label === 'events:van_breakdown_tire.opt3.label'
  )
  assert.ok(
    spareTireOption,
    'Should have spare tire option when inventory has it'
  )
})

test('eventEngine.processOptions does not add spare tire option without inventory', () => {
  const event = {
    ...TEST_EVENT_VAN_BREAKDOWN,
    id: 'van_breakdown_tire',
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

// Parametrized: applyResult stat and resource effects
const applyResultVariants = [
  {
    label: 'resource [money]',
    result: { type: 'resource', resource: 'money', value: -50 },
    validate: delta => {
      assert.equal(delta.player.money, -50, 'Should apply money change')
    }
  },
  {
    label: 'stat [fame]',
    result: { type: 'stat', stat: 'fame', value: 10 },
    validate: delta => {
      assert.equal(delta.player.fame, 10, 'Should apply fame change')
    }
  },
  {
    label: 'stat [harmony]',
    result: { type: 'stat', stat: 'harmony', value: -15 },
    validate: delta => {
      assert.equal(delta.band.harmony, -15, 'Should apply harmony change')
    }
  },
  {
    label: 'stat [mood]',
    result: { type: 'stat', stat: 'mood', value: 10 },
    validate: delta => {
      assert.ok(delta.band.membersDelta, 'Should have member changes')
      assert.equal(
        delta.band.membersDelta.moodChange,
        10,
        'Should set mood change'
      )
    }
  },
  {
    label: 'stat [stamina]',
    result: { type: 'stat', stat: 'stamina', value: -20 },
    validate: delta => {
      assert.equal(
        delta.band.membersDelta.staminaChange,
        -20,
        'Should set stamina change'
      )
    }
  },
  {
    label: 'resource [fuel]',
    result: { type: 'resource', resource: 'fuel', value: 30 },
    validate: delta => {
      assert.ok(delta.player.van, 'Should have van changes')
      assert.equal(delta.player.van.fuel, 30, 'Should set fuel value')
    }
  }
]

applyResultVariants.forEach(variant => {
  test(`eventEngine.applyResult handles ${variant.label}`, () => {
    const delta = eventEngine.applyResult(variant.result)
    assert.ok(delta, 'Should return delta')
    variant.validate(delta)
  })
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

// Parametrized: van condition clamping
const vanConditionVariants = [
  {
    label: 'raw delta -10',
    value: -10,
    expected: -10
  },
  {
    label: 'raw delta 150',
    value: 150,
    expected: 150
  }
]

vanConditionVariants.forEach(variant => {
  test(`eventEngine.applyResult handles van condition [${variant.label}]`, () => {
    const result = { type: 'stat', stat: 'van_condition', value: variant.value }
    const delta = eventEngine.applyResult(result)
    assert.ok(delta, 'Should return delta')
    assert.equal(
      delta.player.van.condition,
      variant.expected,
      `Should ${variant.label}`
    )
  })
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

test('eventEngine.applyResult ignores prototype-colliding effect types', () => {
  const result = {
    type: 'composite',
    effects: [{ type: 'hasOwnProperty' }, { type: 'toString' }]
  }

  assert.doesNotThrow(() => eventEngine.applyResult(result))
  const delta = eventEngine.applyResult(result)
  assert.ok(delta, 'Should still return delta object')
  assert.deepEqual(
    delta.flags,
    {},
    'Should not set any flags for unknown effects'
  )
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

// Parametrized: time and viral stats
const timeViralVariants = [
  {
    label: 'time',
    result: { type: 'stat', stat: 'time', value: -3 },
    validate: delta =>
      assert.equal(delta.player.time, -3, 'Should apply time change')
  },
  {
    label: 'viral',
    result: { type: 'stat', stat: 'viral', value: 15 },
    validate: delta =>
      assert.equal(delta.social.viral, 15, 'Should apply viral change')
  }
]

timeViralVariants.forEach(variant => {
  test(`eventEngine.applyResult handles ${variant.label} stat`, () => {
    const delta = eventEngine.applyResult(variant.result)
    assert.ok(delta, 'Should return delta')
    variant.validate(delta)
  })
})

// Parametrized: inventory handling
const inventoryVariants = [
  {
    label: 'numeric increment',
    result: { type: 'item', item: 'strings', value: 5 },
    validate: delta =>
      assert.equal(
        delta.band.inventory.strings,
        5,
        'Should set initial increment value'
      )
  },
  {
    label: 'non-numeric value',
    result: { type: 'item', item: 'golden_pick', value: true },
    validate: delta =>
      assert.equal(delta.band.inventory.golden_pick, true, 'Should set value')
  },
  {
    label: 'accumulate across composite effects',
    result: {
      type: 'composite',
      effects: [
        { type: 'item', item: 'strings', value: 5 },
        { type: 'item', item: 'strings', value: 3 }
      ]
    },
    validate: delta =>
      assert.equal(
        delta.band.inventory.strings,
        8,
        'Should accumulate values in delta'
      )
  },
  {
    label: 'allow negative inventory in delta',
    result: {
      type: 'composite',
      effects: [
        { type: 'item', item: 'strings', value: 5 },
        { type: 'item', item: 'strings', value: -10 }
      ]
    },
    validate: delta =>
      assert.equal(
        delta.band.inventory.strings,
        -5,
        'Should allow negative inventory in delta for consumption'
      )
  }
]

inventoryVariants.forEach(variant => {
  test(`eventEngine.applyResult inventory [${variant.label}]`, () => {
    const delta = eventEngine.applyResult(variant.result)
    assert.ok(delta, 'Should return delta')
    variant.validate(delta)
  })
})

// Parametrized: fame mapping and score
const fameMappingVariants = [
  {
    label: 'hype → fame',
    result: { type: 'stat', stat: 'hype', value: 10 },
    validate: delta =>
      assert.equal(delta.player.fame, 10, 'hype should map to fame')
  },
  {
    label: 'crowd_energy → fame',
    result: { type: 'stat', stat: 'crowd_energy', value: 5 },
    validate: delta =>
      assert.equal(delta.player.fame, 5, 'crowd_energy should map to fame')
  },
  {
    label: 'score increment',
    result: { type: 'stat', stat: 'score', value: 100 },
    validate: delta =>
      assert.equal(
        delta.score,
        100,
        'score should increment in top-level score'
      )
  }
]

fameMappingVariants.forEach(variant => {
  test(`eventEngine.applyResult handles ${variant.label}`, () => {
    const delta = eventEngine.applyResult(variant.result)
    assert.ok(delta, 'Should return delta')
    variant.validate(delta)
  })
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

test('eventEngine.processEvent handles condition errors and calls handleError with invalid states', () => {
  mockLogger.error.mock.resetCalls()

  const invalidEvent = {
    id: 'crash_event',
    condition: state => {
      // Force an invalid state check that throws
      return state.missing.data > 5
    }
  }

  const state = buildGameState()
  const result = eventEngine.processEvent(invalidEvent, state)

  assert.equal(result, null)

  // Verify that the logger was ultimately called by the unmocked handleError
  assert.strictEqual(mockLogger.error.mock.calls.length, 1)
  const [channel, message, errArg] = mockLogger.error.mock.calls[0].arguments
  assert.equal(channel, 'EventEngine')
  assert.ok(message.includes('Condition check failed for event crash_event'))
  assert.ok(errArg instanceof TypeError, 'Should be a TypeError')
})

test('eventEngine.processEvent processes valid events successfully', () => {
  mockLogger.error.mock.resetCalls()

  const validEvent = {
    id: 'good_event',
    condition: () => true
  }

  const result = eventEngine.processEvent(validEvent, {})

  assert.ok(result, 'Should return a result object')
  assert.equal(
    result.event.id,
    'good_event',
    'Should return the event inside the result'
  )
  assert.strictEqual(
    mockLogger.error.mock.calls.length,
    0,
    'No errors should be logged'
  )
})

test('eventEngine.applyResult percentage_resource skips if no gameState', () => {
  const result = {
    type: 'percentage_resource',
    resource: 'money',
    percentage: 10
  }
  const delta = eventEngine.applyResult(result)
  assert.equal(delta.player.money, undefined, 'Should skip without gameState')
})

test('eventEngine.applyResult percentage_resource handles positive gain with max cap', () => {
  const result = {
    type: 'percentage_resource',
    resource: 'money',
    percentage: 50,
    max: 100
  }
  const gameState = { player: { money: 1000 } }
  const delta = eventEngine.applyResult(result, {}, gameState)
  assert.equal(delta.player.money, 100, 'Should cap positive gain at max')
})

test('eventEngine.applyResult percentage_resource handles positive gain with min cap', () => {
  const result = {
    type: 'percentage_resource',
    resource: 'money',
    percentage: 5,
    min: 200
  }
  const gameState = { player: { money: 1000 } }
  const delta = eventEngine.applyResult(result, {}, gameState)
  assert.equal(delta.player.money, 200, 'Should elevate positive gain to min')
})

test('eventEngine.applyResult percentage_resource handles negative loss with min cap (lower bound)', () => {
  const result = {
    type: 'percentage_resource',
    resource: 'money',
    percentage: -50,
    min: -100
  }
  const gameState = { player: { money: 1000 } }
  const delta = eventEngine.applyResult(result, {}, gameState)
  assert.equal(
    delta.player.money,
    -100,
    'The negative loss should be floor-capped at -100 (maximaler Verlust) using Math.max.'
  )
})

test('eventEngine.applyResult percentage_resource handles negative loss with max cap (upper bound)', () => {
  const result = {
    type: 'percentage_resource',
    resource: 'money',
    percentage: -5,
    max: -200
  }
  const gameState = { player: { money: 1000 } }
  const delta = eventEngine.applyResult(result, {}, gameState)
  assert.equal(
    delta.player.money,
    -200,
    'The negative loss should be ceiling-capped at -200 (minimaler Verlust) using Math.min.'
  )
})

test('eventEngine.applyResult percentage_resource handles zero money correctly', () => {
  const result = {
    type: 'percentage_resource',
    resource: 'money',
    percentage: 50
  }
  const gameState = { player: { money: 0 } }
  const delta = eventEngine.applyResult(result, {}, gameState)
  assert.equal(delta.player.money, 0, 'Zero money should yield zero gain')
})

test('eventEngine.applyResult percentage_resource gracefully handles min > max', () => {
  const result = {
    type: 'percentage_resource',
    resource: 'money',
    percentage: 50,
    min: 200,
    max: 100
  }
  const gameState = { player: { money: 1000 } }
  // Gain is 500. Correct max should cap it to 200 (if min=100 max=200).
  // With inverted inputs, it should swap them, treating 100 as min and 200 as max.
  const delta = eventEngine.applyResult(result, {}, gameState)
  assert.equal(
    delta.player.money,
    200,
    'Should swap inverted min/max properties safely'
  )
})
