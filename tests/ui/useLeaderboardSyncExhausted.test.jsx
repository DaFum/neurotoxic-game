import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLeaderboardSyncExhausted } from '../../src/hooks/useLeaderboardSync'

// A controller stand-in exposing the status API the hook reads. The real
// state machine is covered in tests/node/leaderboardSyncController.test.js;
// this suite pins the external-store wiring only.
const fakeController = vi.hoisted(() => {
  const listeners = new Set()
  const exhaustedPlayers = new Set()
  return {
    listeners,
    exhaustedPlayers,
    submit: () => {},
    dispose: () => {},
    getSyncStatus: playerId =>
      Object.freeze({ exhausted: exhaustedPlayers.has(playerId) }),
    subscribe: listener => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    }
  }
})

vi.mock('../../src/utils/leaderboardSyncController', () => ({
  createLeaderboardSyncController: () => fakeController
}))

const markExhausted = playerId => {
  fakeController.exhaustedPlayers.add(playerId)
  for (const listener of fakeController.listeners) listener()
}

describe('useLeaderboardSyncExhausted', () => {
  beforeEach(() => {
    fakeController.listeners.clear()
    fakeController.exhaustedPlayers.clear()
  })

  it('re-renders with true when the controller reports exhaustion', () => {
    const { result } = renderHook(() => useLeaderboardSyncExhausted('id-123'))
    expect(result.current).toBe(false)
    expect(fakeController.listeners.size).toBe(1)

    act(() => markExhausted('id-123'))

    expect(result.current).toBe(true)
  })

  it('ignores exhaustion of another player and a missing player id', () => {
    const { result, rerender } = renderHook(
      ({ playerId }) => useLeaderboardSyncExhausted(playerId),
      { initialProps: { playerId: 'id-123' } }
    )

    act(() => markExhausted('other-player'))
    expect(result.current).toBe(false)

    rerender({ playerId: null })
    expect(result.current).toBe(false)
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useLeaderboardSyncExhausted('id-123'))
    expect(fakeController.listeners.size).toBe(1)

    unmount()

    expect(fakeController.listeners.size).toBe(0)
  })
})
