import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { IntroVideo } from '../src/scenes/IntroVideo'
import { useGameState } from '../src/context/GameState'
import { GAME_PHASES } from '../src/context/gameConstants'
import { logger } from '../src/utils/logger'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: key => key
  })
}))

// Mock GameState context
vi.mock('../src/context/GameState', () => ({
  useGameState: vi.fn()
}))

// Mock logger
vi.mock('../src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}))

// Mock GlitchButton to simplify testing
vi.mock('../src/ui/GlitchButton', () => ({
  GlitchButton: ({ children, onClick, className }) => (
    <button onClick={onClick} className={className} data-testid='glitch-button'>
      {children}
    </button>
  )
}))

// Mock video import
vi.mock('../src/assets/Neurotoxic_start.webm', () => ({
  default: 'mock-video-url.webm'
}))

describe('IntroVideo Component', () => {
  const mockChangeScene = vi.fn()
  let playPromiseResolve
  let playPromiseReject

  beforeEach(() => {
    vi.clearAllMocks()
    useGameState.mockReturnValue({
      changeScene: mockChangeScene
    })

    // Setup HTMLMediaElement mock
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: vi.fn(() => {
        return new Promise((resolve, reject) => {
          playPromiseResolve = resolve
          playPromiseReject = reject
        })
      })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders video with correct attributes', () => {
    const { container } = render(<IntroVideo />)
    const video = container.querySelector('video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('src', 'mock-video-url.webm')
    expect(video).toHaveAttribute('playsInline')
    expect(video).toHaveProperty('muted', true)
  })

  it('attempts to play video on mount and does not show overlay on success', async () => {
    render(<IntroVideo />)

    // play() should have been called
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1)

    // Resolve the play promise
    await act(async () => {
      playPromiseResolve()
    })

    // Fallback UI should not be visible
    expect(screen.queryByText('ui:intro_play')).not.toBeInTheDocument()
    // Skip button should be visible
    expect(screen.getByText('ui:intro_skip')).toBeInTheDocument()
  })

  it('shows fallback UI when autoplay is blocked', async () => {
    render(<IntroVideo />)

    // play() should have been called
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1)

    // Reject the play promise to simulate autoplay block
    await act(async () => {
      playPromiseReject(new Error('Autoplay blocked'))
    })

    // Fallback UI should be visible
    expect(screen.getByText('ui:intro_play')).toBeInTheDocument()
    // Skip button should also be visible
    expect(screen.getByText('ui:intro_skip')).toBeInTheDocument()

    // Logger should have warned
    expect(logger.warn).toHaveBeenCalledWith(
      'IntroVideo',
      'Intro video autoplay blocked',
      expect.any(Error)
    )
  })

  it('allows manual play when fallback UI is clicked', async () => {
    render(<IntroVideo />)

    // Reject initial autoplay
    await act(async () => {
      playPromiseReject(new Error('Autoplay blocked'))
    })

    // Fallback UI should be visible
    const playButton = screen.getByText('ui:intro_play')
    expect(playButton).toBeInTheDocument()

    // Click manual play
    await act(async () => {
      fireEvent.click(playButton)
    })

    // play() should be called again
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2)

    // Resolve manual play
    await act(async () => {
      playPromiseResolve()
    })

    // Fallback UI should be removed
    expect(screen.queryByText('ui:intro_play')).not.toBeInTheDocument()
  })

  it('logs error if manual play fails', async () => {
    render(<IntroVideo />)

    // Reject initial autoplay
    await act(async () => {
      playPromiseReject(new Error('Autoplay blocked'))
    })

    const playButton = screen.getByText('ui:intro_play')

    // Click manual play and reject
    await act(async () => {
      fireEvent.click(playButton)
    })

    await act(async () => {
      playPromiseReject(new Error('Manual play failed'))
    })

    // Fallback UI should still be visible
    expect(screen.getByText('ui:intro_play')).toBeInTheDocument()

    // Logger should have recorded error
    expect(logger.error).toHaveBeenCalledWith(
      'IntroVideo',
      'Manual play failed',
      expect.any(Error)
    )
  })

  it('changes scene to menu when skip button is clicked', () => {
    render(<IntroVideo />)

    const skipButton = screen.getByText('ui:intro_skip')
    fireEvent.click(skipButton)

    expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.MENU)
  })

  it('changes scene to menu when video ends', () => {
    render(<IntroVideo />)

    const video = document.querySelector('video')
    fireEvent.ended(video)

    expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.MENU)
  })

  it('changes scene to menu when video has an error (auto-skip)', () => {
    render(<IntroVideo />)

    const video = document.querySelector('video')
    fireEvent.error(video)

    expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.MENU)
  })

  it('changes scene to menu when video is clicked', () => {
    render(<IntroVideo />)

    const video = document.querySelector('video')
    fireEvent.click(video)

    expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.MENU)
  })
})
