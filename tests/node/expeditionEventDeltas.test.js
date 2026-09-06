/**
 * @fileoverview Expedition effects requested by declarative events.
 *
 * Events are authored content that reaches the run from outside it, so the
 * boundary is deliberately narrow: an event names a result, the Expedition's
 * own registry owns the numbers, and the Expedition reducer stays the authority
 * over run state. A hand-written effect carrying its own Condition or cargo
 * figures, or an unknown result id, must therefore move nothing at all.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { applyExpeditionEventDelta } from '../../src/context/expeditionActionCreators'
import { processEffect } from '../../src/utils/eventEngine/eventEffectHandlers'
import { resolveEvent } from '../../src/domain/eventResolver'
import { getExpeditionTechnicalCondition } from '../../src/domain/expedition/condition'
import { getExpeditionCargoView } from '../../src/domain/expedition/cargo'
import { getEffectiveExpeditionRules } from '../../src/domain/expedition/effectiveRules'
import { startedState } from '../expeditionLifecycleFixture.js'

/** A fresh delta accumulator in the shape the engine builds. */
const emptyDelta = () => ({ player: {}, band: {}, social: {}, flags: {} })

const applyIds = (state, resultIds, overrides = {}) =>
  gameReducer(state, {
    type: ActionTypes.APPLY_EXPEDITION_EVENT_DELTA,
    payload: {
      resultIds,
      expectedRouteStep: state.expedition.routeStep,
      ...overrides
    }
  })

describe('the event engine only carries Expedition result ids', () => {
  it('collects a known result id into the delta envelope', () => {
    const delta = emptyDelta()
    processEffect({ type: 'expedition', result: 'equipment_scuffed' }, delta)
    assert.deepEqual(delta.expedition, { resultIds: ['equipment_scuffed'] })
  })

  it('ignores an unknown result id', () => {
    const delta = emptyDelta()
    processEffect({ type: 'expedition', result: 'grant_me_everything' }, delta)
    assert.equal(delta.expedition, undefined)
  })

  it('ignores a caller-supplied value on the effect', () => {
    const delta = emptyDelta()
    processEffect(
      {
        type: 'expedition',
        result: 'supplies_spoiled',
        value: -999,
        heat: 100,
        condition: { pa: 0 }
      },
      delta
    )
    // Only the id survives, so the numbers can only come from the registry.
    assert.deepEqual(delta.expedition, { resultIds: ['supplies_spoiled'] })
  })

  it('records one result once', () => {
    const delta = emptyDelta()
    processEffect({ type: 'expedition', result: 'pa_overloaded' }, delta)
    processEffect({ type: 'expedition', result: 'pa_overloaded' }, delta)
    assert.deepEqual(delta.expedition, { resultIds: ['pa_overloaded'] })
  })
})

describe('the resolver forwards the envelope as its own typed action', () => {
  it('emits APPLY_EXPEDITION_EVENT_DELTA next to the career delta', () => {
    const state = startedState({ money: 5000, fuel: 100 })
    const { actions } = resolveEvent(
      { effect: { type: 'expedition', result: 'pa_overloaded' } },
      state
    )
    const forwarded = actions.find(
      action => action.type === ActionTypes.APPLY_EXPEDITION_EVENT_DELTA
    )
    assert.ok(forwarded, 'the Expedition results were never forwarded')
    assert.deepEqual(forwarded.payload.resultIds, ['pa_overloaded'])
    assert.equal(
      forwarded.payload.expectedRouteStep,
      state.expedition.routeStep
    )
    // The career delta still travels separately; run state is not its business.
    assert.ok(
      actions.some(action => action.type === ActionTypes.APPLY_EVENT_DELTA)
    )
  })

  it('forwards nothing for an event that names no known result', () => {
    const state = startedState({ money: 5000, fuel: 100 })
    const { actions } = resolveEvent(
      { effect: { type: 'expedition', result: 'not_a_result' } },
      state
    )
    assert.ok(
      !actions.some(
        action => action.type === ActionTypes.APPLY_EXPEDITION_EVENT_DELTA
      )
    )
  })

  it('forwards nothing outside an active run', () => {
    const state = startedState({ money: 5000, fuel: 100 })
    const idle = {
      ...state,
      expedition: { ...state.expedition, status: 'idle' }
    }
    assert.equal(applyExpeditionEventDelta(idle, ['pa_overloaded']), null)
  })
})

