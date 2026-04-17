import { vi } from 'vitest'
import { renderHook } from '@testing-library/react'

// Mocks
const mockGameState = {
  advanceDay: vi.fn(),
  saveGame: vi.fn(),
  updateBand: vi.fn(),
  updatePlayer: vi.fn(),
  triggerEvent: vi.fn(),
  startGig: vi.fn(),
  changeScene: vi.fn(),
  addToast: vi.fn(),
  band: { harmony: 50, harmonyRegenTravel: false, members: [] },
  gameMap: { nodes: {} },
  player: { currentNodeId: 'node_start' }
}

const mockUseGameState = vi.fn(() => mockGameState)

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
  mockUseGameState.mockReset()
  mockUseGameState.mockImplementation(() => mockGameState)

  mockGameState.advanceDay.mockReset()
  mockGameState.saveGame.mockReset()
  mockGameState.updateBand.mockReset()
  mockGameState.updatePlayer.mockReset()
  mockGameState.triggerEvent.mockReset()
  mockGameState.startGig.mockReset()
  mockGameState.changeScene.mockReset()
  mockGameState.addToast.mockReset()

  mockGameState.band = { harmony: 50, harmonyRegenTravel: false, members: [] }
  mockGameState.gameMap = { nodes: {} }
  mockGameState.player = { currentNodeId: 'node_start' }
}

// Mock modules - Correct path specifier
vi.mock('../src/context/GameState.tsx', () => ({
  useGameState: mockUseGameState
}))

// Mock utils
vi.mock('../src/utils/gameStateUtils', () => ({
  clampBandHarmony: val => {
    if (!Number.isFinite(val)) return 1
    return Math.max(1, Math.min(100, Math.floor(val)))
  },
  clampMemberStamina: (val, max = 100) => {
    if (!Number.isFinite(val)) return 0
    const resolvedMax = Number.isFinite(max) ? max : 100
    return Math.max(0, Math.min(resolvedMax, Math.floor(val)))
  },
  clampMemberMood: val => {
    if (!Number.isFinite(val)) return 0
    return Math.max(0, Math.min(100, Math.floor(val)))
  },
  clampPlayerFame: val => {
    if (!Number.isFinite(val)) return 0
    return Math.max(0, Math.floor(val))
  },
  calculateFameLevel: val => {
    if (!Number.isFinite(val)) return 0
    return Math.floor(Math.max(0, val) / 100)
  },
  BALANCE_CONSTANTS: {
    FAME_LOSS_BAD_GIG: 12,
    MAX_FAME_GAIN: 500,
    LOW_HARMONY_THRESHOLD: 15,
    LOW_HARMONY_CANCELLATION_CHANCE: 0.25,
    MISS_TOLERANCE: 8,
    MISS_PENALTY_RATE: 1.5,
    MISS_MONEY_PENALTY: 15,
    SPONSORSHIP_PAYOUT_FLOOR: 180,
    SPONSORSHIP_PAYOUT_CAP: 350,
    WEALTH_DRAIN_THRESHOLD: 2000,
    WEALTH_DRAIN_CHANCE: 0.12,
    WEALTH_DRAIN_MIN_RATE: 0.015,
    WEALTH_DRAIN_MAX_RATE: 0.05
  }
}))

export const setupArrivalLogicTest = async () => {
  const { useArrivalLogic } = await import('../src/hooks/useArrivalLogic')
  return { useArrivalLogic, mockGameState }
}

export const setupArrivalScenario = (
  useArrivalLogic,
  stateOverrides = {},
  hookProps = {}
) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error(
      'setupArrivalScenario requires a DOM environment. Please call setupJSDOM() before running this test.'
    )
  }

  resetMockGameState()
  setMockGameState(stateOverrides)

  const { result } = renderHook(() => useArrivalLogic(hookProps))

  return { result, mockGameState }
}
