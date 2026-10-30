import { useEffect, useReducer } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { gameReducer } from '../../src/context/gameReducer'
import { createInitialState } from '../../src/context/initialState'
import {
  advanceDay,
  createLoadGameAction,
  createStartGigAction,
  createUpdateBandAction,
  createUpdatePlayerAction
} from '../../src/context/actionCreators'
import { ActionTypes } from '../../src/context/actionTypes'
import {
  createPersistedState,
  createRawLoadPayload
} from '../../src/context/usePersistence'
import { deriveExpeditionGhostRouteTargetFrom } from '../../src/domain/expedition/legendaries'
import { createFixedClock } from '../../src/utils/clock'
import { fixtureMap, startedState } from '../expeditionLifecycleFixture.js'
import { BALANCE_CONSTANTS } from '../../src/utils/gameState'
import { GAME_PHASES, MINIGAME_TYPES } from '../../src/context/gameConstants'

// The hook reads and dispatches through a store backed by the real root
// reducer and action creators, so assertions cover committed state.
const store = vi.hoisted(() => ({ state: null, listeners: new Set() }))
const dispatch = action => {
  store.state = gameReducer(store.state, action)
  for (const listener of store.listeners) listener()
}
const spies = vi.hoisted(() => ({
  changeScene: null,
  addToast: null,
  saveGame: null,
  saveGameAfterStateCommit: null,
  startGig: null,
  triggerEvent: null
}))

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: selector => {,
  useGameSelectorOptional: selector => {
    const [, rerender] = useReducer(n => n + 1, 0)
    useEffect(() => {
      store.listeners.add(rerender)
      return () => {
        store.listeners.delete(rerender)
      }
    }, [])
    return selector(store.state)
  },
  useGameActions: () => ({
    advanceDay: () => dispatch(advanceDay(store.state)),
    updateBand: updates => dispatch(createUpdateBandAction(updates)),
    updatePlayer: updates => dispatch(createUpdatePlayerAction(updates)),
    startGig: spies.startGig,
    changeScene: spies.changeScene,
    addToast: spies.addToast,
    saveGame: spies.saveGame,
    saveGameAfterStateCommit: spies.saveGameAfterStateCommit,
    triggerEvent: spies.triggerEvent,
    setPendingBandHQOpen: () => {},
    setPendingSupplyStopInventory: () => {},
    moveRivalBand: () => {},
    checkRivalEncounter: () => {},
    recordExpeditionCrewStressSource: () => {},
    recordExpeditionObligationSignal: () => {},
    offerExpeditionDraft: () => {}
  })
}))

const { useArrivalLogic } = await import('../../src/hooks/useArrivalLogic')

const REST = { id: 'node_rest', type: 'REST_STOP', layer: 1, x: 10, y: 10 }

const restState = () => {
  const base = createInitialState()
  const members = base.band.members.map((m, i) => ({
    ...m,
    mood: 50,
    // Index 0 sits close enough to the cap that rest is bounded by staminaMax.
    stamina: i === 0 ? 95 : 40,
    // +20 from the contraband effect below, which the tick expires.
    staminaMax: 120,
    traits: { ...(m.traits ?? {}) }
  }))
  // A one-day stamina_max contraband effect: the tick reverts it, so the
  // post-tick members are back at a staminaMax of 100.
  const activeContrabandEffects = [
    {
      instanceId: 'contraband_test_1',
      effectType: 'stamina_max',
      value: 20,
      remainingDuration: 1
    }
  ]
  return {
    ...base,
    currentScene: GAME_PHASES.TRAVEL_MINIGAME,
    // Stress drains member mood on the tick, so post-tick mood differs.
    band: {
      ...base.band,
      members,
      activeContrabandEffects,
      stress: 60,
      harmony: 70
    },
    gameMap: {
      nodes: { [REST.id]: REST },
      connections: [],
      layers: [[REST.id]]
    },
    player: { ...base.player, currentNodeId: REST.id }
  }
}

afterEach(() => {
  store.listeners.clear()
})

