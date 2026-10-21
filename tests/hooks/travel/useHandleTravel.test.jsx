import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useHandleTravel } from '../../../src/hooks/travel/actions/useHandleTravel'
import { createInitialState } from '../../../src/context/initialState'

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
    onShowSupplyStop
  } = {}
) => {
  const state = createInitialState()
  const player = {
    ...state.player,
    currentNodeId,
    money: 5000,
    van: { ...state.player.van, fuel, condition: 100 }
  }
  const setPendingTravelNode = vi.fn()
  const addToast = vi.fn()
  const startTravelSequence = vi.fn()
  const refs = {
    isTravelingRef: { current: false },
    playerRef: { current: player },
    bandRef: { current: state.band },
    assetsRef: { current: state.assets },
    liabilitiesRef: { current: state.liabilities },
    socialRef: { current: state.social },
    gameMapRef: { current: buildMap() },
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
        expeditionFuelMultiplier
      },
      getLocationName: name => name ?? '',
      handleNodeArrivalCallback: vi.fn(),
      clearPendingTravel: vi.fn(),
      startTravelSequence
    })
  )
  return { handleTravel: result.current, setPendingTravelNode, addToast }
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
    const idle = renderTravel('idle', {
      fuel: 100,
      expeditionFuelMultiplier: 1000
    })
    idle.handleTravel(TWO_STEPS_AHEAD)
    // Dimmed by the Career visibility rule, never by a fuel refusal.
    expect(toastKeys(idle.addToast).join('|')).not.toMatch(/fuel/i)
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
