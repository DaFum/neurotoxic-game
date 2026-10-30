import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useHandleTravel } from '../../../src/hooks/travel/actions/useHandleTravel'
import { createInitialState } from '../../../src/context/initialState'
import { activateGamepadElement } from '../../../src/utils/gamepad/navigation'

// Expedition overlay edges (the Nemesis Key's two-step jump) reach a node the
// layer rule would still dim. The route authorizes the move, so a connected
// node is travelable in a run, while the Career map keeps its visibility rule.
const START = { id: 'node_0', type: 'START', layer: 0, x: 10, y: 50 }
const TWO_STEPS_AHEAD = {
  id: 'node_2',
  type: 'SPECIAL',
  layer: 2,
  x: 60,
  y: 50
}
const UNCONNECTED = { id: 'node_2b', type: 'SPECIAL', layer: 2, x: 60, y: 20 }

const buildMap = () => ({
  nodes: {
    [START.id]: START,
    [TWO_STEPS_AHEAD.id]: TWO_STEPS_AHEAD,
    [UNCONNECTED.id]: UNCONNECTED
  },
  nodeList: [],
  // The overlay edge skips layer 1 entirely.
  connections: [{ from: START.id, to: TWO_STEPS_AHEAD.id }],
  layers: [[START.id], [], [TWO_STEPS_AHEAD.id, UNCONNECTED.id]]
})

const renderTravel = (
  expeditionStatus,
  {
    fuel = 100,
    expeditionFuelMultiplier,
    currentNodeId = START.id,
    onShowSupplyStop,
    money = 5000,
    expeditionProtectedCash,
    expeditionArrivedOverlay,
    lastGigNodeId,
    gameMap = buildMap()
  } = {}
) => {
  const state = createInitialState()
  const player = {
    ...state.player,
    currentNodeId,
    ...(lastGigNodeId === undefined ? {} : { lastGigNodeId }),
    money,
    van: { ...state.player.van, fuel, condition: 100 }
  }
  const setPendingTravelNode = vi.fn()
  const addToast = vi.fn()
  const startTravelSequence = vi.fn()
  const handleNodeArrivalCallback = vi.fn()
  const refs = {
    isTravelingRef: { current: false },
    playerRef: { current: player },
    bandRef: { current: state.band },
    assetsRef: { current: state.assets },
    liabilitiesRef: { current: state.liabilities },
    socialRef: { current: state.social },
    gameMapRef: { current: gameMap },
    reputationByRegionRef: { current: {} },
    venueBlacklistRef: { current: [] },
    pendingTravelNodeRef: { current: null },
    pendingTimeoutRef: { current: null }
  }
  const { result } = renderHook(() =>
    useHandleTravel({
      refs,
      setters: { setPendingTravelNode },
      params: {
        addToast,
        onShowHQ: vi.fn(),
        onShowSupplyStop,
        expeditionStatus,
        expeditionDraftPending: false,
        expeditionFuelMultiplier,
        expeditionProtectedCash,
        expeditionArrivedOverlay
      },
      getLocationName: name => name ?? '',
      handleNodeArrivalCallback,
      clearPendingTravel: vi.fn(),
      startTravelSequence
    })
  )
  return {
    handleTravel: result.current,
    setPendingTravelNode,
    addToast,
    startTravelSequence,
    handleNodeArrivalCallback,
    refs
  }
}

const toastKeys = addToast =>
  addToast.mock.calls.map(([message]) => String(message))

