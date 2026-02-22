import { mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook } from '@testing-library/react'

// Mocks
const mockGameState = {
  advanceDay: mock.fn(),
  saveGame: mock.fn(),
  updateBand: mock.fn(),
  triggerEvent: mock.fn(),
  startGig: mock.fn(),
  changeScene: mock.fn(),
  addToast: mock.fn(),
  band: { harmony: 50, harmonyRegenTravel: false, members: [] },
  gameMap: { nodes: {} },
  player: { currentNodeId: 'node_start' }
}

const mockUseGameState = mock.fn(() => mockGameState)

// Helper to update mock state
export const setMockGameState = (overrides) => {
  Object.assign(mockGameState, overrides)
}

export const resetMockGameState = () => {
  mockGameState.advanceDay.mock.resetCalls()
  mockGameState.saveGame.mock.resetCalls()
  mockGameState.updateBand.mock.resetCalls()
  mockGameState.triggerEvent.mock.resetCalls()
  mockGameState.startGig.mock.resetCalls()
  mockGameState.changeScene.mock.resetCalls()
  mockGameState.addToast.mock.resetCalls()

  mockGameState.band = { harmony: 50, harmonyRegenTravel: false, members: [] }
  mockGameState.gameMap = { nodes: {} }
  mockGameState.player = { currentNodeId: 'node_start' }
}

// Mock modules
mock.module('../src/context/GameState.js', {
  namedExports: {
    useGameState: mockUseGameState
  }
})

// Mock utils
mock.module('../src/utils/gameStateUtils.js', {
  namedExports: {
    clampBandHarmony: (val) => Math.min(100, Math.max(0, val))
  }
})

export const setupArrivalLogicTest = async () => {
  const { useArrivalLogic } = await import('../src/hooks/useArrivalLogic.js')
  return { useArrivalLogic, mockGameState }
}

export const setupArrivalScenario = (useArrivalLogic, stateOverrides = {}) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error(
      'setupArrivalScenario requires a DOM environment. Please call setupJSDOM() before running this test.'
    )
  }

  resetMockGameState()
  setMockGameState(stateOverrides)

  const { result } = renderHook(() => useArrivalLogic())

  return { result, mockGameState }
}
