import { mock } from 'node:test'
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

export const setMockGameState = overrides => {
  // Simple deep merge for known structures or just use overrides if structure is simple
  // For simplicity in tests, we can just assign, but let's be safer
  // Actually, Object.assign is shallow. Let's do a slightly better merge for band/player
  if (overrides.band) {
    Object.assign(mockGameState.band, overrides.band)
    delete overrides.band // handled
  }
  if (overrides.player) {
    Object.assign(mockGameState.player, overrides.player)
    delete overrides.player
  }
  Object.assign(mockGameState, overrides)
}

export const resetMockGameState = () => {
  mockUseGameState.mock.resetCalls()

  mockGameState.advanceDay.mock.resetCalls()
  mockGameState.advanceDay.mock.restore()
  mockGameState.saveGame.mock.resetCalls()
  mockGameState.saveGame.mock.restore()
  mockGameState.updateBand.mock.resetCalls()
  mockGameState.updateBand.mock.restore()
  mockGameState.triggerEvent.mock.resetCalls()
  mockGameState.triggerEvent.mock.restore()
  mockGameState.startGig.mock.resetCalls()
  mockGameState.startGig.mock.restore()
  mockGameState.changeScene.mock.resetCalls()
  mockGameState.changeScene.mock.restore()
  mockGameState.addToast.mock.resetCalls()
  mockGameState.addToast.mock.restore()

  mockGameState.band = { harmony: 50, harmonyRegenTravel: false, members: [] }
  mockGameState.gameMap = { nodes: {} }
  mockGameState.player = { currentNodeId: 'node_start' }
}

// Mock modules - Correct path specifier
mock.module('../src/context/GameState.jsx', {
  namedExports: {
    useGameState: mockUseGameState
  }
})

// Mock utils
mock.module('../src/utils/gameStateUtils.js', {
  namedExports: {
    // Correct clamp: 1 to 100
    clampBandHarmony: val => Math.min(100, Math.max(1, val)),
<<<<<<< jules/add-missing-arrival-logic-tests-14588888633433148622
    clampMemberStamina: (stamina, staminaMax = 100) => {
      if (!Number.isFinite(stamina)) return 0
      const resolvedStaminaMax = Number.isFinite(staminaMax) ? staminaMax : 100
      return Math.max(0, Math.min(resolvedStaminaMax, Math.floor(stamina)))
    },
    clampMemberMood: mood => {
      if (!Number.isFinite(mood)) return 0
      return Math.max(0, Math.min(100, Math.floor(mood)))
    }
=======
    clampMemberStamina: (val, max = 100) => Math.min(max, Math.max(0, val)),
    clampMemberMood: val => Math.min(100, Math.max(0, val))
>>>>>>> main
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
