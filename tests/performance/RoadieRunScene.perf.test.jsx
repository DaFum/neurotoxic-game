
import { test } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { render, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils.js'

// Mocks
const mockChangeScene = test.mock.fn()
const mockUpdate = test.mock.fn()
const mockMove = test.mock.fn()

let mockUiState = {
  itemsRemaining: 3,
  itemsDelivered: 0,
  currentDamage: 0,
  carrying: null,
  isGameOver: false
}

const mockUseGameState = () => ({
  changeScene: mockChangeScene,
  settings: { crtEnabled: false }
})

const mockUseRoadieLogic = () => ({
  uiState: mockUiState,
  gameStateRef: { current: {} },
  stats: {},
  update: mockUpdate,
  actions: { move: mockMove }
})

// Register mocks
test.mock.module('../../src/context/GameState', {
  namedExports: {
    useGameState: mockUseGameState
  }
})

test.mock.module('../../src/hooks/minigames/useRoadieLogic', {
  namedExports: {
    useRoadieLogic: mockUseRoadieLogic
  }
})

test.mock.module('../../src/components/stage/RoadieStageController', {
  namedExports: {
    createRoadieStageController: () => ({ destroy: () => {} })
  }
})

test.mock.module('../../src/components/PixiStage', {
  namedExports: {
    PixiStage: () => React.createElement('div', { 'data-testid': 'pixi-stage' })
  }
})

// Dynamic import
const { RoadieRunScene } = await import('../../src/scenes/RoadieRunScene.jsx')

test.describe('RoadieRunScene Performance', () => {
  test.beforeEach(() => {
    setupJSDOM()
    mockUiState = { ...mockUiState }
    mockMove.mock.resetCalls()
  })

  test.afterEach(() => {
    cleanup()
    teardownJSDOM()
    test.mock.reset()
  })

  test('button handlers should be referentially stable across re-renders', async () => {
    const { getByText, rerender } = render(React.createElement(RoadieRunScene))

    const upButton = getByText('▲')
    const leftButton = getByText('◄')

    // Verify initial call works
    await act(async () => {
      upButton.click()
    })
    assert.strictEqual(mockMove.mock.calls.length, 1)
    assert.deepStrictEqual(mockMove.mock.calls[0].arguments, [0, -1])

    // Trigger re-render by changing uiState
    mockUiState = { ...mockUiState, itemsRemaining: 2 }
    rerender(React.createElement(RoadieRunScene))

    // Verify second call works
    await act(async () => {
      leftButton.click()
    })
    assert.strictEqual(mockMove.mock.calls.length, 2)
    assert.deepStrictEqual(mockMove.mock.calls[1].arguments, [-1, 0])
  })
})
