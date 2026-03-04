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

  const mockUseAudioControl = () => ({
    audioState: { isMuted: false },
    handleAudioChange: () => {}
  })

  mock.module('../src/hooks/useAudioControl', {
    namedExports: {
      useAudioControl: mockUseAudioControl
    }
  })

  const mockUseTranslation = () => ({
    t: key => {
      if (key === 'ui:start_game') return 'Start Tour'
      if (key === 'ui:load_game') return 'Load Game'
      if (key === 'ui:band_hq') return 'Band HQ'
      if (key === 'ui:credits') return 'Credits'
      return key
    }
  })

  mock.module('react-i18next', {
    namedExports: {
      useTranslation: mockUseTranslation,
      Trans: ({ i18nKey }) => i18nKey
    }
  })

  // We need to return a mutable object for useGameState so we can update it in tests if needed,
  // but for these tests a static return is fine, or we can use a mock function.
  // Using a mock function allows for flexibility.
  const mockUseGameState = mock.fn(() => createMockGameState({ canLoad: true }))
  const mockUseGameDispatch = mock.fn(() => {
    const state = createMockGameState({ canLoad: true })
    // Return only the dispatch functions, filtering out actual state values
    return {
      changeScene: state.changeScene,
      loadGame: state.loadGame,
      addToast: state.addToast,
      updatePlayer: state.updatePlayer,
      updateBand: state.updateBand,
      updateSettings: state.updateSettings,
      deleteSave: state.deleteSave,
      setSetlist: state.setSetlist,
      resetState: state.resetState
    }
  })

  mock.module('../src/context/GameState', {
    namedExports: {
      useGameState: mockUseGameState,
      useGameDispatch: mockUseGameDispatch
    }
  })

  const { MainMenu } = await import('../src/scenes/MainMenu.jsx')

  return { MainMenu, mockUseGameState: getMockGameState }
}
