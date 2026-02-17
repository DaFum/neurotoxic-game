import { mock } from 'node:test'

export const mockAudioContextCalls = {
  startAmbientCalls: [],
  ensureAudioContextCalls: []
}

export const resetMockAudioContextCalls = () => {
  mockAudioContextCalls.startAmbientCalls.length = 0
  mockAudioContextCalls.ensureAudioContextCalls.length = 0
}

export const mockAudioManager = {
  ensureAudioContext: async () => {
    mockAudioContextCalls.ensureAudioContextCalls.push(true)
  },
  startAmbient: async () => {
    mockAudioContextCalls.startAmbientCalls.push(true)
  }
}

export const createMockGameState = ({ canLoad } = {}) => ({
  changeScene: () => {},
  loadGame: () => Boolean(canLoad),
  addToast: () => {},
  player: { money: 100, currentNodeId: 'node_0_0' },
  updatePlayer: () => {},
  band: { harmony: 3 },
  updateBand: () => {},
  social: {},
  settings: { crtEnabled: false },
  updateSettings: () => {},
  deleteSave: () => {},
  setlist: [],
  setSetlist: () => {},
  resetState: () => {}
})

export const setupMainMenuAudioTest = async () => {
  mock.module('../src/utils/AudioManager', {
    namedExports: { audioManager: mockAudioManager }
  })

  mock.module('../src/hooks/useAudioControl', {
    namedExports: {
      useAudioControl: () => ({
        audioState: { isMuted: false },
        handleAudioChange: () => {}
      })
    }
  })

  // We need to return a mutable object for useGameState so we can update it in tests if needed,
  // but for these tests a static return is fine, or we can use a mock function.
  // Using a mock function allows for flexibility.
  const mockUseGameState = mock.fn(() => createMockGameState({ canLoad: true }))

  mock.module('../src/context/GameState', {
    namedExports: {
      useGameState: mockUseGameState
    }
  })

  const { MainMenu } = await import('../src/scenes/MainMenu.jsx')

  return { MainMenu, mockUseGameState }
}
