import { test, describe, before, after, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils'
import {
  mockTravelLogicDependencies,
  createTravelLogicProps,
  setupTravelLogicTest,
  assertActionSuccess,
  assertTravelPrevented,
  setupTravelScenario
} from '../useTravelLogicTestUtils'

const {
  mockCalculateTravelExpenses,
  mockAudioManager,
  mockCalculateGuaranteedDailyCost,
  mockLogger,
  mockHandleError,
  setEnsureAudioContextResult
} = mockTravelLogicDependencies

const { useTravelLogic } = await setupTravelLogicTest()

describe('useTravelLogic', () => {
  before(() => {
    setupJSDOM()
  })

  after(() => {
    teardownJSDOM()
  })

  beforeEach(() => {
    mockCalculateTravelExpenses.mock.resetCalls()
    mockCalculateGuaranteedDailyCost.mock.resetCalls()
    mockCalculateTravelExpenses.mock.mockImplementation(() => ({
      dist: 100,
      totalCost: 50,
      fuelLiters: 10
    }))
    setEnsureAudioContextResult(true)
    mockAudioManager.ensureAudioContext.mock.resetCalls()
    mockAudioManager.playSFX.mock.resetCalls()
    mockLogger.info.mock.resetCalls()
    mockLogger.warn.mock.resetCalls()
    mockLogger.error.mock.resetCalls()
    mockLogger.debug.mock.resetCalls()
    mockHandleError.mock.resetCalls()
  })

  afterEach(() => {
    cleanup()
  })

  test('initial state', () => {
    const props = createTravelLogicProps()
    const { result } = renderHook(() => useTravelLogic(props))

    assert.equal(result.current.isTraveling, false)
    assert.equal(result.current.travelTarget, null)
  })

  test('handleTravel initiates travel when valid', async () => {
    const { result, targetNode } = setupTravelScenario(useTravelLogic)

    // First click: sets pending state
    act(() => {
      result.current.handleTravel(targetNode)
    })

    // Second click: confirms travel
    await act(async () => {
      result.current.handleTravel(targetNode)
      // wait for audio promise
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    assert.equal(result.current.isTraveling, true)
    assert.deepEqual(result.current.travelTarget, targetNode)
    assert.equal(mockAudioManager.playSFX.mock.calls.length, 1)
    assert.equal(mockAudioManager.playSFX.mock.calls[0].arguments[0], 'travel')
  })

  test('handleTravel confirmation includes travel, upkeep, and total cash impact', () => {
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic, {
      player: {
        money: 1000,
        fameLevel: 3,
        currentNodeId: 'node_start',
        van: { fuel: 50, condition: 80 },
        totalTravels: 0
      },
      band: { members: [{}, {}, {}], harmony: 50 }
    })

    act(() => {
      result.current.handleTravel(targetNode)
    })

    const toastMessage = props.addToast.mock.calls[0].arguments[0]
    assert.match(toastMessage, /Travel Costs: 50€/)
    assert.match(toastMessage, /Daily Upkeep: 155€/)
    assert.match(toastMessage, /Total Cash Impact: 205€/)
  })

  test('handleTravel confirmation passes social state into guaranteed daily cost', () => {
    mockCalculateGuaranteedDailyCost.mock.mockImplementation(
      (_player, _band, social = {}) => (social.youtube >= 10000 ? 42 : 155)
    )
    const social = { youtube: 20000 }
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic, {
      player: {
        money: 1000,
        fameLevel: 3,
        currentNodeId: 'node_start',
        van: { fuel: 50, condition: 80 },
        totalTravels: 0
      },
      band: { members: [{}, {}, {}], harmony: 50 },
      social
    })

    act(() => {
      result.current.handleTravel(targetNode)
    })

    assert.equal(
      mockCalculateGuaranteedDailyCost.mock.calls[0].arguments[2],
      social
    )
    const toastMessage = props.addToast.mock.calls[0].arguments[0]
    assert.match(toastMessage, /Daily Upkeep: 42€/)
    assert.match(toastMessage, /Total Cash Impact: 92€/)
  })

  test('onTravelComplete passes social state into guaranteed daily cost', () => {
    mockCalculateGuaranteedDailyCost.mock.mockImplementation(
      (_player, _band, social = {}) => (social.youtube >= 10000 ? 42 : 155)
    )
    const social = { youtube: 20000 }
    const { result, targetNode } = setupTravelScenario(useTravelLogic, {
      player: {
        money: 1000,
        fameLevel: 3,
        currentNodeId: 'node_start',
        van: { fuel: 50, condition: 80 },
        totalTravels: 0
      },
      band: { members: [{}, {}, {}], harmony: 50 },
      social
    })

    act(() => {
      result.current.onTravelComplete(targetNode)
    })

    assert.equal(
      mockCalculateGuaranteedDailyCost.mock.calls[0].arguments[2],
      social
    )
  })

  test('handleTravel skips travel SFX and logs when audio context is unavailable', async () => {
    setEnsureAudioContextResult(false)
    const { result, targetNode } = setupTravelScenario(useTravelLogic, {
      onStartTravelMinigame: () => {}
    })

    act(() => {
      result.current.handleTravel(targetNode)
    })

    await act(async () => {
      result.current.handleTravel(targetNode)
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    assert.equal(mockAudioManager.ensureAudioContext.mock.calls.length, 1)
    assert.equal(mockAudioManager.playSFX.mock.calls.length, 0)
    assert.equal(mockLogger.warn.mock.calls.length, 1)
    assert.deepEqual(mockLogger.warn.mock.calls[0].arguments, [
      'useTravelLogic',
      'Travel audio context unavailable'
    ])
  })

  test('handleTravel prevents travel if insufficient funds', () => {
    const defaults = createTravelLogicProps()
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic, {
      player: { ...defaults.player, money: 10 }
    })

    act(() => {
      result.current.handleTravel(targetNode)
    })

    assertTravelPrevented(result, props, /Not enough money/)
  })

  test('handleTravel prevents travel if insufficient fuel', () => {
    const defaults = createTravelLogicProps()
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic, {
      player: {
        ...defaults.player,
        van: { ...defaults.player.van, fuel: 5 }
      }
    })

    act(() => {
      result.current.handleTravel(targetNode)
    })

    assertTravelPrevented(result, props, /Not enough fuel/)
  })

  test('handleTravel to current node triggers interaction', () => {
    const props = createTravelLogicProps()
    const currentNode = props.gameMap.nodes.node_start
    // node_start is type START, so it should trigger onShowHQ

    const { result } = renderHook(() => useTravelLogic(props))

    act(() => {
      result.current.handleTravel(currentNode)
    })

    assert.equal(result.current.isTraveling, false)
    assert.equal(props.onShowHQ.mock.calls.length, 1)
  })

  test('onTravelComplete updates state and finalizes travel', () => {
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic)

    // Start travel (requires 2 clicks)
    act(() => {
      result.current.handleTravel(targetNode)
    })
    act(() => {
      result.current.handleTravel(targetNode)
    })

    // Complete travel
    act(() => {
      result.current.onTravelComplete()
    })

    assert.equal(result.current.isTraveling, false)
    assert.equal(result.current.travelTarget, null)

    // Check player updates
    assert.equal(props.updatePlayer.mock.calls.length, 1)
    const updateArg = props.updatePlayer.mock.calls[0].arguments[0]
    assert.equal(updateArg.currentNodeId, targetNode.id)
    assert.equal(updateArg.money, 950) // 1000 - 50
    assert.equal(updateArg.van.fuel, 40) // 50 - 10
    assert.equal(updateArg.totalTravels, 1)

    assert.equal(props.advanceDay.mock.calls.length, 1)
    assert.equal(props.saveGame.mock.calls.length, 1)
  })

  test('handleRefuel fills tank and deducts money', () => {
    // Defaults: money 1000, van.fuel 50. Price is 2 per unit.
    const { result, props } = setupTravelScenario(useTravelLogic)
    // Missing 50 fuel. Price is 2 per unit. Cost = 100.

    act(() => {
      result.current.handleRefuel()
    })

    assertActionSuccess(props, mockAudioManager, updateArg => {
      assert.equal(updateArg.money, 900)
      assert.equal(updateArg.van.fuel, 100)
    })
  })

  test('handleRepair fixes van and deducts money', () => {
    // Defaults: money 1000, van.condition 80. Price is 5 per unit.
    const { result, props } = setupTravelScenario(useTravelLogic)
    // Missing 20 condition. Price is 5 per unit. Cost = 100.

    act(() => {
      result.current.handleRepair()
    })

    assertActionSuccess(props, mockAudioManager, updateArg => {
      assert.equal(updateArg.money, 900)
      assert.equal(updateArg.van.condition, 100)
    })
  })

  test('handleRefuel does nothing when traveling', () => {
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic)

    // Start travel to set isTravelingRef.current to true
    act(() => {
      result.current.handleTravel(targetNode)
    })
    act(() => {
      result.current.handleTravel(targetNode)
    })

    assert.equal(result.current.isTraveling, true)

    // Attempt refuel
    act(() => {
      result.current.handleRefuel()
    })

    assert.equal(props.updatePlayer.mock.calls.length, 0)
  })

  test('handleRepair does nothing when traveling', () => {
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic)

    // Start travel
    act(() => {
      result.current.handleTravel(targetNode)
    })
    act(() => {
      result.current.handleTravel(targetNode)
    })

    assert.equal(result.current.isTraveling, true)

    // Attempt repair
    act(() => {
      result.current.handleRepair()
    })

    assert.equal(props.updatePlayer.mock.calls.length, 0)
  })
  test('prevents playing a gig at the same location consecutively', async () => {
    const defaults = createTravelLogicProps()
    const { result, props } = setupTravelScenario(useTravelLogic, {
      player: {
        ...defaults.player,
        currentNodeId: 'node_gig',
        lastGigNodeId: 'node_gig'
      },
      gameMap: {
        connections: [],
        nodes: {
          node_gig: {
            id: 'node_gig',
            type: 'GIG',
            venue: { id: 'venue_1', capacity: 100, name: 'Venue 1' }
          }
        }
      }
    })

    act(() => {
      // Simulate clicking on the current node which is a GIG
      result.current.handleTravel(props.gameMap.nodes.node_gig)
    })

    assert.equal(props.startGig.mock.calls.length, 0)
    assert.equal(props.addToast.mock.calls.length, 1)
    assert.equal(
      props.addToast.mock.calls[0].arguments[0],
      'You just played a gig here! Hit the road and find a new crowd.'
    )
  })

  test('keeps handleTravel stable when player money changes', () => {
    const initialProps = createTravelLogicProps({
      player: { money: 1000, currentNodeId: 'node_start', van: { fuel: 100 } }
    })

    const { result, rerender } = renderHook(props => useTravelLogic(props), {
      initialProps
    })

    const initialHandleTravel = result.current.handleTravel

    rerender({
      ...initialProps,
      player: { ...initialProps.player, money: 900 }
    })

    assert.strictEqual(
      result.current.handleTravel,
      initialHandleTravel,
      'handleTravel should be referentially stable when unrelated player stats change'
    )
  })

  test('keeps handleTravel stable when pendingTravelNode changes', async () => {
    const initialProps = createTravelLogicProps({
      player: { money: 1000, currentNodeId: 'node_start', van: { fuel: 100 } }
    })

    const { result, unmount } = renderHook(() => useTravelLogic(initialProps))

    const initialHandleTravel = result.current.handleTravel
    const targetNode = initialProps.gameMap.nodes.node_target

    await act(async () => {
      initialHandleTravel(targetNode)
    })

    assert.strictEqual(result.current.pendingTravelNode?.id, targetNode.id)
    assert.strictEqual(
      result.current.handleTravel,
      initialHandleTravel,
      'handleTravel should remain stable when pendingTravelNode updates'
    )

    unmount()
  })
})
