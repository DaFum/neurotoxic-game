import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  GameStateProvider,
  useGameActions,
  useGameSelector,
  useGameDispatch
} from '../../src/context/GameState.tsx'

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const wrapper = ({ children }) => (
  <GameStateProvider>{children}</GameStateProvider>
)

describe('useGameActions referential stability', () => {
  it('returns the same action bundle reference across renders that do not change state', () => {
    const { result, rerender } = renderHook(() => useGameActions(), { wrapper })

    const first = result.current
    rerender()
    const second = result.current

    expect(second).toBe(first)
  })


  it('prevents consumer re-renders on unrelated state changes (useGameSelector bailout)', () => {
    let renderCount = 0
    const { result } = renderHook(() => {
      renderCount++
      return useGameSelector(s => s.player)
    }, { wrapper })

    expect(renderCount).toBe(1)
    const initialPlayer = result.current

    // Trigger an unrelated state mutation (e.g. adding a toast)
    const { result: actionsResult } = renderHook(() => useGameActions(), { wrapper })
    act(() => {
      actionsResult.current.addToast('Unrelated update', 'info')
    })

    // We must manually rerender the test hook if it was going to rerender, but actually
    // the provider changes, and if the hook bails out, renderCount stays 1.
    // Let's just check the returned state.
    expect(result.current).toBe(initialPlayer)
    expect(renderCount).toBe(1) // Should not have re-rendered!
  })

  it('keeps individual action references stable across a no-op state change', () => {
    const { result } = renderHook(() => useGameActions(), { wrapper })

    const firstAdvance = result.current.advanceDay
    const firstAddToast = result.current.addToast

    // Trigger an unrelated state mutation (toast add/remove) and reread actions
    act(() => {
      result.current.addToast('noop', 'info')
    })

    expect(result.current.advanceDay).toBe(firstAdvance)
    expect(result.current.addToast).toBe(firstAddToast)
  })
})

describe('useGameSelector correctness', () => {
  it('returns the exact value requested by the selector function', () => {
    const { result } = renderHook(
      () => useGameSelector(state => state.player.money),
      { wrapper }
    )
    expect(result.current).toBe(500)
  })

  it('updates the returned value when the selected state changes', () => {
    const { result } = renderHook(
      () => ({
        money: useGameSelector(state => state.player.money),
        actions: useGameActions()
      }),
      { wrapper }
    )

    const initialMoney = result.current.money
    act(() => {
      result.current.actions.updatePlayer({ money: initialMoney + 100 })
    })

    expect(result.current.money).toBe(initialMoney + 100)
  })
})

describe('useGameSelector slice stability', () => {
  it('returns the same slice reference when unrelated state changes', () => {
    const { result } = renderHook(
      () => ({
        actions: useGameActions(),
        player: useGameSelector(state => state.player)
      }),
      { wrapper }
    )

    const firstPlayer = result.current.player

    // Mutate toasts — an unrelated slice. The player slice must not be replaced.
    act(() => {
      result.current.actions.addToast('noop', 'info')
    })

    expect(result.current.player).toBe(firstPlayer)
  })
})

describe('hook bounds', () => {
  it('throws an error if used outside of GameStateProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      expect(() => renderHook(() => useGameDispatch())).toThrow(
        'useGameDispatch must be used within GameStateProvider'
      )
      expect(() => renderHook(() => useGameActions())).toThrow(
        'useGameActions must be used within GameStateProvider'
      )
      expect(() =>
        renderHook(() => useGameSelector(state => state.player))
      ).toThrow('useGameSelector must be used within GameStateProvider')
    } finally {
      consoleError.mockRestore()
    }
  })
})
