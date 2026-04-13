import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import {
  usePostGigLogic,
  DEFAULT_SOCIAL_UNAVAILABLE_MSG,
  DEFAULT_POST_FAILED_MSG
} from '../src/hooks/usePostGigLogic'
import * as GameState from '../src/context/GameState'
import * as economyEngine from '../src/utils/economyEngine'
import * as socialEngine from '../src/utils/socialEngine'
import * as crypto from '../src/utils/crypto'
import { GAME_PHASES } from '../src/context/gameConstants'

vi.mock('../src/context/GameState', () => ({ useGameState: vi.fn() }))
vi.mock('../src/utils/economyEngine', () => ({
  calculateGigFinancials: vi.fn(),
  shouldTriggerBankruptcy: vi.fn()
}))
vi.mock('../src/utils/socialEngine', () => ({
  generatePostOptions: vi.fn(),
  resolvePost: vi.fn(),
  checkViralEvent: vi.fn(),
  calculateSocialGrowth: vi.fn(),
  generateBrandOffers: vi.fn()
}))
vi.mock('../src/utils/crypto', () => ({ secureRandom: vi.fn() }))
vi.mock('../src/data/songs', () => ({
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
vi.mock('../src/utils/logger.js', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
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
    activeEvent: null,
    activeStoryFlags: [],
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
    socialEngine.generateBrandOffers.mockReturnValue([])
    crypto.secureRandom.mockReturnValue(0.5)
    GameState.useGameState.mockReturnValue(getBaseState())
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
        })
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
      await waitFor(() => {
        expect(result.current.postOptions).toEqual([])
        expect(result.current.phase).toBe('COMPLETE')
        expect(result.current.postResult).toMatchObject({
          type: 'ERROR',
          success: false
        })
      })
      expect(mockAddToast).toHaveBeenCalledWith(
        DEFAULT_SOCIAL_UNAVAILABLE_MSG,
        'error'
      )
    })

    it('handles low stats initialization', async () => {
      GameState.useGameState.mockReturnValue(
        getBaseState({
          lastGigStats: { score: 1000, accuracy: 50, events: [] }
        })
      )
      renderHook(() => usePostGigLogic())
      await waitFor(() => {
        expect(economyEngine.calculateGigFinancials).toHaveBeenCalledWith(
          expect.objectContaining({ performanceScore: 30 })
        )
      })
    })

    it('skips event triggering when activeEvent already exists', () => {
      GameState.useGameState.mockReturnValue(
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
        DEFAULT_POST_FAILED_MSG,
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

      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({ instagram: expect.any(Number), viral: 1 })
      )
      expect(mockAddToast).toHaveBeenCalledWith('Money +300€', 'success')
      expect(mockAddToast).toHaveBeenCalledWith('Harmony +15', 'success')
      expect(mockUpdateBand).toHaveBeenCalledWith(
        expect.objectContaining({
          members: expect.arrayContaining([
            expect.objectContaining({ mood: 70 })
          ])
        })
      )
      expect(mockUpdatePlayer).toHaveBeenCalledWith({ money: 800 })
      expect(mockUnlockTrait).toHaveBeenCalledWith(
        'Member1',
        'social_butterfly'
      )

      // Viral bonus
      mockUpdateSocial.mockClear()
      socialEngine.checkViralEvent.mockReturnValueOnce(true)
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        platform: 'instagram',
        followers: 100
      })
      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })
      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({ viral: 2 })
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
      socialEngine.generateBrandOffers.mockReturnValueOnce([
        {
          id: 'deal_1',
          name: 'Test Brand',
          offer: { upfront: 1000, duration: 3 }
        }
      ])
      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockAddToast).toHaveBeenCalledWith('Money -500€', 'error')
      expect(mockAddToast).toHaveBeenCalledWith('Harmony +50', 'success')
      await waitFor(() => {
        expect(result.current.phase).toBe('DEALS')
        expect(result.current.brandOffers).toHaveLength(1)
      })
    })

    it('handles brand deal acceptance, rejection, and errors', async () => {
      let { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.financials).toBeTruthy())

      // Accept deal (Upfront)
      let deal = {
        id: 'deal_1',
        name: 'Mega Corp',
        alignment: 'CORPORATE',
        offer: { upfront: 1000, duration: 3 },
        penalty: null
      }
      act(() => {
        result.current.handleAcceptDeal(deal)
      })
      expect(mockUpdatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({ money: 1500 })
      ) // 500 + 1000

      // Accept deal (Item)
      mockUpdateBand.mockClear()
      let dealItem = {
        id: 'deal_2',
        name: 'Cool Brand',
        offer: { item: 'special_guitar', duration: 2 },
        penalty: null
      }
      act(() => {
        result.current.handleAcceptDeal(dealItem)
      })
      expect(mockUpdateBand).toHaveBeenCalledWith(expect.any(Function))

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
      expect(() => {
        act(() => {
          result.current.handleAcceptDeal(dealError)
        })
      }).not.toThrow()
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Deal failed'),
        'error'
      )

      let dealWithPenalty = {
        id: 'deal_3',
        name: 'Evil Corp',
        alignment: 'EVIL',
        offer: { upfront: 2000, duration: 5 },
        penalty: { loyalty: -15, controversy: 30 }
      }
      act(() => {
        result.current.handleAcceptDeal(dealWithPenalty)
      })
      expect(mockUpdateSocial).toHaveBeenCalledWith(expect.any(Function))

      // Reject deals
      socialEngine.generateBrandOffers.mockReturnValueOnce([
        {
          id: 'deal_1',
          name: 'Test Brand',
          offer: { upfront: 1000, duration: 3 }
        }
      ])
      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })
      await waitFor(() => expect(result.current.phase).toBe('DEALS'))

      act(() => {
        result.current.handleRejectDeals()
      })
      expect(result.current.phase).toBe('COMPLETE')
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
      GameState.useGameState.mockReturnValue(
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
        expect(mockSaveGame).toHaveBeenCalledWith(false)
        expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
      })

      // Continue game flow (Ego management quest)
      GameState.useGameState.mockReturnValue(
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
          id: 'quest_ego_management',
          deadline: 10,
          required: 1,
          failurePenalty: { type: 'game_over' }
        })
      )
    })

    it('handles more specific edge cases (target member, missing data, ego management, stamina clamps)', async () => {
      let { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))

      // Target member
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        followers: 50,
        platform: 'instagram',
        moodChange: 25,
        targetMember: 'Member1'
      })
      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })
      expect(mockUpdateBand).toHaveBeenCalledWith(
        expect.objectContaining({
          members: expect.arrayContaining([
            expect.objectContaining({ name: 'Member1', mood: 75 }),
            expect.objectContaining({ name: 'Member2', mood: 50 })
          ])
        })
      )

      // Missing Influencer
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        followers: 50,
        platform: 'instagram',
        influencerUpdate: { id: 'nonexistent', scoreChange: 10 }
      })
      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })
      expect(mockUpdateSocial).toHaveBeenCalled()

      // Ego Drop
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        followers: 50,
        platform: 'instagram',
        egoDrop: 'Member2'
      })
      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })
      let updateFn =
        mockUpdateSocial.mock.calls[mockUpdateSocial.mock.calls.length - 1][0]
      let updatedSocial =
        typeof updateFn === 'function'
          ? updateFn(getBaseState().social)
          : updateFn
      expect(updatedSocial).toEqual(
        expect.objectContaining({ egoFocus: 'Member2' })
      )

      // All members stamina change clamping
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        followers: 50,
        platform: 'instagram',
        moodChange: 100,
        staminaChange: -100,
        allMembersMoodChange: true,
        allMembersStaminaChange: true
      })
      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })
      let updateBandFn =
        mockUpdateBand.mock.calls[mockUpdateBand.mock.calls.length - 1][0]
      let updatedBand =
        typeof updateBandFn === 'function'
          ? updateBandFn(getBaseState().band)
          : updateBandFn
      expect(updatedBand).toEqual(
        expect.objectContaining({
          members: expect.arrayContaining([
            expect.objectContaining({ mood: 100, stamina: 0 }),
            expect.objectContaining({ mood: 100, stamina: 0 })
          ])
        })
      )

      // Ego Clear
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        followers: 50,
        platform: 'instagram',
        egoClear: true
      })
      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })
      let egoClearFn =
        mockUpdateSocial.mock.calls[mockUpdateSocial.mock.calls.length - 1][0]
      let egoClearedSocial =
        typeof egoClearFn === 'function'
          ? egoClearFn({ ...getBaseState().social, egoFocus: 'Member1' })
          : egoClearFn
      expect(egoClearedSocial).toEqual(
        expect.objectContaining({ egoFocus: null })
      )
    })

    it('handles sponsor deactivation and early return from continue', async () => {
      // Need a clean mount for sponsor deactivation
      GameState.useGameState.mockReturnValue(
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
            activeDeals: [],
            influencers: {},
            brandReputation: {},
            sponsorActive: true
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
      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({ sponsorActive: false })
      )
    })

    it('returns early from handleContinue if financials are null', async () => {
      GameState.useGameState.mockReturnValue(
        getBaseState({ lastGigStats: null })
      )
      const { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.financials).toBeNull())
      act(() => {
        result.current.handleContinue()
      })
      expect(mockUpdatePlayer).not.toHaveBeenCalled()
    })

    it('handles bankruptcy and story quests on continue', async () => {
      GameState.useGameState.mockReturnValue(
        getBaseState({ activeStoryFlags: ['cancel_quest_active'] })
      )
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
          id: 'quest_apology_tour',
          deadline: 19,
          required: 3
        })
      )
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('BANKRUPT'),
        'error'
      )
      expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.GAMEOVER)
    })

    it('applies miss penalty on bad gig with excess misses', async () => {
      GameState.useGameState.mockReturnValue(
        getBaseState({
          lastGigStats: { score: 25000, accuracy: 60, events: [], misses: 13 }
        })
      )
      const { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.financials).toBeTruthy())
      act(() => { result.current.handleContinue() })
      // perfScore = clamp(25000/500, 30, 100) = 50 -> bad gig
      // missPenalty = round((13 - 8) * 0.5) = 3
      // finalFameGain = -FAME_LOSS_BAD_GIG - 3
      expect(mockUpdatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({ fame: expect.any(Number) })
      )
    })
  })
})
