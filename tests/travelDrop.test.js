import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { handleCompleteTravelMinigame } from '../src/context/reducers/minigameReducer.js'
import {
  DEFAULT_BAND_STATE,
  DEFAULT_PLAYER_STATE
} from '../src/context/initialState.js'

describe('minigameReducer - Travel Complete Drops', () => {
  it('does not drop contraband when rng rolls high', () => {
    const state = {
      player: {
        ...DEFAULT_PLAYER_STATE,
        currentNodeId: 'node_1',
        money: 1000,
        van: { fuel: 100, condition: 100 }
      },
      band: { ...DEFAULT_BAND_STATE, stash: {}, luck: 0 },
      minigame: { targetDestination: 'node_2' },
      gameMap: {
        nodes: {
          node_1: { id: 'node_1', coordinates: { x: 0, y: 0 } },
          node_2: { id: 'node_2', coordinates: { x: 10, y: 10 } }
        }
      },
      toasts: []
    }
    const payload = {
      damageTaken: 0,
      itemsCollected: 0,
      rngValue: 0.99,
      contrabandId: 'c_void_energy',
      instanceId: 'test_inst_1'
    } // High roll, no drop
    const newState = handleCompleteTravelMinigame(state, payload)

    assert.equal(Object.keys(newState.band.stash).length, 0)
    assert.equal(newState.toasts.length, 0)
  })

  it('drops contraband when rng rolls low', () => {
    const state = {
      player: {
        ...DEFAULT_PLAYER_STATE,
        currentNodeId: 'node_1',
        money: 1000,
        van: { fuel: 100, condition: 100 }
      },
      band: { ...DEFAULT_BAND_STATE, stash: {}, luck: 0 },
      minigame: { targetDestination: 'node_2' },
      gameMap: {
        nodes: {
          node_1: { id: 'node_1', coordinates: { x: 0, y: 0 } },
          node_2: { id: 'node_2', coordinates: { x: 10, y: 10 } }
        }
      },
      toasts: []
    }
    const payload = {
      damageTaken: 0,
      itemsCollected: 0,
      rngValue: 0.01,
      contrabandId: 'c_void_energy',
      instanceId: 'test_inst_2'
    } // Low roll, drop
    const newState = handleCompleteTravelMinigame(state, payload)

    assert.equal('c_void_energy' in newState.band.stash, true)
    assert.equal(newState.band.stash['c_void_energy'].instanceId, 'test_inst_2')
    assert.equal(newState.toasts.length, 1)
    assert.equal(newState.toasts[0].message, 'ui:contraband.dropped')
  })
})
