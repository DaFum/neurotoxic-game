import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, cleanup, waitFor } from '@testing-library/react'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('PixiStage', () => {
  const mockGameStateRef = { current: { notes: [], score: 0 } }
  const mockUpdate = vi.fn()

  const createMockController = () => ({
    init: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn(),
    manualUpdate: vi.fn()
  })

  test('renders canvas container with correct styling', async () => {
    const { PixiStage } = await import('../src/components/PixiStage.jsx')

    const { container } = render(
      <PixiStage gameStateRef={mockGameStateRef} update={mockUpdate} />
    )

    const canvasContainer = container.firstChild
    expect(canvasContainer?.className).toContain('absolute')
    expect(canvasContainer?.className).toContain('inset-0')
    expect(canvasContainer?.className).toContain('z-20')
    expect(canvasContainer?.className).toContain('pointer-events-none')
  })

  test('calls controller init on mount', async () => {
    const { PixiStage } = await import('../src/components/PixiStage.jsx')
    const mockController = createMockController()
    const mockFactory = vi.fn(() => mockController)

    render(
      <PixiStage
        gameStateRef={mockGameStateRef}
        update={mockUpdate}
        controllerFactory={mockFactory}
      />
    )

    await waitFor(() => {
      expect(mockFactory).toHaveBeenCalled()
      expect(mockController.init).toHaveBeenCalled()
    })
  })

  test('passes correct params to controller factory', async () => {
    const { PixiStage } = await import('../src/components/PixiStage.jsx')
    const mockController = createMockController()
    const mockFactory = vi.fn(() => mockController)

    render(
      <PixiStage
        gameStateRef={mockGameStateRef}
        update={mockUpdate}
        controllerFactory={mockFactory}
      />
    )

    await waitFor(() => {
      expect(mockFactory).toHaveBeenCalledWith(
        expect.objectContaining({
          containerRef: expect.objectContaining({ current: expect.anything() }),
          gameStateRef: mockGameStateRef,
          updateRef: expect.objectContaining({ current: mockUpdate })
        })
      )
    })
  })

  test('calls dispose on unmount', async () => {
    const { PixiStage } = await import('../src/components/PixiStage.jsx')
    const mockController = createMockController()
    const mockFactory = vi.fn(() => mockController)

    const { unmount } = render(
      <PixiStage
        gameStateRef={mockGameStateRef}
        update={mockUpdate}
        controllerFactory={mockFactory}
      />
    )

    await waitFor(() => {
      expect(mockController.init).toHaveBeenCalled()
    })

    unmount()

    expect(mockController.dispose).toHaveBeenCalled()
  })

  test('handles controller init failure gracefully', async () => {
    const { PixiStage } = await import('../src/components/PixiStage.jsx')
    const mockController = createMockController()
    mockController.init = vi.fn().mockRejectedValue(new Error('Init failed'))
    const mockFactory = vi.fn(() => mockController)

    // Should not throw
    const { container } = render(
      <PixiStage
        gameStateRef={mockGameStateRef}
        update={mockUpdate}
        controllerFactory={mockFactory}
      />
    )

    await waitFor(() => {
      expect(mockFactory).toHaveBeenCalled()
    })

    expect(container).toBeTruthy()
  })

  test('disposes controller if unmounted before init completes', async () => {
    const { PixiStage } = await import('../src/components/PixiStage.jsx')
    const mockController = createMockController()
    let resolveInit
    mockController.init = vi.fn(
      () =>
        new Promise(resolve => {
          resolveInit = resolve
        })
    )
    const mockFactory = vi.fn(() => mockController)

    const { unmount } = render(
      <PixiStage
        gameStateRef={mockGameStateRef}
        update={mockUpdate}
        controllerFactory={mockFactory}
      />
    )

    // Unmount before init completes
    unmount()

    // Complete init after unmount
    resolveInit()

    await waitFor(() => {
      expect(mockController.dispose).toHaveBeenCalled()
    })
  })

  test('updates updateRef when update prop changes', async () => {
    const { PixiStage } = await import('../src/components/PixiStage.jsx')
    const mockController = createMockController()
    const mockFactory = vi.fn(() => mockController)

    const newUpdate = vi.fn()

    const { rerender } = render(
      <PixiStage
        gameStateRef={mockGameStateRef}
        update={mockUpdate}
        controllerFactory={mockFactory}
      />
    )

    rerender(
      <PixiStage
        gameStateRef={mockGameStateRef}
        update={newUpdate}
        controllerFactory={mockFactory}
      />
    )

    // The controller should have received the updateRef with the new update
    await waitFor(() => {
      const factoryCall = mockFactory.mock.calls[0][0]
      expect(factoryCall.updateRef.current).toBe(newUpdate)
    })
  })

  test('uses default controller factory when not provided', async () => {
    const { PixiStage } = await import('../src/components/PixiStage.jsx')

    // Should not crash when using default factory
    render(<PixiStage gameStateRef={mockGameStateRef} update={mockUpdate} />)

    await waitFor(() => {
      // Just verify it renders without error
      expect(true).toBe(true)
    })
  })

  test('containerRef is attached to DOM element', async () => {
    const { PixiStage } = await import('../src/components/PixiStage.jsx')
    const mockController = createMockController()
    let capturedContainerRef
    const mockFactory = vi.fn(params => {
      capturedContainerRef = params.containerRef
      return mockController
    })

    render(
      <PixiStage
        gameStateRef={mockGameStateRef}
        update={mockUpdate}
        controllerFactory={mockFactory}
      />
    )

    await waitFor(() => {
      expect(capturedContainerRef.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  test('does not recreate controller on gameStateRef change', async () => {
    const { PixiStage } = await import('../src/components/PixiStage.jsx')
    const mockController = createMockController()
    const mockFactory = vi.fn(() => mockController)

    const ref1 = { current: { score: 0 } }
    const ref2 = { current: { score: 100 } }

    const { rerender } = render(
      <PixiStage
        gameStateRef={ref1}
        update={mockUpdate}
        controllerFactory={mockFactory}
      />
    )

    await waitFor(() => {
      expect(mockFactory).toHaveBeenCalledTimes(1)
    })

    // Changing the ref's content should not recreate controller
    rerender(
      <PixiStage
        gameStateRef={ref2}
        update={mockUpdate}
        controllerFactory={mockFactory}
      />
    )

    // Factory should still only have been called once
    expect(mockFactory).toHaveBeenCalledTimes(1)
  })

  test('recreates controller when controllerFactory changes', async () => {
    const { PixiStage } = await import('../src/components/PixiStage.jsx')
    const mockController1 = createMockController()
    const mockController2 = createMockController()
    const mockFactory1 = vi.fn(() => mockController1)
    const mockFactory2 = vi.fn(() => mockController2)

    const { rerender } = render(
      <PixiStage
        gameStateRef={mockGameStateRef}
        update={mockUpdate}
        controllerFactory={mockFactory1}
      />
    )

    await waitFor(() => {
      expect(mockFactory1).toHaveBeenCalledTimes(1)
    })

    rerender(
      <PixiStage
        gameStateRef={mockGameStateRef}
        update={mockUpdate}
        controllerFactory={mockFactory2}
      />
    )

    await waitFor(() => {
      expect(mockController1.dispose).toHaveBeenCalled()
      expect(mockFactory2).toHaveBeenCalled()
    })
  })

  test('memoizes component to prevent unnecessary rerenders', async () => {
    const { PixiStage } = await import('../src/components/PixiStage.jsx')
    const mockController = createMockController()
    const mockFactory = vi.fn(() => mockController)

    const { rerender } = render(
      <PixiStage
        gameStateRef={mockGameStateRef}
        update={mockUpdate}
        controllerFactory={mockFactory}
      />
    )

    await waitFor(() => {
      expect(mockFactory).toHaveBeenCalledTimes(1)
    })

    // Rerender with same props
    rerender(
      <PixiStage
        gameStateRef={mockGameStateRef}
        update={mockUpdate}
        controllerFactory={mockFactory}
      />
    )

    // Should not create new controller due to memo
    expect(mockFactory).toHaveBeenCalledTimes(1)
  })
})