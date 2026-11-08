import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createInitialState } from '../../src/context/initialState'
import {
  handleAdvanceDay,
  handleLoadGame
} from '../../src/context/reducers/systemReducer'
import { handleAddCooldown } from '../../src/context/reducers/eventReducer'
import { sanitizeEventCooldowns } from '../../src/context/reducers/sanitizers/stateSanitizers'
import {
  addEventCooldown,
  applyEventDelta,
  isOnCooldown
} from '../../src/utils/gameState'
import { eventEngine } from '../../src/utils/eventEngine'

const HALF_ROLLS = { next: () => 0.5 }

const stateOnDay = (day, eventCooldowns) => {
  const base = createInitialState()
  return { ...base, player: { ...base.player, day }, eventCooldowns }
}

test('initial state stores event cooldowns as an empty record', () => {
  assert.deepEqual(createInitialState().eventCooldowns, {})
})

test('legacy string cooldowns migrate to eventId -> unlock day', () => {
  // Bare ids were "on cooldown until the next advanceDay", so they unlock on
  // the day after the loaded day. Timed entries keep their expiry day, ids
  // with colons keep them, and a non-numeric suffix is part of a bare id.
  assert.deepEqual(
    sanitizeEventCooldowns(
      ['bare', 'timed:10', 'ns:event:12', 'odd:junk', 'expired:7'],
      7
    ),
    { bare: 8, timed: 10, 'ns:event': 12, 'odd:junk': 8 }
  )
})

test('legacy duplicates keep the latest unlock day', () => {
  assert.deepEqual(sanitizeEventCooldowns(['a:20', 'a', 'b', 'b:3'], 5), {
    a: 20,
    b: 6
  })
})

test('record cooldowns drop non-finite, non-number and expired entries', () => {
  assert.deepEqual(
    sanitizeEventCooldowns(
      {
        live: 9,
        today: 5,
        text: '12',
        flag: true,
        nan: Number.NaN,
        inf: Number.POSITIVE_INFINITY
      },
      5
    ),
    { live: 9 }
  )
  assert.deepEqual(sanitizeEventCooldowns('invalid', 5), {})
  assert.deepEqual(sanitizeEventCooldowns(null, 5), {})
})

test('forbidden prototype keys are stripped from cooldown records', () => {
  const hostile = JSON.parse(
    '{"__proto__": 99, "constructor": 99, "prototype": 99, "ok": 99}'
  )
  const fromRecord = sanitizeEventCooldowns(hostile, 1)
  assert.equal(Object.hasOwn(fromRecord, '__proto__'), false)
  assert.equal(Object.hasOwn(fromRecord, 'constructor'), false)
  assert.equal(Object.hasOwn(fromRecord, 'prototype'), false)
  assert.deepEqual(fromRecord, { ok: 99 })

  const fromLegacy = sanitizeEventCooldowns(
    ['__proto__', 'constructor:50', 'prototype', 'ok'],
    1
  )
  assert.equal(Object.hasOwn(fromLegacy, '__proto__'), false)
  assert.equal(Object.hasOwn(fromLegacy, 'constructor'), false)
  assert.equal(Object.hasOwn(fromLegacy, 'prototype'), false)
  assert.deepEqual(fromLegacy, { ok: 2 })
  assert.equal(Object.getPrototypeOf(fromLegacy), Object.prototype)
})

test('LOAD_GAME migrates a legacy string[] save', () => {
  const next = handleLoadGame(createInitialState(), {
    player: { day: 4 },
    eventCooldowns: ['daily', 'timed:9', 'gone:2', false]
  })
  assert.deepEqual(next.eventCooldowns, { daily: 5, timed: 9 })
})

test('LOAD_GAME keeps a record save and drops hostile entries', () => {
  const next = handleLoadGame(createInitialState(), {
    player: { day: 4 },
    eventCooldowns: JSON.parse('{"__proto__": 50, "timed": 9, "bad": "9"}')
  })
  assert.equal(Object.hasOwn(next.eventCooldowns, '__proto__'), false)
  assert.deepEqual(next.eventCooldowns, { timed: 9 })
})

test('isOnCooldown is active strictly before the unlock day', () => {
  const at = day => isOnCooldown(stateOnDay(day, { evt: 10 }), 'evt')
  assert.equal(at(9), true)
  assert.equal(at(10), false)
  assert.equal(at(11), false)
  assert.equal(isOnCooldown(stateOnDay(9, {}), 'evt'), false)
})

