import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { EVENTS_DB } from '../../src/data/events/index.ts'
import { eventEngine } from '../../src/utils/eventEngine/index.ts'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { createInitialState } from '../../src/context/initialState.ts'
import { startedState } from '../expeditionLifecycleFixture.js'

// Regression for #3456: a percentage money effect was taken of the raw balance,
// protected Career Cash included, so the cash floor then clipped it to the
// whole spendable slice instead of the stated percentage.

const BALANCE = 10_100
const PROTECTED = 10_000

// Real registry effects, looked up by event id and option label key.
const optionEffect = (eventId, labelKey) => {
  const event = Object.values(EVENTS_DB)
    .flat()
    .find(candidate => candidate.id === eventId)
  const option = event?.options?.find(candidate => candidate.label === labelKey)
  assert.ok(option?.effect, `${eventId} option ${labelKey} exists`)
  return option.effect
}

const criticalFailureOpt3 = () =>
  optionEffect('van_critical_failure', 'events:van_critical_failure.opt3.label')

const runState = () => {
  const run = startedState(
    { money: BALANCE },
    { build: { protectedCareerCash: PROTECTED } }
  )
  return { ...run, player: { ...run.player, money: BALANCE } }
}

const applyEvent = (state, effect) => {
  const delta = eventEngine.applyResult(effect, {}, state)
  const next = gameReducer(state, {
    type: ActionTypes.APPLY_EVENT_DELTA,
    payload: delta
  })
  return { delta, next }
}

describe('percentage money effects during an expedition', () => {
  test('take the percentage of spendable cash, not of protected cash', () => {
    const state = runState()
    const spendable = state.player.money - state.expedition.protectedCareerCash
    assert.equal(state.expedition.status, 'active')
    assert.equal(spendable, 100)

    const { delta, next } = applyEvent(state, criticalFailureOpt3())
    // 40% of the 100 spendable, not the 500 cap of 40% of the whole balance.
    assert.equal(delta.player.money, -40)
    assert.equal(next.player.money, BALANCE - 40)
  })

  test('keep the non-cash consequences of a composite option', () => {
    const state = runState()
    // A composite that pairs a percentage repair bill with a time cost.
    const { delta, next } = applyEvent(
      state,
      optionEffect(
        'van_breakdown_engine',
        'events:van_breakdown_engine.opt1.label'
      )
    )
    // 15% of the 100 spendable; the time cost still lands.
    assert.equal(delta.player.money, -15)
    assert.equal(delta.player.time, -4)
    assert.equal(next.player.money, BALANCE - 15)
    assert.notEqual(next.player.time, state.player.time)
  })

  test('use the full balance outside a run', () => {
    const base = createInitialState()
    const state = { ...base, player: { ...base.player, money: BALANCE } }
    assert.notEqual(state.expedition?.status, 'active')
    const delta = eventEngine.applyResult(criticalFailureOpt3(), {}, state)
    // 40% of 10,100 is 4,040, capped by the event's own min of -500.
    assert.equal(delta.player.money, -500)
  })
})
