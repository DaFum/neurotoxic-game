import { mock } from 'node:test'

export const mockAudioManager = {
  ensureAudioContext: mock.fn(async () => {}),
  startAmbient: mock.fn(async () => {})
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
  // NOTE: mock.module requires the --experimental-test-module-mocks flag
  mock.module('../src/utils/AudioManager', {
    namedExports: { audioManager: mockAudioManager }
  })

  mock.module('../src/hooks/useAudioControl', {
    namedExports: {
      // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
      useAudioControl: () => ({
        audioState: { isMuted: false },
        handleAudioChange: () => {}
      })
    }
  })

  mock.module('react-i18next', {
    namedExports: {
      useTranslation: () => ({
        t: key => {
          if (key === 'ui:start_game') return 'Start Tour'
          if (key === 'ui:load_game') return 'Load Game'
          if (key === 'ui:band_hq') return 'Band HQ'
          if (key === 'ui:credits') return 'Credits'
          return key
        }
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
