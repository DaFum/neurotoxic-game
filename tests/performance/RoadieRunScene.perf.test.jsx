import React from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { render, act, cleanup } from '@testing-library/react'

// Mocks
const mockChangeScene = vi.fn()
const mockUpdate = vi.fn()
const mockMove = vi.fn()

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
vi.mock('../../src/context/GameState', () => ({
  useGameState: mockUseGameState
}))
vi.mock('../../src/hooks/minigames/useRoadieLogic', () => ({
  useRoadieLogic: mockUseRoadieLogic
}))
vi.mock('../../src/components/stage/RoadieStageController', () => ({
  createRoadieStageController: () => ({ destroy: () => {} })
}))
vi.mock('../../src/components/PixiStage', () => ({
  PixiStage: () => React.createElement('div', { 'data-testid': 'pixi-stage' })
}))
// Dynamic import
const { RoadieRunScene } = await import('../../src/scenes/RoadieRunScene.jsx')

describe('RoadieRunScene Performance', () => {
  beforeEach(() => {
    //  removed (handled by vitest env)
    mockUiState = { ...mockUiState }
    mockMove.mockReset()
  })

  afterEach(() => {
    cleanup()

    vi.clearAllMocks()
  })

  test('button handlers should be referentially stable across re-renders', async () => {
    const { getByText, rerender } = render(React.createElement(RoadieRunScene))

    const upButton = getByText('▲')
    const leftButton = getByText('◄')

    // Verify initial call works
    await act(async () => {
      upButton.click()
    })
    expect(mockMove.mock.calls.length).toBe(1)
    expect(mockMove.mock.calls[0]).toEqual([0, -1])

    // Trigger re-render by changing uiState
    mockUiState = { ...mockUiState, itemsRemaining: 2 }
    rerender(React.createElement(RoadieRunScene))

    // Verify second call works
    await act(async () => {
      leftButton.click()
    })
    expect(mockMove.mock.calls.length).toBe(2)
    expect(mockMove.mock.calls[1]).toEqual([-1, 0])
  })
})
