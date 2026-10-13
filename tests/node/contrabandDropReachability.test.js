import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DROP_BASE_CHANCE,
  pickContrabandDropFromRoll
} from '../../src/utils/contrabandUtils'
import { CONTRABAND_BY_RARITY } from '../../src/data/contraband'
import { handleCompleteTravelMinigame } from '../../src/context/reducers/minigameReducer'
import {
  DEFAULT_BAND_STATE,
  DEFAULT_PLAYER_STATE
} from '../../src/context/initialState'

// Only rolls below the drop chance reach the picker, so the sweep stays inside
// the base (luck 0) drop window: the narrowest seed range a real drop uses.
const SWEEP_SIZE = 20000
const sweepRolls = () => {
  const rolls = []
  for (let i = 0; i < SWEEP_SIZE; i++) {
    rolls.push((i / SWEEP_SIZE) * DROP_BASE_CHANCE)
  }
  return rolls
}

describe('pickContrabandDropFromRoll', () => {
  it('reaches every catalogue item in every rarity pool', () => {
    const seen = new Set()
    for (const roll of sweepRolls()) {
      const id = pickContrabandDropFromRoll(roll)
      if (id !== null) seen.add(id)
    }

    const unreachable = []
    for (const [rarity, pool] of Object.entries(CONTRABAND_BY_RARITY)) {
      assert.ok(pool.length > 0, `rarity pool ${rarity} is empty`)
      for (const item of pool) {
        if (!seen.has(item.id)) unreachable.push(`${rarity}:${item.id}`)
      }
    }
    assert.deepEqual(unreachable, [])
  })

  it('is deterministic per roll', () => {
    for (const roll of [0, 0.0001, 0.01, 0.0733, 0.149999]) {
      assert.equal(
        pickContrabandDropFromRoll(roll),
        pickContrabandDropFromRoll(roll)
      )
    }
  })
})

describe('handleCompleteTravelMinigame contraband drop', () => {
  const buildState = () => ({
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
  })

  it('drops the same seeded item for the same rngValue', () => {
    const payload = { damageTaken: 0, itemsCollected: 0, rngValue: 0.042 }
    const first = handleCompleteTravelMinigame(buildState(), payload)
    const second = handleCompleteTravelMinigame(buildState(), payload)
    const firstIds = Object.keys(first.band.stash)
    assert.equal(firstIds.length, 1)
    assert.deepEqual(Object.keys(second.band.stash), firstIds)
    assert.equal(firstIds[0], pickContrabandDropFromRoll(0.042))
  })

  it('drops different items across rolls (rarity and index are independent)', () => {
    const ids = new Set()
    for (let i = 0; i < 200; i++) {
      const rngValue = (i / 200) * DROP_BASE_CHANCE
      const next = handleCompleteTravelMinigame(buildState(), {
        damageTaken: 0,
        itemsCollected: 0,
        rngValue
      })
      for (const id of Object.keys(next.band.stash)) ids.add(id)
    }
    // The old constant-RNG path reached only 12 items catalogue-wide.
    assert.ok(ids.size > 12, `only ${ids.size} distinct drops`)
  })
})
