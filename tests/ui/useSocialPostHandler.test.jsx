import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock the pure utils so the test characterizes the hook's *orchestration*
// (which dispatchers fire, in what order) rather than the math those utils own.
vi.mock('../../src/utils/postGigUtils', () => ({
  calculatePostGigStateUpdates: vi.fn()
}))
vi.mock('../../src/utils/brandDealLogic', () => ({
  generateBrandOffers: vi.fn(() => [])
}))
vi.mock('../../src/quests/producers/gigQuestEvents', () => ({
  createHarmonyChangedQuestEvent: vi.fn(() => ({ type: 'harmony.changed' }))
}))
vi.mock('../../src/quests/producers/socialQuestEvents', () => ({
  createSocialPostQuestEvents: vi.fn(() => [{ type: 'social.post' }])
}))
vi.mock('../../src/utils/crypto', () => ({
  secureRandom: vi.fn(() => 0.5),
  getSafeRandom: vi.fn(() => 0.5),
  getSafeUUID: vi.fn(() => 'test-uuid')
}))

import { useSocialPostHandler } from '../../src/hooks/postGig/handlers/useSocialPostHandler'
import { calculatePostGigStateUpdates } from '../../src/utils/postGigUtils'
import { generateBrandOffers } from '../../src/utils/brandDealLogic'

const t = (key, opts) => opts?.defaultValue ?? key

function makeDispatchers() {
  return {
    updateSocial: vi.fn(),
    updateBand: vi.fn(),
    updatePlayer: vi.fn(),
    unlockTrait: vi.fn(),
    applyQuestEvent: vi.fn(),
    addToast: vi.fn(),
    setPostResult: vi.fn(),
    setBrandOffers: vi.fn(),
    setPhase: vi.fn()
  }
}

function makeProps(overrides = {}) {
  const dispatchers = overrides.dispatchers ?? makeDispatchers()
  return {
    player: { money: 1000, fame: 10, day: 3, location: 'berlin' },
    band: { harmony: 80, members: [], inventory: {} },
    social: { followers: 500, brandReputation: {} },
    currentGig: { id: 'venue_1' },
    perfScore: 75,
    lastGigStats: { misses: 1 },
    isProcessingActionRef: { current: false },
    setIsProcessingAction: vi.fn(),
    t,
    dispatchers,
    ...overrides
  }
}

// A representative `updates` result from calculatePostGigStateUpdates.
function makeUpdates(overrides = {}) {
  return {
    finalResult: { followers: 10, moneyChange: 0, ...overrides.finalResult },
    newBand: { harmony: 85, members: [], inventory: {} },
    hasBandUpdates: true,
    appliedHarmonyDelta: 5,
    nextMoney: 1100,
    appliedMoneyDelta: 100,
    updatedSocial: { followers: 510 },
    ...overrides
  }
}

describe('useSocialPostHandler (characterization)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    generateBrandOffers.mockReturnValue([])
  })

  it('applies updates and routes to COMPLETE when there are no brand offers', () => {
    calculatePostGigStateUpdates.mockReturnValue(makeUpdates())
    const props = makeProps()
    const { result } = renderHook(() => useSocialPostHandler(props))

    act(() => result.current({ id: 'post_1' }))

    const d = props.dispatchers
    expect(d.setPostResult).toHaveBeenCalledTimes(1)
    expect(d.updateBand).toHaveBeenCalledWith(
      expect.objectContaining({ harmony: 85 })
    )
    expect(d.updatePlayer).toHaveBeenCalledWith({ money: 1100 })
    expect(d.updateSocial).toHaveBeenCalledWith({ followers: 510 })
    // harmony delta +5 => success toast + harmony quest event
    expect(d.addToast).toHaveBeenCalledWith(
      expect.stringContaining('+5'),
      'success'
    )
    expect(d.applyQuestEvent).toHaveBeenCalledWith({ type: 'harmony.changed' })
    expect(d.applyQuestEvent).toHaveBeenCalledWith({ type: 'social.post' })
    expect(d.setBrandOffers).toHaveBeenCalledWith([])
    expect(d.setPhase).toHaveBeenCalledWith('COMPLETE')
    expect(props.setIsProcessingAction).toHaveBeenLastCalledWith(false)
    expect(props.isProcessingActionRef.current).toBe(false)
  })

  it('routes to DEALS when brand offers are generated', () => {
    calculatePostGigStateUpdates.mockReturnValue(makeUpdates())
    generateBrandOffers.mockReturnValue([{ id: 'deal_1' }])
    const props = makeProps()
    const { result } = renderHook(() => useSocialPostHandler(props))

    act(() => result.current({ id: 'post_1' }))

    expect(props.dispatchers.setBrandOffers).toHaveBeenCalledWith([
      { id: 'deal_1' }
    ])
    expect(props.dispatchers.setPhase).toHaveBeenCalledWith('DEALS')
  })

  it('unlocks a trait when the result carries one', () => {
    calculatePostGigStateUpdates.mockReturnValue(
      makeUpdates({
        finalResult: {
          followers: 0,
          unlockTrait: { memberId: 'm1', traitId: 'shredder' }
        }
      })
    )
    const props = makeProps()
    const { result } = renderHook(() => useSocialPostHandler(props))

    act(() => result.current({ id: 'post_1' }))

    expect(props.dispatchers.unlockTrait).toHaveBeenCalledWith('m1', 'shredder')
  })

  it('shows an error and bails when the resolver throws', () => {
    calculatePostGigStateUpdates.mockImplementation(() => {
      throw new Error('boom')
    })
    const props = makeProps()
    const { result } = renderHook(() => useSocialPostHandler(props))

    act(() => result.current({ id: 'post_1' }))

    expect(props.dispatchers.addToast).toHaveBeenCalledWith(
      expect.any(String),
      'error'
    )
    expect(props.dispatchers.setPostResult).not.toHaveBeenCalled()
    // guard still released
    expect(props.isProcessingActionRef.current).toBe(false)
  })

  it('no-ops while another action is processing', () => {
    calculatePostGigStateUpdates.mockReturnValue(makeUpdates())
    const props = makeProps({ isProcessingActionRef: { current: true } })
    const { result } = renderHook(() => useSocialPostHandler(props))

    act(() => result.current({ id: 'post_1' }))

    expect(props.dispatchers.setPostResult).not.toHaveBeenCalled()
    expect(calculatePostGigStateUpdates).not.toHaveBeenCalled()
  })
})
