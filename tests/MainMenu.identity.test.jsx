import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MainMenu } from '../src/scenes/MainMenu'
import { useGameState } from '../src/context/GameState'
import { useBandHQModal } from '../src/hooks/useBandHQModal'

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}))

vi.mock('../src/context/GameState', () => ({
  useGameState: vi.fn()
}))

vi.mock('../src/hooks/useBandHQModal', () => ({
  useBandHQModal: vi.fn()
}))

vi.mock('../src/utils/imageGen', () => ({
  getGenImageUrl: vi.fn(),
  IMG_PROMPTS: { MAIN_MENU_BG: 'mock-bg' }
}))

vi.mock('../src/utils/AudioManager', () => ({
  audioManager: {
    startAmbient: vi.fn().mockResolvedValue(),
    ensureAudioContext: vi.fn().mockResolvedValue()
  }
}))

describe('MainMenu Identity Flow', () => {
  const mockUpdatePlayer = vi.fn()
  const mockChangeScene = vi.fn()
  const mockResetState = vi.fn()
  const mockAddToast = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorage.clear()
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'mock-uuid-1234') })

    useGameState.mockReturnValue({
      changeScene: mockChangeScene,
      updatePlayer: mockUpdatePlayer,
      resetState: mockResetState,
      addToast: mockAddToast,
      loadGame: vi.fn().mockReturnValue(false)
    })

    useBandHQModal.mockReturnValue({
      showHQ: false,
      openHQ: vi.fn(),
      bandHQProps: {}
    })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('shows identity modal when no player ID exists in localStorage', async () => {
    render(<MainMenu />)

    // Click Start Tour
    fireEvent.click(screen.getByText('ui:start_game'))

    // Expect Modal to appear
    // State update is synchronous, so getByText should work.
    // If we rely on findByText with fake timers, it might hang if not advanced.
    expect(screen.getByText('ui:identity_required')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('ui:enter_name_placeholder')
    ).toBeInTheDocument()
  })

  it('generates ID and saves to localStorage on submit', async () => {
    render(<MainMenu />)

    // Trigger Modal
    fireEvent.click(screen.getByText('ui:start_game'))
    expect(screen.getByText('ui:identity_required')).toBeInTheDocument()

    // Enter Name
    const input = screen.getByPlaceholderText('ui:enter_name_placeholder')
    fireEvent.change(input, { target: { value: 'TestPlayer' } })
    fireEvent.click(screen.getByText('ui:confirm_identity'))

    expect(localStorage.getItem('neurotoxic_player_id')).toBe('mock-uuid-1234')
    expect(localStorage.getItem('neurotoxic_player_name')).toBe('TestPlayer')

    // Verify state update and scene change
    expect(mockUpdatePlayer).toHaveBeenCalledWith({
      playerId: 'mock-uuid-1234',
      playerName: 'TestPlayer'
    })

    // Scene change should happen after animation delay
    await vi.advanceTimersByTimeAsync(600)
    expect(mockChangeScene).toHaveBeenCalledWith('OVERWORLD')
  })

  it('skips modal if identity already exists', async () => {
    localStorage.setItem('neurotoxic_player_id', 'existing-id')
    localStorage.setItem('neurotoxic_player_name', 'ExistingPlayer')

    render(<MainMenu />)

    fireEvent.click(screen.getByText('ui:start_game'))

    // Should NOT see modal
    expect(screen.queryByText('ui:identity_required')).not.toBeInTheDocument()

    // Should proceed to scene change
    await vi.advanceTimersByTimeAsync(600)
    expect(mockChangeScene).toHaveBeenCalledWith('OVERWORLD')
  })
})
