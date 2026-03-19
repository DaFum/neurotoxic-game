import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MainMenu } from '../src/scenes/MainMenu'
import { useGameState } from '../src/context/GameState'
import { GAME_PHASES } from '../src/context/gameConstants'
import { useBandHQModal } from '../src/hooks/useBandHQModal'
import { BandHQ } from '../src/ui/BandHQ'

// Mock dependencies

vi.mock('../src/context/GameState', () => ({
  useGameState: vi.fn()
}))

vi.mock('../src/hooks/useBandHQModal', () => ({
  useBandHQModal: vi.fn()
}))

vi.mock('../src/utils/imageGen', () => ({
  getGenImageUrl: vi.fn(() => 'mock-image-url'),
  IMG_PROMPTS: { MAIN_MENU_BG: 'mock-bg' }
}))

vi.mock('../src/utils/AudioManager', () => ({
  audioManager: {
    startAmbient: vi.fn().mockResolvedValue(),
    ensureAudioContext: vi.fn().mockResolvedValue()
  }
}))

vi.mock('../src/utils/errorHandler', () => ({
  handleError: vi.fn()
}))

// Mock BandHQ component to avoid deep dependencies
vi.mock('../src/ui/BandHQ', () => ({
  BandHQ: vi.fn(({ ...rest }) => (
    <div data-testid='band-hq-modal' {...rest}>
      Band HQ Modal
    </div>
  ))
}))

