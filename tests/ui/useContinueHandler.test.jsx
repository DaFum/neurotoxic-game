import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mocks
vi.mock('../../src/utils/postGigUtils', () => ({
  calculateContinueStats: vi.fn()
}))
vi.mock('../../src/utils/economyEngine', () => ({
  shouldTriggerBankruptcy: vi.fn()
}))
vi.mock('../../src/utils/leaderboardUtils', () => ({
  submitLeaderboardScores: vi.fn(() => Promise.resolve())
}))
vi.mock('../../src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))
vi.mock('../../src/quests/producers/economyQuestEvents', () => ({
  createFameGainedQuestEvent: vi.fn(args => ({ type: 'fame.gained', ...args })),
  createMoneyEarnedQuestEvent: vi.fn(args => ({
    type: 'money.earned',
    ...args
  }))
}))
vi.mock('../../src/utils/mapUtils', () => ({
  getRegionKeyForLocation: vi.fn(() => 'test-region')
}))
vi.mock('../../src/context/gameConstants', () => ({
  GAME_PHASES: { OVERWORLD: 'OVERWORLD', GAMEOVER: 'GAMEOVER' },
  NEUROTOXIC_PEDAL_HARMONY_PENALTY: 10
}))

import {
  dispatchEconomyQuests,
  applyNeurotoxicPenalty,
  handleContinueSceneTransition,
  useContinueHandler
} from '../../src/hooks/postGig/handlers/useContinueHandler'

import { calculateContinueStats } from '../../src/utils/postGigUtils'
import { shouldTriggerBankruptcy } from '../../src/utils/economyEngine'
import { submitLeaderboardScores } from '../../src/utils/leaderboardUtils'
import { logger } from '../../src/utils/logger'

// --- Mock implementations and helpers ---
const t = (key, opts) => opts?.defaultValue ?? key

function makeDispatchers() {
  return {
    updatePlayer: vi.fn(),
    updateBand: vi.fn(),
    addToast: vi.fn(),
    changeScene: vi.fn(),
    addQuest: vi.fn(),
    applyQuestEvent: vi.fn()
  }
}

function makeProps(overrides = {}) {
  const dispatchers = overrides.dispatchers ?? makeDispatchers()
  return {
    financials: {
      net: 100,
      soldMerch: { shirt: 2 }
    },
    perfScore: 80,
    player: {
      money: 1000,
      fame: 10,
      day: 3,
      location: 'berlin',
      currentNodeId: 'n1',
      stats: { tourCompleted: false }
    },
    band: { harmony: 80, members: [], inventory: { shirt: 10 } },
    currentGig: { id: 'venue_1' },
    lastGigStats: { misses: 1 },
    setlist: [],
    activeStoryFlags: [],
    isFinaleGig: false,
    totalDailyObligations: 50,
    isProcessingActionRef: { current: false },
    setIsProcessingAction: vi.fn(),
    t,
    dispatchers,
    ...overrides
  }
}

// Queue microtask helper for testing async scene changes
const flushMicrotasks = () => new Promise(resolve => setTimeout(resolve, 0))

describe('Pure Functions in useContinueHandler.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('dispatchEconomyQuests', () => {
    it('dispatches fame quest when fame increases', () => {
      const applyQuestEvent = vi.fn()
      const player = { fame: 10, location: 'paris', money: 100 }
      const stats = { newFame: 20, newMoney: 100 }

      dispatchEconomyQuests(player, stats, applyQuestEvent)

      expect(applyQuestEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'fame.gained',
          region: 'test-region', // from mock
          amount: 10,
          reason: 'post_gig_fame'
        })
      )
    })

    it('dispatches money quest when money increases', () => {
      const applyQuestEvent = vi.fn()
      const player = { fame: 10, money: 100 }
      const stats = { newFame: 10, newMoney: 150 }

      dispatchEconomyQuests(player, stats, applyQuestEvent)

      expect(applyQuestEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'money.earned',
          amount: 50
        })
      )
    })

    it('does not dispatch events when fame or money do not increase', () => {
      const applyQuestEvent = vi.fn()
      const player = { fame: 10, money: 100 }
      const stats = { newFame: 5, newMoney: 50 } // Decreased

      dispatchEconomyQuests(player, stats, applyQuestEvent)

      expect(applyQuestEvent).not.toHaveBeenCalled()
    })
  })

  describe('applyNeurotoxicPenalty', () => {
    it('applies penalty and updates band if pedal is in inventory', () => {
      const updateBand = vi.fn()
      const band = { harmony: 80, inventory: { neurotoxicPedal: true } }

      // 80 - 10 (mocked penalty) = 70
      const result = applyNeurotoxicPenalty(band, updateBand)

      expect(result).toBe(70)
      expect(updateBand).toHaveBeenCalledTimes(1)

      // Test functional state update
      const updateFn = updateBand.mock.calls[0][0]
      const nextBand = updateFn(band)
      expect(nextBand.harmony).toBe(70)
    })

    it('returns undefined and does not update if pedal is not in inventory', () => {
      const updateBand = vi.fn()
      const band = { harmony: 80, inventory: {} }

      const result = applyNeurotoxicPenalty(band, updateBand)

      expect(result).toBeUndefined()
      expect(updateBand).not.toHaveBeenCalled()
    })
  })

  describe('handleContinueSceneTransition', () => {
    it('shows error toast and routes to GAMEOVER if bankrupt', () => {
      const addToast = vi.fn()
      const changeScene = vi.fn()
      handleContinueSceneTransition({
        bankrupt: true,
        isFinaleGig: false,
        addToast,
        changeScene,
        t
      })

      expect(addToast).toHaveBeenCalledWith(expect.any(String), 'error')
      expect(changeScene).toHaveBeenCalledWith('GAMEOVER')
    })

    it('shows success toast and microtasks GAMEOVER if finale', async () => {
      const addToast = vi.fn()
      const changeScene = vi.fn()
      handleContinueSceneTransition({
        bankrupt: false,
        isFinaleGig: true,
        addToast,
        changeScene,
        t
      })

      expect(addToast).toHaveBeenCalledWith(expect.any(String), 'success')
      expect(changeScene).not.toHaveBeenCalled() // because microtask
      await flushMicrotasks()
      expect(changeScene).toHaveBeenCalledWith('GAMEOVER')
    })

    it('microtasks OVERWORLD in normal case', async () => {
      const addToast = vi.fn()
      const changeScene = vi.fn()
      handleContinueSceneTransition({
        bankrupt: false,
        isFinaleGig: false,
        addToast,
        changeScene,
        t
      })

      expect(addToast).not.toHaveBeenCalled()
      expect(changeScene).not.toHaveBeenCalled()
      await flushMicrotasks()
      expect(changeScene).toHaveBeenCalledWith('OVERWORLD')
    })
  })
})

