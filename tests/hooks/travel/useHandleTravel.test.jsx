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

const renderTravel = expeditionStatus => {
  const state = createInitialState()
  const player = {
    ...state.player,
    currentNodeId: START.id,
    money: 5000,
    van: { ...state.player.van, fuel: 100, condition: 100 }
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
        expeditionStatus,
        expeditionDraftPending: false
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
})
