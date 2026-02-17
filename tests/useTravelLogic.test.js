import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import {
  mockTravelLogicDependencies,
  createTravelLogicProps,
  setupTravelLogicTest,
  assertActionSuccess,
  assertTravelPrevented,
  setupTravelScenario
} from './useTravelLogicTestUtils.js'

const {
  mockCalculateTravelExpenses,
  mockAudioManager,
  mockLogger,
  mockHandleError
} = mockTravelLogicDependencies

const { useTravelLogic } = await setupTravelLogicTest()

describe('useTravelLogic', () => {
  beforeEach(() => {
    mockCalculateTravelExpenses.mock.resetCalls()
    mockCalculateTravelExpenses.mock.mockImplementation(() => ({
      dist: 100,
      totalCost: 50,
      fuelLiters: 10
    }))
    mockAudioManager.playSFX.mock.resetCalls()
    mockLogger.info.mock.resetCalls()
    mockLogger.error.mock.resetCalls()
    mockHandleError.mock.resetCalls()

    setupJSDOM()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('initial state', () => {
    const props = createTravelLogicProps()
    const { result } = renderHook(() => useTravelLogic(props))

    assert.equal(result.current.isTraveling, false)
    assert.equal(result.current.travelTarget, null)
  })

  test('handleTravel initiates travel when valid', () => {
    const { result, targetNode } = setupTravelScenario(useTravelLogic)

    act(() => {
      result.current.handleTravel(targetNode)
    })

    assert.equal(result.current.isTraveling, true)
    assert.deepEqual(result.current.travelTarget, targetNode)
    assert.equal(mockAudioManager.playSFX.mock.calls.length, 1)
    assert.equal(mockAudioManager.playSFX.mock.calls[0].arguments[0], 'travel')
  })

  test('handleTravel prevents travel if insufficient funds', () => {
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic, {
      player: { ...createTravelLogicProps().player, money: 10 }
    })

    act(() => {
      result.current.handleTravel(targetNode)
    })

    assertTravelPrevented(result, props, /Not enough money/)
  })

  test('handleTravel prevents travel if insufficient fuel', () => {
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic, {
      player: {
        ...createTravelLogicProps().player,
        van: { ...createTravelLogicProps().player.van, fuel: 5 }
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

    // Start travel
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
    const { result, props } = setupTravelScenario(useTravelLogic, {
      player: {
        ...createTravelLogicProps().player,
        money: 1000,
        van: { fuel: 50 }
      }
    })
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
    const { result, props } = setupTravelScenario(useTravelLogic, {
      player: {
        ...createTravelLogicProps().player,
        money: 1000,
        van: { condition: 80 }
      }
    })
    // Missing 20 condition. Price is 5 per unit. Cost = 100.

    act(() => {
      result.current.handleRepair()
    })

    assertActionSuccess(props, mockAudioManager, updateArg => {
      assert.equal(updateArg.money, 900)
      assert.equal(updateArg.van.condition, 100)
    })
  })
})
