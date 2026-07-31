import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TourbusScene } from '../../src/scenes/TourbusScene'

const moveLeft = vi.fn()
const moveRight = vi.fn()
const handleArrivalSequence = vi.fn()

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (_k, o) => (_k === 'ui:continue' ? 'WEITER' : (o?.defaultValue ?? _k))
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
