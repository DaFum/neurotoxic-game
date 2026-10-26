import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mocks
vi.mock('../../src/utils/postGig', () => ({
  calculateContinueStats: vi.fn()
}))
vi.mock('../../src/utils/economy', () => ({
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
  GAME_PHASES: {
    OVERWORLD: 'OVERWORLD',
    GAMEOVER: 'GAMEOVER',
    RUN_SUMMARY: 'RUN_SUMMARY'
  },
  NEUROTOXIC_PEDAL_HARMONY_PENALTY: 10
}))

import { useContinueHandler } from '../../src/hooks/postGig/handlers/useContinueHandler'
import {
  dispatchEconomyQuests,
  getNeurotoxicPenaltyHarmony,
  handleContinueSceneTransition
} from '../../src/hooks/postGig/handlers/continueHandlerUtils'

import { calculateContinueStats } from '../../src/utils/postGig'
import { shouldTriggerBankruptcy } from '../../src/utils/economy'
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
    applyQuestEvent: vi.fn(),
    recordExpeditionCrewStressSource: vi.fn(),
    completeExpedition: vi.fn(),
    saveGameAfterStateCommit: vi.fn()
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
    lastGigStats: { misses: 1, failed: false },
    setlist: [],
    expedition: { status: 'idle', routeStep: 0, loadout: null },
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

  describe('getNeurotoxicPenaltyHarmony', () => {
    it('returns the penalised harmony if pedal is in inventory', () => {
      const band = { harmony: 80, inventory: { neurotoxicPedal: true } }

      // 80 - 10 (mocked penalty) = 70
      expect(getNeurotoxicPenaltyHarmony(band)).toBe(70)
    })

    it('returns undefined if pedal is not in inventory', () => {
      const band = { harmony: 80, inventory: {} }

      expect(getNeurotoxicPenaltyHarmony(band)).toBeUndefined()
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
      fameLevel: 2
    })

    // submit leaderboard
    expect(submitLeaderboardScores).toHaveBeenCalled()

    await flushMicrotasks()

    // transition to overworld
    expect(d.changeScene).toHaveBeenCalledWith('OVERWORLD')
  })

  describe('pending settlement record', () => {
    const withClear = () => ({
      ...makeDispatchers(),
      clearPendingGigSettlement: vi.fn()
    })

    it('clears the record by id right after settling the player', () => {
      const dispatchers = withClear()
      const props = makeProps({ dispatchers, pendingSettlementId: 'settle-1' })
      const { result } = renderHook(() => useContinueHandler(props))

      act(() => {
        result.current()
      })

      expect(dispatchers.clearPendingGigSettlement).toHaveBeenCalledTimes(1)
      expect(dispatchers.clearPendingGigSettlement).toHaveBeenCalledWith(
        'settle-1'
      )
      expect(dispatchers.updatePlayer.mock.invocationCallOrder[0]).toBeLessThan(
        dispatchers.clearPendingGigSettlement.mock.invocationCallOrder[0]
      )
    })

    it('a second Continue press settles and clears nothing more', () => {
      const dispatchers = withClear()
      const props = makeProps({ dispatchers, pendingSettlementId: 'settle-1' })
      const { result } = renderHook(() => useContinueHandler(props))

      act(() => {
        result.current()
        result.current()
      })

      expect(dispatchers.updatePlayer).toHaveBeenCalledTimes(1)
      expect(dispatchers.clearPendingGigSettlement).toHaveBeenCalledTimes(1)
    })

    it('Continue without a record still settles and clears nothing', async () => {
      const dispatchers = withClear()
      const props = makeProps({ dispatchers, pendingSettlementId: null })
      const { result } = renderHook(() => useContinueHandler(props))

      act(() => {
        result.current()
      })
      await flushMicrotasks()

      expect(dispatchers.updatePlayer).toHaveBeenCalledTimes(1)
      expect(dispatchers.clearPendingGigSettlement).not.toHaveBeenCalled()
      expect(dispatchers.changeScene).toHaveBeenCalledWith('OVERWORLD')
    })
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

  it('dispatches previous balance, no error toast, no GAMEOVER, and navigates to OVERWORLD for protected active-run loss', async () => {
    calculateContinueStats.mockReturnValue({
      newMoney: 0,
      newFame: 20,
      fameLevel: 2
    })
    shouldTriggerBankruptcy.mockReturnValue(false)
    const props = makeProps({
      player: {
        money: 500,
        fame: 10,
        day: 3,
        location: 'berlin',
        currentNodeId: 'n1',
        stats: { tourCompleted: false }
      },
      financials: { net: -600, soldMerch: {} },
      expedition: {
        status: 'active',
        protectedCareerCash: 400,
        routeStep: 1,
        loadout: null
      }
    })
    const { result } = renderHook(() => useContinueHandler(props))

    act(() => {
      result.current()
    })

    expect(props.dispatchers.updatePlayer).toHaveBeenCalledWith({
      money: 500,
      fame: 20,
      fameLevel: 2
    })
    expect(props.dispatchers.addToast).not.toHaveBeenCalledWith(
      expect.any(String),
      'error'
    )
    expect(props.dispatchers.changeScene).not.toHaveBeenCalledWith('GAMEOVER')

    await flushMicrotasks()
    expect(props.dispatchers.changeScene).toHaveBeenCalledWith('OVERWORLD')
  })

  it('gates active-run Finale completion on spendable cash insolvency when balance equals protected Career cash', async () => {
    calculateContinueStats.mockReturnValue({
      newMoney: 400,
      newFame: 20,
      fameLevel: 2
    })
    shouldTriggerBankruptcy.mockReturnValue(true)
    const props = makeProps({
      isFinaleGig: true,
      player: {
        money: 500,
        fame: 10,
        day: 3,
        location: 'berlin',
        currentNodeId: 'n1',
        stats: { tourCompleted: false }
      },
      financials: { net: -100, soldMerch: {} },
      expedition: {
        status: 'active',
        runId: 'run-1',
        protectedCareerCash: 400,
        routeStep: 4,
        loadout: null
      },
      lastGigStats: { misses: 0, failed: false }
    })
    const { result } = renderHook(() => useContinueHandler(props))

    act(() => {
      result.current()
    })

    expect(props.dispatchers.updatePlayer).toHaveBeenCalledWith({
      money: 400,
      fame: 20,
      fameLevel: 2
    })
    expect(props.dispatchers.completeExpedition).not.toHaveBeenCalled()
    expect(props.dispatchers.saveGameAfterStateCommit).not.toHaveBeenCalled()

    await flushMicrotasks()
    expect(props.dispatchers.changeScene).toHaveBeenCalledWith('OVERWORLD')
  })

  it('dispatches accepted money, no error toast, no GAMEOVER, and navigates to OVERWORLD for accepted-money insolvency in active run', async () => {
    calculateContinueStats.mockReturnValue({
      newMoney: 0,
      newFame: 20,
      fameLevel: 2
    })
    shouldTriggerBankruptcy.mockReturnValue(true)
    const props = makeProps({
      player: {
        money: 500,
        fame: 10,
        day: 3,
        location: 'berlin',
        currentNodeId: 'n1',
        stats: { tourCompleted: false }
      },
      financials: { net: -600, soldMerch: {} },
      expedition: {
        status: 'active',
        protectedCareerCash: 0,
        routeStep: 1,
        loadout: null
      }
    })
    const { result } = renderHook(() => useContinueHandler(props))

    act(() => {
      result.current()
    })

    expect(props.dispatchers.updatePlayer).toHaveBeenCalledWith({
      money: 0,
      fame: 20,
      fameLevel: 2
    })
    expect(props.dispatchers.addToast).not.toHaveBeenCalledWith(
      expect.any(String),
      'error'
    )
    expect(props.dispatchers.changeScene).not.toHaveBeenCalledWith('GAMEOVER')

    await flushMicrotasks()
    expect(props.dispatchers.changeScene).toHaveBeenCalledWith('OVERWORLD')
  })

  it('does not request completion or Run Summary for an insolvent active-run Finale', async () => {
    calculateContinueStats.mockReturnValue({
      newMoney: 0,
      newFame: 20,
      fameLevel: 2
    })
    shouldTriggerBankruptcy.mockReturnValue(true)
    const props = makeProps({
      isFinaleGig: true,
      expedition: {
        status: 'active',
        runId: 'run-1',
        protectedCareerCash: 0,
        routeStep: 4,
        loadout: null
      },
      lastGigStats: { misses: 0, failed: false }
    })
    const { result } = renderHook(() => useContinueHandler(props))

    act(() => {
      result.current()
    })

    expect(props.dispatchers.completeExpedition).not.toHaveBeenCalled()
    expect(props.dispatchers.saveGameAfterStateCommit).not.toHaveBeenCalled()

    await flushMicrotasks()
    expect(props.dispatchers.changeScene).toHaveBeenCalledWith('OVERWORLD')
  })

  it('handles successful Career finale path correctly', async () => {
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
    expect(props.dispatchers.completeExpedition).not.toHaveBeenCalled()
    expect(props.dispatchers.changeScene).toHaveBeenCalledWith('GAMEOVER')
  })

  it('waits for committed Expedition completion and saved state before Run Summary', async () => {
    const props = makeProps({
      isFinaleGig: true,
      expedition: {
        status: 'active',
        runId: 'run-1',
        routeStep: 4,
        loadout: null
      }
    })
    const { result } = renderHook(() => {
      const [expedition, setExpedition] = useState(props.expedition)
      props.dispatchers.completeExpedition.mockImplementation(() =>
        setExpedition(prev => ({ ...prev, status: 'completed' }))
      )
      return useContinueHandler({ ...props, expedition })
    })
    act(() => result.current())
    expect(props.dispatchers.completeExpedition).toHaveBeenCalledWith(
      'gig:venue_1'
    )
    expect(props.dispatchers.changeScene).not.toHaveBeenCalled()
    expect(props.dispatchers.addToast).not.toHaveBeenCalled()
    expect(props.dispatchers.updatePlayer.mock.calls[0][0]).not.toHaveProperty(
      'stats'
    )

    expect(props.dispatchers.saveGameAfterStateCommit).toHaveBeenCalledTimes(1)
    expect(props.dispatchers.changeScene).not.toHaveBeenCalled()
    act(() => props.dispatchers.saveGameAfterStateCommit.mock.calls[0][0](true))
    expect(props.dispatchers.changeScene).toHaveBeenCalledWith('RUN_SUMMARY')
    expect(props.dispatchers.addToast).toHaveBeenCalledWith(
      expect.any(String),
      'success'
    )
  })

  it('returns a solvent failed Finale to recovery without claiming victory', async () => {
    const props = makeProps({
      isFinaleGig: true,
      expedition: {
        status: 'active',
        runId: 'run-1',
        routeStep: 4,
        loadout: null
      },
      lastGigStats: { misses: 5, failed: true }
    })
    const { result } = renderHook(() => useContinueHandler(props))
    act(() => result.current())
    await flushMicrotasks()
    expect(props.dispatchers.updatePlayer.mock.calls[0][0]).not.toHaveProperty(
      'stats'
    )
    expect(props.dispatchers.completeExpedition).not.toHaveBeenCalled()
    expect(props.dispatchers.addToast).not.toHaveBeenCalledWith(
      expect.any(String),
      'success'
    )
    expect(props.dispatchers.changeScene).toHaveBeenCalledWith('OVERWORLD')
  })

  it('routes rejected completion to recovery after the commit without a victory toast', async () => {
    const props = makeProps({
      isFinaleGig: true,
      expedition: {
        status: 'active',
        runId: 'run-1',
        routeStep: 4,
        loadout: null
      }
    })
    const { result } = renderHook(() => useContinueHandler(props))
    act(() => result.current())
    await flushMicrotasks()
    expect(props.dispatchers.completeExpedition).toHaveBeenCalledTimes(1)
    expect(props.dispatchers.changeScene).toHaveBeenCalledWith('OVERWORLD')
    expect(props.dispatchers.addToast).not.toHaveBeenCalledWith(
      expect.any(String),
      'success'
    )
    expect(props.dispatchers.saveGameAfterStateCommit).not.toHaveBeenCalled()
  })

  it('retains the actual post-gig Finale stamina adjustment', () => {
    const props = makeProps({
      isFinaleGig: true,
      expedition: {
        status: 'active',
        runId: 'run-1',
        routeStep: 4,
        loadout: null,
        finaleType: 'disaster_gig'
      },
      band: {
        harmony: 80,
        inventory: {},
        members: [{ id: 'member-1', stamina: 50, staminaMax: 100 }]
      }
    })
    const { result } = renderHook(() => useContinueHandler(props))
    act(() => result.current())
    const staminaUpdater = props.dispatchers.updateBand.mock.calls.at(-1)[0]
    expect(staminaUpdater(props.band).members[0].stamina).toBe(48)
  })

  describe('major-gig Run Draft', () => {
    const activeExpedition = {
      status: 'active',
      routeStep: 2,
      loadout: { crewIds: [] },
      finaleType: null
    }

    it('offers the major_gig draft after a completed Expedition gig', () => {
      const dispatchers = {
        ...makeDispatchers(),
        offerExpeditionDraft: vi.fn()
      }
      const props = makeProps({
        dispatchers,
        expedition: activeExpedition,
        lastGigStats: { misses: 1, accuracy: 70, failed: false }
      })
      const { result } = renderHook(() => useContinueHandler(props))
      act(() => {
        result.current()
      })
      // The reducer proves the node is a major gig; the handler only names
      // the qualifying moment.
      expect(dispatchers.offerExpeditionDraft).toHaveBeenCalledWith(
        'major_gig',
        'venue_1'
      )
    })

    it('offers nothing for a failed gig, the Finale or outside a run', () => {
      for (const overrides of [
        {
          expedition: activeExpedition,
          lastGigStats: { misses: 9, accuracy: 20, failed: true }
        },
        { expedition: activeExpedition, isFinaleGig: true },
        {}
      ]) {
        const dispatchers = {
          ...makeDispatchers(),
          offerExpeditionDraft: vi.fn()
        }
        const props = makeProps({ dispatchers, ...overrides })
        const { result } = renderHook(() => useContinueHandler(props))
        act(() => {
          result.current()
        })
        expect(dispatchers.offerExpeditionDraft).not.toHaveBeenCalled()
      }
    })
  })

  it('catches errors and releases guard when nothing was dispatched yet', () => {
    calculateContinueStats.mockImplementation(() => {
      throw new Error('Test error')
    })
    const props = makeProps({ financials: { net: 100, soldMerch: null } })
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

  it('keeps the guard closed and moves on when a dispatch throws after the settlement committed', () => {
    const dispatchers = makeDispatchers()
    // The sold-merch settlement (updateBand) returned; the player update then
    // throws. A second click must not pay the merch out again.
    dispatchers.updatePlayer.mockImplementation(() => {
      throw new Error('reducer rejected')
    })
    const props = makeProps({ dispatchers })
    const { result } = renderHook(() => useContinueHandler(props))

    act(() => {
      result.current()
    })
    act(() => {
      result.current()
    })

    expect(props.isProcessingActionRef.current).toBe(true)
    expect(props.setIsProcessingAction).not.toHaveBeenCalledWith(false)
    expect(dispatchers.updateBand).toHaveBeenCalledTimes(1)
    expect(dispatchers.changeScene).toHaveBeenCalledWith('OVERWORLD')
  })

  it('releases the guard when the very first dispatch throws, since nothing was applied', () => {
    const dispatchers = makeDispatchers()
    dispatchers.updateBand.mockImplementation(() => {
      throw new Error('reducer rejected')
    })
    const props = makeProps({ dispatchers })
    const { result } = renderHook(() => useContinueHandler(props))

    act(() => {
      result.current()
    })

    expect(props.isProcessingActionRef.current).toBe(false)
    expect(props.setIsProcessingAction).toHaveBeenCalledWith(false)
    expect(dispatchers.changeScene).not.toHaveBeenCalled()
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
