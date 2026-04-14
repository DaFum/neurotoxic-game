import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MinigameSceneFrame } from '../src/components/MinigameSceneFrame.jsx'
import React from 'react'
import * as GameState from '../src/context/GameState.jsx'

vi.mock('../src/components/PixiStage', () => ({
  PixiStage: () => <div data-testid="pixi-stage">Pixi</div>
}))
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}))

vi.spyOn(GameState, 'useGameState').mockReturnValue({
  settings: { crtEnabled: false }
})

describe('MinigameSceneFrame', () => {
  it('renders Game Over and handles continue click', async () => {
    const onCompleteMock = vi.fn()
    const logicMock = {
      gameStateRef: { current: {} },
      update: vi.fn(),
      dispatch: vi.fn()
    }

    render(
      <MinigameSceneFrame
        controllerFactory={vi.fn()}
        logic={logicMock}
        uiState={{ isGameOver: true }}
        onComplete={onCompleteMock}
        completionButtonText="GIG STARTEN"
      />
    )

    const button = screen.getByText('GIG STARTEN')
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(onCompleteMock).toHaveBeenCalled()
  })
})
