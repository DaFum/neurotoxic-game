import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MainMenu } from '../../src/scenes/MainMenu'
import { GAME_PHASES } from '../../src/context/gameConstants'

const changeSceneMock = vi.fn()
const updatePlayerMock = vi.fn()
const resetStateMock = vi.fn()
const addToastMock = vi.fn()
const loadGameMock = vi.fn()

vi.mock('../../src/context/GameState', () => ({
  useGameState: () => ({
    changeScene: changeSceneMock,
    updatePlayer: updatePlayerMock,
    resetState: resetStateMock,
    addToast: addToastMock,
    loadGame: loadGameMock
  })
}))

vi.mock('../../src/hooks/useBandHQModal', () => ({
  useBandHQModal: () => ({
    showHQ: false,
    openHQ: vi.fn(),
    closeHQ: vi.fn()
  })
}))

vi.mock('../../src/utils/imageGen', () => ({
  getGenImageUrl: () => 'mock-image-url',
  IMG_PROMPTS: { MAIN_MENU_BG: 'mock-bg' }
}))

vi.mock('../../src/utils/AudioManager', () => ({
  audioManager: {
    startAmbient: vi.fn().mockResolvedValue(),
    ensureAudioContext: vi.fn().mockResolvedValue()
  }
}))

vi.mock('../../src/utils/errorHandler', () => ({
  handleError: vi.fn()
}))

vi.mock('../../src/ui/BandHQ', () => ({
  BandHQ: () => <div data-testid='band-hq-modal'>Band HQ Modal</div>
}))

describe('proceedToTour timing test', () => {
  beforeEach(() => {
    vi.useRealTimers()
    localStorage.clear()
    localStorage.setItem('neurotoxic_player_id', 'existing-id')
    localStorage.setItem('neurotoxic_player_name', 'ExistingPlayer')
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('measures execution time of handleStartTour without extra delay', async () => {
    render(<MainMenu />)

    const startButton = screen.getByText('ui:start_game')

    const startTime = performance.now()

    // We only wait to make sure React effects process and we see the outcome
    // Since we'll remove the artificial delay, waiting 50ms should be plenty.
    await act(async () => {
      startButton.click()
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    const endTime = performance.now()

    console.log(`Execution time (waiting 50ms): ${endTime - startTime}ms`)
    expect(changeSceneMock).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
  })
})
