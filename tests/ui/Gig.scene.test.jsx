import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { StrictMode } from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { Gig } from '../../src/scenes/Gig.tsx'
import { useRhythmGameLogic } from '../../src/hooks/useRhythmGameLogic'
import { useGameActions } from '../../src/context/GameState.tsx'
import { GAME_PHASES } from '../../src/context/gameConstants'
import { audioManager, audioService } from '../../src/utils/audio/audioEngine'
import {
  pauseAudio,
  resumeAudio,
  stopAudio
} from '../../src/utils/audio/audioEngine'
import { setActiveInputSource } from '../../src/utils/gamepad/inputSource'

const sharedGameStateRef = vi.hoisted(() => ({ current: {} }))

// Mock dependencies
vi.mock('../../src/context/GameState', () => {
  const useGameActions = vi.fn()
  return {
    useGameActions,
    useGameSelector: selector => selector(useGameActions())
  }
})
vi.mock('../../src/utils/audio/audioEngine', () => ({
  audioManager: {
    ensureAudioContext: vi.fn().mockResolvedValue(true)
  },
  audioService: {
    ensureAudioContext: vi.fn().mockResolvedValue(true)
  },
  pauseAudio: vi.fn(),
  resumeAudio: vi.fn(async () => true),
  stopAudio: vi.fn(),
  getPlayRequestId: vi.fn()
}))
vi.mock('../../src/utils/imageGen', () => ({
  getGenImageUrl: vi.fn(prompt => `mock-${prompt}.jpg`),
  isImageGenerationAvailable: () => true,
  resolveGenImageUrl: vi.fn(prompt => `mock-${prompt}.jpg`),
  getGeneratedImageFallbackUrl: () => 'mock-fallback',
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
vi.mock('../../src/utils/errorHandler', () => ({
  handleError: vi.fn()
}))
vi.mock('../../src/hooks/useRhythmGameLogic', () => ({
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
    gameStateRef: sharedGameStateRef,
    update: vi.fn()
  }))
}))
vi.mock('../../src/hooks/useGigEffects', () => ({
  useGigEffects: vi.fn(() => ({
    chaosContainerRef: { current: null },
    chaosStyle: {},
    triggerBandAnimation: vi.fn(),
    setBandMemberRef: vi.fn(() => () => {})
  }))
}))
vi.mock('../../src/hooks/useGigInput', () => ({
  useGigInput: vi.fn(() => ({
    handleLaneInput: vi.fn()
  }))
}))
vi.mock('../../src/components/PixiStage', () => ({
  PixiStage: props => (
    <div data-testid='pixi-stage' {...props}>
      Pixi Stage
    </div>
  )
}))
vi.mock('../../src/components/GigHUD', () => ({
  GigHUD: ({ onTogglePause }) => (
    <div data-testid='gig-hud'>
      <button type='button' onClick={onTogglePause}>
        Pause Button
      </button>
    </div>
  )
}))

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('Gig Scene Component', () => {
  const mockChangeScene = vi.fn()
  const mockAddToast = vi.fn()
  const mockSetActiveEvent = vi.fn()
  const mockSetLastGigStats = vi.fn()
  const mockEndGig = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    sharedGameStateRef.current = {
      score: 0,
      stats: {},
      hasSubmittedResults: false,
      isGameOver: false,
      toxicTimeTotal: 0,
      songStats: []
    }

    useGameActions.mockReturnValue({
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
      useGameActions.mockReturnValue({
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
      useGameActions.mockReturnValue({
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
      useGameActions.mockReturnValue({
        currentGig: { id: 'gig', name: 'Small Venue', difficulty: 1 },
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
      useGameActions.mockReturnValue({
        currentGig: { id: 'gig', name: 'Big Stadium', difficulty: 6 },
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
      useGameActions.mockReturnValue({
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
      useGameActions.mockReturnValue({
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
      useGameActions.mockReturnValue({
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

    test('resumes audio when pause is toggled off', async () => {
      render(<Gig />)

      const pauseButton = screen.getByText('Pause Button')

      act(() => {
        fireEvent.click(pauseButton)
      })

      const resumeButton = screen.getByText(/RESUME/i)
      await act(async () => {
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
    test('shows audio lock screen when audio blocked', async () => {
      useRhythmGameLogic.mockReturnValue({
        stats: {
          audioStatus: 'blocked',
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
    })

    test('shows audio lock screen when audio failed', async () => {
      useRhythmGameLogic.mockReturnValue({
        stats: {
          audioStatus: 'failed',
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
    })

    test('initialize audio button calls ensureAudioContext', async () => {
      const mockRetry = vi.fn()
      useRhythmGameLogic.mockReturnValue({
        stats: { audioStatus: 'blocked' },
        actions: { retryAudioInitialization: mockRetry },
        gameStateRef: { current: {} },
        update: vi.fn()
      })

      audioManager.ensureAudioContext.mockResolvedValue(true)
      audioService.ensureAudioContext.mockResolvedValue(true)

      render(<Gig />)

      const initButton = screen.getByText(/INITIALIZE AUDIO/i)
      await act(async () => {
        fireEvent.click(initButton)
      })

      await flushPromises()
      expect(audioService.ensureAudioContext).toHaveBeenCalled()
      expect(mockRetry).toHaveBeenCalled()
    })

    test('offers no quit button while audio is merely blocked', async () => {
      useRhythmGameLogic.mockReturnValue({
        stats: { audioStatus: 'blocked' },
        actions: { retryAudioInitialization: vi.fn() },
        gameStateRef: { current: {} },
        update: vi.fn()
      })

      render(<Gig />)
      expect(screen.queryByText(/QUIT GIG/i)).toBeNull()
    })

    test('failed audio offers a way out of the gig', async () => {
      useRhythmGameLogic.mockReturnValue({
        stats: { audioStatus: 'failed' },
        actions: { retryAudioInitialization: vi.fn() },
        gameStateRef: { current: {} },
        update: vi.fn()
      })

      render(<Gig />)
      await act(async () => {
        fireEvent.click(screen.getByText(/QUIT GIG/i))
      })

      expect(mockSetLastGigStats).toHaveBeenCalled()
      expect(mockEndGig).toHaveBeenCalled()
    })

    describe('stage failure', () => {
      const mockRetry = vi.fn()

      beforeEach(() => {
        useRhythmGameLogic.mockReturnValue({
          stats: { audioStatus: 'failed', failureKind: 'stage' },
          actions: { retryAudioInitialization: mockRetry },
          gameStateRef: { current: {} },
          update: vi.fn()
        })
        setActiveInputSource('gamepad')
      })

      afterEach(() => {
        setActiveInputSource('keyboard')
      })

      test('names the stage instead of the audio lock', () => {
        render(<Gig />)

        expect(screen.getByText('STAGE FAILED TO LOAD')).toBeInTheDocument()
        expect(
          screen.getByText(
            'The stage could not be drawn. Retry or quit the gig.'
          )
        ).toBeInTheDocument()
        expect(screen.queryByText(/SYSTEM LOCKED/i)).toBeNull()
        expect(screen.queryByText(/INITIALIZE AUDIO/i)).toBeNull()
        expect(
          screen.queryByText('A click or tap may be needed to enable audio.')
        ).toBeNull()
      })

      test('retry re-runs the initialization', async () => {
        audioService.ensureAudioContext.mockResolvedValue(true)
        render(<Gig />)

        await act(async () => {
          fireEvent.click(screen.getByText('RETRY'))
        })
        await flushPromises()

        expect(mockRetry).toHaveBeenCalled()
      })

      test('quit leaves the gig', async () => {
        render(<Gig />)

        await act(async () => {
          fireEvent.click(screen.getByText(/QUIT GIG/i))
        })

        expect(mockSetLastGigStats).toHaveBeenCalled()
        expect(mockEndGig).toHaveBeenCalled()
      })
    })

    test('keeps the audio copy and gamepad hint for an audio failure', () => {
      useRhythmGameLogic.mockReturnValue({
        stats: { audioStatus: 'failed', failureKind: 'audio' },
        actions: { retryAudioInitialization: vi.fn() },
        gameStateRef: { current: {} },
        update: vi.fn()
      })
      setActiveInputSource('gamepad')
      try {
        render(<Gig />)
        expect(screen.getByText(/SYSTEM LOCKED/i)).toBeInTheDocument()
        expect(
          screen.getByText('A click or tap may be needed to enable audio.')
        ).toBeInTheDocument()
      } finally {
        setActiveInputSource('keyboard')
      }
    })

    test('toasts when the audio unlock resolves false', async () => {
      const mockRetry = vi.fn()
      useRhythmGameLogic.mockReturnValue({
        stats: { audioStatus: 'blocked' },
        actions: { retryAudioInitialization: mockRetry },
        gameStateRef: { current: {} },
        update: vi.fn()
      })
      audioService.ensureAudioContext.mockResolvedValue(false)

      render(<Gig />)
      await act(async () => {
        fireEvent.click(screen.getByText(/INITIALIZE AUDIO/i))
      })
      await flushPromises()

      expect(mockRetry).not.toHaveBeenCalled()
      expect(mockAddToast).toHaveBeenCalledWith(expect.any(String), 'error')
    })

    test('offers quit after a blocked unlock attempt rejects', async () => {
      useRhythmGameLogic.mockReturnValue({
        stats: { audioStatus: 'blocked' },
        actions: { retryAudioInitialization: vi.fn() },
        gameStateRef: { current: {} },
        update: vi.fn()
      })
      audioService.ensureAudioContext.mockRejectedValue(new Error('denied'))

      render(<Gig />)
      expect(screen.queryByText(/QUIT GIG/i)).toBeNull()
      await act(async () => {
        fireEvent.click(screen.getByText(/INITIALIZE AUDIO/i))
      })
      await flushPromises()

      expect(screen.getByText(/QUIT GIG/i)).toBeInTheDocument()
      expect(mockAddToast).toHaveBeenCalledWith(expect.any(String), 'error')
    })

    test('does not render main gig UI when audio locked', async () => {
      useRhythmGameLogic.mockReturnValue({
        stats: { audioStatus: 'blocked' },
        actions: { retryAudioInitialization: vi.fn() },
        gameStateRef: { current: {} },
        update: vi.fn()
      })

      render(<Gig />)
      expect(screen.queryByTestId('gig-hud')).toBeNull()
      expect(screen.queryByTestId('pixi-stage')).toBeNull()
    })
  })

  describe('audio unlock attempt lifetime', () => {
    let unlock
    let retry

    beforeEach(() => {
      unlock = Promise.withResolvers()
      retry = vi.fn()
      audioService.ensureAudioContext.mockReturnValue(unlock.promise)
      useRhythmGameLogic.mockReturnValue({
        stats: { audioStatus: 'failed', failureKind: 'stage' },
        actions: { retryAudioInitialization: retry },
        gameStateRef: sharedGameStateRef,
        update: vi.fn()
      })
    })

    const settle = async (deferred, outcome) => {
      await act(async () => {
        if (outcome === 'reject') deferred.reject(new Error('denied'))
        else deferred.resolve(outcome)
        await flushPromises()
      })
    }

    test('ignores a successful unlock after Quit without clearing submission', async () => {
      render(<Gig />)
      fireEvent.click(screen.getByText('RETRY'))
      await act(async () => {
        fireEvent.click(screen.getByText(/QUIT GIG/i))
      })
      expect(mockSetLastGigStats).toHaveBeenCalledTimes(1)
      expect(mockEndGig).toHaveBeenCalledTimes(1)
      expect(sharedGameStateRef.current.hasSubmittedResults).toBe(true)
      const toastCount = mockAddToast.mock.calls.length

      await settle(unlock, true)

      expect(retry).not.toHaveBeenCalled()
      expect(mockSetLastGigStats).toHaveBeenCalledTimes(1)
      expect(mockEndGig).toHaveBeenCalledTimes(1)
      expect(sharedGameStateRef.current.hasSubmittedResults).toBe(true)
      expect(mockAddToast).toHaveBeenCalledTimes(toastCount)
    })

    test.each([true, false, 'reject'])(
      'ignores %s after unmount',
      async outcome => {
        const { unmount } = render(<Gig />)
        fireEvent.click(screen.getByText('RETRY'))
        unmount()
        const toastCount = mockAddToast.mock.calls.length

        await settle(unlock, outcome)

        expect(retry).not.toHaveBeenCalled()
        expect(mockAddToast).toHaveBeenCalledTimes(toastCount)
      }
    )

    test.each([true, false])(
      'ignores an older overlapping attempt that resolves %s',
      async firstOutcome => {
        const latest = Promise.withResolvers()
        audioService.ensureAudioContext
          .mockReturnValueOnce(unlock.promise)
          .mockReturnValueOnce(latest.promise)
        render(<Gig />)
        fireEvent.click(screen.getByText('RETRY'))
        fireEvent.click(screen.getByText('RETRY'))

        await settle(unlock, firstOutcome)
        expect(retry).not.toHaveBeenCalled()
        expect(mockAddToast).not.toHaveBeenCalled()

        await settle(latest, true)
        expect(retry).toHaveBeenCalledTimes(1)
        expect(mockAddToast).not.toHaveBeenCalled()
      }
    )

    test('retries exactly once when the mounted current attempt unlocks', async () => {
      render(
        <StrictMode>
          <Gig />
        </StrictMode>
      )
      fireEvent.click(screen.getByText('RETRY'))
      await settle(unlock, true)
      expect(retry).toHaveBeenCalledTimes(1)
      expect(mockAddToast).not.toHaveBeenCalled()
    })

    test('ignores unlock after shared results are submitted without Quit', async () => {
      render(<Gig />)
      fireEvent.click(screen.getByText('RETRY'))
      sharedGameStateRef.current.hasSubmittedResults = true
      await settle(unlock, true)
      expect(retry).not.toHaveBeenCalled()
      expect(mockAddToast).not.toHaveBeenCalled()
      expect(sharedGameStateRef.current.hasSubmittedResults).toBe(true)
    })

    test.each([false, 'reject'])(
      'retains failure feedback for a mounted %s result',
      async outcome => {
        useRhythmGameLogic.mockReturnValue({
          stats: { audioStatus: 'blocked' },
          actions: { retryAudioInitialization: retry },
          gameStateRef: sharedGameStateRef,
          update: vi.fn()
        })
        render(<Gig />)
        expect(screen.queryByText(/QUIT GIG/i)).toBeNull()
        fireEvent.click(screen.getByText(/INITIALIZE AUDIO/i))
        await settle(unlock, outcome)

        expect(retry).not.toHaveBeenCalled()
        expect(mockAddToast).toHaveBeenCalledTimes(1)
        expect(mockAddToast).toHaveBeenCalledWith(expect.any(String), 'error')
        expect(screen.getByText(/QUIT GIG/i)).toBeInTheDocument()
      }
    )
  })

  describe('Toxic Mode Visual Effects', () => {
    test('applies toxic mode border when isToxicMode is true', async () => {
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
  describe('Edge Cases', () => {
    test.each([
      { desc: 'missing currentGig name', currentGig: { id: 'gig', diff: 3 } },
      {
        desc: 'missing currentGig diff',
        currentGig: { id: 'gig', name: 'Test' }
      },
      { desc: 'minimum required props', currentGig: { id: 'gig' } },
      {
        desc: 'festival venue names',
        currentGig: { id: 'gig', name: 'Summer Festival', diff: 5 }
      },
      {
        desc: 'open air venue names',
        currentGig: { id: 'gig', name: 'Open Air Stage', diff: 4 }
      }
    ])('handles $desc gracefully', ({ currentGig }) => {
      useGameActions.mockReturnValue({
        currentGig,
        changeScene: vi.fn(),
        addToast: vi.fn(),
        setActiveEvent: vi.fn(),
        setLastGigStats: vi.fn(),
        band: { harmony: 70 },
        endGig: vi.fn()
      })

      // We expect the fallback diff to be applied without crashing
      render(<Gig />)
      expect(screen.getByTestId('gig-hud')).toBeInTheDocument()
    })
  })
})
