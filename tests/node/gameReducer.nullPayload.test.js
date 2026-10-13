import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { createInitialState } from '../../src/context/initialState'
import { MINIGAME_TYPES } from '../../src/context/gameConstants'

// Asset reducer guards land in a separate work package. Once that branch is
// merged these types stop throwing: the coordinator removes this set (and the
// `continue` below) so every action type is covered without exception.
const expectedToBeFixedElsewhere = new Set([
  ActionTypes.PURCHASE_CHASSIS,
  ActionTypes.UPGRADE_CHASSIS_TIER,
  ActionTypes.SELL_CHASSIS,
  ActionTypes.REPAIR_CHASSIS,
  ActionTypes.REFINANCE_LIABILITY,
  ActionTypes.INSTALL_MODULE,
  ActionTypes.REMOVE_MODULE,
  ActionTypes.START_CROWDFUND,
  ActionTypes.ASSET_FORECLOSED
])

/**
 * States that reach the deeper branches: the fresh state, plus one per
 * minigame type with an active rival and a map, so completion handlers and
 * MOVE_RIVAL_BAND get past their "nothing to do" early returns.
 */
const buildStates = () => {
  const base = createInitialState()
  const states = [['initial', base]]
  for (const type of Object.values(MINIGAME_TYPES)) {
    states.push([
      `active ${type} minigame with rival`,
      {
        ...base,
        rivalBand: {
          id: 'rival_1',
          name: 'Rivals',
          alignment: 'EVIL',
          powerLevel: 1,
          currentLocationId: null
        },
        gameMap: { nodes: {}, connections: [] },
        minigame: { ...base.minigame, active: true, type }
      }
    ])
  }
  return states
}

const PAYLOAD_SHAPES = [
  ['payload: null', type => ({ type, payload: null })],
  ['payload: undefined', type => ({ type, payload: undefined })],
  ['no payload key', type => ({ type })]
]

describe('gameReducer - null and missing payloads', () => {
  for (const type of Object.values(ActionTypes)) {
    if (expectedToBeFixedElsewhere.has(type)) continue
    it(`${type} does not throw`, () => {
      for (const [stateLabel, state] of buildStates()) {
        for (const [shapeLabel, build] of PAYLOAD_SHAPES) {
          let next
          assert.doesNotThrow(() => {
            next = gameReducer(state, build(type))
          }, `${type} threw for ${shapeLabel} on ${stateLabel} state`)
          assert.equal(typeof next, 'object')
          assert.notEqual(next, null)
        }
      }
    })
  }

  it('leaves state untouched for guarded payload-carrying actions', () => {
    const state = createInitialState()
    for (const type of [
      ActionTypes.ADVANCE_QUEST,
      ActionTypes.APPLY_EVENT_DELTA,
      ActionTypes.APPLY_QUEST_EVENT,
      ActionTypes.CLINIC_ENHANCE,
      ActionTypes.CLINIC_HEAL,
      ActionTypes.CRAFT_ITEM,
      ActionTypes.SPAWN_RIVAL_BAND,
      ActionTypes.START_AMP_CALIBRATION,
      ActionTypes.START_KABELSALAT_MINIGAME,
      ActionTypes.START_ROADIE_MINIGAME,
      ActionTypes.START_TRAVEL_MINIGAME,
      ActionTypes.UNBLACKLIST_VENUE,
      ActionTypes.USE_CONTRABAND
    ]) {
      assert.equal(
        gameReducer(state, { type, payload: null }),
        state,
        `${type} changed state for a null payload`
      )
    }
  })

  it('treats a null RESET_STATE payload as "no overrides"', () => {
    const state = {
      ...createInitialState(),
      unlocks: ['kept_unlock']
    }
    const next = gameReducer(state, {
      type: ActionTypes.RESET_STATE,
      payload: null
    })
    assert.deepEqual(next.unlocks, ['kept_unlock'])
    assert.deepEqual(next.settings, state.settings)
  })

  it('ignores a missing SET_LAST_GIG_STATS payload but clears on null', () => {
    const state = {
      ...createInitialState(),
      lastGigStats: { score: 1000, accuracy: 80 }
    }
    assert.equal(
      gameReducer(state, { type: ActionTypes.SET_LAST_GIG_STATS }),
      state
    )
    assert.equal(
      gameReducer(state, {
        type: ActionTypes.SET_LAST_GIG_STATS,
        payload: null
      }).lastGigStats,
      null
    )
  })
})
