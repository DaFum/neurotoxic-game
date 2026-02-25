import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import {
  setupTravelLogicTest,
  createTravelLogicProps,
  mockTravelLogicDependencies
} from './useTravelLogicTestUtils.js'

const { mockCalculateTravelExpenses } = mockTravelLogicDependencies

// Top-level await is supported in modules
const { useTravelLogic } = await setupTravelLogicTest()

describe('useTravelLogic Performance', () => {
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

  test('handleTravel remains referentially stable when player money changes', () => {
    const initialProps = createTravelLogicProps({
      player: { money: 1000, currentNodeId: 'node_start', van: { fuel: 100 } }
    })

    const { result, rerender } = renderHook(props => useTravelLogic(props), {
      initialProps
    })

    const initialHandleTravel = result.current.handleTravel

    // Update player money but keep everything else same (especially function props)
    const newProps = {
      ...initialProps,
      player: { ...initialProps.player, money: 900 }
    }

    rerender(newProps)

    const nextHandleTravel = result.current.handleTravel

    // This assertion captures the performance issue.
    // Ideally, handleTravel should be stable.
    assert.strictEqual(
      nextHandleTravel,
      initialHandleTravel,
      'handleTravel should be referentially stable when only unrelated player stats change'
    )
  })
})
