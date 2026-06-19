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

import {
  useSocialPostHandler,
  applySocialPostResult
} from '../../src/hooks/postGig/handlers/useSocialPostHandler'
import { logger } from '../../src/utils/logger'
import { calculatePostGigStateUpdates } from '../../src/utils/postGigUtils'
import { generateBrandOffers } from '../../src/utils/brandDealLogic'

vi.spyOn(logger, 'error').mockImplementation(() => {})

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
    // Guard is held after success — NOT reset until phase change/unmount
    expect(props.isProcessingActionRef.current).toBe(true)
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
    const error = new Error('boom')
    calculatePostGigStateUpdates.mockImplementation(() => {
      throw error
    })
    const props = makeProps()
    const { result } = renderHook(() => useSocialPostHandler(props))

    act(() => result.current({ id: 'post_1' }))

    expect(props.dispatchers.addToast).toHaveBeenCalledWith(
      expect.any(String),
      'error'
    )
    expect(logger.error).toHaveBeenCalledWith(
      'PostGig',
      'Failed to resolve selected post',
      error
    )
    expect(props.dispatchers.setPostResult).not.toHaveBeenCalled()
    // guard still released
    expect(props.isProcessingActionRef.current).toBe(false)
  })

  it('shows an error and releases guard when applySocialPostResult throws', () => {
    const error = new Error('apply boom')
    calculatePostGigStateUpdates.mockReturnValue(makeUpdates())

    // Inject a dispatcher that throws to force applySocialPostResult to throw
    const dispatchers = makeDispatchers()
    dispatchers.setPostResult.mockImplementation(() => {
      throw error
    })

    const props = makeProps({ dispatchers })
    const { result } = renderHook(() => useSocialPostHandler(props))

    act(() => result.current({ id: 'post_1' }))

    expect(props.dispatchers.addToast).toHaveBeenCalledWith(
      expect.any(String),
      'error'
    )
    expect(logger.error).toHaveBeenCalledWith(
      'PostGig',
      'Failed to apply selected post result',
      error
    )
    // guard must be released so the player can retry
    expect(props.isProcessingActionRef.current).toBe(false)
    expect(props.setIsProcessingAction).toHaveBeenCalledWith(false)
  })

  it('no-ops while another action is processing', () => {
    calculatePostGigStateUpdates.mockReturnValue(makeUpdates())
    const props = makeProps({ isProcessingActionRef: { current: true } })
    const { result } = renderHook(() => useSocialPostHandler(props))

    act(() => result.current({ id: 'post_1' }))

    expect(props.dispatchers.setPostResult).not.toHaveBeenCalled()
    expect(calculatePostGigStateUpdates).not.toHaveBeenCalled()
  })

  it('double-click only applies side-effects once (guard held after dispatch)', () => {
    calculatePostGigStateUpdates.mockReturnValue(makeUpdates())
    const props = makeProps()
    const { result } = renderHook(() => useSocialPostHandler(props))

    act(() => {
      result.current({ id: 'post_1' })
      result.current({ id: 'post_1' })
    })

    expect(props.dispatchers.setPhase).toHaveBeenCalledTimes(1)
    expect(calculatePostGigStateUpdates).toHaveBeenCalledTimes(1)
  })

  it('releases guard in the error path so the player can retry', () => {
    calculatePostGigStateUpdates.mockImplementation(() => {
      throw new Error('boom')
    })
    const props = makeProps()
    const { result } = renderHook(() => useSocialPostHandler(props))

    act(() => result.current({ id: 'post_1' }))

    expect(props.isProcessingActionRef.current).toBe(false)
    expect(props.setIsProcessingAction).toHaveBeenLastCalledWith(false)
  })
})