const renderArrival = (initial, rng = () => 0.99) => {
  store.state = initial
  spies.changeScene = vi.fn()
  spies.addToast = vi.fn()
  spies.saveGame = vi.fn()
  spies.saveGameAfterStateCommit = vi.fn()
  // Still the real action creator; only the calls are recorded.
  spies.startGig = vi.fn(venue => dispatch(createStartGigAction(venue)))
  spies.triggerEvent = vi.fn(() => false)
  return renderHook(() => useArrivalLogic({ rng }))
}

describe('useArrivalLogic through the real reducer', () => {
  test('rest recovery applies to the post-tick members', () => {
    const initial = restState()
    const postTick = gameReducer(initial, advanceDay(initial))
    // The fixture must make the tick move mood and expire the contraband
    // staminaMax bonus, or the test proves nothing.
    expect(postTick.band.members[0].mood).not.toBe(50)
    expect(postTick.band.activeContrabandEffects).toEqual([])
    expect(postTick.band.members[0].staminaMax).toBe(100)

    const { result } = renderArrival(initial)
    act(() => {
      result.current.handleArrivalSequence()
    })

    const after = store.state
    expect(after.player.day).toBe(postTick.player.day)
    after.band.members.forEach((member, i) => {
      const ticked = postTick.band.members[i]
      const staminaMax = ticked.staminaMax ?? 100
      expect(member.id).toBe(ticked.id)
      expect(member.mood).toBe(Math.min(100, ticked.mood + 10))
      expect(member.stamina).toBe(Math.min(staminaMax, ticked.stamina + 20))
      expect(member.traits).toEqual(ticked.traits)
      expect(member.staminaMax).toBe(ticked.staminaMax)
    })
  })

  test('harmony regen adds to the post-tick harmony', () => {
    const initial = restState()
    initial.band = { ...initial.band, harmonyRegenTravel: true }
    const postTick = gameReducer(initial, advanceDay(initial))
    expect(postTick.band.harmony).not.toBe(70)

    const { result } = renderArrival(initial)
    act(() => {
      result.current.handleArrivalSequence()
    })

    expect(store.state.band.harmony).toBe(
      Math.min(100, postTick.band.harmony + 5)
    )
  })

  test('a settlement the reducer refused charges no day and processes no arrival', () => {
    const initial = restState()
    // What the cash floor leaves behind: the minigame still active, the band
    // still on the node it was leaving.
    initial.player = { ...initial.player, currentNodeId: REST.id }
    initial.minigame = {
      ...initial.minigame,
      active: true,
      type: MINIGAME_TYPES.TOURBUS,
      targetDestination: 'node_far'
    }
    const { result } = renderArrival(initial)
    act(() => {
      result.current.handleArrivalSequence()
    })

    expect(store.state.player.day).toBe(initial.player.day)
    expect(store.state.band.members).toEqual(initial.band.members)
    expect(spies.changeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
    expect(spies.addToast).toHaveBeenCalledWith(
      'Not enough money for gas and food!',
      'error'
    )
  })

  test('a leg the route refused is reported as not completed, not as unaffordable', () => {
    const initial = restState()
    initial.minigame = {
      ...initial.minigame,
      active: true,
      type: MINIGAME_TYPES.TOURBUS,
      targetDestination: 'node_far'
    }
    const { result } = renderArrival(initial)
    // A route refusal or invalid target clears the minigame and leaves the
    // band on the node it was leaving.
    act(() => {
      store.state = {
        ...store.state,
        minigame: { ...store.state.minigame, active: false, type: null }
      }
      for (const listener of store.listeners) listener()
    })
    act(() => {
      result.current.handleArrivalSequence()
    })

    expect(store.state.player.day).toBe(initial.player.day)
    expect(spies.changeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
    expect(spies.addToast).toHaveBeenCalledWith(
      'The trip could not be completed. Back to the map.',
      'error'
    )
  })

  test('a committed settlement to the intended node arrives normally', () => {
    const initial = restState()
    initial.minigame = {
      ...initial.minigame,
      active: true,
      type: MINIGAME_TYPES.TOURBUS,
      targetDestination: REST.id
    }
    const { result } = renderArrival(initial)
    // The completion reducer clears the minigame on a committed leg.
    act(() => {
      dispatch({ type: 'UPDATE_PLAYER', payload: {} })
      store.state = {
        ...store.state,
        minigame: { ...store.state.minigame, active: false, type: null }
      }
      for (const listener of store.listeners) listener()
    })
    act(() => {
      result.current.handleArrivalSequence()
    })
    expect(store.state.player.day).toBe(initial.player.day + 1)
  })
})

describe('gig arrival through the real reducer', () => {
  const GIG = {
    id: 'node_gig',
    type: 'GIG',
    layer: 1,
    x: 10,
    y: 10,
    venue: { id: 'berlin_so36', name: 'SO36' }
  }
  const gigArrivalState = ({ harmony, consecutiveBadShows = 0 }) => {
    const base = createInitialState()
    return {
      ...base,
      currentScene: GAME_PHASES.TRAVEL_MINIGAME,
      band: { ...base.band, harmony },
      gameMap: {
        nodes: { [GIG.id]: GIG },
        connections: [],
        layers: [[GIG.id]]
      },
      player: {
        ...base.player,
        currentNodeId: GIG.id,
        fame: 500,
        stats: { ...base.player.stats, consecutiveBadShows }
      }
    }
  }
  const cancelledToast = () =>
    spies.addToast.mock.calls.some(([message]) =>
      String(message).toLowerCase().includes('cancelled')
    )

  test('a band the tick lifts off the harmony floor plays the show', () => {
    const initial = gigArrivalState({ harmony: 1 })
    const postTick = gameReducer(initial, advanceDay(initial))
    // Pre-tick harmony is the deterministic cancel; the tick must lift it.
    expect(postTick.band.harmony).toBeGreaterThan(1)

    const { result } = renderArrival(initial)
    act(() => {
      result.current.handleArrivalSequence()
    })

    expect(cancelledToast()).toBe(false)
    expect(store.state.player.fame).toBe(500)
    expect(store.state.currentScene).toBe(GAME_PHASES.PRE_GIG)
    expect(store.state.currentGig?.id).toBe(GIG.venue.id)
  })

  test('a band the tick drops below the threshold can lose the show', () => {
    const initial = gigArrivalState({ harmony: 20, consecutiveBadShows: 5 })
    const postTick = gameReducer(initial, advanceDay(initial))
    // Above the threshold before the tick, below it after.
    expect(postTick.band.harmony).toBeLessThan(
      BALANCE_CONSTANTS.LOW_HARMONY_THRESHOLD
    )

    const { result } = renderArrival(initial, () => 0)
    act(() => {
      result.current.handleArrivalSequence()
    })

    expect(cancelledToast()).toBe(true)
    expect(store.state.currentGig).toBeFalsy()
    expect(store.state.player.fame).toBe(
      postTick.player.fame - BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG * 2
    )
    expect(spies.changeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
  })

  test('a gig evaluation that throws is reported and falls back to the map', () => {
    const initial = gigArrivalState({ harmony: 20, consecutiveBadShows: 5 })
    const { result } = renderArrival(initial, () => {
      throw new Error('boom')
    })

    expect(() =>
      act(() => {
        result.current.handleArrivalSequence()
      })
    ).not.toThrow()

    expect(spies.addToast).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String)
    )
    expect(store.state.currentGig).toBeFalsy()
    expect(spies.changeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
    expect(spies.changeScene).toHaveBeenCalledTimes(1)
  })

  test('a cancelled show saves after its fame penalty has committed', () => {
    const initial = gigArrivalState({ harmony: 20, consecutiveBadShows: 5 })

    const { result } = renderArrival(initial, () => 0)
    act(() => {
      result.current.handleArrivalSequence()
    })

    // The penalty is dispatched inside the routing effect, so an immediate
    // saveGame would still see the pre-penalty fame.
    expect(cancelledToast()).toBe(true)
    expect(spies.saveGame).not.toHaveBeenCalled()
    expect(spies.saveGameAfterStateCommit).toHaveBeenCalledTimes(1)
  })
})

describe('START_GIG on a converted current node', () => {
  const GIG = {
    id: 'node_gig',
    type: 'GIG',
    layer: 1,
    x: 10,
    y: 10,
    venue: { id: 'berlin_so36', name: 'SO36' }
  }
  const gigState = arrivedOverlay => {
    const base = createInitialState()
    return {
      ...base,
      currentScene: GAME_PHASES.OVERWORLD,
      gameMap: {
        nodes: { [GIG.id]: GIG },
        connections: [],
        layers: [[GIG.id]]
      },
      player: { ...base.player, currentNodeId: GIG.id },
      expedition: { ...base.expedition, arrivedOverlay }
    }
  }

  test('is rejected by the reducer', () => {
    const state = gigState({
      nodeId: GIG.id,
      subtype: 'UNDERGROUND_MARKET',
      source: 'ghost_route'
    })
    const next = gameReducer(state, createStartGigAction(GIG.venue))
    expect(next).toBe(state)
  })

  test('an ordinary unplayed gig node still starts', () => {
    const state = gigState(null)
    const next = gameReducer(state, createStartGigAction(GIG.venue))
    expect(next.currentScene).toBe(GAME_PHASES.PRE_GIG)
    expect(next.currentGig?.id).toBe(GIG.venue.id)
  })
})

describe('a Ghost Route conversion that survives a real LOAD_GAME', () => {
  const HEADLINER = {
    finalizedExpeditionRuns: 5,
    completedExpeditionRuns: 5,
    completedExpeditionRegionIds: ['home_turf', 'festival_fields']
  }

  /**
   * Finds a Ghost Route detour the run can actually take: a Gig the seeded
   * derivation picks from a reachable node, so the conversion has a base Gig to
   * be taken for. Nothing is hard-coded: the map and seed decide.
   *
   * @param {number} runSeed - The run's seed.
   * @param {import('../../src/types/expedition').ExpeditionMap} map - The run's canonical route.
   * @returns {{ path: string[], predecessor: string, predecessorStep: number, target: string }}
   *   The path from the start to the predecessor (both included), the
   *   predecessor, its route step and the detour target.
   */
  const findGhostRouteFixture = (runSeed, map) => {
    const queue = [{ nodeId: map.startNodeId, path: [map.startNodeId] }]
    const seen = new Set([map.startNodeId])
    for (let head = 0; head < queue.length; head++) {
      const entry = queue[head]
      if (!entry) continue
      const { nodeId, path } = entry
      const outgoing = map.connections.filter(edge => edge.from === nodeId)
      if (Object.hasOwn(map.meta, nodeId)) {
        const step = map.meta[nodeId]?.routeStep
        const target =
          typeof step === 'number'
            ? deriveExpeditionGhostRouteTargetFrom(nodeId, step, runSeed, map)
            : null
        const node =
          target !== null && Object.hasOwn(map.nodes, target)
            ? map.nodes[target]
            : null
        const subtype =
          target !== null && Object.hasOwn(map.meta, target)
            ? map.meta[target]?.specialSubtype
            : undefined
        const hasVenue =
          node?.venue !== undefined &&
          node.venue !== null &&
          Object.keys(node.venue).length > 0
        if (
          typeof step === 'number' &&
          target !== null &&
          node?.type === 'GIG' &&
          hasVenue &&
          subtype !== undefined &&
          subtype !== 'UNDERGROUND_MARKET' &&
          subtype !== 'BLACK_MARKET' &&
          outgoing.some(edge => edge.to === target)
        ) {
          return { path, predecessor: nodeId, predecessorStep: step, target }
        }
      }
      for (const edge of outgoing) {
        if (seen.has(edge.to)) continue
        seen.add(edge.to)
        queue.push({ nodeId: edge.to, path: [...path, edge.to] })
      }
    }
    throw new Error(
      `No reachable node derives a Ghost Route detour onto a Gig for seed ${runSeed}`
    )
  }

  const advanceRoute = (state, nodeId) => {
    const next = gameReducer(state, {
      type: ActionTypes.ADVANCE_EXPEDITION_ROUTE,
      payload: { nodeId, expectedRouteStep: state.expedition.routeStep }
    })
    // A refused advance returns the same state; the fixture must not go on.
    expect(next).not.toBe(state)
    return next
  }

  /**
   * Owns Ghost Route at Headliner rank and corners the run with Authority
   * pressure, mirroring `owning` and `cornered` in
   * tests/node/expeditionLegendaries.test.js.
   */
  const ownedAndCornered = state => ({
    ...state,
    career: { ...state.career, ...HEADLINER, legendaryIds: ['ghost_route'] },
    player: {
      ...state.player,
      money: 0,
      van: { ...state.player.van, fuel: 0 }
    },
    expedition: {
      ...state.expedition,
      pressure: { ...state.expedition.pressure, heat: 95 },
      cargo: { ...state.expedition.cargo, contraband: [] },
      loadout: { ...state.expedition.loadout, crewIds: [] },
      activeObligations: [
        { id: 'o1', sourceType: 'native', status: 'active' },
        { id: 'o2', sourceType: 'native', status: 'active' }
      ]
    }
  })

  /** The overlay a reload must still carry, reached only through real saves. */
  const loadedGhostRouteState = () => {
    const base = startedState({ money: 5000 })
    const fixture = findGhostRouteFixture(base.runSeed, fixtureMap())

    let state = base
    for (const nodeId of fixture.path.slice(1)) {
      state = advanceRoute(state, nodeId)
    }
    expect(state.expedition.routeStep).toBe(fixture.predecessorStep)
    state = ownedAndCornered(state)
    const escaped = advanceRoute(state, fixture.target)

    const overlay = {
      nodeId: fixture.target,
      subtype: 'UNDERGROUND_MARKET',
      source: 'ghost_route'
    }
    expect(escaped.expedition.arrivedOverlay).toEqual(overlay)
    expect(escaped.expedition.consumedLegendaryIds).toContain('ghost_route')
    expect(escaped.expedition.visitedNodeIds.at(-1)).toBe(fixture.target)

    // The save path the game uses: persist, serialize, parse, whitelist, load.
    const persisted = createPersistedState(escaped, createFixedClock(1000))
    const parsed = JSON.parse(JSON.stringify(persisted))
    const payload = createRawLoadPayload(parsed, parsed.unlocks ?? [])
    const loaded = gameReducer(
      createInitialState(),
      createLoadGameAction(payload)
    )
    return { loaded, fixture, overlay }
  }

  test('the load keeps the overlay and the base Gig behind it', () => {
    const { loaded, fixture, overlay } = loadedGhostRouteState()

    expect(loaded.expedition.status).toBe('active')
    expect(loaded.expedition.arrivedOverlay).toEqual(overlay)
    expect(loaded.player.currentNodeId).toBe(fixture.target)
    expect(loaded.expedition.visitedNodeIds.at(-1)).toBe(fixture.target)
    const targetNode = loaded.gameMap?.nodes[fixture.target]
    expect(targetNode?.type).toBe('GIG')
    expect(targetNode?.venue).toBeTruthy()
    // The load hard-sets the scene; nothing else about it is changed here.
    expect(loaded.currentScene).toBe(GAME_PHASES.OVERWORLD)
    expect(loaded.minigame?.active).toBe(false)
    expect(loaded.minigame?.targetDestination ?? null).toBeNull()
  })

  test('arrival routes it as a special stop and never books the base Gig', () => {
    const { loaded } = loadedGhostRouteState()
    const gigBefore = loaded.currentGig

    const { result } = renderArrival(loaded)
    act(() => {
      result.current.handleArrivalSequence()
    })

    expect(spies.startGig).not.toHaveBeenCalled()
    const categories = spies.triggerEvent.mock.calls.map(
      ([category]) => category
    )
    expect(categories).toContain('special')
    expect(spies.changeScene).not.toHaveBeenCalledWith(GAME_PHASES.PRE_GIG)
    expect(store.state.currentScene).not.toBe(GAME_PHASES.PRE_GIG)
    expect(store.state.currentGig).toEqual(gigBefore)
    expect(store.state.expedition.arrivedOverlay).toEqual(
      loaded.expedition.arrivedOverlay
    )
  })

  test('the same node without the overlay books its Gig (positive control)', () => {
    const { loaded, fixture } = loadedGhostRouteState()
    const control = {
      ...loaded,
      expedition: { ...loaded.expedition, arrivedOverlay: null }
    }

    const { result } = renderArrival(control)
    act(() => {
      result.current.handleArrivalSequence()
    })

    const venue = loaded.gameMap?.nodes[fixture.target]?.venue
    expect(spies.startGig).toHaveBeenCalledWith(
      expect.objectContaining({ id: venue?.id })
    )
    const categories = spies.triggerEvent.mock.calls.map(
      ([category]) => category
    )
    expect(categories).not.toContain('special')
  })
})
