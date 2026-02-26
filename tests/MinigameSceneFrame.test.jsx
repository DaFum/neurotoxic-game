import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, cleanup, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

// Mock GameState context
const mockGameState = {
  settings: { crtEnabled: false }
}

vi.mock('../src/context/GameState.jsx', () => ({
  useGameState: () => mockGameState
}))

// Mock PixiStage component
const mockPixiStage = vi.fn()
vi.mock('../src/components/PixiStage.jsx', () => ({
  PixiStage: (props) => {
    mockPixiStage(props)
    return <div data-testid='pixi-stage-mock'>Pixi Stage Mock</div>
  }
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('MinigameSceneFrame', () => {
  const mockControllerFactory = vi.fn()
  const mockLogic = {
    gameStateRef: { current: {} },
    update: vi.fn()
  }
  const mockOnComplete = vi.fn()

  test('renders PixiStage with correct props', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )

    render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: false }}
        onComplete={mockOnComplete}
      />
    )

    expect(screen.getByTestId('pixi-stage-mock')).toBeTruthy()
  })

  test('does not show CRT overlay when crtEnabled is false', async () => {
    mockGameState.settings.crtEnabled = false

    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )

    const { container } = render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: false }}
        onComplete={mockOnComplete}
      />
    )

    const crtOverlay = container.querySelector('.crt-overlay')
    expect(crtOverlay).toBeFalsy()
  })

  test('shows CRT overlay when crtEnabled is true', async () => {
    mockGameState.settings.crtEnabled = true

    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )

    const { container } = render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: false }}
        onComplete={mockOnComplete}
      />
    )

    const crtOverlay = container.querySelector('.crt-overlay')
    expect(crtOverlay).toBeTruthy()
  })

  test('does not show completion overlay when game is not over', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )

    render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: false }}
        onComplete={mockOnComplete}
      />
    )

    expect(screen.queryByText('COMPLETE')).toBeFalsy()
  })

  test('shows completion overlay when game is over', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )

    render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: true }}
        onComplete={mockOnComplete}
      />
    )

    expect(screen.getByText('COMPLETE')).toBeTruthy()
  })

  test('displays custom completion title', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )

    render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: true }}
        onComplete={mockOnComplete}
        completionTitle='VICTORY!'
      />
    )

    expect(screen.getByText('VICTORY!')).toBeTruthy()
  })

  test('displays custom completion button text', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )

    render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: true }}
        onComplete={mockOnComplete}
        completionButtonText='NEXT LEVEL'
      />
    )

    expect(screen.getByText('NEXT LEVEL')).toBeTruthy()
  })

  test('calls onComplete when continue button is clicked', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )
    const user = userEvent.setup()

    render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: true }}
        onComplete={mockOnComplete}
      />
    )

    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)

    expect(mockOnComplete).toHaveBeenCalledOnce()
  })

  test('renders custom completion stats when provided', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )

    const renderStats = uiState => (
      <div data-testid='custom-stats'>Score: {uiState.score}</div>
    )

    render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: true, score: 1000 }}
        onComplete={mockOnComplete}
        renderCompletionStats={renderStats}
      />
    )

    expect(screen.getByTestId('custom-stats')).toBeTruthy()
    expect(screen.getByText('Score: 1000')).toBeTruthy()
  })

  test('renders children elements', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )

    render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: false }}
        onComplete={mockOnComplete}
      >
        <div data-testid='custom-child'>Custom HUD</div>
      </MinigameSceneFrame>
    )

    expect(screen.getByTestId('custom-child')).toBeTruthy()
  })

  test('focuses continue button when game over', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )

    render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: true }}
        onComplete={mockOnComplete}
      />
    )

    await waitFor(() => {
      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(document.activeElement).toBe(continueButton)
    })
  })

  test('calls onComplete when Escape key is pressed during game over', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )
    const user = userEvent.setup()

    render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: true }}
        onComplete={mockOnComplete}
      />
    )

    await user.keyboard('{Escape}')

    expect(mockOnComplete).toHaveBeenCalledOnce()
  })

  test('does not call onComplete when Escape is pressed before game over', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )
    const user = userEvent.setup()

    render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: false }}
        onComplete={mockOnComplete}
      />
    )

    await user.keyboard('{Escape}')

    expect(mockOnComplete).not.toHaveBeenCalled()
  })

  test('restores focus to previous element on unmount', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )

    // Create a dummy focused element
    const dummyElement = document.createElement('button')
    document.body.appendChild(dummyElement)
    dummyElement.focus()

    const { unmount } = render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: true }}
        onComplete={mockOnComplete}
      />
    )

    // Continue button should be focused now
    const continueButton = screen.getByRole('button', { name: /continue/i })
    await waitFor(() => {
      expect(document.activeElement).toBe(continueButton)
    })

    unmount()

    // Focus should be restored to dummy element
    await waitFor(() => {
      expect(document.activeElement).toBe(dummyElement)
    })

    document.body.removeChild(dummyElement)
  })

  test('completion overlay has correct ARIA attributes', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )

    const { container } = render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: true }}
        onComplete={mockOnComplete}
      />
    )

    const dialog = container.querySelector('[role="dialog"]')
    expect(dialog).toBeTruthy()
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
    expect(dialog?.getAttribute('aria-labelledby')).toBe('completion-title')
  })

  test('passes logic.update and logic.gameStateRef to PixiStage', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )

    const customLogic = {
      gameStateRef: { current: { test: 'value' } },
      update: vi.fn()
    }

    render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={customLogic}
        uiState={{ isGameOver: false }}
        onComplete={mockOnComplete}
      />
    )

    // PixiStage mock should have been rendered with correct props
    expect(screen.getByTestId('pixi-stage-mock')).toBeTruthy()
    expect(mockPixiStage).toHaveBeenCalledWith(expect.objectContaining({
      gameStateRef: customLogic.gameStateRef,
      update: customLogic.update,
      controllerFactory: mockControllerFactory
    }))
  })

  test('handles missing optional props gracefully', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )

    // Should not crash with minimal props
    render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        onComplete={mockOnComplete}
      />
    )

    expect(screen.getByTestId('pixi-stage-mock')).toBeTruthy()
  })

  test('handles missing children prop', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )

    render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: false }}
        onComplete={mockOnComplete}
      />
    )

    // Should render without errors
    expect(screen.getByTestId('pixi-stage-mock')).toBeTruthy()
  })

  test('handles missing renderCompletionStats prop', async () => {
    const { MinigameSceneFrame } = await import(
      '../src/components/MinigameSceneFrame.jsx'
    )

    render(
      <MinigameSceneFrame
        controllerFactory={mockControllerFactory}
        logic={mockLogic}
        uiState={{ isGameOver: true }}
        onComplete={mockOnComplete}
      />
    )

    // Should render completion overlay without stats
    expect(screen.getByText('COMPLETE')).toBeTruthy()
    expect(screen.getByRole('button', { name: /continue/i })).toBeTruthy()
  })
})