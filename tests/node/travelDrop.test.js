import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { handleCompleteTravelMinigame } from '../../src/context/reducers/minigameReducer'
import {
  DEFAULT_BAND_STATE,
  DEFAULT_PLAYER_STATE
} from '../../src/context/initialState'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { fixtureMap, startedState } from '../expeditionLifecycleFixture.js'

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
      minigame: { active: true, type: 'TOURBUS', targetDestination: 'node_2' },
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
      minigame: { active: true, type: 'TOURBUS', targetDestination: 'node_2' },
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
      rngValue: 0.01
    } // Low roll, drop
    const newState = handleCompleteTravelMinigame(state, payload)

    assert.equal(Object.keys(newState.band.stash).length, 1)
    const droppedItemKey = Object.keys(newState.band.stash)[0]
    assert.equal(
      newState.band.stash[droppedItemKey].instanceId.startsWith('drop-'),
      true
    )
    assert.equal(newState.toasts.length, 1)
    assert.equal(newState.toasts[0].messageKey, 'ui:contraband.dropped')
  })

  describe('during an active Expedition', () => {
    const map = fixtureMap()
    const firstHop = map.connections.find(
      edge => edge.from === map.startNodeId
    )?.to

    /** Travels the first hop of the fixture run with a roll that drops. */
    const travelWithDrop = state => {
      const traveling = gameReducer(state, {
        type: ActionTypes.START_TRAVEL_MINIGAME,
        payload: { targetNodeId: firstHop }
      })
      return gameReducer(traveling, {
        type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
        payload: { damageTaken: 0, itemsCollected: [], rngValue: 0.01 }
      })
    }

    it('credits the drop to the packed manifest so it is usable as carried cargo', () => {
      const arrived = travelWithDrop(startedState({ money: 5000, fuel: 100 }))
      assert.equal(arrived.player.currentNodeId, firstHop)

      const [dropId] = Object.keys(arrived.band.stash)
      assert.ok(dropId, 'the low roll must drop an item')
      const dropped = arrived.band.stash[dropId]
      assert.deepEqual(arrived.expedition.cargo.contraband, [
        { stashKey: dropId, instanceId: dropped.instanceId, stacks: 1 }
      ])

      const used = gameReducer(arrived, {
        type: ActionTypes.USE_CONTRABAND,
        payload: {
          contrabandId: dropId,
          instanceId: dropped.instanceId,
          memberId: arrived.band.members[0]?.id
        }
      })
      assert.notStrictEqual(used, arrived)
      assert.equal(Object.hasOwn(used.band.stash, dropId), false)
      assert.deepEqual(used.expedition.cargo.contraband, [])
    })

    it('leaves the drop at HQ when the cargo has no free slot', () => {
      // Eight spare parts fill the base van; there is no hidden capacity.
      const full = startedState(
        { money: 5000, fuel: 100 },
        { cargo: { spareParts: 8, supplies: 0 } }
      )
      assert.equal(full.expedition.cargo.spareParts, 8)
      const arrived = travelWithDrop(full)

      const [dropId] = Object.keys(arrived.band.stash)
      assert.ok(dropId, 'the drop is still owned')
      assert.deepEqual(arrived.expedition.cargo.contraband, [])
    })
  })
})
