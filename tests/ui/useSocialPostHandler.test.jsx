import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const { SocialPostRefusalError } = vi.hoisted(() => {
  class SocialPostRefusalError extends Error {
    constructor(message) {
      super(message)
      this.name = 'SocialPostRefusalError'
      this.code = 'INSUFFICIENT_SPENDABLE_CASH'
    }
  }
  return { SocialPostRefusalError }
})

vi.mock('../../src/utils/postGig', () => ({
  calculatePostGigStateUpdates: vi.fn(),
  SocialPostRefusalError
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
  getSafeUUID: vi.fn(() => 'test-uuid'),
  getSecureRandomUint32: vi.fn(() => 123456)
}))

import { useSocialPostHandler } from '../../src/hooks/postGig/handlers/useSocialPostHandler'
import { applySocialPostResult } from '../../src/hooks/postGig/handlers/socialPostHandlerUtils'
import { logger } from '../../src/utils/logger'
import { calculatePostGigStateUpdates } from '../../src/utils/postGig'
import { createSocialPostQuestEvents } from '../../src/quests/producers/socialQuestEvents'
import { secureRandom } from '../../src/utils/crypto'

vi.spyOn(logger, 'error').mockImplementation(() => {})

const t = (key, opts) => opts?.defaultValue ?? key

function makeDispatchers() {
  return {
    commitSocialPost: vi.fn(() => true),
    updateSocial: vi.fn(),
    applyGigSocialReconciliation: vi.fn(),
    updateBand: vi.fn(),
    updatePlayer: vi.fn(),
    unlockTrait: vi.fn(),
    applyQuestEvent: vi.fn(),
    addToast: vi.fn(),
    setPostResult: vi.fn(),
    requestBrandOffers: vi.fn(),
    saveGameAfterStateCommit: vi.fn()
  }
}

