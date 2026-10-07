import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TourbusScene } from '../../src/scenes/TourbusScene'

const moveLeft = vi.fn()
const moveRight = vi.fn()
const handleArrivalSequence = vi.fn()

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (_k, o) =>
      _k === 'ui:continue'
        ? 'WEITER'
        : (o?.defaultValue ?? _k).replace(/\{\{(\w+)\}\}/g, (_m, name) =>
            String(o?.[name])
          )
  })
}))

vi.mock('../../src/hooks/minigames/useTourbusLogic', () => ({
  useTourbusLogic: () => ({
    uiState: { distance: 123, damage: 40, isComplete: false },
    gameStateRef: { current: {} },
    stats: {},
    update: vi.fn(),
    actions: { moveLeft, moveRight }
  })
}))

vi.mock('../../src/hooks/useArrivalLogic', () => ({
  useArrivalLogic: () => ({ handleArrivalSequence })
}))

vi.mock('../../src/components/stage/TourbusStageController', () => ({
  createTourbusStageController: vi.fn()
}))

vi.mock('../../src/components/MinigameSceneFrame', () => ({
  MinigameSceneFrame: ({
    children,
    onComplete,
    completionButtonText,
    renderCompletionStats
  }) => (
    <div>
      <button type='button' onClick={() => onComplete()}>
        {completionButtonText}
      </button>
      <div>{renderCompletionStats({ damage: 40 })}</div>
      <div data-testid='hostile-stats'>
        {renderCompletionStats({ damage: '40' })}
        {renderCompletionStats({ damage: Number.NaN })}
      </div>
      {children}
    </div>
  )
}))

describe('TourbusScene', () => {
  it('renders overlays and routes controls/completion actions', () => {
    render(<TourbusScene />)

    expect(screen.getByText('TOURBUS TERROR')).toBeInTheDocument()
    expect(screen.getByText(/DISTANCE:/)).toBeInTheDocument()
    expect(screen.getByText(/DAMAGE:/)).toBeInTheDocument()
    expect(screen.getByText('Condition Loss: 20%')).toBeInTheDocument()
    // Numeric strings and NaN are not coerced: both fall back to zero damage.
    expect(screen.getByTestId('hostile-stats')).toHaveTextContent(
      'Condition Loss: 0%Condition Loss: 0%'
    )
    const completionButton = screen.getByRole('button', { name: 'WEITER' })
    expect(completionButton).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Move Left'))
    fireEvent.click(screen.getByLabelText('Move Right'))
    fireEvent.click(completionButton)

    expect(moveLeft).toHaveBeenCalled()
    expect(moveRight).toHaveBeenCalled()
    expect(handleArrivalSequence).toHaveBeenCalled()
  })
})