describe('the reducer derives the effects from the registry', () => {
  it('wears technical Condition through the chassis wear rule', () => {
    const state = startedState({ money: 5000, fuel: 100 })
    const before = getExpeditionTechnicalCondition(state)
    const multiplier =
      getEffectiveExpeditionRules(state).numeric.technicalWearMultiplier

    const next = applyIds(state, ['pa_overloaded'])
    const after = getExpeditionTechnicalCondition(next)
    assert.equal(after.pa, before.pa - Math.round(15 * multiplier))
    assert.equal(after.instruments, before.instruments)
    assert.equal(after.stageGear, before.stageGear)
  })

  it('sums the wear of several results in one dispatch', () => {
    const state = startedState({ money: 5000, fuel: 100 })
    const before = getExpeditionTechnicalCondition(state)
    const multiplier =
      getEffectiveExpeditionRules(state).numeric.technicalWearMultiplier

    const next = applyIds(state, ['pa_overloaded', 'equipment_scuffed'])
    const after = getExpeditionTechnicalCondition(next)
    assert.equal(after.pa, before.pa - Math.round((15 + 4) * multiplier))
    assert.equal(after.stageGear, before.stageGear - Math.round(3 * multiplier))
  })

  it('applies a cargo loss and never goes below zero', () => {
    const state = startedState(
      { money: 5000, fuel: 100 },
      { cargo: { spareParts: 0, supplies: 1 } }
    )
    assert.equal(getExpeditionCargoView(state).supplies, 1)

    const once = applyIds(state, ['supplies_spoiled'])
    assert.equal(once.expedition.cargo.supplies, 0)

    const twice = applyIds(once, ['supplies_spoiled'])
    assert.equal(twice.expedition.cargo.supplies, 0)
  })

  it('grants cargo only while the bus has a free slot', () => {
    const state = startedState(
      { money: 5000, fuel: 100 },
      { cargo: { spareParts: 0, supplies: 0 } }
    )
    const free = getExpeditionCargoView(state).availableVisibleSlots
    assert.ok(free > 0, 'the fixture bus has no free cargo slot')

    const granted = applyIds(state, ['spare_parts_scavenged'])
    assert.equal(granted.expedition.cargo.spareParts, 1)

    // Fill the hold, then confirm the same result grants nothing.
    const packed = {
      ...state,
      expedition: {
        ...state.expedition,
        cargo: {
          ...getExpeditionCargoView(state),
          spareParts: free,
          supplies: 0
        }
      }
    }
    const refused = applyIds(packed, ['spare_parts_scavenged'])
    assert.equal(refused.expedition.cargo.spareParts, free)
  })

  it('does not store the derived capacity numbers on cargo', () => {
    const state = startedState(
      { money: 5000, fuel: 100 },
      { cargo: { spareParts: 0, supplies: 1 } }
    )
    const next = applyIds(state, ['supplies_spoiled'])
    assert.deepEqual(Object.keys(next.expedition.cargo).sort(), [
      'contraband',
      'merch',
      'spareParts',
      'supplies',
      'technicalGearItemIds'
    ])
  })
})

describe('the reducer rejects what an event may not author', () => {
  it('ignores a payload of unknown ids', () => {
    const state = startedState({ money: 5000, fuel: 100 })
    assert.equal(applyIds(state, ['grant_me_everything', 7, null]), state)
  })

  it('ignores numeric state changes smuggled into the payload', () => {
    const state = startedState({ money: 5000, fuel: 100 })
    const before = getExpeditionTechnicalCondition(state)
    const next = applyIds(state, ['supplies_spoiled'], {
      conditionWear: { pa: 100, instruments: 100, stageGear: 100 },
      heat: 90,
      cargoDelta: { spareParts: 99 }
    })
    assert.deepEqual(getExpeditionTechnicalCondition(next), before)
    assert.equal(next.expedition.cargo.spareParts, 0)
  })

  it('ignores a stale route step', () => {
    const state = startedState({ money: 5000, fuel: 100 })
    assert.equal(
      applyIds(state, ['pa_overloaded'], { expectedRouteStep: 99 }),
      state
    )
  })

  it('ignores a dispatch outside an active run', () => {
    const state = startedState({ money: 5000, fuel: 100 })
    const idle = {
      ...state,
      expedition: { ...state.expedition, status: 'idle' }
    }
    assert.equal(
      gameReducer(idle, {
        type: ActionTypes.APPLY_EXPEDITION_EVENT_DELTA,
        payload: { resultIds: ['pa_overloaded'], expectedRouteStep: 0 }
      }),
      idle
    )
  })
})
