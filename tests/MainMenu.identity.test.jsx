import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MainMenu } from '../src/scenes/MainMenu'
import { useGameState } from '../src/context/GameState'
import { useBandHQModal } from '../src/hooks/useBandHQModal'

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}))

vi.mock('../src/context/GameState', () => ({
  useGameState: vi.fn(),
}))

vi.mock('../src/hooks/useBandHQModal', () => ({
  useBandHQModal: vi.fn(),
}))

vi.mock('../src/utils/imageGen', () => ({
  getGenImageUrl: vi.fn(),
  IMG_PROMPTS: { MAIN_MENU_BG: 'mock-bg' },
}))

vi.mock('../src/utils/AudioManager', () => ({
  audioManager: {
    startAmbient: vi.fn().mockResolvedValue(),
    ensureAudioContext: vi.fn().mockResolvedValue(),
  },
}))

// Mock crypto.randomUUID
global.crypto.randomUUID = vi.fn(() => 'mock-uuid-1234')

describe('MainMenu Identity Flow', () => {
  const mockUpdatePlayer = vi.fn()
  const mockChangeScene = vi.fn()
  const mockResetState = vi.fn()
  const mockAddToast = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    useGameState.mockReturnValue({
      changeScene: mockChangeScene,
      updatePlayer: mockUpdatePlayer,
      resetState: mockResetState,
      addToast: mockAddToast,
      loadGame: vi.fn().mockReturnValue(false),
    })

    useBandHQModal.mockReturnValue({
      showHQ: false,
      openHQ: vi.fn(),
      bandHQProps: {},
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows identity modal when no player ID exists in localStorage', async () => {
    render(<MainMenu />)

    // Click Start Tour
    fireEvent.click(screen.getByText('ui:start_game'))

    // Expect Modal to appear
    expect(await screen.findByText('IDENTITY REQUIRED')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ENTER NAME...')).toBeInTheDocument()
  })

  it('generates ID and saves to localStorage on submit', async () => {
    render(<MainMenu />)

    // Trigger Modal
    fireEvent.click(screen.getByText('ui:start_game'))
    await screen.findByText('IDENTITY REQUIRED')

    // Enter Name
    const input = screen.getByPlaceholderText('ENTER NAME...')
    fireEvent.change(input, { target: { value: 'TestPlayer' } })
    fireEvent.click(screen.getByText('CONFIRM IDENTITY'))

    await waitFor(() => {
      expect(localStorage.getItem('neurotoxic_player_id')).toBe('mock-uuid-1234')
      expect(localStorage.getItem('neurotoxic_player_name')).toBe('TestPlayer')
    })

    // Verify state update and scene change
    await waitFor(() => {
      expect(mockUpdatePlayer).toHaveBeenCalledWith({
        playerId: 'mock-uuid-1234',
        playerName: 'TestPlayer',
      })
    }, { timeout: 2000 })

    // Scene change should happen after animation delay
    await waitFor(() => expect(mockChangeScene).toHaveBeenCalledWith('OVERWORLD'), { timeout: 2000 })
  })

  it('skips modal if identity already exists', async () => {
    localStorage.setItem('neurotoxic_player_id', 'existing-id')
    localStorage.setItem('neurotoxic_player_name', 'ExistingPlayer')

    render(<MainMenu />)

    fireEvent.click(screen.getByText('ui:start_game'))

    // Should NOT see modal
    expect(screen.queryByText('IDENTITY REQUIRED')).not.toBeInTheDocument()

    // Should update player state with existing ID
    await waitFor(() => {
      expect(mockUpdatePlayer).toHaveBeenCalledWith({
        playerId: 'existing-id',
        playerName: 'ExistingPlayer',
      })
    })

    // Should proceed to scene change
    await waitFor(() => expect(mockChangeScene).toHaveBeenCalledWith('OVERWORLD'), { timeout: 2000 })
  })
})
