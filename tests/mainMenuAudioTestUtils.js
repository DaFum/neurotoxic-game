import { mock } from 'node:test'

export const mockAudioManager = {
  ensureAudioContext: mock.fn(async () => true),
  startAmbient: mock.fn(async () => true)
}

export const createMockGameState = ({
  canLoad,
  pendingBandHQOpen = false
} = {}) => ({
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
  pendingBandHQOpen,
  resetState: () => {}
})

export const setupMainMenuAudioTest = async () => {
  // NOTE: mock.module requires the --experimental-test-module-mocks flag
  mock.module('../src/utils/audio/AudioManager', {
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
      Trans: ({ i18nKey }) => i18nKey,
      initReactI18next: { type: '3rdParty', init: () => {} }
    }
  })

  // We need to return a mutable object for useGameState so we can update it in tests if needed,
  // but for these tests a static return is fine, or we can use a mock function.
  // Using a mock function allows for flexibility.
  const sharedState = createMockGameState({ canLoad: true })

  const mockUseGameState = mock.fn(() => sharedState)
  const mockUseGameDispatch = mock.fn(() => {
    // Return only the dispatch functions, filtering out actual state values
    return {
      changeScene: sharedState.changeScene,
      loadGame: sharedState.loadGame,
      addToast: sharedState.addToast,
      updatePlayer: sharedState.updatePlayer,
      updateBand: sharedState.updateBand,
      updateSettings: sharedState.updateSettings,
      deleteSave: sharedState.deleteSave,
      setSetlist: sharedState.setSetlist,
      resetState: sharedState.resetState,
      setPendingBandHQOpen: () => {}
    }
  })

  const mockUseGameSelector = mock.fn(selector => {
    return selector(sharedState)
  })

  mock.module('../src/context/GameState.tsx', {
    namedExports: {
      useGameState: mockUseGameState,
      useGameDispatch: mockUseGameDispatch,
      useGameSelector: mockUseGameSelector,
      useGameActions: mockUseGameDispatch
    }
  })

  const { MainMenu } = await import('../src/scenes/MainMenu.tsx')

  return { MainMenu, mockUseGameState }
}
