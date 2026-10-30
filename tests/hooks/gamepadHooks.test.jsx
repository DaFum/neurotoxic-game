import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGigInput } from '../../src/hooks/useGigInput'
import { useTourbusLogic } from '../../src/hooks/minigames/useTourbusLogic'
import { useRoadieLogic } from '../../src/hooks/minigames/useRoadieLogic'
import { useGamepadActions } from '../../src/context/GamepadInputContext'
import { GameStateProvider } from '../../src/context/GameState'
import { GamepadInputProvider } from '../../src/context/GamepadInputContext'

const wrapper = ({ children }) => (
  <GameStateProvider>
    <GamepadInputProvider>{children}</GamepadInputProvider>
  </GameStateProvider>
)

describe('Gamepad Hooks Integration', () => {
  let mockActions
  let mockGameStateRef

  beforeEach(() => {
    mockActions = {
      registerInput: vi.fn(),
      togglePause: vi.fn()
    }
    mockGameStateRef = {
      current: {
        lanes: [
          { id: 'guitar', key: 'a' },
          { id: 'drums', key: 's' },
          { id: 'bass', key: 'd' }
        ]
      }
    }
  })

  it('useGigInput handles lane press and release without repeats', () => {
    const triggerAnim = vi.fn()
    const { result } = renderHook(
      () =>
        useGigInput({
          actions: mockActions,
          gameStateRef: mockGameStateRef,
          triggerBandAnimation: triggerAnim,
          onTogglePause: vi.fn()
        }),
      { wrapper }
    )

    act(() => {
      result.current.handleLaneInput(0, true)
    })

    expect(mockActions.registerInput).toHaveBeenCalledWith(0, true)
    expect(triggerAnim).toHaveBeenCalledWith(0)

    act(() => {
      result.current.handleLaneInput(0, false)
    })

    expect(mockActions.registerInput).toHaveBeenCalledWith(0, false)
  })

  it('useTourbusLogic updates busLane on moveLeft and moveRight', () => {
    const { result } = renderHook(() => useTourbusLogic(), { wrapper })

    act(() => {
      result.current.actions.moveLeft()
    })
    expect(result.current.gameStateRef.current.busLane).toBe(0)

    act(() => {
      result.current.actions.moveRight()
    })
    expect(result.current.gameStateRef.current.busLane).toBe(1)
  })

  it('useRoadieLogic updates playerPos on move', () => {
    const { result } = renderHook(() => useRoadieLogic(), { wrapper })

    const initialX = result.current.gameStateRef.current.playerPos.x
    act(() => {
      result.current.actions.move(1, 0)
    })
    expect(result.current.gameStateRef.current.playerPos.x).toBe(initialX + 1)
  })

  it('Back/Menu-only consumer does not consume direction or lane inputs', () => {
    const onBack = vi.fn()
    const onMenu = vi.fn()

    const { unmount } = renderHook(
      () =>
        useGamepadActions(
          { onBack, onMenu },
          { enabled: true, consumes: ['back', 'menu'] }
        ),
      { wrapper }
    )

    expect(onBack).not.toHaveBeenCalled()
    expect(onMenu).not.toHaveBeenCalled()
    unmount()
  })
})
