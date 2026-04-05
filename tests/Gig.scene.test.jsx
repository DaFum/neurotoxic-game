import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { Gig } from '../src/scenes/Gig.jsx'
import { useGameState } from '../src/context/GameState.jsx'
import { GAME_PHASES } from '../src/context/gameConstants.js'
import { audioManager } from '../src/utils/AudioManager'
import { pauseAudio, resumeAudio, stopAudio } from '../src/utils/audioEngine'

// Mock dependencies
vi.mock('../src/context/GameState')
vi.mock('../src/utils/AudioManager', () => ({
  audioManager: {
    ensureAudioContext: vi.fn().mockResolvedValue(true)
  }
}))
vi.mock('../src/utils/audioEngine', () => ({
  pauseAudio: vi.fn(),
  resumeAudio: vi.fn(),
  stopAudio: vi.fn()
}))
vi.mock('../src/utils/imageGen', () => ({
  getGenImageUrl: vi.fn(prompt => `mock-${prompt}.jpg`),
  IMG_PROMPTS: {
    VENUE_CLUB: 'club',
    VENUE_KAMINSTUBE: 'kaminstube',
    VENUE_FESTIVAL: 'festival',
    VENUE_DIVE_BAR: 'dive',
    VENUE_GALACTIC: 'galactic',
    MATZE_PLAYING: 'matze',
    MATZE_ANGRY: 'matze_angry',
    MARIUS_PLAYING: 'marius',
    MARIUS_DRINKING: 'marius_drink',
    LARS_PLAYING: 'lars',
    LARS_IDLE: 'lars_idle',
    LARS_SCREAMING: 'lars_scream'
  }
}))
vi.mock('../src/utils/errorHandler', () => ({
  handleError: vi.fn()
}))
vi.mock('../src/hooks/useRhythmGameLogic', () => ({
  useRhythmGameLogic: vi.fn(() => ({
    stats: {
      score: 0,
      combo: 0,
      health: 100,
      overload: 0,
      isToxicMode: false,
      isGameOver: false,
      isAudioReady: true,
      accuracy: 0
    },
    actions: {
      handleLaneHit: vi.fn(),
      retryAudioInitialization: vi.fn()
    },
    gameStateRef: {
      current: {
        score: 0,
        stats: {},
        hasSubmittedResults: false,
        toxicTimeTotal: 0,
        songStats: []
      }
    },
    update: vi.fn()
  }))
}))
vi.mock('../src/hooks/useGigEffects', () => ({
  useGigEffects: vi.fn(() => ({
    chaosContainerRef: { current: null },
    chaosStyle: {},
    triggerBandAnimation: vi.fn(),
    setBandMemberRef: vi.fn(() => () => {})
  }))
}))
vi.mock('../src/hooks/useGigInput', () => ({
  useGigInput: vi.fn(() => ({
    handleLaneInput: vi.fn()
  }))
}))
vi.mock('../src/components/PixiStage', () => ({
  PixiStage: props => (
    <div data-testid='pixi-stage' {...props}>
      Pixi Stage
    </div>
  ),
  default: props => (
    <div data-testid='pixi-stage' {...props}>
      Pixi Stage
    </div>
  )
}))
vi.mock('../src/components/GigHUD', () => ({
  GigHUD: ({ onTogglePause }) => (
    <div data-testid='gig-hud'>
      <button type='button' onClick={onTogglePause}>
        Pause Button
      </button>
    </div>
  )
}))