test('isOnCooldown matches scoped keys and ignores inherited keys', () => {
  const state = stateOnDay(3, { evt_berlin: 5 })
  assert.equal(isOnCooldown(state, 'evt', 'berlin'), true)
  assert.equal(isOnCooldown(state, 'evt', 'hamburg'), false)
  assert.equal(isOnCooldown(stateOnDay(3, {}), 'constructor'), false)
  assert.equal(isOnCooldown(stateOnDay(3, {}), 'toString'), false)
})

test('isOnCooldown reads the active-id Set built for event selection', () => {
  const state = { eventCooldowns: new Set(['evt']), player: { day: 3 } }
  assert.equal(isOnCooldown(state, 'evt'), true)
  assert.equal(isOnCooldown(state, 'other'), false)
})

test('addEventCooldown keeps the later unlock day and the same reference', () => {
  const cooldowns = { evt: 10 }
  assert.equal(addEventCooldown(cooldowns, 'evt', 8), cooldowns)
  assert.equal(addEventCooldown(cooldowns, 'evt', 10), cooldowns)
  assert.deepEqual(addEventCooldown(cooldowns, 'evt', 12), { evt: 12 })
  assert.deepEqual(addEventCooldown(cooldowns, 'new', 4), { evt: 10, new: 4 })
  assert.equal(addEventCooldown(cooldowns, '__proto__', 99), cooldowns)
  assert.equal(addEventCooldown(cooldowns, '', 99), cooldowns)
  assert.equal(addEventCooldown(cooldowns, 'evt2', Number.NaN), cooldowns)
})

test('ADD_COOLDOWN blocks an event for the rest of the current day', () => {
  const state = stateOnDay(5, {})
  const next = handleAddCooldown(state, 'evt')
  assert.deepEqual(next.eventCooldowns, { evt: 6 })
  assert.equal(isOnCooldown(next, 'evt'), true)

  const afterDay = handleAdvanceDay(next, { dayRngStream: HALF_ROLLS })
  assert.equal(afterDay.player.day, 6)
  assert.deepEqual(afterDay.eventCooldowns, {})
  assert.equal(isOnCooldown(afterDay, 'evt'), false)
})

test('ADD_COOLDOWN returns the same state when nothing changes', () => {
  const state = stateOnDay(5, { evt: 9 })
  assert.equal(handleAddCooldown(state, 'evt'), state)
  assert.equal(handleAddCooldown(state, '__proto__'), state)
  assert.equal(handleAddCooldown(state, ''), state)
})

test('advanceDay keeps timed cooldowns until their unlock day', () => {
  const next = handleAdvanceDay(
    stateOnDay(5, { daily: 6, retry: 10, edge: 7 }),
    { dayRngStream: HALF_ROLLS }
  )
  assert.equal(next.player.day, 6)
  assert.deepEqual(next.eventCooldowns, { retry: 10, edge: 7 })
})

test('cooldown effect writes a structured unlock day into the delta', () => {
  const gameState = stateOnDay(5, {})
  const timed = eventEngine.applyResult(
    { type: 'cooldown', eventId: 'evt', value: 3 },
    {},
    gameState
  )
  assert.deepEqual(timed.flags.addCooldown, { eventId: 'evt', unlockDay: 8 })

  const daily = eventEngine.applyResult(
    { type: 'cooldown', eventId: 'evt' },
    {},
    gameState
  )
  assert.deepEqual(daily.flags.addCooldown, { eventId: 'evt', unlockDay: 6 })

  const applied = applyEventDelta(gameState, timed)
  assert.deepEqual(applied.eventCooldowns, { evt: 8 })
})

test('applyEventDelta ignores malformed or hostile cooldown flags', () => {
  const gameState = stateOnDay(5, { keep: 9 })
  for (const addCooldown of [
    'evt:9',
    { eventId: '__proto__', unlockDay: 9 },
    { eventId: 'evt', unlockDay: Number.NaN },
    { eventId: 'evt', unlockDay: '9' },
    { eventId: 4, unlockDay: 9 }
  ]) {
    const next = applyEventDelta(gameState, { flags: { addCooldown } })
    assert.deepEqual(next.eventCooldowns, { keep: 9 })
    assert.equal(Object.hasOwn(next.eventCooldowns, '__proto__'), false)
  }
})

test('event selection honours record cooldowns for event conditions', () => {
  const event = {
    id: 'crisis_probe',
    trigger: 'travel',
    chance: 1,
    condition: gs => !isOnCooldown(gs, 'crisis_probe'),
    options: [{ label: 'ok', effect: { type: 'stat', stat: 'fame', value: 1 } }]
  }
  const pick = day =>
    eventEngine.selectEvent(
      [event],
      stateOnDay(day, { crisis_probe: 10 }),
      'travel',
      () => 0
    )
  assert.equal(pick(9), null)
  assert.equal(pick(10)?.id, 'crisis_probe')
})
