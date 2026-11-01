import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePostGigLogic } from '../../src/hooks/usePostGigLogic'
import * as GameState from '../../src/context/GameState'
import * as economyEngine from '../../src/utils/economy'
import * as socialEngine from '../../src/utils/socialEngine'
import * as brandDealLogic from '../../src/utils/brandDealLogic'
import * as crypto from '../../src/utils/crypto'
import * as assetSelectors from '../../src/utils/assets/assetSelectors'
import { GAME_PHASES } from '../../src/context/gameConstants'
import { BALANCE_CONSTANTS } from '../../src/utils/gameState'

function mockGameState(state) {
  GameState.useGameSelector.mockImplementation(selector => selector(state))
  GameState.useGameActions.mockReturnValue(state)
}

vi.mock('../../src/context/GameState', () => {
  const useGameActions = vi.fn()
  const useGameSelector = vi.fn()
  return {
    useGameActions,
    useGameSelector
  }
})
vi.mock('../../src/utils/economy', () => ({
  calculateGigFinancials: vi.fn(),
  shouldTriggerBankruptcy: vi.fn(),
  applySwingSmoothing: vi.fn(val => val)
}))
vi.mock('../../src/utils/assets/assetSelectors', () => ({
  getTotalDailyObligations: vi.fn(() => 0),
  getActiveAssetModifiers: vi.fn(() => ({
    fuelMultiplier: 1,
    merchCostMultiplier: 1,
    songCostMultiplier: 1,
    trainingCostMultiplier: 1,
    baseRiskChanceMultiplier: 1,
    staminaRegenBonusPerDay: 0,
    travelStaminaRegen: 0,
    merchCapacityBonus: 0,
    songQualityBonus: 0,
    avgMerchSalePriceBonus: 0,
    famePassivePerDay: 0,
    bandMoodPerDay: 0,
    tipBonusGigs: 0,
    flags: {
      infightingDamper: false,
      enablesReRecording: false,
      enablesLimitedEditions: false,
      enablesBulkProduction: false,
      reducesTheftRiskTravel: false
    }
  }))
}))

vi.mock('../../src/utils/brandDealLogic', () => ({
  generateBrandOffers: vi.fn(),
  negotiateDeal: vi.fn()
}))
vi.mock('../../src/utils/socialEngine', () => ({
  generatePostOptions: vi.fn(),
  resolvePost: vi.fn(),
  checkViralEvent: vi.fn(),
  calculateSocialGrowth: vi.fn(),
  isPostMatchingTrend: vi.fn(() => false)
}))
vi.mock('../../src/utils/crypto', () => ({
  secureRandom: vi.fn(),
  getSafeRandom: vi.fn(() => 0.5),
  getSecureRandomUint32: vi.fn(() => 123456)
}))
vi.mock('../../src/data/songs', () => ({
  SONGS_DB: [
    { id: 'test_song', leaderboardId: 'test-song', name: 'Test Song' }
  ],
  SONGS_BY_ID: new Map([
    [
      'test_song',
      { id: 'test_song', leaderboardId: 'test-song', name: 'Test Song' }
    ]
  ])
}))
vi.mock('../../src/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
  isValidLogLevel: vi.fn(() => true),
  LOG_LEVELS: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, NONE: 4 }
}))
vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, options) => {
      const template = options?.defaultValue || key
      if (!options) return template
      return template.replace(/\{\{(\w+)\}\}/g, (_, token) =>
        String(options[token] ?? `{{${token}}}`)
      )
    }
  })
}))

