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
  return {
    player: { money: 1000 },
    postOptionsDerivationError: null,
    isProcessingActionRef: { current: false },
    setIsProcessingAction: vi.fn(),
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

  it('guard is held (not reset) after successful dispatch', () => {
    const props = makeProps()
    const { result } = renderHook(() => useMinorHandlers(props))

    act(() => result.current.handleSpinStory())

    expect(props.isProcessingActionRef.current).toBe(true)
  })

  it('releases guard when not enough cash', async () => {
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
    expect(props.isProcessingActionRef.current).toBe(false)
    expect(props.setIsProcessingAction).toHaveBeenLastCalledWith(false)
  })

  it('no-ops when already processing', () => {
    const props = makeProps({ isProcessingActionRef: { current: true } })
    const { result } = renderHook(() => useMinorHandlers(props))

    act(() => result.current.handleSpinStory())

    expect(props.dispatchers.updatePlayer).not.toHaveBeenCalled()
  })
})