describe('useHandleTravel overlay override', () => {
  // A successful call schedules the hook's real five-second confirmation
  // timeout; fake timers keep it from holding the worker open.
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  test('a connected node two layers ahead is travelable in an active run', () => {
    const { handleTravel, setPendingTravelNode } = renderTravel('active')
    handleTravel(TWO_STEPS_AHEAD)
    expect(setPendingTravelNode).toHaveBeenCalledWith(TWO_STEPS_AHEAD)
  })

  test('controller confirmation selects once before starting travel', () => {
    const { handleTravel, setPendingTravelNode, startTravelSequence } =
      renderTravel('active')
    const node = document.createElement('button')
    node.addEventListener('click', () => handleTravel(TWO_STEPS_AHEAD))
    activateGamepadElement(node)
    expect(setPendingTravelNode).toHaveBeenCalledTimes(1)
    expect(startTravelSequence).not.toHaveBeenCalled()
    activateGamepadElement(node)
    expect(startTravelSequence).toHaveBeenCalledTimes(1)
  })

  test('the same connected node stays dimmed outside a run', () => {
    const { handleTravel, setPendingTravelNode, addToast } =
      renderTravel('idle')
    handleTravel(TWO_STEPS_AHEAD)
    expect(setPendingTravelNode).not.toHaveBeenCalled()
    expect(toastKeys(addToast).join('|')).toMatch(/not visible/i)
  })

  test('an unconnected node two layers ahead is refused in an active run', () => {
    const { handleTravel, setPendingTravelNode, addToast } =
      renderTravel('active')
    handleTravel(UNCONNECTED)
    expect(setPendingTravelNode).not.toHaveBeenCalled()
    expect(toastKeys(addToast).join('|')).toMatch(/not connected/i)
  })

  test('quotes the effective expedition fuel multiplier in the resource gate', () => {
    // A free-fuel chassis makes a leg affordable on an empty tank, and a
    // punishing one rejects it on a full tank, matching settlement.
    const free = renderTravel('active', {
      fuel: 0,
      expeditionFuelMultiplier: 0
    })
    free.handleTravel(TWO_STEPS_AHEAD)
    expect(free.setPendingTravelNode).toHaveBeenCalledWith(TWO_STEPS_AHEAD)

    const neutral = renderTravel('active', { fuel: 0 })
    neutral.handleTravel(TWO_STEPS_AHEAD)
    expect(neutral.setPendingTravelNode).not.toHaveBeenCalled()

    const heavy = renderTravel('active', {
      fuel: 100,
      expeditionFuelMultiplier: 1000
    })
    heavy.handleTravel(TWO_STEPS_AHEAD)
    expect(heavy.setPendingTravelNode).not.toHaveBeenCalled()
  })

  test('ignores the expedition fuel multiplier outside a run', () => {
    // START is visible and connected from here, so travel reaches the
    // resource check, which a 1000x multiplier would fail if it leaked in.
    const idle = renderTravel('idle', {
      fuel: 100,
      expeditionFuelMultiplier: 1000,
      currentNodeId: TWO_STEPS_AHEAD.id
    })
    idle.handleTravel(START)
    expect(idle.setPendingTravelNode).toHaveBeenCalledWith(START)
  })

  test('clicking the current supply stop reopens its persisted shop', () => {
    const inventory = [{ id: 'item_1', name: 'Snack', cost: 5 }]
    const stop = {
      id: 'node_stop',
      type: 'SUPPLY_STOP',
      layer: 1,
      x: 30,
      y: 50,
      shopInventory: inventory
    }
    const onShowSupplyStop = vi.fn()
    const { handleTravel, setPendingTravelNode } = renderTravel('active', {
      currentNodeId: stop.id,
      onShowSupplyStop
    })
    handleTravel(stop)
    expect(onShowSupplyStop).toHaveBeenCalledWith(inventory)
    expect(setPendingTravelNode).not.toHaveBeenCalled()
  })
})

describe('useHandleTravel expedition cash and overlay gates', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  test('a leg costing more than the spendable slice is refused, not started', () => {
    // 10000 Cash with 9999 protected leaves 1 spendable; any leg costs more.
    const {
      handleTravel,
      setPendingTravelNode,
      startTravelSequence,
      addToast,
      refs
    } = renderTravel('active', { money: 10000, expeditionProtectedCash: 9999 })
    handleTravel(TWO_STEPS_AHEAD)
    refs.pendingTravelNodeRef.current = TWO_STEPS_AHEAD
    handleTravel(TWO_STEPS_AHEAD)
    expect(setPendingTravelNode).not.toHaveBeenCalled()
    expect(startTravelSequence).not.toHaveBeenCalled()
    expect(toastKeys(addToast).join('|')).toMatch(/not enough money/i)
  })

  test('the same wallet with no protected slice may travel', () => {
    const { handleTravel, setPendingTravelNode } = renderTravel('active', {
      money: 10000,
      expeditionProtectedCash: 0
    })
    handleTravel(TWO_STEPS_AHEAD)
    expect(setPendingTravelNode).toHaveBeenCalledWith(TWO_STEPS_AHEAD)
  })

  const GIG_HERE = {
    id: 'node_gig',
    type: 'GIG',
    layer: 0,
    x: 10,
    y: 50,
    venue: { id: 'berlin_so36', name: 'SO36' }
  }
  const gigMap = () => ({
    nodes: { [GIG_HERE.id]: GIG_HERE },
    nodeList: [],
    connections: [],
    layers: [[GIG_HERE.id]]
  })

  test('re-entering a gig node a persisted overlay converted books no show', () => {
    // After a reload only the persisted `expedition.arrivedOverlay` remains.
    const { handleTravel, handleNodeArrivalCallback, addToast } = renderTravel(
      'active',
      {
        currentNodeId: GIG_HERE.id,
        gameMap: gigMap(),
        expeditionArrivedOverlay: {
          nodeId: GIG_HERE.id,
          subtype: 'UNDERGROUND_MARKET',
          source: 'ghost_route'
        }
      }
    )
    handleTravel(GIG_HERE)
    expect(handleNodeArrivalCallback).not.toHaveBeenCalled()
    expect(toastKeys(addToast).join('|')).toMatch(/you are at/i)
  })

  test('re-entering an ordinary unplayed gig node still starts it', () => {
    const { handleTravel, handleNodeArrivalCallback } = renderTravel('active', {
      currentNodeId: GIG_HERE.id,
      gameMap: gigMap(),
      expeditionArrivedOverlay: null
    })
    handleTravel(GIG_HERE)
    expect(handleNodeArrivalCallback).toHaveBeenCalledTimes(1)
    expect(handleNodeArrivalCallback.mock.calls[0][0].type).toBe('GIG')
  })
})