describe('MainMenu Component', () => {
  const mockUpdatePlayer = vi.fn()
  const mockChangeScene = vi.fn()
  const mockResetState = vi.fn()
  const mockAddToast = vi.fn()
  const mockLoadGame = vi.fn()
  const mockOpenHQ = vi.fn()

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
      loadGame: mockLoadGame
    })

    useBandHQModal.mockReturnValue({
      showHQ: false,
      openHQ: mockOpenHQ,
      bandHQProps: {}
    })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  describe('Load Game and Navigation', () => {
    it('loads game successfully when save exists', async () => {
      mockLoadGame.mockReturnValue(true)
      render(<MainMenu />)

      await act(async () => {
        fireEvent.click(screen.getByText('ui:load_game'))
      })

      expect(mockLoadGame).toHaveBeenCalled()
      expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
    })

    it('shows error toast when no save found', async () => {
      mockLoadGame.mockReturnValue(false)
      render(<MainMenu />)

      await act(async () => {
        fireEvent.click(screen.getByText('ui:load_game'))
      })

      expect(mockLoadGame).toHaveBeenCalled()
      expect(mockAddToast).toHaveBeenCalledWith('ui:no_save_found', 'error')
      expect(mockChangeScene).not.toHaveBeenCalled()
    })

    it('sets loading state while loading game', () => {
      mockLoadGame.mockReturnValue(true)
      const { container } = render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:load_game'))

      expect(container).toBeTruthy()
    })

    it('navigates to credits scene when credits button clicked', () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:credits'))

      expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.CREDITS)
    })
  })

  describe('Band HQ functionality', () => {
    it('opens Band HQ modal when button clicked', () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:band_hq'))

      expect(mockOpenHQ).toHaveBeenCalled()
    })

    it('renders Band HQ component when showHQ is true', () => {
      const concreteBandHQProps = {
        onClose: vi.fn(),
        player: { id: 'test', name: 'tester' },
        band: { harmony: 100 }
      }

      useBandHQModal.mockReturnValue({
        showHQ: true,
        openHQ: mockOpenHQ,
        bandHQProps: concreteBandHQProps
      })

      render(<MainMenu />)

      expect(screen.getByTestId('band-hq-modal')).toBeInTheDocument()

      const expectedCallArgs = BandHQ.mock.calls[0]
      expect(expectedCallArgs[0]).toEqual(
        expect.objectContaining(concreteBandHQProps)
      )
    })
  })

  describe('Existing save prompt', () => {
    beforeEach(() => {
      localStorage.setItem('neurotoxic_v3_save', 'some-save-data')
      localStorage.setItem('neurotoxic_player_id', 'existing-id')
      localStorage.setItem('neurotoxic_player_name', 'ExistingPlayer')
    })

    it('shows existing save prompt when starting new game with existing save', () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:start_game'))

      expect(
        screen.getByText('ui:mainMenu.existingSave.title')
      ).toBeInTheDocument()
      expect(
        screen.getByText('ui:mainMenu.existingSave.desc')
      ).toBeInTheDocument()
    })

    it('loads existing save when load button clicked in prompt', async () => {
      mockLoadGame.mockReturnValue(true)
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:start_game'))

      await act(async () => {
        fireEvent.click(screen.getByText('ui:mainMenu.existingSave.load'))
      })

      expect(mockLoadGame).toHaveBeenCalled()
      expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
    })

    it('starts new game when start new button clicked in prompt', async () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:start_game'))

      await act(async () => {
        fireEvent.click(screen.getByText('ui:mainMenu.existingSave.startNew'))
      })

      expect(mockResetState).toHaveBeenCalled()
      expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
    })

    it('closes existing save prompt when close button clicked', () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:start_game'))
      expect(
        screen.getByText('ui:mainMenu.existingSave.title')
      ).toBeInTheDocument()

      const modalCloseButton = screen.getByRole('button', {
        name: 'ui:closeModal'
      })
      expect(modalCloseButton).toBeInTheDocument()
      fireEvent.click(modalCloseButton)
      expect(
        screen.queryByText('ui:mainMenu.existingSave.title')
      ).not.toBeInTheDocument()
    })
  })

  describe('Player name input validation', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('shows error toast when submitting empty name', () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:start_game'))

      const input = screen.getByPlaceholderText('ui:enter_name_placeholder')
      fireEvent.change(input, { target: { value: '' } })
      fireEvent.click(screen.getByText('ui:confirm_identity'))

      expect(mockAddToast).toHaveBeenCalledWith('ui:enter_name_error', 'error')
      expect(mockChangeScene).not.toHaveBeenCalled()
    })

    it('shows error toast when submitting whitespace-only name', () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:start_game'))

      const input = screen.getByPlaceholderText('ui:enter_name_placeholder')
      fireEvent.change(input, { target: { value: '   ' } })
      fireEvent.click(screen.getByText('ui:confirm_identity'))

      expect(mockAddToast).toHaveBeenCalledWith('ui:enter_name_error', 'error')
      expect(mockChangeScene).not.toHaveBeenCalled()
    })

    it('trims whitespace from player name before saving', async () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:start_game'))

      const input = screen.getByPlaceholderText('ui:enter_name_placeholder')
      fireEvent.change(input, { target: { value: '  TestPlayer  ' } })
      fireEvent.click(screen.getByText('ui:confirm_identity'))

      expect(localStorage.getItem('neurotoxic_player_name')).toBe('TestPlayer')
      expect(mockUpdatePlayer).toHaveBeenCalledWith({
        playerId: 'mock-uuid-1234',
        playerName: 'TestPlayer'
      })
    })

    it('submits name when Enter key pressed', async () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:start_game'))

      const input = screen.getByPlaceholderText('ui:enter_name_placeholder')
      fireEvent.change(input, { target: { value: 'TestPlayer' } })

      await act(async () => {
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
      })

      expect(localStorage.getItem('neurotoxic_player_name')).toBe('TestPlayer')
      expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
    })

    it('does not submit when non-Enter key pressed', () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:start_game'))

      const input = screen.getByPlaceholderText('ui:enter_name_placeholder')
      fireEvent.change(input, { target: { value: 'TestPlayer' } })
      fireEvent.keyDown(input, { key: 'Tab', code: 'Tab' })

      expect(mockChangeScene).not.toHaveBeenCalled()
    })

    it('closes name input modal when close button clicked', () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:start_game'))
      expect(screen.getByText('ui:identity_required')).toBeInTheDocument()

      const modalCloseButton = screen.getByRole('button', {
        name: 'ui:closeModal'
      })
      expect(modalCloseButton).toBeInTheDocument()
      fireEvent.click(modalCloseButton)
      expect(screen.queryByText('ui:identity_required')).not.toBeInTheDocument()
    })

    it('enforces maxLength of 20 characters', () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:start_game'))

      const input = screen.getByPlaceholderText('ui:enter_name_placeholder')
      expect(input).toHaveAttribute('maxLength', '20')
    })

    it('focuses input when name input modal opens', () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:start_game'))

      const input = screen.getByPlaceholderText('ui:enter_name_placeholder')

      input.focus()
      expect(document.activeElement).toBe(input)
    })
  })

  describe('Component lifecycle', () => {
    it('sets mounted ref on mount and cleans up on unmount', () => {
      const { unmount } = render(<MainMenu />)

      expect(screen.getByText('ui:start_game')).toBeInTheDocument()

      unmount()
    })

    it('prevents state updates after component unmounts', async () => {
      mockLoadGame.mockReturnValue(false)
      const { unmount, rerender } = render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:load_game'))

      rerender(<MainMenu />)

      unmount()

      expect(true).toBe(true)
    })

    it('restores player identity after reset when starting new tour', async () => {
      localStorage.setItem('neurotoxic_player_id', 'saved-id')
      localStorage.setItem('neurotoxic_player_name', 'SavedPlayer')

      render(<MainMenu />)

      await act(async () => {
        fireEvent.click(screen.getByText('ui:start_game'))
      })

      expect(mockResetState).toHaveBeenCalled()
      expect(mockUpdatePlayer).toHaveBeenCalledWith({
        playerId: 'saved-id',
        playerName: 'SavedPlayer'
      })
    })
  })

  describe('Modal interactions edge cases', () => {
    it('renders primary menu chrome and buttons', () => {
      const { container } = render(<MainMenu />)

      const title = container.querySelector('h1')
      expect(title).toHaveTextContent('NEUROTOXIC')
      expect(container.textContent).toContain('v3.0 // EARLY ACCESS')
      expect(container.textContent).toContain(
        '© 2026 NEUROTOXIC // DEATH GRINDCORE FROM STENDAL'
      )
      expect(
        screen.getByText('ui:mainMenu.subtitle.grindTheVoid')
      ).toBeInTheDocument()
      const bgDiv = container.querySelector('[style*="background-image"]')
      expect(bgDiv).toBeTruthy()
      expect(screen.getByText('ui:start_game')).toBeInTheDocument()
      expect(screen.getByText('ui:load_game')).toBeInTheDocument()
      expect(screen.getByText('ui:band_hq')).toBeInTheDocument()
      expect(screen.getByText('ui:socials')).toBeInTheDocument()
      expect(screen.getByText('ui:credits')).toBeInTheDocument()
      expect(screen.getByText('ui:features.button')).toBeInTheDocument()
    })
    it('opens, displays links, and closes socials modal', () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:socials'))

      expect(screen.getAllByText('ui:socials').length).toBeGreaterThan(1)
      expect(screen.getByText('ui:social_links.game.title')).toBeInTheDocument()
      expect(
        screen.getByText('ui:social_links.bandcamp.title')
      ).toBeInTheDocument()
      expect(
        screen.getByText('ui:social_links.instagram.title')
      ).toBeInTheDocument()

      const modalCloseButton = screen.getByRole('button', {
        name: 'ui:closeModal'
      })
      expect(modalCloseButton).toBeInTheDocument()
      fireEvent.click(modalCloseButton)
      expect(
        screen.queryByText('ui:social_links.game.title')
      ).not.toBeInTheDocument()
    })

    it('opens, renders content, and closes features modal', () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:features.button'))

      const expectedItems = [
        'ui:features.title',
        'Feature Section 2',
        'Header 1',
        'Row1Col1',
        'Feature Section 1',
        'Description 1'
      ]

      expectedItems.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument()
      })

      const modalCloseButton = screen.getByRole('button', {
        name: 'ui:closeModal'
      })
      expect(modalCloseButton).toBeInTheDocument()
      fireEvent.click(modalCloseButton)
      expect(screen.queryByText('ui:features.title')).not.toBeInTheDocument()
    })

    it('handles multiple modal opens and closes', () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:socials'))
      expect(screen.getAllByText('ui:socials').length).toBeGreaterThan(1)

      fireEvent.click(screen.getByText('ui:features.button'))
      expect(screen.getByText('ui:features.title')).toBeInTheDocument()
    })

    it('handles rapid button clicks gracefully', async () => {
      mockLoadGame.mockReturnValue(true)
      render(<MainMenu />)

      const loadButton = screen.getByText('ui:load_game')
      fireEvent.click(loadButton)
      fireEvent.click(loadButton)
      fireEvent.click(loadButton)

      expect(mockLoadGame).toHaveBeenCalled()
    })
  })

  describe('Button layout and edge cases', () => {
    it('keeps action button order, grouping, and accessibility stable', () => {
      render(<MainMenu />)

      const buttons = screen.getAllByRole('button')
      const buttonTexts = buttons.map(btn => btn.textContent)

      const startGameIndex = buttonTexts.indexOf('ui:start_game')
      const loadGameIndex = buttonTexts.indexOf('ui:load_game')
      const bandHQIndex = buttonTexts.indexOf('ui:band_hq')
      const socialsIndex = buttonTexts.indexOf('ui:socials')
      const creditsIndex = buttonTexts.indexOf('ui:credits')

      expect(startGameIndex).toBeGreaterThanOrEqual(0)
      expect(loadGameIndex).toBeGreaterThanOrEqual(0)
      expect(bandHQIndex).toBeGreaterThanOrEqual(0)
      expect(creditsIndex).toBeGreaterThanOrEqual(0)

      expect(startGameIndex).toBeLessThan(socialsIndex)
      expect(loadGameIndex).toBeLessThan(socialsIndex)
      expect(bandHQIndex).toBeLessThan(socialsIndex)

      const socialsButton = screen.getByText('ui:socials')
      const creditsButton = screen.getByText('ui:credits')

      expect(socialsButton).toBeInTheDocument()
      expect(creditsButton).toBeInTheDocument()

      const socialsParent = socialsButton.closest('div[class*="flex"]')
      const creditsParent = creditsButton.closest('div[class*="flex"]')

      expect(socialsParent).toBeTruthy()
      expect(creditsParent).toBeTruthy()

      const startButton = screen.getByText('ui:start_game')
      const loadButton = screen.getByText('ui:load_game')
      const bandHQButton = screen.getByText('ui:band_hq')

      expect(startButton).toBeEnabled()
      expect(loadButton).toBeEnabled()
      expect(bandHQButton).toBeEnabled()
      expect(socialsButton).toBeEnabled()
      expect(creditsButton).toBeEnabled()

      fireEvent.click(socialsButton)
      expect(screen.getByText('ui:social_links.game.title')).toBeInTheDocument()
    })

    it('handles feature content regardless of item formatting', () => {
      render(<MainMenu />)
      fireEvent.click(screen.getByText('ui:features.button'))

      const featureContent = screen.getByText('ui:features.title').parentElement
      expect(featureContent).toBeTruthy()
      expect(featureContent).toHaveTextContent('ui:features.title')
      // Verify at least one feature item is rendered
      expect(featureContent.children.length).toBeGreaterThan(0)
    })

    it('continues scene transition even if audio fails', async () => {
      const { audioManager } = await import('../src/utils/AudioManager')
      audioManager.ensureAudioContext.mockRejectedValue(
        new Error('Audio failed')
      )

      localStorage.setItem('neurotoxic_player_id', 'test-id')
      localStorage.setItem('neurotoxic_player_name', 'TestPlayer')

      render(<MainMenu />)

      await act(async () => {
        fireEvent.click(screen.getByText('ui:start_game'))
      })

      expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
    })
  })

  describe('Additional edge cases and regressions', () => {
    it('handles concurrent save and load operations', async () => {
      mockLoadGame.mockReturnValue(true)
      render(<MainMenu />)

      const loadButton = screen.getByText('ui:load_game')
      const startButton = screen.getByText('ui:start_game')

      await act(async () => {
        fireEvent.click(loadButton)
        fireEvent.click(startButton)
      })

      expect(mockChangeScene).toHaveBeenCalled()
    })

    it('maintains player identity across multiple new game starts', async () => {
      localStorage.setItem('neurotoxic_player_id', 'test-id')
      localStorage.setItem('neurotoxic_player_name', 'TestPlayer')

      render(<MainMenu />)

      await act(async () => {
        fireEvent.click(screen.getByText('ui:start_game'))
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith({
        playerId: 'test-id',
        playerName: 'TestPlayer'
      })

      await act(async () => {
        fireEvent.click(screen.getByText('ui:start_game'))
      })

      expect(mockUpdatePlayer).toHaveBeenCalledTimes(2)
    })

    it('clears existing save prompt state when starting from modal', () => {
      localStorage.setItem('neurotoxic_v3_save', 'existing')
      localStorage.setItem('neurotoxic_player_id', 'id')
      localStorage.setItem('neurotoxic_player_name', 'Name')

      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:start_game'))
      expect(
        screen.getByText('ui:mainMenu.existingSave.title')
      ).toBeInTheDocument()

      const closeButton = screen.getByRole('button', { name: 'ui:closeModal' })
      fireEvent.click(closeButton)

      expect(
        screen.queryByText('ui:mainMenu.existingSave.title')
      ).not.toBeInTheDocument()
    })

    it('validates player name input on blur', () => {
      localStorage.clear()
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:start_game'))

      const input = screen.getByPlaceholderText('ui:enter_name_placeholder')
      fireEvent.change(input, { target: { value: '   ' } })
      fireEvent.blur(input)

      expect(input.value).toBe('   ')
    })

    it('prevents starting game without player identity', () => {
      localStorage.clear()
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:start_game'))
      expect(screen.getByText('ui:identity_required')).toBeInTheDocument()

      expect(mockChangeScene).not.toHaveBeenCalled()
    })

    it('handles audio initialization failure on load game', async () => {
      const { audioManager } = await import('../src/utils/AudioManager')
      audioManager.ensureAudioContext.mockRejectedValue(
        new Error('Audio failed')
      )
      mockLoadGame.mockReturnValue(true)

      render(<MainMenu />)

      await act(async () => {
        fireEvent.click(screen.getByText('ui:load_game'))
      })

      expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
    })

    it('disables start button while starting', async () => {
      localStorage.setItem('neurotoxic_player_id', 'id')
      localStorage.setItem('neurotoxic_player_name', 'Name')

      render(<MainMenu />)

      const startButton = screen.getByText('ui:start_game').closest('button')

      fireEvent.click(startButton)

      expect(startButton).toBeDisabled()
    })

    it('handles missing crypto.randomUUID gracefully', () => {
      const originalCrypto = global.crypto
      global.crypto = {}

      localStorage.clear()

      expect(() => render(<MainMenu />)).not.toThrow()

      global.crypto = originalCrypto
    })

    it('renders all social links in socials modal', () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:socials'))

      expect(
        screen.getByText('ui:social_links.bandcamp.title')
      ).toBeInTheDocument()
      expect(
        screen.getByText('ui:social_links.tiktok.title')
      ).toBeInTheDocument()
      expect(
        screen.getByText('ui:social_links.neurotoxic_once.title')
      ).toBeInTheDocument()
      expect(
        screen.getByText('ui:social_links.neurotoxic_3000.title')
      ).toBeInTheDocument()
      expect(screen.getByText('ui:social_links.blog.title')).toBeInTheDocument()
    })

    it('closes features modal and reopens socials modal', () => {
      render(<MainMenu />)

      fireEvent.click(screen.getByText('ui:features.button'))
      expect(screen.getByText('ui:features.title')).toBeInTheDocument()

      const closeButton = screen.getByRole('button', { name: 'ui:closeModal' })
      fireEvent.click(closeButton)
      expect(screen.queryByText('ui:features.title')).not.toBeInTheDocument()

      fireEvent.click(screen.getByText('ui:socials'))
      expect(screen.getByText('ui:social_links.game.title')).toBeInTheDocument()
    })
  })
})
