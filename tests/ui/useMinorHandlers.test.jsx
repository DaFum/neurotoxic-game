import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../../src/utils/postGig', () => ({
  getSpinStoryMoneyUpdate: vi.fn(() => ({
    success: true,
    nextMoney: 900,
    appliedDelta: -100
  })),
  getSpinStorySocialUpdate: vi.fn(prev => prev),
  buildPerGigSocialReconciliation: vi.fn(() => ({
    lastGigDay: 7,
    lastGigDifficulty: 3,
    regionalGigHistory: { BERLIN: [7] },
    activeDeals: []
  }))
}))

vi.mock('../../src/utils/numberUtils', async importOriginal => {
  const actual = await importOriginal()
  return { ...actual, formatCurrency: vi.fn(actual.formatCurrency) }
})

import { formatCurrency } from '../../src/utils/numberUtils'
import { useMinorHandlers } from '../../src/hooks/postGig/handlers/useMinorHandlers'

const t = (key, opts) => opts?.defaultValue ?? key

function makeDispatchers() {
  return {
    updatePlayer: vi.fn(),
    updateSocial: vi.fn(),
    applyGigSocialReconciliation: vi.fn(),
    addToast: vi.fn(),
    setPhase: vi.fn(),
    setPostResult: vi.fn(),
    saveGameAfterStateCommit: vi.fn()
  }
}

function makeProps(overrides = {}) {
  const dispatchers = overrides.dispatchers ?? makeDispatchers()
  const hasSpunRef = overrides.hasSpunRef ?? { current: false }
  const setHasSpun = overrides.setHasSpun ?? vi.fn()
  return {
    player: { money: 1000, day: 7, location: 'venues:berlin_club.name' },
    expedition: { status: 'idle', protectedCareerCash: 0 },
    social: { activeDeals: [{ id: 'deal_1', remainingGigs: 2 }] },
    currentGig: { id: 'berlin_club', diff: 3 },
    postOptionsDerivationError: null,
    isProcessingActionRef: { current: false },
    setIsProcessingAction: vi.fn(),
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

  it('bakes the signed money delta into the toast (#3467)', () => {
    const props = makeProps()
    const { result } = renderHook(() => useMinorHandlers(props))

    act(() => result.current.handleSpinStory())

    expect(formatCurrency).toHaveBeenCalledTimes(1)
    const [value, , signDisplay] = formatCurrency.mock.calls[0]
    expect(value).toBe(-100)
    expect(signDisplay).toBe('always')
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
    const { getSpinStoryMoneyUpdate } = await import('../../src/utils/postGig')
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

describe('useMinorHandlers — handleNextPhase', () => {
  beforeEach(() => vi.clearAllMocks())

  it('routes to SOCIAL without touching social state when options generated', () => {
    const props = makeProps()
    const { result } = renderHook(() => useMinorHandlers(props))

    act(() => result.current.handleNextPhase())

    expect(props.dispatchers.setPhase).toHaveBeenCalledWith('SOCIAL')
    expect(props.dispatchers.updateSocial).not.toHaveBeenCalled()
  })

  it('still reconciles per-gig social state when post options failed', async () => {
    const { buildPerGigSocialReconciliation } =
      await import('../../src/utils/postGig')
    const props = makeProps({
      postOptionsDerivationError: new Error('boom')
    })
    const { result } = renderHook(() => useMinorHandlers(props))

    act(() => result.current.handleNextPhase())

    // The gig happened, so deal countdowns and gig markers must advance even
    // though the player never reaches the social-post step.
    expect(buildPerGigSocialReconciliation).toHaveBeenCalledWith({
      player: props.player,
      social: props.social,
      currentGig: props.currentGig
    })
    expect(props.dispatchers.applyGigSocialReconciliation).toHaveBeenCalledWith(
      {
        lastGigDay: 7,
        lastGigDifficulty: 3,
        regionalGigHistory: { BERLIN: [7] },
        activeDeals: []
      },
      undefined
    )
    expect(props.dispatchers.saveGameAfterStateCommit).toHaveBeenCalledTimes(1)
    expect(props.dispatchers.updateSocial).not.toHaveBeenCalled()
    expect(props.dispatchers.setPhase).toHaveBeenCalledWith('COMPLETE')
  })

  it('completes the phase even when reconciliation throws', async () => {
    const { buildPerGigSocialReconciliation } =
      await import('../../src/utils/postGig')
    buildPerGigSocialReconciliation.mockImplementationOnce(() => {
      throw new Error('invalid remainingGigs')
    })

    const props = makeProps({
      postOptionsDerivationError: new Error('boom')
    })
    const { result } = renderHook(() => useMinorHandlers(props))

    act(() => result.current.handleNextPhase())

    expect(
      props.dispatchers.applyGigSocialReconciliation
    ).not.toHaveBeenCalled()
    expect(props.dispatchers.updateSocial).not.toHaveBeenCalled()
    expect(props.dispatchers.setPhase).toHaveBeenCalledWith('COMPLETE')
    expect(props.dispatchers.addToast).toHaveBeenCalledWith(
      expect.any(String),
      'error'
    )
  })

  it('reconciles, saves and toasts only once on a double "Next" (#3467)', () => {
    const props = makeProps({
      postOptionsDerivationError: new Error('boom'),
      pendingSettlementId: null
    })
    const { result } = renderHook(() => useMinorHandlers(props))

    act(() => {
      result.current.handleNextPhase()
      result.current.handleNextPhase()
    })

    expect(
      props.dispatchers.applyGigSocialReconciliation
    ).toHaveBeenCalledTimes(1)
    expect(props.dispatchers.saveGameAfterStateCommit).toHaveBeenCalledTimes(1)
    expect(props.dispatchers.addToast).toHaveBeenCalledTimes(1)
    expect(props.dispatchers.setPhase).toHaveBeenCalledTimes(1)
    // The phase change releases the shared guard, not this handler.
    expect(props.isProcessingActionRef.current).toBe(true)
    expect(props.setIsProcessingAction).toHaveBeenCalledWith(true)
  })

  it('is a no-op while another post-gig action holds the shared guard', () => {
    const props = makeProps({ isProcessingActionRef: { current: true } })
    const { result } = renderHook(() => useMinorHandlers(props))

    act(() => result.current.handleNextPhase())

    expect(props.dispatchers.setPhase).not.toHaveBeenCalled()
  })
})
