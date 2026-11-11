import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { GAME_PHASES } from '../../src/context/gameConstants'

const mockMove = vi.fn()
const mockChangeScene = vi.fn()

let mockUiState = {
  itemsRemaining: 0,
  itemsDelivered: 3,
  currentDamage: 0,
  carrying: null,
  isGameOver: false
}

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (_key, options) => `Equipment Damage: ${options?.damage ?? 'missing'}%`
  })
}))

vi.mock('../../src/hooks/minigames/useRoadieLogic', () => ({
  useRoadieLogic: (options = {}) => ({
    uiState: mockUiState,
    gameStateRef: { current: {} },
    stats: {},
    update: vi.fn(),
    actions: { move: mockMove },
    options
  })
}))

vi.mock('../../src/components/stage/RoadieStageController', () => ({
  createRoadieStageController: vi.fn()
}))

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({ changeScene: mockChangeScene })
}))

vi.mock('../../src/components/MinigameSceneFrame', () => ({
  MinigameSceneFrame: ({
    children,
    completionTitle = 'COMPLETE',
    completionButtonText = 'CONTINUE',
    renderCompletionStats
  }) => (
    <div className='w-full h-full bg-void-black relative overflow-hidden flex flex-col items-center justify-center'>
      <div
        className='absolute inset-0 pointer-events-none'
        data-testid='mock-pixi-stage'
      />
      {children}
      <div
        className='fixed inset-0 z-(--z-modal) flex flex-col items-center justify-center backdrop-blur-sm pointer-events-auto'
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--color-void-black) 80%, transparent)'
        }}
        role='dialog'
        aria-modal='true'
        aria-labelledby='completion-title'
      >
        <h1
          id='completion-title'
          className='text-4xl text-toxic-green font-bold mb-4'
        >
          {completionTitle}
        </h1>
        <div className='text-star-white mb-8'>
          <div>{renderCompletionStats({ currentDamage: Number.NaN })}</div>
          <div>
            {renderCompletionStats({ currentDamage: Number.POSITIVE_INFINITY })}
          </div>
        </div>
        <button type='button'>{completionButtonText}</button>
      </div>
    </div>
  )
}))

const { RoadieRunScene } = await import('../../src/scenes/RoadieRunScene.tsx')

describe('RoadieRunScene', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockUiState = {
      itemsRemaining: 0,
      itemsDelivered: 3,
      currentDamage: 0,
      carrying: null,
      isGameOver: false
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders finite completion damage for non-finite minigame state', () => {
    render(<RoadieRunScene />)

    expect(screen.getAllByText('Equipment Damage: 0%')).toHaveLength(2)
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument()
  })

  it('calls changeScene(GAME_PHASES.GIG) after 10-second completion fallback timer when game is over', () => {
    mockUiState = {
      ...mockUiState,
      isGameOver: true
    }

    render(<RoadieRunScene />)

    expect(mockChangeScene).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(9999)
    })
    expect(mockChangeScene).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(mockChangeScene).toHaveBeenCalledTimes(1)
    expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.GIG)
  })

  it('clears the fallback timer on unmount before 10 seconds elapse', () => {
    mockUiState = {
      ...mockUiState,
      isGameOver: true
    }

    const { unmount } = render(<RoadieRunScene />)

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(mockChangeScene).not.toHaveBeenCalled()

    unmount()

    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(mockChangeScene).not.toHaveBeenCalled()
  })

  it('does not start the fallback timer while the minigame is in progress', () => {
    mockUiState = {
      ...mockUiState,
      isGameOver: false
    }

    render(<RoadieRunScene />)

    act(() => {
      vi.advanceTimersByTime(15000)
    })

    expect(mockChangeScene).not.toHaveBeenCalled()
  })
})