describe('Gig Scene Component', () => {
  const mockChangeScene = vi.fn()
  const mockAddToast = vi.fn()
  const mockSetActiveEvent = vi.fn()
  const mockSetLastGigStats = vi.fn()
  const mockEndGig = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    useGameState.mockReturnValue({
      currentGig: { id: 'test-gig', name: 'Test Venue', diff: 3 },
      changeScene: mockChangeScene,
      addToast: mockAddToast,
      activeEvent: null,
      setActiveEvent: mockSetActiveEvent,
      setLastGigStats: mockSetLastGigStats,
      band: { harmony: 70 },
      endGig: mockEndGig
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial Rendering', () => {
    test('renders gig scene when currentGig exists', async () => {
      render(<Gig />)

      await waitFor(() => {
        expect(screen.getByTestId('pixi-stage')).toBeInTheDocument()
      })
      expect(screen.getByTestId('gig-hud')).toBeInTheDocument()
    })

    test('redirects to overworld when no current gig', () => {
      useGameState.mockReturnValue({
        currentGig: null,
        changeScene: mockChangeScene,
        addToast: mockAddToast,
        setActiveEvent: mockSetActiveEvent,
        setLastGigStats: mockSetLastGigStats,
        band: { harmony: 70 },
        endGig: mockEndGig
      })

      render(<Gig />)

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('No gig active! Returning to map.'),
        'error'
      )
      expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
    })

    test('renders appropriate backgrounds based on venue or difficulty', () => {
      useGameState.mockReturnValue({
        currentGig: { id: 'gig', name: 'Kaminstube', diff: 2 },
        changeScene: mockChangeScene,
        addToast: mockAddToast,
        setActiveEvent: mockSetActiveEvent,
        setLastGigStats: mockSetLastGigStats,
        band: { harmony: 70 },
        endGig: mockEndGig
      })
      const { container, rerender } = render(<Gig />)
      expect(
        container.querySelector('[style*="background-image"]').style
          .backgroundImage
      ).toContain('mock-kaminstube.jpg')

      // Low diff
      useGameState.mockReturnValue({
        currentGig: { id: 'gig', name: 'Small Venue', diff: 1 },
        changeScene: mockChangeScene,
        addToast: mockAddToast,
        setActiveEvent: mockSetActiveEvent,
        setLastGigStats: mockSetLastGigStats,
        band: { harmony: 70 },
        endGig: mockEndGig
      })
      rerender(<Gig />)
      expect(
        container.querySelector('[style*="background-image"]').style
          .backgroundImage
      ).toContain('mock-dive.jpg')

      // High diff
      useGameState.mockReturnValue({
        currentGig: { id: 'gig', name: 'Big Stadium', diff: 6 },
        changeScene: mockChangeScene,
        addToast: mockAddToast,
        setActiveEvent: mockSetActiveEvent,
        setLastGigStats: mockSetLastGigStats,
        band: { harmony: 70 },
        endGig: mockEndGig
      })
      rerender(<Gig />)
      expect(
        container.querySelector('[style*="background-image"]').style
          .backgroundImage
      ).toContain('mock-galactic.jpg')
    })
  })

  describe('Band Member Display', () => {
    test('shows correct band member moods based on harmony', () => {
      // High harmony (assuming PLAYING for everyone)
      useGameState.mockReturnValue({
        currentGig: { id: 'gig', name: 'Test', diff: 3 },
        changeScene: mockChangeScene,
        addToast: mockAddToast,
        setActiveEvent: mockSetActiveEvent,
        setLastGigStats: mockSetLastGigStats,
        band: { harmony: 85 },
        endGig: mockEndGig
      })
      const { container, rerender } = render(<Gig />)
      // The images use i18n for alt text, so we'll use a data attribute or class to query, or just update the alt text query.
      // But we can check alt based on translation default values since it is mocked.
      // Actually, we can check by id on the wrapper div.
      expect(container.querySelector('#band-member-0 img').src).toMatch(
        /mock-matze\.jpg$/
      )
      expect(container.querySelector('#band-member-1 img').src).toMatch(
        /mock-marius\.jpg$/
      )
      expect(container.querySelector('#band-member-2 img').src).toMatch(
        /mock-lars\.jpg$/
      )

      // Very low harmony (harmony: 15 -> Matze Angry, Marius Drinking, Lars Idle)
      useGameState.mockReturnValue({
        currentGig: { id: 'gig', name: 'Test', diff: 3 },
        changeScene: mockChangeScene,
        addToast: mockAddToast,
        setActiveEvent: mockSetActiveEvent,
        setLastGigStats: mockSetLastGigStats,
        band: { harmony: 15 },
        endGig: mockEndGig
      })
      rerender(<Gig />)
      expect(container.querySelector('#band-member-0 img').src).toMatch(
        /mock-matze_angry\.jpg$/
      )
      expect(container.querySelector('#band-member-1 img').src).toMatch(
        /mock-marius_drink\.jpg$/
      )
      expect(container.querySelector('#band-member-2 img').src).toMatch(
        /mock-lars_idle\.jpg$/
      )

      // Moderate harmony (harmony: 45 -> Matze Angry, Marius Playing, Lars Screaming)
      useGameState.mockReturnValue({
        currentGig: { id: 'gig', name: 'Test', diff: 3 },
        changeScene: mockChangeScene,
        addToast: mockAddToast,
        setActiveEvent: mockSetActiveEvent,
        setLastGigStats: mockSetLastGigStats,
        band: { harmony: 45 },
        endGig: mockEndGig
      })
      rerender(<Gig />)
      expect(container.querySelector('#band-member-0 img').src).toMatch(
        /mock-matze_angry\.jpg$/
      )
      expect(container.querySelector('#band-member-1 img').src).toMatch(
        /mock-marius\.jpg$/
      ) // MARIUS_PLAYING is 'marius'
      expect(container.querySelector('#band-member-2 img').src).toMatch(
        /mock-lars_scream\.jpg$/
      )
    })
  })

  describe('Pause Functionality', () => {
    test('toggles pause overlay when pause button clicked', () => {
      render(<Gig />)

      const pauseButton = screen.getByText('Pause Button')
      act(() => {
        fireEvent.click(pauseButton)
      })

      expect(screen.getByText(/PAUSED/i)).toBeInTheDocument()
    })

    test('pauses audio when pause is toggled on', () => {
      render(<Gig />)

      const pauseButton = screen.getByText('Pause Button')
      act(() => {
        fireEvent.click(pauseButton)
      })

      expect(pauseAudio).toHaveBeenCalled()
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('PAUSED'),
        'info'
      )
    })

    test('resumes audio when pause is toggled off', () => {
      render(<Gig />)

      const pauseButton = screen.getByText('Pause Button')

      act(() => {
        fireEvent.click(pauseButton)
      })

      const resumeButton = screen.getByText(/RESUME/i)
      act(() => {
        fireEvent.click(resumeButton)
      })

      expect(resumeAudio).toHaveBeenCalled()
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('RESUMED'),
        'info'
      )
    })

    test('shows pause modal with resume and quit buttons', () => {
      render(<Gig />)

      const pauseButton = screen.getByText('Pause Button')
      act(() => {
        fireEvent.click(pauseButton)
      })

      expect(screen.getByText(/RESUME/i)).toBeInTheDocument()
      expect(screen.getByText(/QUIT GIG/i)).toBeInTheDocument()
    })
  })

  describe('Quit Functionality', () => {
    test('quit button stops audio and ends gig', async () => {
      render(<Gig />)

      const pauseButton = screen.getByText('Pause Button')
      act(() => {
        fireEvent.click(pauseButton)
      })

      const quitButton = screen.getByText(/QUIT GIG/i)
      await act(async () => {
        fireEvent.click(quitButton)
      })

      expect(stopAudio).toHaveBeenCalled()
      expect(mockSetLastGigStats).toHaveBeenCalled()
      expect(mockEndGig).toHaveBeenCalled()
    })

    test('quit handles undefined gameStateRef gracefully', async () => {
      const { useRhythmGameLogic } =
        await import('../src/hooks/useRhythmGameLogic')
      useRhythmGameLogic.mockReturnValue({
        stats: { isAudioReady: true, isToxicMode: false },
        actions: { retryAudioInitialization: vi.fn() },
        gameStateRef: { current: null },
        update: vi.fn()
      })

      render(<Gig />)

      const pauseButton = screen.getByText('Pause Button')
      act(() => {
        fireEvent.click(pauseButton)
      })

      const quitButton = screen.getByText(/QUIT GIG/i)
      await act(async () => {
        fireEvent.click(quitButton)
      })

      expect(mockSetLastGigStats).toHaveBeenCalled()
      expect(mockEndGig).toHaveBeenCalled()
    })

    test('quit handles audio cleanup errors gracefully', async () => {
      const { stopAudio } = await import('../src/utils/audioEngine')
      stopAudio.mockImplementation(() => {
        throw new Error('Audio cleanup failed')
      })

      render(<Gig />)

      const pauseButton = screen.getByText('Pause Button')
      act(() => {
        fireEvent.click(pauseButton)
      })

      const quitButton = screen.getByText(/QUIT GIG/i)
      await act(async () => {
        fireEvent.click(quitButton)
      })

      expect(mockSetLastGigStats).toHaveBeenCalled()
      expect(mockEndGig).toHaveBeenCalled()
    })

    test('quit sets hasSubmittedResults flag', async () => {
      const gameStateRef = {
        current: {
          score: 1000,
          stats: {},
          hasSubmittedResults: false,
          toxicTimeTotal: 0,
          songStats: []
        }
      }

      const { useRhythmGameLogic } =
        await import('../src/hooks/useRhythmGameLogic')
      useRhythmGameLogic.mockReturnValue({
        stats: { isAudioReady: true, isToxicMode: false },
        actions: { retryAudioInitialization: vi.fn() },
        gameStateRef,
        update: vi.fn()
      })

      render(<Gig />)

      const pauseButton = screen.getByText('Pause Button')
      act(() => {
        fireEvent.click(pauseButton)
      })

      const quitButton = screen.getByText(/QUIT GIG/i)
      await act(async () => {
        fireEvent.click(quitButton)
      })

      expect(gameStateRef.current.hasSubmittedResults).toBe(true)
    })
  })

  describe('Audio Lock Screen', () => {
    test('shows audio lock screen when audio not ready', async () => {
      const { useRhythmGameLogic } =
        await import('../src/hooks/useRhythmGameLogic')
      useRhythmGameLogic.mockReturnValue({
        stats: {
          isAudioReady: false,
          isToxicMode: false
        },
        actions: {
          retryAudioInitialization: vi.fn()
        },
        gameStateRef: { current: {} },
        update: vi.fn()
      })

      render(<Gig />)

      expect(screen.getByText(/SYSTEM LOCKED/i)).toBeInTheDocument()
      expect(screen.getByText(/Audio Interface requires manual override./i)).toBeInTheDocument()
      expect(screen.getByText(/INITIALIZE AUDIO/i)).toBeInTheDocument()
    })

    test('initialize audio button calls ensureAudioContext', async () => {
      const mockRetry = vi.fn()
      const { useRhythmGameLogic } =
        await import('../src/hooks/useRhythmGameLogic')
      useRhythmGameLogic.mockReturnValue({
        stats: { isAudioReady: false },
        actions: { retryAudioInitialization: mockRetry },
        gameStateRef: { current: {} },
        update: vi.fn()
      })

      audioManager.ensureAudioContext.mockResolvedValue(true)

      render(<Gig />)

      const initButton = screen.getByText(/INITIALIZE AUDIO/i)
      await act(async () => {
        fireEvent.click(initButton)
      })

      await waitFor(() => {
        expect(audioManager.ensureAudioContext).toHaveBeenCalled()
        expect(mockRetry).toHaveBeenCalled()
      })
    })

    test('does not render main gig UI when audio locked', async () => {
      const { useRhythmGameLogic } =
        await import('../src/hooks/useRhythmGameLogic')
      useRhythmGameLogic.mockReturnValue({
        stats: { isAudioReady: false },
        actions: { retryAudioInitialization: vi.fn() },
        gameStateRef: { current: {} },
        update: vi.fn()
      })

      render(<Gig />)

      expect(screen.queryByTestId('pixi-stage')).not.toBeInTheDocument()
      expect(screen.queryByTestId('gig-hud')).not.toBeInTheDocument()
    })
  })

  describe('Toxic Mode Visual Effects', () => {
    test('applies toxic mode border when isToxicMode is true', async () => {
      const { useRhythmGameLogic } =
        await import('../src/hooks/useRhythmGameLogic')
      useRhythmGameLogic.mockReturnValue({
        stats: {
          isAudioReady: true,
          isToxicMode: true
        },
        actions: {},
        gameStateRef: { current: {} },
        update: vi.fn()
      })

      const { container } = render(<Gig />)

      const mainContainer = container.firstChild
      expect(mainContainer.className).toContain('border-toxic-green')
    })

    test('no toxic border when isToxicMode is false', async () => {
      const { useRhythmGameLogic } =
        await import('../src/hooks/useRhythmGameLogic')
      useRhythmGameLogic.mockReturnValue({
        stats: {
          isAudioReady: true,
          isToxicMode: false
        },
        actions: {},
        gameStateRef: { current: {} },
        update: vi.fn()
      })

      const { container } = render(<Gig />)

      const mainContainer = container.firstChild
      const classString = mainContainer.className || ''
      const hasBorder = classString.includes('border-4')
      expect(hasBorder).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    test('handles missing currentGig name gracefully', () => {
      useGameState.mockReturnValue({
        currentGig: { id: 'gig', diff: 3 },
        changeScene: mockChangeScene,
        addToast: mockAddToast,
        setActiveEvent: mockSetActiveEvent,
        setLastGigStats: mockSetLastGigStats,
        band: { harmony: 70 },
        endGig: mockEndGig
      })

      expect(() => render(<Gig />)).not.toThrow()
    })

    test('handles missing currentGig diff gracefully', () => {
      useGameState.mockReturnValue({
        currentGig: { id: 'gig', name: 'Test' },
        changeScene: mockChangeScene,
        addToast: mockAddToast,
        setActiveEvent: mockSetActiveEvent,
        setLastGigStats: mockSetLastGigStats,
        band: { harmony: 70 },
        endGig: mockEndGig
      })

      expect(() => render(<Gig />)).not.toThrow()
    })

    test('renders with minimum required props', () => {
      useGameState.mockReturnValue({
        currentGig: { id: 'gig' },
        changeScene: mockChangeScene,
        addToast: mockAddToast,
        setActiveEvent: mockSetActiveEvent,
        setLastGigStats: mockSetLastGigStats,
        band: { harmony: 50 },
        endGig: mockEndGig
      })

      expect(() => render(<Gig />)).not.toThrow()
    })

    test('handles festival venue names correctly', () => {
      useGameState.mockReturnValue({
        currentGig: { id: 'gig', name: 'Summer Festival', diff: 5 },
        changeScene: mockChangeScene,
        addToast: mockAddToast,
        setActiveEvent: mockSetActiveEvent,
        setLastGigStats: mockSetLastGigStats,
        band: { harmony: 70 },
        endGig: mockEndGig
      })

      expect(() => render(<Gig />)).not.toThrow()
    })

    test('handles open air venue names correctly', () => {
      useGameState.mockReturnValue({
        currentGig: { id: 'gig', name: 'Open Air Stage', diff: 4 },
        changeScene: mockChangeScene,
        addToast: mockAddToast,
        setActiveEvent: mockSetActiveEvent,
        setLastGigStats: mockSetLastGigStats,
        band: { harmony: 70 },
        endGig: mockEndGig
      })

      expect(() => render(<Gig />)).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    test('pause modal has proper ARIA attributes', () => {
      render(<Gig />)

      const pauseButton = screen.getByText('Pause Button')
      act(() => {
        fireEvent.click(pauseButton)
      })

      const modal = screen.getByRole('dialog')
      expect(modal).toHaveAttribute('aria-modal', 'true')
    })
  })
})
