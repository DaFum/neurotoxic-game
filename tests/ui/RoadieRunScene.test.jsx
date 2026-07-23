import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockMove = vi.fn()

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (_key, options) => `Equipment Damage: ${options?.damage ?? 'missing'}%`
  })
}))

vi.mock('../../src/hooks/minigames/useRoadieLogic', () => ({
  useRoadieLogic: () => ({
    uiState: {
      itemsRemaining: 0,
      itemsDelivered: 3,
      currentDamage: 0,
      carrying: null,
      isGameOver: false
    },
    gameStateRef: { current: {} },
    stats: {},
    update: vi.fn(),
    actions: { move: mockMove }
  })
}))

vi.mock('../../src/components/stage/RoadieStageController', () => ({
  createRoadieStageController: vi.fn()
}))

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({ changeScene: vi.fn() })
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
  it('renders finite completion damage for non-finite minigame state', () => {
    render(<RoadieRunScene />)

    expect(screen.getAllByText('Equipment Damage: 0%')).toHaveLength(2)
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument()
  })
})
