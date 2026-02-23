import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import {
  setupTravelLogicTest,
  createTravelLogicProps,
  mockTravelLogicDependencies
} from './useTravelLogicTestUtils.js'

const { mockCalculateTravelExpenses } = mockTravelLogicDependencies

// Top-level await is supported in modules
const { useTravelLogic } = await setupTravelLogicTest()

describe('useTravelLogic Optimization', () => {
  beforeEach(() => {
    setupJSDOM()

    // Reset mocks
    mockCalculateTravelExpenses.mock.resetCalls()
    mockCalculateTravelExpenses.mock.mockImplementation(() => ({
      dist: 100,
      totalCost: 50,
      fuelLiters: 10
    }))
  })

  afterEach(() => {
    teardownJSDOM()
  })

  test('handleTravel remains referentially stable when pendingTravelNode changes', async () => {
    const initialProps = createTravelLogicProps({
      player: { money: 1000, currentNodeId: 'node_start', van: { fuel: 100 } }
    })

    const { result, unmount } = renderHook(() => useTravelLogic(initialProps))

    const initialHandleTravel = result.current.handleTravel
    const targetNode = initialProps.gameMap.nodes.node_target

    // Trigger first click to set pendingTravelNode
    await act(async () => {
      initialHandleTravel(targetNode)
    })

    // Verify pending state changed
    assert.strictEqual(result.current.pendingTravelNode?.id, targetNode.id)

    // Verify handleTravel is stable
    const nextHandleTravel = result.current.handleTravel
    assert.strictEqual(
      nextHandleTravel,
      initialHandleTravel,
      'handleTravel should not change when pendingTravelNode updates'
    )

    unmount()
  })
})