function makeProps(overrides = {}) {
  const dispatchers = overrides.dispatchers ?? makeDispatchers()
  return {
    player: { money: 1000, fame: 10, day: 3, location: 'berlin' },
    band: { harmony: 80, members: [], inventory: {} },
    social: { followers: 500, brandReputation: {} },
    rivalBand: null,
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
  })

  it('commits composite payload and requests brand offers', () => {
    calculatePostGigStateUpdates.mockReturnValue(makeUpdates())
    const props = makeProps()
    const { result } = renderHook(() => useSocialPostHandler(props))

    act(() => result.current({ id: 'post_1' }))

    const d = props.dispatchers
    expect(d.commitSocialPost).toHaveBeenCalledWith({
      band: expect.objectContaining({ harmony: 85 }),
      moneyDelta: 100,
      social: expect.objectContaining({
        followers: 510,
        pendingSocialOptionId: 'post_1'
      })
    })
    expect(d.setPostResult).toHaveBeenCalledTimes(1)
    // harmony delta +5 => success toast + harmony quest event
    expect(d.addToast).toHaveBeenCalledWith(
      expect.stringContaining('+5'),
      'success'
    )
    expect(d.applyQuestEvent).toHaveBeenCalledWith({ type: 'harmony.changed' })
    expect(d.applyQuestEvent).toHaveBeenCalledWith({ type: 'social.post' })
    expect(d.requestBrandOffers).toHaveBeenCalledTimes(1)
    // Guard is held after success — NOT reset until phase change/unmount
    expect(props.isProcessingActionRef.current).toBe(true)
  })

  it('requests brand offers only after commitSocialPost and its quest events dispatch', () => {
    calculatePostGigStateUpdates.mockReturnValue(makeUpdates())
    const props = makeProps()
    const { result } = renderHook(() => useSocialPostHandler(props))

    act(() => result.current({ id: 'post_1' }))

    const d = props.dispatchers
    const requestedAt = d.requestBrandOffers.mock.invocationCallOrder[0]
    expect(requestedAt).toBeGreaterThan(
      Math.max(
        ...d.commitSocialPost.mock.invocationCallOrder,
        ...d.applyQuestEvent.mock.invocationCallOrder
      )
    )
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

    expect(props.dispatchers.requestBrandOffers).toHaveBeenCalledTimes(1)
    expect(calculatePostGigStateUpdates).toHaveBeenCalledTimes(1)
  })

  it('draws independent random values for post, member selection, and virality', () => {
    calculatePostGigStateUpdates.mockReturnValue(makeUpdates())
    secureRandom
      .mockReturnValueOnce(0.11)
      .mockReturnValueOnce(0.44)
      .mockReturnValueOnce(0.88)
    const props = makeProps()
    const { result } = renderHook(() => useSocialPostHandler(props))

    act(() => result.current({ id: 'post_1' }))

    expect(calculatePostGigStateUpdates).toHaveBeenCalledWith(
      expect.objectContaining({
        secureRandomValue: 0.11,
        selectionRandomValue: 0.44,
        viralRandomValue: 0.88
      })
    )
    expect(secureRandom).toHaveBeenCalledTimes(3)
    expect(props.dispatchers.setPostResult).toHaveBeenCalledWith(
      expect.objectContaining({ followers: 10 })
    )
    expect(props.dispatchers.commitSocialPost).toHaveBeenCalledWith(
      expect.objectContaining({
        social: expect.objectContaining({ followers: 510 })
      })
    )
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

  it('commits composite payload and requests brand offers when hasBandUpdates is true', () => {
    const props = makeApplyProps()
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.commitSocialPost).toHaveBeenCalledWith({
      band: props.updates.newBand,
      moneyDelta: 100,
      social: {
        ...props.updates.updatedSocial,
        pendingSocialOptionId: 'post_1'
      }
    })
    expect(d.setPostResult).toHaveBeenCalledWith(props.updates.finalResult)
    expect(d.requestBrandOffers).toHaveBeenCalledTimes(1)
  })

  it('forwards pendingSettlementId as settlementId and persists after commit', () => {
    const props = makeApplyProps({ pendingSettlementId: 'settlement-123' })
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.commitSocialPost).toHaveBeenCalledWith(
      expect.objectContaining({ settlementId: 'settlement-123' })
    )
    expect(d.saveGameAfterStateCommit).toHaveBeenCalledTimes(1)
  })

  it('does not persist when the commit is rejected', () => {
    const props = makeApplyProps()
    props.dispatchers.commitSocialPost.mockReturnValue(false)

    expect(applySocialPostResult(props)).toBe(false)
    expect(props.dispatchers.saveGameAfterStateCommit).not.toHaveBeenCalled()
  })

  it('does not include band in commitPayload when hasBandUpdates is false', () => {
    const props = makeApplyProps({
      updatesOverrides: { hasBandUpdates: false }
    })
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.commitSocialPost).toHaveBeenCalledWith({
      moneyDelta: 100,
      social: {
        ...props.updates.updatedSocial,
        pendingSocialOptionId: 'post_1'
      }
    })
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

  it('shows success toast for positive money delta', () => {
    const props = makeApplyProps({
      updatesOverrides: { appliedMoneyDelta: 100, nextMoney: 1100 }
    })
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.commitSocialPost).toHaveBeenCalledWith(
      expect.objectContaining({ moneyDelta: 100 })
    )
    expect(d.addToast).toHaveBeenCalledWith(
      expect.stringContaining('100'),
      'success'
    )
  })

  it('shows error toast for negative money delta', () => {
    const props = makeApplyProps({
      updatesOverrides: { appliedMoneyDelta: -50, nextMoney: 950 }
    })
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.commitSocialPost).toHaveBeenCalledWith(
      expect.objectContaining({ moneyDelta: -50 })
    )
    expect(d.addToast).toHaveBeenCalledWith(
      expect.stringContaining('50'),
      'error'
    )
  })

  it('does not include moneyDelta when appliedMoneyDelta is zero', () => {
    const props = makeApplyProps({
      updatesOverrides: {
        appliedMoneyDelta: 0,
        nextMoney: 1000,
        finalResult: { moneyChange: true }
      }
    })
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.commitSocialPost).toHaveBeenCalledWith(
      expect.not.objectContaining({ moneyDelta: expect.anything() })
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

  it('includes failedStageDive in commit payload', () => {
    const props = makeApplyProps({
      updatesOverrides: { finalResult: { failedStageDive: true } }
    })
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.commitSocialPost).toHaveBeenCalledWith(
      expect.objectContaining({ failedStageDive: true })
    )
  })

  it('emits quest progress from the applied total follower gain', () => {
    const props = makeApplyProps({
      updatesOverrides: {
        finalResult: { followers: 0, totalFollowers: 125 }
      }
    })
    applySocialPostResult(props)

    expect(createSocialPostQuestEvents).toHaveBeenCalledWith(
      props.option,
      expect.objectContaining({ followers: 125 })
    )
  })
})
