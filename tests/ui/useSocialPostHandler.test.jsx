import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock the pure utils so the test characterizes the hook's *orchestration*
// (which dispatchers fire, in what order) rather than the math those utils own.
vi.mock('../../src/utils/postGig', () => ({
  calculatePostGigStateUpdates: vi.fn()
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

  it('applies updates and requests brand offers', () => {
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
    expect(d.applyGigSocialReconciliation).toHaveBeenCalledWith(
      { followers: 510 },
      undefined
    )
    expect(d.saveGameAfterStateCommit).toHaveBeenCalledTimes(1)
    expect(d.updateSocial).not.toHaveBeenCalled()
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

  it('requests brand offers only after the post and its quest events dispatch', () => {
    calculatePostGigStateUpdates.mockReturnValue(makeUpdates())
    const props = makeProps()
    const { result } = renderHook(() => useSocialPostHandler(props))

    act(() => result.current({ id: 'post_1' }))

    const d = props.dispatchers
    const requestedAt = d.requestBrandOffers.mock.invocationCallOrder[0]
    expect(requestedAt).toBeGreaterThan(
      Math.max(
        ...d.applyGigSocialReconciliation.mock.invocationCallOrder,
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
    expect(props.dispatchers.applyGigSocialReconciliation).toHaveBeenCalledWith(
      { followers: 510 },
      undefined
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

  it('fires core dispatchers and requests brand offers when hasBandUpdates is true', () => {
    const props = makeApplyProps()
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.setPostResult).toHaveBeenCalledWith(props.updates.finalResult)
    expect(d.updateBand).toHaveBeenCalledWith(props.updates.newBand)
    expect(d.updatePlayer).toHaveBeenCalledWith({ money: 1100 })
    expect(d.applyGigSocialReconciliation).toHaveBeenCalledWith(
      props.updates.updatedSocial,
      undefined
    )
    expect(d.requestBrandOffers).toHaveBeenCalledTimes(1)
  })

  it('passes pendingSettlementId through to applyGigSocialReconciliation', () => {
    const props = makeApplyProps({ pendingSettlementId: 'settlement-123' })
    applySocialPostResult(props)

    const d = props.dispatchers
    expect(d.applyGigSocialReconciliation).toHaveBeenCalledWith(
      props.updates.updatedSocial,
      'settlement-123'
    )
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
