import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../../src/utils/crypto', () => ({
  secureRandom: vi.fn(() => 0.5),
  getSafeRandom: vi.fn(() => 0.5),
  getSafeUUID: vi.fn(() => 'test-uuid')
}))

import { usePostGigHandlers } from '../../src/hooks/usePostGigHandlers'

const t = (key, opts) => opts?.defaultValue ?? key

function makeProps(overrides = {}) {
  return {
    player: {
      money: 1000,
      fame: 10,
      day: 3,
      location: 'berlin',
      currentNodeId: 'n1'
    },
    band: { harmony: 80, members: [], inventory: {} },
    social: { followers: 500, brandReputation: {} },
    lastGigStats: { misses: 1 },
    currentGig: { id: 'venue_1' },
    postOptionsDerivationError: null,
    perfScore: 75,
    financials: null,
    activeStoryFlags: [],
    setlist: [],
    totalDailyObligations: 0,
    updatePlayer: vi.fn(),
    updateBand: vi.fn(),
    updateSocial: vi.fn(),

    addToast: vi.fn(),
    changeScene: vi.fn(),
    addQuest: vi.fn(),
    applyQuestEvent: vi.fn(),
    setPhase: vi.fn(),
    setBrandOffers: vi.fn(),
    setPostResult: vi.fn(),
    t,
    ...overrides
  }
}

describe('usePostGigHandlers (characterization)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exposes the full post-gig handler surface', () => {
    const { result } = renderHook(() => usePostGigHandlers(makeProps()))
    expect(typeof result.current.handlePostSelection).toBe('function')
    expect(typeof result.current.handleAcceptDeal).toBe('function')
    expect(typeof result.current.handleRejectDeals).toBe('function')
    expect(typeof result.current.handleSpinStory).toBe('function')
    expect(typeof result.current.handleContinue).toBe('function')
    expect(typeof result.current.handleNextPhase).toBe('function')
    expect(typeof result.current.isProcessingAction).toBe('boolean')
  })

  it('handleRejectDeals clears offers, completes the phase, and toasts', () => {
    const props = makeProps()
    const { result } = renderHook(() => usePostGigHandlers(props))

    act(() => result.current.handleRejectDeals())

    expect(props.setBrandOffers).toHaveBeenCalledWith([])
    expect(props.setPhase).toHaveBeenCalledWith('COMPLETE')
    expect(props.addToast).toHaveBeenCalledWith(expect.any(String), 'info')
  })

  it('handleContinue is a no-op without financials', () => {
    const props = makeProps({ financials: null })
    const { result } = renderHook(() => usePostGigHandlers(props))

    act(() => result.current.handleContinue())

    expect(props.updatePlayer).not.toHaveBeenCalled()
    expect(props.changeScene).not.toHaveBeenCalled()
  })

  it('keeps stable handler identities across re-render when inputs are unchanged', () => {
    const props = makeProps()
    const { result, rerender } = renderHook(() => usePostGigHandlers(props))
    const first = result.current.handleRejectDeals
    rerender()
    expect(result.current.handleRejectDeals).toBe(first)
  })

  it('handleContinue prevents tourCompleted and routes to GAMEOVER on finale gig if bankrupt', () => {
    const props = makeProps({
      isFinaleGig: true,
      player: {
        money: 10,
        fame: 10,
        day: 3,
        location: 'berlin',
        currentNodeId: 'n1',
        stats: { tourCompleted: false }
      },
      financials: { net: -1000 }, // massive debt
      totalDailyObligations: 100 // causes bankruptcy
    })
    const { result } = renderHook(() => usePostGigHandlers(props))

    act(() => result.current.handleContinue())

    expect(props.updatePlayer).toHaveBeenCalledWith(
      expect.not.objectContaining({
        stats: expect.objectContaining({ tourCompleted: true })
      })
    )
    expect(props.changeScene).toHaveBeenCalledWith('GAMEOVER')
  })
})
