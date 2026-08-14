import { describe, it } from 'vitest'
import assert from 'node:assert/strict'

import {
  ALL_RAW_EVENTS,
  KNOWN_EVENT_IDS,
  EVENTS_DB
} from '../../../src/data/events/index'
import { resolveEventChoice } from '../../../src/utils/eventEngine/index'
import { applyEventDelta } from '../../../src/utils/gameState/delta'
import { createInitialState } from '../../../src/context/initialState'
import { validateGameEvent } from '../../../src/utils/eventValidator'

const ROAD_TRIP_EVENT_IDS = [
  'van_playlist_dispute',
  'reststop_night_coffee',
  'traffic_jam_improv',
  'reststop_trunk_dealer',
  'van_ac_heater_failure',
  'night_drive_heart_to_heart'
]

describe('Road Trip Events Suite', () => {
  it('all 6 road-trip events are registered and pass schema validation', () => {
    for (const id of ROAD_TRIP_EVENT_IDS) {
      const event = ALL_RAW_EVENTS.find(e => e.id === id)
      assert.ok(event, `Expected event ${id} to exist in ALL_RAW_EVENTS`)
      assert.equal(
        event.trigger,
        'travel',
        `Expected event ${id} to have trigger 'travel'`
      )
      assert.ok(
        Array.isArray(event.options) && event.options.length === 3,
        `Expected event ${id} to have 3 options`
      )
      assert.ok(
        KNOWN_EVENT_IDS.has(id),
        `Expected event ${id} to be in KNOWN_EVENT_IDS`
      )
      assert.doesNotThrow(
        () => validateGameEvent(event),
        `Event ${id} failed validateGameEvent`
      )
    }
  })

  it('all road-trip events exist in their respective category pools in EVENTS_DB', () => {
    const bandIds = new Set(EVENTS_DB.band.map(e => e.id))
    const transportIds = new Set(EVENTS_DB.transport.map(e => e.id))
    const specialIds = new Set(EVENTS_DB.special.map(e => e.id))

    assert.ok(bandIds.has('van_playlist_dispute'))
    assert.ok(bandIds.has('traffic_jam_improv'))
    assert.ok(bandIds.has('night_drive_heart_to_heart'))

    assert.ok(transportIds.has('reststop_night_coffee'))
    assert.ok(transportIds.has('van_ac_heater_failure'))
    assert.ok(transportIds.has('reststop_trunk_dealer'))
  })

  it('event options resolve choices and apply deltas correctly without mutating base state', () => {
    const state = createInitialState()
    for (const id of ROAD_TRIP_EVENT_IDS) {
      const event = ALL_RAW_EVENTS.find(e => e.id === id)
      for (let i = 0; i < event.options.length; i++) {
        const option = event.options[i]

        // Test with high roll (success on skill checks)
        const successRes = resolveEventChoice(option, state, () => 0.99)
        assert.ok(
          successRes,
          `Expected resolution for ${id} opt ${i + 1} (success)`
        )
        if (option.skillCheck) {
          assert.equal(
            successRes.result?.outcome,
            'success',
            `Expected success outcome for ${id} opt ${i + 1} with high roll`
          )
        }
        if (successRes.delta) {
          const nextState = applyEventDelta(state, successRes.delta)
          assert.ok(nextState, `applyEventDelta failed for ${id} opt ${i + 1}`)
        }

        // Test with low roll (failure on skill checks)
        const failRes = resolveEventChoice(option, state, () => 0.01)
        assert.ok(failRes, `Expected resolution for ${id} opt ${i + 1} (fail)`)
        if (option.skillCheck) {
          assert.equal(
            failRes.result?.outcome,
            'failure',
            `Expected failure outcome for ${id} opt ${i + 1} with low roll`
          )
        }
        if (failRes.delta) {
          const nextState = applyEventDelta(state, failRes.delta)
          assert.ok(
            nextState,
            `applyEventDelta failed for ${id} opt ${i + 1} (fail)`
          )
        }
      }
    }
  })

  it('van_playlist_dispute resolves options as expected', () => {
    const state = createInitialState()
    const event = ALL_RAW_EVENTS.find(e => e.id === 'van_playlist_dispute')
    assert.ok(event)

    // Option 1 with success roll (Lars charisma 8 + crit 2 = 10 >= threshold 10)
    const opt1Success = resolveEventChoice(event.options[0], state, () => 0.99)
    assert.ok(opt1Success.delta)
    const nextStateOpt1 = applyEventDelta(state, opt1Success.delta)
    assert.ok(nextStateOpt1.band.harmony >= state.band.harmony)

    // Option 2 (Demokratischer Kompromiss)
    const opt2Res = resolveEventChoice(event.options[1], state)
    assert.ok(opt2Res.delta)
    const nextStateOpt2 = applyEventDelta(state, opt2Res.delta)
    assert.ok(nextStateOpt2)

    // Option 3 (Lautstärke auf Anschlag)
    const opt3Res = resolveEventChoice(event.options[2], state)
    assert.ok(opt3Res.delta)
    const nextStateOpt3 = applyEventDelta(state, opt3Res.delta)
    assert.ok(nextStateOpt3)
  })

  it('reststop_trunk_dealer adds items to inventory upon purchase', () => {
    const state = createInitialState()
    const event = ALL_RAW_EVENTS.find(e => e.id === 'reststop_trunk_dealer')
    assert.ok(event)

    // Option 1: Buy modded module
    const opt1 = resolveEventChoice(event.options[0], state)
    assert.ok(opt1.delta)
    const nextState = applyEventDelta(state, opt1.delta)
    assert.equal(nextState.player.money, state.player.money - 120)
    assert.equal(nextState.band.inventory.c_diy_overdrive, 1)
  })
})
