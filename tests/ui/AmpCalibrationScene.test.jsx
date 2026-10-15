import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

const mockFinishMinigame = vi.fn()
const mockUpdate = vi.fn()
const mockGameStateRef = { current: {} }
const viewProps = vi.fn()

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: key => key })
}))

vi.mock('../../src/hooks/minigames/useAmpLogic', () => ({
  useAmpLogic: () => ({
    update: mockUpdate,
    gameStateRef: mockGameStateRef,
    finishMinigame: mockFinishMinigame,
    uiState: { isGameOver: false }
  })
}))

vi.mock('../../src/components/stage/AmpStageController', () => ({
  createAmpStageController: vi.fn()
}))

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({ changeScene: vi.fn() })
}))

vi.mock('../../src/components/minigames/amp/AmpCalibrationView', () => ({
  AmpCalibrationView: props => {
    viewProps(props)
    return (
      <div className='w-full h-full relative' data-testid='amp-view'>
        <div data-testid='mock-pixi-stage' />
      </div>
    )
  }
}))

const { AmpCalibrationScene } =
  await import('../../src/scenes/AmpCalibrationScene.tsx')

describe('AmpCalibrationScene', () => {
  it('forwards finishMinigame through the scene logic object', () => {
    render(<AmpCalibrationScene />)

    const props = viewProps.mock.lastCall?.[0]
    expect(props.logic.finishMinigame).toBe(mockFinishMinigame)
    expect(props.logic.update).toBe(mockUpdate)
    expect(props.logic.gameStateRef).toBe(mockGameStateRef)
    expect(props).not.toHaveProperty('finishMinigame')
  })
})