describe('usePostGigLogic', () => {
  const mockUpdatePlayer = vi.fn()
  const mockUpdateBand = vi.fn()
  const mockUpdateSocial = vi.fn()
  const mockChangeScene = vi.fn()
  const mockTriggerEvent = vi.fn()
  const mockAddToast = vi.fn()
  const mockSaveGame = vi.fn()
  const mockUnlockTrait = vi.fn()
  const mockAddQuest = vi.fn()
  const mockApplyQuestEvent = vi.fn()
  const mockRecordExpeditionCrewStressSource = vi.fn()
  const mockCompleteExpedition = vi.fn()
  const mockSaveGameAfterStateCommit = vi.fn()
  const mockRecordPendingGigSettlement = vi.fn()
  const mockClearPendingGigSettlement = vi.fn()
  const mockCommitSocialPost = vi.fn(() => ({ ok: true }))

  const getBaseState = (overrides = {}) => ({
    currentGig: { songId: 'test_song', venue: 'Test Venue', payout: 500 },
    player: {
      money: 500,
      fame: 100,
      day: 5,
      location: 'berlin',
      playerId: null,
      playerName: null
    },
    band: {
      inventory: {},
      members: [
        { name: 'Member1', mood: 50, stamina: 50 },
        { name: 'Member2', mood: 50, stamina: 50 }
      ],
      harmony: 50
    },
    social: {
      instagram: 100,
      tiktok: 50,
      youtube: 25,
      trend: 'NEUTRAL',
      viral: 0,
      controversyLevel: 0,
      loyalty: 50,
      reputationCooldown: 0,
      egoFocus: null,
      sponsorActive: false,
      activeDeals: [],
      influencers: {},
      brandReputation: {}
    },
    lastGigStats: { score: 50000, accuracy: 95, events: [] },
    gigModifiers: {},
    assets: [],
    activeEvent: null,
    activeStoryFlags: [],
    expedition: { status: 'idle', routeStep: 0, loadout: null },
    triggerEvent: mockTriggerEvent,
    updatePlayer: mockUpdatePlayer,
    updateBand: mockUpdateBand,
    updateSocial: mockUpdateSocial,
    changeScene: mockChangeScene,
    saveGame: mockSaveGame,
    addToast: mockAddToast,
    unlockTrait: mockUnlockTrait,
    reputationByRegion: { berlin: 50 },
    setlist: [],
    addQuest: mockAddQuest,
    applyQuestEvent: mockApplyQuestEvent,
    recordExpeditionCrewStressSource: mockRecordExpeditionCrewStressSource,
    completeExpedition: mockCompleteExpedition,
    saveGameAfterStateCommit: mockSaveGameAfterStateCommit,
    recordPendingGigSettlement: mockRecordPendingGigSettlement,
    clearPendingGigSettlement: mockClearPendingGigSettlement,
    commitSocialPost: mockCommitSocialPost,
    ...overrides
  })

  beforeEach(() => {
    vi.clearAllMocks()
    economyEngine.calculateGigFinancials.mockReturnValue({
      net: 200,
      income: {
        total: 500,
        breakdown: [
          { labelKey: 'ticketSales', label: 'Ticket Sales', value: 500 }
        ]
      },
      expenses: {
        total: 300,
        breakdown: [{ labelKey: 'venueCut', label: 'Venue Cut', value: 300 }]
      }
    })
    economyEngine.shouldTriggerBankruptcy.mockReturnValue(false)
    socialEngine.generatePostOptions.mockReturnValue([
      { id: 'post_1', name: 'Test Post', platform: 'instagram', type: 'basic' }
    ])
    socialEngine.resolvePost.mockReturnValue({
      success: true,
      followers: 50,
      platform: 'instagram',
      message: 'Post successful!'
    })
    socialEngine.checkViralEvent.mockReturnValue(false)
    socialEngine.calculateSocialGrowth.mockReturnValue(25)
    brandDealLogic.generateBrandOffers.mockReturnValue([])
    crypto.secureRandom.mockReturnValue(0.5)
    mockGameState(getBaseState())
  })

  describe('Initialization & Event Trigger Chain', () => {
    it('handles initialization, phase transition and basic mounting events', async () => {
      mockTriggerEvent.mockReturnValueOnce(false).mockReturnValueOnce(true)
      const { result } = renderHook(() => usePostGigLogic())
      expect(result.current.phase).toBe('REPORT')
      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
        expect(result.current.postOptions.length).toBeGreaterThan(0)
      })
      expect(economyEngine.calculateGigFinancials).toHaveBeenCalledWith(
        expect.objectContaining({
          gigData: expect.objectContaining({ songId: 'test_song' }),
          performanceScore: 100
        }),
        expect.any(Object)
      )
      expect(mockTriggerEvent).toHaveBeenCalledWith('financial', 'post_gig')
      expect(mockTriggerEvent).toHaveBeenCalledWith('special', 'post_gig')
      act(() => {
        result.current.handleNextPhase()
      })
      expect(result.current.phase).toBe('SOCIAL')
    })

    it('handles initialization fallback when post options generation throws', async () => {
      socialEngine.generatePostOptions.mockImplementation(() => {
        throw new Error('bad state')
      })
      const { result } = renderHook(() => usePostGigLogic())

      // Action triggers the error response now
      act(() => {
        result.current.handleNextPhase()
      })

      await waitFor(() => {
        expect(result.current.postOptions).toEqual([])
        expect(result.current.phase).toBe('COMPLETE')
        expect(result.current.postResult).toMatchObject({
          type: 'ERROR',
          success: false
        })
      })
      expect(mockAddToast).toHaveBeenCalledWith(
        'ui:postGig.socialOptionsUnavailable',
        'error'
      )
    })

    it('handles low stats initialization', async () => {
      mockGameState(
        getBaseState({
          lastGigStats: { score: 1000, accuracy: 50, events: [] }
        })
      )
      renderHook(() => usePostGigLogic())
      await waitFor(() => {
        expect(economyEngine.calculateGigFinancials).toHaveBeenCalledWith(
          expect.objectContaining({ performanceScore: 30 }),
          expect.any(Object)
        )
      })
    })

    it('passes active asset modifiers into post-gig financials', async () => {
      const assetModifiers = {
        fuelMultiplier: 1,
        merchCostMultiplier: 1,
        songCostMultiplier: 1,
        trainingCostMultiplier: 1,
        baseRiskChanceMultiplier: 1,
        staminaRegenBonusPerDay: 0,
        travelStaminaRegen: 0,
        merchCapacityBonus: 0,
        songQualityBonus: 0,
        avgMerchSalePriceBonus: 0.25,
        famePassivePerDay: 0,
        bandMoodPerDay: 0,
        tipBonusGigs: 0.1,
        flags: {
          infightingDamper: false,
          enablesReRecording: false,
          enablesLimitedEditions: false,
          enablesBulkProduction: false,
          reducesTheftRiskTravel: false
        }
      }
      const assets = [{ id: 'asset_1', slots: [] }]
      assetSelectors.getActiveAssetModifiers.mockReturnValueOnce(assetModifiers)
      mockGameState(getBaseState({ assets }))

      renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(assetSelectors.getActiveAssetModifiers).toHaveBeenCalledWith(
          assets
        )
        expect(economyEngine.calculateGigFinancials).toHaveBeenCalledWith(
          expect.any(Object),
          assetModifiers
        )
      })
    })

    it('skips event triggering when activeEvent already exists', () => {
      mockGameState(
        getBaseState({ activeEvent: { id: 'some_event', type: 'financial' } })
      )
      renderHook(() => usePostGigLogic())
      expect(mockTriggerEvent).not.toHaveBeenCalled()
    })

    it('covers trigger event returning false for both financial and special', () => {
      mockTriggerEvent
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
      renderHook(() => usePostGigLogic())
      expect(mockTriggerEvent).toHaveBeenCalledWith('financial', 'post_gig')
      expect(mockTriggerEvent).toHaveBeenCalledWith('special', 'post_gig')
      expect(mockTriggerEvent).toHaveBeenCalledWith('band', 'post_gig')
    })
  })

  describe('Post Selection, Brand Deals, Spin Story, Continue, Edge Cases', () => {
    it('shows an error toast and aborts when post resolution throws', async () => {
      socialEngine.resolvePost.mockImplementation(() => {
        throw new Error('broken resolver')
      })
      const { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => {
        expect(result.current.postOptions.length).toBeGreaterThan(0)
      })
      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })
      expect(mockAddToast).toHaveBeenCalledWith(
        'ui:postGig.postResolutionFailed',
        'error'
      )
      expect(mockUpdateSocial).not.toHaveBeenCalled()
    })

    it('handles basic post selection and viral bonus', async () => {
      const { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))

      // Success (Basic post)
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        platform: 'instagram',
        followers: 100,
        moneyChange: 300,
        harmonyChange: 15,
        moodChange: 20,
        allMembersMoodChange: true,
        unlockTrait: { memberId: 'Member1', traitId: 'social_butterfly' }
      })
      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockCommitSocialPost).toHaveBeenCalledWith(
        expect.objectContaining({
          social: expect.objectContaining({ instagram: expect.any(Number) })
        })
      )
      expect(mockAddToast).toHaveBeenCalledWith('Money +€300', 'success')
      expect(mockAddToast).toHaveBeenCalledWith('Harmony +15', 'success')
      expect(mockUnlockTrait).toHaveBeenCalledWith(
        'Member1',
        'social_butterfly'
      )

      // Viral bonus
      mockCommitSocialPost.mockClear()
      socialEngine.checkViralEvent.mockReturnValueOnce(true)
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        platform: 'instagram',
        followers: 100
      })
      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })
      expect(mockCommitSocialPost).toHaveBeenCalledWith(
        expect.objectContaining({
          social: expect.objectContaining({ viral: 2 })
        })
      )
    })

    it('handles post selection clamping and brand offers', async () => {
      const { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))

      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        platform: 'instagram',
        followers: 100,
        moneyChange: -600,
        harmonyChange: 60
      })
      brandDealLogic.generateBrandOffers.mockReturnValueOnce([
        {
          id: 'deal_1',
          name: 'Test Brand',
          offer: { upfront: 1000, duration: 3 }
        }
      ])
      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockAddToast).toHaveBeenCalledWith('Money -€500', 'error')
      expect(mockAddToast).toHaveBeenCalledWith('Harmony +50', 'success')
      await waitFor(() => {
        expect(result.current.phase).toBe('DEALS')
        expect(result.current.brandOffers).toHaveLength(1)
      })
    })

    it('generates brand offers once from the live store state, including rivalBand', async () => {
      const rivalBand = {
        id: 'rival_1',
        currentLocationId: 'node_1',
        powerLevel: 75
      }
      mockGameState(getBaseState({ rivalBand }))
      const { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      await waitFor(() => expect(result.current.phase).toBe('COMPLETE'))
      expect(brandDealLogic.generateBrandOffers).toHaveBeenCalledTimes(1)
      expect(brandDealLogic.generateBrandOffers).toHaveBeenCalledWith(
        expect.objectContaining({
          player: expect.objectContaining({ money: 500 }),
          band: expect.objectContaining({ harmony: 50 }),
          social: expect.objectContaining({ instagram: 100 }),
          rivalBand
        }),
        expect.any(Function)
      )
    })

    it('finishes without offers when brand offer generation throws', async () => {
      mockGameState(getBaseState())
      brandDealLogic.generateBrandOffers.mockImplementationOnce(() => {
        throw new Error('offer pool exploded')
      })
      const { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      await waitFor(() => expect(result.current.phase).toBe('COMPLETE'))
      expect(result.current.brandOffers).toEqual([])
    })

    it('handles brand deal acceptance, rejection, and errors', async () => {
      // Each sub-scenario uses its own hook instance because the single-shot guard
      // holds after a successful deal acceptance until the phase changes.

      // Accept deal (Upfront)
      let deal = {
        id: 'deal_1',
        name: 'Mega Corp',
        alignment: 'CORPORATE',
        offer: { upfront: 1000, duration: 3 },
        penalty: null
      }
      {
        let { result, unmount } = renderHook(() => usePostGigLogic())
        await waitFor(() => expect(result.current.financials).toBeTruthy())
        act(() => {
          result.current.handleAcceptDeal(deal)
        })
        expect(mockUpdatePlayer).toHaveBeenCalledWith(
          expect.objectContaining({ money: 1500 })
        ) // 500 + 1000
        unmount()
      }

      // Accept deal (Item)
      mockUpdateBand.mockClear()
      let dealItem = {
        id: 'deal_2',
        name: 'Cool Brand',
        offer: { item: 'special_guitar', duration: 2 },
        penalty: null
      }
      {
        let { result, unmount } = renderHook(() => usePostGigLogic())
        await waitFor(() => expect(result.current.financials).toBeTruthy())
        act(() => {
          result.current.handleAcceptDeal(dealItem)
        })
        expect(mockUpdateBand).toHaveBeenCalledWith(expect.any(Function))
        unmount()
      }

      // Accept deal (Error handling)
      mockUpdatePlayer.mockImplementationOnce(() => {
        throw new Error('Database Error')
      })
      let dealError = {
        id: 'deal_error',
        name: 'Error Corp',
        alignment: 'CORPORATE',
        offer: { upfront: 1000, duration: 3 },
        penalty: null
      }
      {
        let { result, unmount } = renderHook(() => usePostGigLogic())
        await waitFor(() => expect(result.current.financials).toBeTruthy())
        expect(() => {
          act(() => {
            result.current.handleAcceptDeal(dealError)
          })
        }).not.toThrow()
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.stringContaining('Deal failed'),
          'error'
        )
        unmount()
      }

      let dealWithPenalty = {
        id: 'deal_3',
        name: 'Evil Corp',
        alignment: 'EVIL',
        offer: { upfront: 2000, duration: 5 },
        penalty: { loyalty: -15, controversy: 30 }
      }
      {
        mockUpdateSocial.mockClear()
        let { result, unmount } = renderHook(() => usePostGigLogic())
        await waitFor(() => expect(result.current.financials).toBeTruthy())
        act(() => {
          result.current.handleAcceptDeal(dealWithPenalty)
        })
        expect(mockUpdateSocial).toHaveBeenCalledWith(expect.any(Function))
        unmount()
      }

      // Reject deals
      {
        brandDealLogic.generateBrandOffers.mockReturnValueOnce([
          {
            id: 'deal_1',
            name: 'Test Brand',
            offer: { upfront: 1000, duration: 3 }
          }
        ])
        let { result, unmount } = renderHook(() => usePostGigLogic())
        await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
        act(() => {
          result.current.handlePostSelection(result.current.postOptions[0])
        })
        await waitFor(() => expect(result.current.phase).toBe('DEALS'))

        act(() => {
          result.current.handleRejectDeals()
        })
        expect(result.current.phase).toBe('COMPLETE')
        unmount()
      }
    })

    it('handles spin story limits and success', async () => {
      let { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.financials).toBeTruthy())

      // Spin story (Success)
      act(() => {
        result.current.handleSpinStory()
      })
      expect(mockUpdatePlayer).toHaveBeenCalledWith({ money: 300 }) // initial 500 - 200
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Controversy reduced'),
        'success'
      )

      // Spin story (Insufficient funds)
      mockGameState(
        getBaseState({
          player: { money: 100, fame: 100, day: 5, location: 'berlin' }
        })
      )
      let { result: spinResult } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(spinResult.current.financials).toBeTruthy())
      mockUpdatePlayer.mockClear()
      act(() => {
        spinResult.current.handleSpinStory()
      })
      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Not enough cash'),
        'error'
      )
    })

    it('reports spin story unaffordable when only protected Expedition cash covers it (#3464)', () => {
      const { result: idle } = renderHook(() => usePostGigLogic())
      expect(idle.current.canAffordSpinStory).toBe(true)

      // 1000 on hand, 900 protected: 100 spendable is below the 200 cost.
      mockGameState(
        getBaseState({
          player: { money: 1000, fame: 100, day: 5, location: 'berlin' },
          expedition: {
            status: 'active',
            routeStep: 0,
            loadout: null,
            protectedCareerCash: 900
          }
        })
      )
      const { result } = renderHook(() => usePostGigLogic())
      expect(result.current.canAffordSpinStory).toBe(false)
    })

    it('handles continue flow and ego quests', async () => {
      let { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.financials).toBeTruthy())

      // Continue game flow (Success)
      act(() => {
        result.current.handleContinue()
      })
      expect(mockUpdatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({ money: 700, fame: expect.any(Number) })
      ) // 500 initial + 200 net
      await waitFor(() => {
        expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
      })

      // Continue game flow (Ego management quest)
      mockGameState(
        getBaseState({ activeStoryFlags: ['breakup_quest_active'] })
      )
      let { result: egoQuestResult } = renderHook(() => usePostGigLogic())
      await waitFor(() =>
        expect(egoQuestResult.current.financials).toBeTruthy()
      )
      act(() => {
        egoQuestResult.current.handleContinue()
      })
      expect(mockAddQuest).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'quest_ego_management'
        })
      )
    })

    it('includes excess miss money penalty in displayed financials before continue', async () => {
      mockGameState(
        getBaseState({
          lastGigStats: { score: 25000, accuracy: 60, events: [], misses: 13 }
        })
      )

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.financials.net).toBe(140)
      })
      expect(result.current.financials.expenses.total).toBe(360)
      expect(result.current.financials.expenses.breakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            labelKey: 'economy:gigExpenses.performancePenalty.label',
            value: 60
          })
        ])
      )
    })

    it('does not subtract a hidden miss money penalty during continue', async () => {
      mockGameState(
        getBaseState({
          lastGigStats: { score: 25000, accuracy: 60, events: [], misses: 13 }
        })
      )

      const { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.financials).toBeTruthy())

      act(() => {
        result.current.handleContinue()
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({ money: 640 })
      )
    })

    it('handles more specific edge cases (target member, missing data, ego management, stamina clamps)', async () => {
      // Each sub-scenario uses its own hook instance because the single-shot guard
      // holds after handlePostSelection until the phase changes.

      // Target member
      {
        socialEngine.resolvePost.mockReturnValueOnce({
          success: true,
          followers: 50,
          platform: 'instagram',
          moodChange: 25,
          targetMember: 'Member1'
        })
        mockUpdateBand.mockClear()
        let { result } = renderHook(() => usePostGigLogic())
        await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
        act(() => {
          result.current.handlePostSelection(result.current.postOptions[0])
        })
        expect(mockCommitSocialPost).toHaveBeenCalledWith(
          expect.objectContaining({
            band: expect.objectContaining({
              members: expect.arrayContaining([
                expect.objectContaining({ name: 'Member1', mood: 75 }),
                expect.objectContaining({ name: 'Member2', mood: 50 })
              ])
            })
          })
        )
      }

      // Missing Influencer
      {
        socialEngine.resolvePost.mockReturnValueOnce({
          success: true,
          followers: 50,
          platform: 'instagram',
          influencerUpdate: { id: 'nonexistent', scoreChange: 10 }
        })
        mockCommitSocialPost.mockClear()
        let { result } = renderHook(() => usePostGigLogic())
        await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
        act(() => {
          result.current.handlePostSelection(result.current.postOptions[0])
        })
        expect(mockCommitSocialPost).toHaveBeenCalled()
      }

      // Ego Drop
      {
        socialEngine.resolvePost.mockReturnValueOnce({
          success: true,
          followers: 50,
          platform: 'instagram',
          egoDrop: 'Member2'
        })
        mockCommitSocialPost.mockClear()
        let { result } = renderHook(() => usePostGigLogic())
        await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
        act(() => {
          result.current.handlePostSelection(result.current.postOptions[0])
        })
        let commitPayload =
          mockCommitSocialPost.mock.calls[
            mockCommitSocialPost.mock.calls.length - 1
          ][0]
        expect(commitPayload.social).toEqual(
          expect.objectContaining({ egoFocus: 'Member2' })
        )
      }

      // All members stamina change clamping
      {
        socialEngine.resolvePost.mockReturnValueOnce({
          success: true,
          followers: 50,
          platform: 'instagram',
          moodChange: 100,
          staminaChange: -100,
          allMembersMoodChange: true,
          allMembersStaminaChange: true
        })
        mockCommitSocialPost.mockClear()
        let { result } = renderHook(() => usePostGigLogic())
        await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
        act(() => {
          result.current.handlePostSelection(result.current.postOptions[0])
        })
        let commitPayload =
          mockCommitSocialPost.mock.calls[
            mockCommitSocialPost.mock.calls.length - 1
          ][0]
        expect(commitPayload.band).toEqual(
          expect.objectContaining({
            members: expect.arrayContaining([
              expect.objectContaining({ mood: 100, stamina: 0 }),
              expect.objectContaining({ mood: 100, stamina: 0 })
            ])
          })
        )
      }

      // Ego Clear
      {
        socialEngine.resolvePost.mockReturnValueOnce({
          success: true,
          followers: 50,
          platform: 'instagram',
          egoClear: true
        })
        mockCommitSocialPost.mockClear()
        let { result } = renderHook(() => usePostGigLogic())
        await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
        act(() => {
          result.current.handlePostSelection(result.current.postOptions[0])
        })
        let commitPayload =
          mockCommitSocialPost.mock.calls[
            mockCommitSocialPost.mock.calls.length - 1
          ][0]
        expect(commitPayload.social).toEqual(
          expect.objectContaining({ egoFocus: null })
        )
      }
    })

    it('handles sponsor deactivation and early return from continue', async () => {
      // Need a clean mount for sponsor deactivation
      mockGameState(
        getBaseState({
          social: {
            instagram: 100,
            tiktok: 50,
            youtube: 25,
            trend: 'NEUTRAL',
            viral: 0,
            controversyLevel: 0,
            loyalty: 50,
            reputationCooldown: 0,
            egoFocus: null,
            activeDeals: [
              {
                id: 'test_brand',
                type: 'SPONSORSHIP',
                name: 'Test Brand',
                offer: { upfront: 100, duration: 1, perGig: 50 },
                remainingGigs: 1,
                penalty: { controversy: 5, loyalty: -5 }
              }
            ],
            influencers: {},
            brandReputation: {}
          }
        })
      )
      socialEngine.generatePostOptions.mockReturnValue([
        {
          id: 'comm_sellout_ad',
          name: 'Sellout Ad',
          platform: 'instagram',
          type: 'basic'
        }
      ])

      const { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })
      expect(mockCommitSocialPost).toHaveBeenCalledWith(
        expect.objectContaining({
          social: expect.objectContaining({ activeDeals: [] })
        })
      )
    })

    it('uses finite harmony when deriving neurotoxic pedal penalty', async () => {
      mockGameState(
        getBaseState({
          band: {
            ...getBaseState().band,
            harmony: Number.NaN,
            inventory: { neurotoxicPedal: true }
          }
        })
      )

      const { result } = renderHook(() => usePostGigLogic())

      expect(result.current.pedalHarmonyPenalty).toBe(0)
    })

    it('returns early from handleContinue if financials are null', async () => {
      mockGameState(getBaseState({ lastGigStats: null }))
      const { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.financials).toBeNull())
      act(() => {
        result.current.handleContinue()
      })
      expect(mockUpdatePlayer).not.toHaveBeenCalled()
    })

    it('handles bankruptcy and story quests on continue', async () => {
      mockGameState(getBaseState({ activeStoryFlags: ['cancel_quest_active'] }))
      economyEngine.shouldTriggerBankruptcy.mockReturnValue(true)
      economyEngine.calculateGigFinancials.mockReturnValue({
        net: -600,
        income: { total: 100, breakdown: [] },
        expenses: { total: 700, breakdown: [] }
      })

      const { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.financials).toBeTruthy())

      act(() => {
        result.current.handleContinue()
      })

      expect(mockAddQuest).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'quest_apology_tour'
        })
      )
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('BANKRUPT'),
        'error'
      )
      expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.GAMEOVER)
    })

    it('passes total daily obligations into the bankruptcy check', async () => {
      mockGameState(getBaseState())
      assetSelectors.getTotalDailyObligations.mockReturnValue(50)
      economyEngine.shouldTriggerBankruptcy.mockReturnValue(false)
      economyEngine.calculateGigFinancials.mockReturnValue({
        net: -600,
        income: { total: 100, breakdown: [] },
        expenses: { total: 700, breakdown: [] }
      })

      const { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.financials).toBeTruthy())

      act(() => {
        result.current.handleContinue()
      })

      expect(economyEngine.shouldTriggerBankruptcy).toHaveBeenCalledWith(
        expect.any(Number),
        -600,
        50
      )
      // vi.clearAllMocks() does not undo mockReturnValue; restore the default.
      assetSelectors.getTotalDailyObligations.mockReturnValue(0)
    })

    it('records the presented settlement exactly once and saves it', async () => {
      const state = getBaseState({
        currentGig: { id: 'venue_1', songId: 'test_song', payout: 500 },
        lastGigStats: { score: 50000, accuracy: 95, misses: 3, events: [] }
      })
      mockGameState(state)

      const { result, rerender } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.financials).toBeTruthy())

      expect(mockRecordPendingGigSettlement).toHaveBeenCalledTimes(1)
      expect(mockRecordPendingGigSettlement).toHaveBeenCalledWith({
        gigId: 'venue_1',
        net: result.current.financials.net,
        perfScore: expect.any(Number),
        misses: 3,
        dealFameMultiplier: 1,
        soldMerch: result.current.financials.soldMerch ?? {}
      })
      expect(mockSaveGameAfterStateCommit).toHaveBeenCalledTimes(1)

      // Unrelated state changes on the result screen do not record again.
      mockGameState({
        ...state,
        player: { ...state.player, money: 900 },
        pendingGigSettlement: { id: 'settle-1' }
      })
      rerender()
      rerender()
      expect(mockRecordPendingGigSettlement).toHaveBeenCalledTimes(1)
      expect(mockSaveGameAfterStateCommit).toHaveBeenCalledTimes(1)
    })

    it('Continue clears the recorded settlement by id', async () => {
      mockGameState(
        getBaseState({
          currentGig: { id: 'venue_1', songId: 'test_song', payout: 500 },
          pendingGigSettlement: { id: 'settle-1' }
        })
      )

      const { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.financials).toBeTruthy())

      act(() => {
        result.current.handleContinue()
      })

      expect(mockClearPendingGigSettlement).toHaveBeenCalledTimes(1)
      expect(mockClearPendingGigSettlement).toHaveBeenCalledWith('settle-1')
    })

    it('applies miss penalty on bad gig with excess misses', async () => {
      const baseState = getBaseState({
        lastGigStats: { score: 1000, accuracy: 60, events: [], misses: 13 }
      })
      mockGameState(baseState)
      const { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.financials).toBeTruthy())
      act(() => {
        result.current.handleContinue()
      })
      // perfScore = clamp(1000/150, 30, 100) = 30 -> bad gig (below threshold 31)
      // missPenalty = round((13 - 8) * MISS_PENALTY_RATE)
      // finalFameGain = -FAME_LOSS_BAD_GIG - missPenalty
      const expectedMissPenalty = Math.round(
        (13 - 8) * BALANCE_CONSTANTS.MISS_PENALTY_RATE
      )
      const expectedFame =
        baseState.player.fame -
        BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG -
        expectedMissPenalty
      expect(mockUpdatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({ fame: expectedFame })
      )
    })
  })

  // handleNextPhase keeps the processing guard held; only the phase change
  // releases it. Each case checks both the rendered flag and that the next
  // phase's action is not blocked by a stale guard ref.
  describe('handleNextPhase guard release on phase change', () => {
    it('releases the guard after reaching SOCIAL', async () => {
      const { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))

      act(() => {
        result.current.handleNextPhase()
      })

      expect(result.current.phase).toBe('SOCIAL')
      expect(result.current.isProcessingAction).toBe(false)

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })
      expect(mockCommitSocialPost).toHaveBeenCalledTimes(1)
    })

    it('releases the guard after the error path reaches COMPLETE', async () => {
      socialEngine.generatePostOptions.mockImplementation(() => {
        throw new Error('bad state')
      })
      const { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.financials).toBeTruthy())

      act(() => {
        result.current.handleNextPhase()
      })

      expect(result.current.phase).toBe('COMPLETE')
      expect(result.current.isProcessingAction).toBe(false)

      act(() => {
        result.current.handleContinue()
      })
      await waitFor(() => {
        expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
      })
    })
  })
})
