import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../../src/utils/postGigUtils', () => ({
  getSpinStoryMoneyUpdate: vi.fn(() => ({
    success: true,
    nextMoney: 900,
    appliedDelta: -100
  })),
  getSpinStorySocialUpdateFactory: vi.fn(() => prev => prev)
}))

import { useMinorHandlers } from '../../src/hooks/postGig/handlers/useMinorHandlers'

const t = (key, opts) => opts?.defaultValue ?? key

function makeDispatchers() {
  return {
    updatePlayer: vi.fn(),
    updateSocial: vi.fn(),
    addToast: vi.fn(),
    setPhase: vi.fn(),
    setPostResult: vi.fn()
  }
}

function makeProps(overrides = {}) {
  const dispatchers = overrides.dispatchers ?? makeDispatchers()
  const hasSpunRef = overrides.hasSpunRef ?? { current: false }
  const setHasSpun = overrides.setHasSpun ?? vi.fn()
  return {
    player: { money: 1000 },
    postOptionsDerivationError: null,
    hasSpunRef,
    setHasSpun,
    t,
    dispatchers,
    ...overrides
  }
}

describe('useMinorHandlers — handleSpinStory single-shot guard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('applies money and social updates on success', () => {
    const props = makeProps()
    const { result } = renderHook(() => useMinorHandlers(props))

    act(() => result.current.handleSpinStory())

    expect(props.dispatchers.updatePlayer).toHaveBeenCalledWith({ money: 900 })
    expect(props.dispatchers.updateSocial).toHaveBeenCalledTimes(1)
    expect(props.dispatchers.addToast).toHaveBeenCalledWith(
      expect.any(String),
      'success'
    )
  })

  it('double-click only applies side-effects once (guard held after dispatch)', () => {
    const props = makeProps()
    const { result } = renderHook(() => useMinorHandlers(props))

    act(() => {
      result.current.handleSpinStory()
      result.current.handleSpinStory()
    })

    expect(props.dispatchers.updatePlayer).toHaveBeenCalledTimes(1)
  })

  it('sets the spin-specific guard after successful dispatch', () => {
    const props = makeProps()
    const { result } = renderHook(() => useMinorHandlers(props))

    act(() => result.current.handleSpinStory())

    // The spin-specific guard is held (hasSpunRef set to true) so a successful
    // spin is one-shot, while the shared continue guard stays decoupled.
    expect(props.hasSpunRef.current).toBe(true)
    expect(props.setHasSpun).toHaveBeenCalledWith(true)
  })

  it('second call after successful spin is a no-op (hasSpunRef prevents re-dispatch)', () => {
    const props = makeProps()
    const { result } = renderHook(() => useMinorHandlers(props))

    act(() => result.current.handleSpinStory())
    // hasSpunRef.current is now true; second call must be ignored
    act(() => result.current.handleSpinStory())

    expect(props.dispatchers.updatePlayer).toHaveBeenCalledTimes(1)
    expect(props.setHasSpun).toHaveBeenCalledTimes(1)
  })

  it('does not set hasSpun when not enough cash (retry allowed)', async () => {
    const { getSpinStoryMoneyUpdate } =
      await import('../../src/utils/postGigUtils')
    getSpinStoryMoneyUpdate.mockReturnValueOnce({
      success: false,
      nextMoney: 0,
      appliedDelta: 0
    })

    const props = makeProps()
    const { result } = renderHook(() => useMinorHandlers(props))

    act(() => result.current.handleSpinStory())

    expect(props.dispatchers.updatePlayer).not.toHaveBeenCalled()
    // hasSpun must NOT be set — player should be able to retry after getting cash
    expect(props.hasSpunRef.current).toBe(false)
    expect(props.setHasSpun).not.toHaveBeenCalled()
  })

  it('no-ops when hasSpunRef is already true', () => {
    const props = makeProps({ hasSpunRef: { current: true } })
    const { result } = renderHook(() => useMinorHandlers(props))

    act(() => result.current.handleSpinStory())

    expect(props.dispatchers.updatePlayer).not.toHaveBeenCalled()
  })
})
