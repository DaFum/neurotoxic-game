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

  // Single state source behind both useGameActions and useGameSelector.
  // Tests swap it with mockGameStateSource.mock.mockImplementation(...).
  const sharedState = createMockGameState({ canLoad: true })

  const mockGameStateSource = mock.fn(() => sharedState)
  const mockUseGameDispatch = mock.fn(() => {
    const state = mockGameStateSource()
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
      resetState: state.resetState,
      setPendingBandHQOpen: () => {}
    }
  })

  const mockUseGameSelector = mock.fn(selector => {
    return selector(mockGameStateSource())
  })

  mock.module('../src/context/GameState.tsx', {
    namedExports: {
      useGameSelector: mockUseGameSelector,
      useGameActions: mockUseGameDispatch
    }
  })

  const { MainMenu } = await import('../src/scenes/MainMenu.tsx')

  return { MainMenu, mockGameStateSource }
}