describe('useContinueHandler hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    calculateContinueStats.mockReturnValue({
      newMoney: 1100,
      newFame: 20,
      fameLevel: 2
    })
    shouldTriggerBankruptcy.mockReturnValue(false)
  })

  it('runs happy path correctly', async () => {
    const props = makeProps()
    const { result } = renderHook(() => useContinueHandler(props))

    act(() => {
      result.current()
    })

    const d = props.dispatchers

    // Guard set
    expect(props.isProcessingActionRef.current).toBe(true)
    expect(props.setIsProcessingAction).toHaveBeenCalledWith(true)

    // updateBand called for inventory
    expect(d.updateBand).toHaveBeenCalledTimes(1) // from buildSoldMerchInventory

    // updatePlayer called with stats
    expect(d.updatePlayer).toHaveBeenCalledWith({
      money: 1100,
      fame: 20,
      fameLevel: 2,
      lastGigNodeId: 'n1'
    })

    // submit leaderboard
    expect(submitLeaderboardScores).toHaveBeenCalled()

    await flushMicrotasks()

    // transition to overworld
    expect(d.changeScene).toHaveBeenCalledWith('OVERWORLD')
  })

  it('no-ops if financials is null', () => {
    const props = makeProps({ financials: null })
    const { result } = renderHook(() => useContinueHandler(props))

    act(() => {
      result.current()
    })

    expect(props.setIsProcessingAction).not.toHaveBeenCalled()
    expect(props.dispatchers.updatePlayer).not.toHaveBeenCalled()
  })

  it('no-ops if guard is already true', () => {
    const props = makeProps({ isProcessingActionRef: { current: true } })
    const { result } = renderHook(() => useContinueHandler(props))

    act(() => {
      result.current()
    })

    expect(props.setIsProcessingAction).not.toHaveBeenCalled()
    expect(props.dispatchers.updatePlayer).not.toHaveBeenCalled()
  })

  it('routes to GAMEOVER if bankrupt', () => {
    shouldTriggerBankruptcy.mockReturnValue(true)
    const props = makeProps()
    const { result } = renderHook(() => useContinueHandler(props))

    act(() => {
      result.current()
    })

    expect(props.dispatchers.addToast).toHaveBeenCalledWith(
      expect.any(String),
      'error'
    )
    expect(props.dispatchers.changeScene).toHaveBeenCalledWith('GAMEOVER')
  })

  it('handles finale path correctly', async () => {
    const props = makeProps({ isFinaleGig: true })
    const { result } = renderHook(() => useContinueHandler(props))

    act(() => {
      result.current()
    })

    // Updates player with tourCompleted flag
    expect(props.dispatchers.updatePlayer).toHaveBeenCalledWith(
      expect.objectContaining({
        stats: expect.objectContaining({ tourCompleted: true })
      })
    )

    expect(props.dispatchers.addToast).toHaveBeenCalledWith(
      expect.any(String),
      'success'
    )

    await flushMicrotasks()
    expect(props.dispatchers.changeScene).toHaveBeenCalledWith('GAMEOVER')
  })

  it('catches errors and releases guard', () => {
    calculateContinueStats.mockImplementation(() => {
      throw new Error('Test error')
    })
    const props = makeProps()
    const { result } = renderHook(() => useContinueHandler(props))

    act(() => {
      result.current()
    })

    expect(logger.error).toHaveBeenCalledWith(
      'PostGig handleContinue',
      'Unexpected error in continue flow',
      expect.objectContaining({ err: expect.any(Error) })
    )
    expect(props.isProcessingActionRef.current).toBe(false)
    expect(props.setIsProcessingAction).toHaveBeenCalledWith(false)
  })

  it('logs an error if submitLeaderboardScores fails', async () => {
    submitLeaderboardScores.mockRejectedValueOnce(
      new Error('Leaderboard error')
    )
    const props = makeProps()
    const { result } = renderHook(() => useContinueHandler(props))

    act(() => {
      result.current()
    })

    await flushMicrotasks()

    expect(logger.error).toHaveBeenCalledWith(
      'PostGig',
      'submitLeaderboardScores failed',
      expect.objectContaining({ err: expect.any(Error) })
    )
  })
})
