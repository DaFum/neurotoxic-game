import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../../src/utils/postGigUtils', () => ({
  getAcceptDealMoneyUpdate: vi.fn(() => ({
    nextMoney: 1500,
    appliedMoneyDelta: 500
  })),
  getAcceptDealBandUpdateFactory: vi.fn(() => prev => prev),
  getAcceptDealSocialUpdateFactory: vi.fn(() => prev => prev),
  getSpinStoryMoneyUpdate: vi.fn(() => ({
    success: true,
    nextMoney: 900,
    appliedDelta: -100
  })),
  getSpinStorySocialUpdateFactory: vi.fn(() => prev => prev)
}))
vi.mock('../../src/quests/producers/brandQuestEvents', () => ({
  createBrandOfferAcceptedQuestEvent: vi.fn(() => ({
    type: 'brand.offerAccepted'
  })),
  createBrandDealCompletedQuestEvent: vi.fn(() => ({
    type: 'brand.dealCompleted'
  })),
  createBrandTrustChangedQuestEvent: vi.fn(() => ({
    type: 'brand.trustChanged'
  }))
}))
vi.mock('../../src/quests/producers/economyQuestEvents', () => ({
  createMoneyEarnedQuestEvent: vi.fn(() => ({ type: 'economy.moneyEarned' }))
}))

import { useDealHandlers } from '../../src/hooks/postGig/handlers/useDealHandlers'

const t = (key, opts) => opts?.defaultValue ?? key

function makeDispatchers() {
  return {
    updatePlayer: vi.fn(),
    updateBand: vi.fn(),
    updateSocial: vi.fn(),
    applyQuestEvent: vi.fn(),
    addToast: vi.fn(),
    setPhase: vi.fn(),
    setBrandOffers: vi.fn()
  }
}

function makeProps(overrides = {}) {
  const dispatchers = overrides.dispatchers ?? makeDispatchers()
  return {
    player: { money: 1000, fame: 10, day: 3, location: 'berlin' },
    social: { followers: 500, brandReputation: {} },
    isProcessingActionRef: { current: false },
    setIsProcessingAction: vi.fn(),
    t,
    dispatchers,
    ...overrides
  }
}

const baseDeal = {
  id: 'd1',
  name: 'BrandX',
  description: 'A deal',
  offer: { upfront: 500, duration: 3 }
}

describe('useDealHandlers — handleAcceptDeal single-shot guard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('applies side-effects and routes to COMPLETE', () => {
    const props = makeProps()
    const { result } = renderHook(() => useDealHandlers(props))

    act(() => result.current.handleAcceptDeal(baseDeal))

    expect(props.dispatchers.setPhase).toHaveBeenCalledWith('COMPLETE')
    expect(props.dispatchers.setBrandOffers).toHaveBeenCalledWith([])
  })

  it('rejecting deals clears offers, completes the phase, and toasts', () => {
    const props = makeProps()
    const { result } = renderHook(() => useDealHandlers(props))

    act(() => result.current.handleRejectDeals())

    expect(props.dispatchers.setBrandOffers).toHaveBeenCalledWith([])
    expect(props.dispatchers.setPhase).toHaveBeenCalledWith('COMPLETE')
    expect(props.dispatchers.addToast).toHaveBeenCalledWith(
      expect.any(String),
      'info'
    )
  })

  it('double-click only applies side-effects once (guard held after dispatch)', () => {
    const props = makeProps()
    const { result } = renderHook(() => useDealHandlers(props))

    act(() => {
      result.current.handleAcceptDeal(baseDeal)
      result.current.handleAcceptDeal(baseDeal)
    })

    expect(props.dispatchers.setPhase).toHaveBeenCalledTimes(1)
    expect(props.dispatchers.updatePlayer).toHaveBeenCalledTimes(1)
  })

  it('guard is held (not reset) after successful dispatch', () => {
    const props = makeProps()
    const { result } = renderHook(() => useDealHandlers(props))

    act(() => result.current.handleAcceptDeal(baseDeal))

    expect(props.isProcessingActionRef.current).toBe(true)
  })

  it('no-ops when already processing', () => {
    const props = makeProps({ isProcessingActionRef: { current: true } })
    const { result } = renderHook(() => useDealHandlers(props))

    act(() => result.current.handleAcceptDeal(baseDeal))

    expect(props.dispatchers.setPhase).not.toHaveBeenCalled()
  })
})