describe('applySocialPostResult', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    generateBrandOffers.mockReturnValue([])
  })

  function makeApplyProps(overrides = {}) {
    const dispatchers = overrides.dispatchers ?? makeDispatchers()
    const updates = makeUpdates(overrides.updatesOverrides ?? {})
    return {
      option: { id: 'post_1' },
      updates,
      player: {
        money: 1000,
        fame: 10,
        day: 3,
        location: 'berlin',
        stats: { failedStageDives: 1 }
      },
      band: { harmony: 80, members: [], inventory: {} },
      social: { followers: 500, brandReputation: {} },
      t,
      dispatchers,
      ...overrides
    }
  }

  it('fires core dispatchers and routes to COMPLETE when there are no brand offers and hasBandUpdates is true', () => {
    const props = makeApplyProps()
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.setPostResult).toHaveBeenCalledWith(props.updates.finalResult)
    expect(d.updateBand).toHaveBeenCalledWith(props.updates.newBand)
    expect(d.updatePlayer).toHaveBeenCalledWith({ money: 1100 })
    expect(d.updateSocial).toHaveBeenCalledWith(props.updates.updatedSocial)
    expect(d.setBrandOffers).toHaveBeenCalledWith([])
    expect(d.setPhase).toHaveBeenCalledWith('COMPLETE')
  })

  it('does not fire updateBand when hasBandUpdates is false', () => {
    const props = makeApplyProps({
      updatesOverrides: { hasBandUpdates: false }
    })
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.updateBand).not.toHaveBeenCalled()
  })

  it('shows success toast and fires quest event for positive harmony delta', () => {
    const props = makeApplyProps({
      updatesOverrides: { appliedHarmonyDelta: 5 }
    })
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.addToast).toHaveBeenCalledWith(
      expect.stringContaining('+5'),
      'success'
    )
    expect(d.applyQuestEvent).toHaveBeenCalledWith({ type: 'harmony.changed' })
  })

  it('shows error toast for negative harmony delta and no quest event', () => {
    const props = makeApplyProps({
      updatesOverrides: { appliedHarmonyDelta: -5 }
    })
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.addToast).toHaveBeenCalledWith(
      expect.stringContaining('-5'),
      'error'
    )
    // it will call social.post, but not harmony.changed
    expect(d.applyQuestEvent).not.toHaveBeenCalledWith({
      type: 'harmony.changed'
    })
  })

  it('shows success toast and updates player money for positive money delta', () => {
    const props = makeApplyProps({
      updatesOverrides: { appliedMoneyDelta: 100, nextMoney: 1100 }
    })
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.updatePlayer).toHaveBeenCalledWith({ money: 1100 })
    expect(d.addToast).toHaveBeenCalledWith(
      expect.stringContaining('100'),
      'success'
    )
  })

  it('shows error toast and updates player money for negative money delta', () => {
    const props = makeApplyProps({
      updatesOverrides: { appliedMoneyDelta: -50, nextMoney: 950 }
    })
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.updatePlayer).toHaveBeenCalledWith({ money: 950 })
    expect(d.addToast).toHaveBeenCalledWith(
      expect.stringContaining('50'),
      'error'
    )
  })

  it('updates player money when money delta is zero but finalResult.moneyChange is truthy', () => {
    const props = makeApplyProps({
      updatesOverrides: {
        appliedMoneyDelta: 0,
        nextMoney: 1000,
        finalResult: { moneyChange: true }
      }
    })
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.updatePlayer).toHaveBeenCalledWith({ money: 1000 })
    expect(d.addToast).not.toHaveBeenCalledWith(
      expect.stringContaining('Money'),
      expect.anything()
    )
  })

  it('unlocks a trait if finalResult carries one', () => {
    const props = makeApplyProps({
      updatesOverrides: {
        finalResult: { unlockTrait: { memberId: 'm1', traitId: 'shredder' } }
      }
    })
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.unlockTrait).toHaveBeenCalledWith('m1', 'shredder')
    expect(d.addToast).toHaveBeenCalledWith(
      expect.stringContaining('Trait Unlocked'),
      'success'
    )
  })

  it('updates player stats for failed stage dive', () => {
    const props = makeApplyProps({
      updatesOverrides: { finalResult: { failedStageDive: true } }
    })
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.updatePlayer).toHaveBeenCalledWith(
      expect.objectContaining({
        stats: expect.objectContaining({ failedStageDives: 2 })
      })
    )
  })

  it('updates player stats for failed stage dive when player.stats is undefined', () => {
    const props = makeApplyProps({
      player: { money: 1000, fame: 10, day: 3, location: 'berlin' },
      updatesOverrides: { finalResult: { failedStageDive: true } }
    })
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.updatePlayer).toHaveBeenCalledWith(
      expect.objectContaining({
        stats: { failedStageDives: 1 }
      })
    )
  })

  it('routes to DEALS phase when brand offers are generated', () => {
    generateBrandOffers.mockReturnValue([{ id: 'deal_1' }])
    const props = makeApplyProps()
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(generateBrandOffers).toHaveBeenCalledWith(
      expect.objectContaining({
        player: expect.objectContaining({ money: 1100 }),
        band: expect.objectContaining({ harmony: 85 }),
        social: expect.objectContaining({ followers: 510 })
      }),
      expect.any(Function)
    )
    expect(d.setBrandOffers).toHaveBeenCalledWith([{ id: 'deal_1' }])
    expect(d.setPhase).toHaveBeenCalledWith('DEALS')
  })
})
