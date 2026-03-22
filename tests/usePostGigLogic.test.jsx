import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

// Mock dependencies
vi.mock('../src/context/GameState', () => ({
  useGameState: vi.fn()
}))

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

vi.mock('../src/utils/crypto', () => ({
  secureRandom: vi.fn()
}))

vi.mock('../src/data/songs', () => ({
  SONGS_DB: [
    {
      id: 'test_song',
      leaderboardId: 'test-song',
      name: 'Test Song'
    }
  ]
}))

vi.mock('../src/utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  },
  LOG_LEVELS: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
  }
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
    lastGigStats: {
      score: 50000,
      accuracy: 95,
      events: []
    },
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
    setupDefaultMocks()
  })

  const setupDefaultMocks = () => {
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
      {
        id: 'post_1',
        name: 'Test Post',
        platform: 'instagram',
        type: 'basic'
      }
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
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('initializes in REPORT phase with financials and post options', async () => {
      const { result } = renderHook(() => usePostGigLogic())

      expect(result.current.phase).toBe('REPORT')

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
        expect(result.current.postOptions.length).toBeGreaterThan(0)
      })

      // Verify both calculations were called
      expect(economyEngine.calculateGigFinancials).toHaveBeenCalledWith(
        expect.objectContaining({
          gigData: expect.objectContaining({ songId: 'test_song' }),
          performanceScore: 100
        })
      )
      expect(socialEngine.generatePostOptions).toHaveBeenCalled()
    })

    it('falls back gracefully when post options generation throws', async () => {
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

    it('clamps performance score to minimum when stats are low', async () => {
      GameState.useGameState.mockReturnValue(
        getBaseState({
          lastGigStats: { score: 1000, accuracy: 50, events: [] }
        })
      )

      renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(economyEngine.calculateGigFinancials).toHaveBeenCalledWith(
          expect.objectContaining({
            performanceScore: 30 // Minimum
          })
        )
      })
    })
  })

  describe('1) Event trigger chain on mount', () => {
    it('covers triggerEvent returning null for financial, then successfully triggering special', () => {
      mockTriggerEvent
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ id: 'special_event' })

      renderHook(() => usePostGigLogic())

      expect(mockTriggerEvent).toHaveBeenCalledWith('financial', 'post_gig')
      expect(mockTriggerEvent).toHaveBeenCalledWith('special', 'post_gig')
      expect(mockTriggerEvent).not.toHaveBeenCalledWith('band', 'post_gig')
    })

    it('covers both financial and special returning null, then triggering band', () => {
      mockTriggerEvent
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ id: 'band_event' })

      renderHook(() => usePostGigLogic())

      expect(mockTriggerEvent).toHaveBeenCalledWith('financial', 'post_gig')
      expect(mockTriggerEvent).toHaveBeenCalledWith('special', 'post_gig')
      expect(mockTriggerEvent).toHaveBeenCalledWith('band', 'post_gig')
    })

    it('verifies no extra trigger calls once one event type resolves', () => {
      mockTriggerEvent
        .mockReturnValueOnce({ id: 'financial_event' })

      renderHook(() => usePostGigLogic())

      expect(mockTriggerEvent).toHaveBeenCalledWith('financial', 'post_gig')
      expect(mockTriggerEvent).not.toHaveBeenCalledWith('special', 'post_gig')
      expect(mockTriggerEvent).not.toHaveBeenCalledWith('band', 'post_gig')
    })

    it('skips event triggering when activeEvent already exists', () => {
      GameState.useGameState.mockReturnValue(
        getBaseState({ activeEvent: { id: 'some_event', type: 'financial' } })
      )

      renderHook(() => usePostGigLogic())
      expect(mockTriggerEvent).not.toHaveBeenCalled()
    })
  })

  describe('phase transitions', () => {
    it('advances from REPORT to SOCIAL phase', async () => {
      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      act(() => {
        result.current.handleNextPhase()
      })

      expect(result.current.phase).toBe('SOCIAL')
    })
  })

  describe('post selection', () => {
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

    it('processes basic post: updates followers, viral count, and cross-posts', async () => {
      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      // Verify social followers updated
      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          instagram: expect.any(Number),
          viral: 1, // incremented
          tiktok: expect.any(Number), // cross-posted
          youtube: expect.any(Number) // cross-posted
        })
      )
    })

    it('handles financial deltas: money, harmony, and clamping at bounds', async () => {
      // First call: normal deltas
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        platform: 'instagram',
        followers: 100,
        moneyChange: 200,
        harmonyChange: 15
      })

      let { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
      act(() =>
        result.current.handlePostSelection(result.current.postOptions[0])
      )

      expect(mockAddToast).toHaveBeenCalledWith('Money +200€', 'success')
      expect(mockAddToast).toHaveBeenCalledWith('Harmony +15', 'success')

      // Cleanup for second test
      vi.clearAllMocks()

      // Second call: clamped deltas
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        platform: 'instagram',
        followers: 100,
        moneyChange: -600, // would go negative
        harmonyChange: 60 // would exceed max
      })

      result = renderHook(() => usePostGigLogic()).result
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
      act(() =>
        result.current.handlePostSelection(result.current.postOptions[0])
      )

      expect(mockAddToast).toHaveBeenCalledWith('Money -500€', 'error')
      expect(mockAddToast).toHaveBeenCalledWith('Harmony +50', 'success')
    })

    it('handles band and member updates: harmony, mood changes, and targeting', async () => {
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        followers: 50,
        platform: 'instagram',
        harmonyChange: 15
      })

      let { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
      act(() =>
        result.current.handlePostSelection(result.current.postOptions[0])
      )

      expect(mockUpdateBand).toHaveBeenCalledWith(
        expect.objectContaining({ harmony: 65 })
      )

      // Test all members mood change
      vi.clearAllMocks()
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        followers: 50,
        platform: 'instagram',
        moodChange: 20,
        allMembersMoodChange: true
      })

      result = renderHook(() => usePostGigLogic()).result
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
      act(() =>
        result.current.handlePostSelection(result.current.postOptions[0])
      )

      expect(mockUpdateBand).toHaveBeenCalledWith(
        expect.objectContaining({
          members: expect.arrayContaining([
            expect.objectContaining({ mood: 70 }),
            expect.objectContaining({ mood: 70 })
          ])
        })
      )

      // Test target member
      vi.clearAllMocks()
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        followers: 50,
        platform: 'instagram',
        moodChange: 25,
        targetMember: 'Member1'
      })

      result = renderHook(() => usePostGigLogic()).result
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
      act(() =>
        result.current.handlePostSelection(result.current.postOptions[0])
      )

      expect(mockUpdateBand).toHaveBeenCalledWith(
        expect.objectContaining({
          members: expect.arrayContaining([
            expect.objectContaining({ name: 'Member1', mood: 75 }),
            expect.objectContaining({ name: 'Member2', mood: 50 })
          ])
        })
      )
    })

    it('applies player money and viral bonuses', async () => {
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        followers: 50,
        platform: 'instagram',
        moneyChange: 300
      })

      let { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
      act(() =>
        result.current.handlePostSelection(result.current.postOptions[0])
      )

      expect(mockUpdatePlayer).toHaveBeenCalledWith({ money: 800 })

      // Test viral bonus
      vi.clearAllMocks()
      socialEngine.checkViralEvent.mockReturnValueOnce(true)

      result = renderHook(() => usePostGigLogic()).result
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
      act(() =>
        result.current.handlePostSelection(result.current.postOptions[0])
      )

      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({ viral: 2 })
      )
    })

    it('processes trait unlock and influencer updates', async () => {
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        followers: 50,
        platform: 'instagram',
        unlockTrait: { memberId: 'Member1', traitId: 'social_butterfly' }
      })

      let { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
      act(() =>
        result.current.handlePostSelection(result.current.postOptions[0])
      )

      expect(mockUnlockTrait).toHaveBeenCalledWith(
        'Member1',
        'social_butterfly'
      )
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('SOCIAL BUTTERFLY'),
        'success'
      )

      // Test influencer update
      vi.clearAllMocks()
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
            influencers: { influencer1: { score: 40 } }
          }
        })
      )
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        followers: 50,
        platform: 'instagram',
        influencerUpdate: { id: 'influencer1', scoreChange: 30 }
      })

      result = renderHook(() => usePostGigLogic()).result
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
      act(() =>
        result.current.handlePostSelection(result.current.postOptions[0])
      )

      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          influencers: { influencer1: { score: 70 } }
        })
      )
    })

    it('transitions to phase based on brand offers availability', async () => {
      socialEngine.generateBrandOffers.mockReturnValueOnce([
        {
          id: 'deal_1',
          name: 'Test Brand',
          offer: { upfront: 1000, duration: 3 }
        }
      ])

      let { result } = renderHook(() => usePostGigLogic())
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
      act(() =>
        result.current.handlePostSelection(result.current.postOptions[0])
      )

      await waitFor(() => {
        expect(result.current.phase).toBe('DEALS')
        expect(result.current.brandOffers).toHaveLength(1)
      })

      // Test no offers path
      vi.clearAllMocks()

      result = renderHook(() => usePostGigLogic()).result
      await waitFor(() => expect(result.current.postOptions).toHaveLength(1))
      act(() =>
        result.current.handlePostSelection(result.current.postOptions[0])
      )

      await waitFor(() => {
        expect(result.current.phase).toBe('COMPLETE')
      })
    })

    it('deactivates sponsor on sellout ad post', async () => {
      socialEngine.generatePostOptions.mockReturnValue([
        {
          id: 'comm_sellout_ad',
          name: 'Sellout Ad',
          platform: 'instagram'
        }
      ])

      GameState.useGameState.mockReturnValue(
        getBaseState({
          social: {
            instagram: 100,
            sponsorActive: true
          }
        })
      )

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          sponsorActive: false
        })
      )
    })
  })

  describe('brand deals', () => {
    it('accepts deals with various reward types and penalties', async () => {
      // Test upfront payment
      let deal = {
        id: 'deal_1',
        name: 'Mega Corp',
        alignment: 'CORPORATE',
        offer: { upfront: 1000, duration: 3 },
        penalty: null
      }

      let { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      act(() => {
        result.current.handleAcceptDeal(deal)
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({ money: 1500 })
      )
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Mega Corp'),
        'success'
      )

      // Test item reward
      vi.clearAllMocks()
      deal = {
        id: 'deal_2',
        name: 'Cool Brand',
        offer: { item: 'special_guitar', duration: 2 },
        penalty: null
      }

      result = renderHook(() => usePostGigLogic()).result

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      act(() => {
        result.current.handleAcceptDeal(deal)
      })

      expect(mockUpdateBand).toHaveBeenCalledWith(expect.any(Function))

      // Test with penalties
      vi.clearAllMocks()
      deal = {
        id: 'deal_3',
        name: 'Evil Corp',
        alignment: 'EVIL',
        offer: { upfront: 2000, duration: 5 },
        penalty: { loyalty: -15, controversy: 30 }
      }

      result = renderHook(() => usePostGigLogic()).result

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      act(() => {
        result.current.handleAcceptDeal(deal)
      })

      expect(mockUpdateSocial).toHaveBeenCalledWith(expect.any(Function))
    })

    it('handles errors gracefully and rejects deals', async () => {
      mockUpdatePlayer.mockImplementationOnce(() => {
        throw new Error('Database Error')
      })

      const deal = {
        id: 'deal_error',
        name: 'Error Corp',
        alignment: 'CORPORATE',
        offer: { upfront: 1000, duration: 3 },
        penalty: null
      }

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      expect(() => {
        act(() => {
          result.current.handleAcceptDeal(deal)
        })
      }).not.toThrow()

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Deal failed'),
        'error'
      )

      // Test reject all deals
      vi.clearAllMocks()
      socialEngine.generateBrandOffers.mockReturnValue([
        {
          id: 'deal_1',
          name: 'Test Brand',
          offer: { upfront: 500, duration: 2 }
        }
      ])

      const { result: result2 } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result2.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result2.current.handlePostSelection(result2.current.postOptions[0])
      })

      await waitFor(() => {
        expect(result2.current.phase).toBe('DEALS')
      })

      act(() => {
        result2.current.handleRejectDeals()
      })

      expect(result2.current.phase).toBe('COMPLETE')
      expect(result2.current.brandOffers).toHaveLength(0)
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Skipped'),
        'info'
      )
    })
  })

  describe('spin story', () => {
    it('reduces controversy based on player funds', async () => {
      // Test with enough money
      let { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      act(() => {
        result.current.handleSpinStory()
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith({
        money: 300 // 500 - 200
      })
      expect(mockUpdateSocial).toHaveBeenCalledWith(expect.any(Function))
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Controversy reduced'),
        'success'
      )

      // Test with insufficient funds
      vi.clearAllMocks()
      GameState.useGameState.mockReturnValue(
        getBaseState({
          player: { money: 100, fame: 100, day: 5, location: 'berlin' }
        })
      )

      result = renderHook(() => usePostGigLogic()).result

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      act(() => {
        result.current.handleSpinStory()
      })

      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Not enough cash'),
        'error'
      )
    })
  })

  describe('continue and completion', () => {
    it('handles game flow: updates state, saves, and transitions', async () => {
      let { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      act(() => {
        result.current.handleContinue()
      })

      // Check money/fame update
      expect(mockUpdatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          money: 700, // 500 + 200 net
          fame: expect.any(Number)
        })
      )

      // Check save/transition
      await waitFor(() => {
        expect(mockSaveGame).toHaveBeenCalledWith(false)
        expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
      })

      // Test bankruptcy path
      vi.clearAllMocks()
      economyEngine.shouldTriggerBankruptcy.mockReturnValue(true)
      economyEngine.calculateGigFinancials.mockReturnValue({
        net: -600,
        income: { total: 100, breakdown: [] },
        expenses: { total: 700, breakdown: [] }
      })

      result = renderHook(() => usePostGigLogic()).result

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      act(() => {
        result.current.handleContinue()
      })

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('BANKRUPT'),
        'error'
      )
      expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.GAMEOVER)
    })

    it('triggers story quests based on active flags', async () => {
      // Test apology tour quest
      GameState.useGameState.mockReturnValue(
        getBaseState({ activeStoryFlags: ['cancel_quest_active'] })
      )

      let { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

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

      // Test ego management quest
      vi.clearAllMocks()
      GameState.useGameState.mockReturnValue(
        getBaseState({ activeStoryFlags: ['breakup_quest_active'] })
      )

      result = renderHook(() => usePostGigLogic()).result

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      act(() => {
        result.current.handleContinue()
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
  })

  describe('edge cases', () => {
    it('clamps band and member attributes to valid ranges', () => {
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        followers: 50,
        platform: 'instagram',
        harmonyChange: 100
      })

      let { result } = renderHook(() => usePostGigLogic())

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateBand).toHaveBeenCalled()
      let updateBandFn = mockUpdateBand.mock.calls[mockUpdateBand.mock.calls.length - 1][0]
      let updatedBand = typeof updateBandFn === 'function' ? updateBandFn({ harmony: 50 }) : updateBandFn
      expect(updatedBand).toEqual(expect.objectContaining({ harmony: 100 })) // Clamped to 100

      // Test mood and stamina clamping
      vi.clearAllMocks()
      GameState.useGameState.mockReturnValue(
        getBaseState({
          band: {
            inventory: {},
            members: [{ name: 'Member1', mood: 95, stamina: 10 }],
            harmony: 50
          }
        })
      )

      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        followers: 50,
        platform: 'instagram',
        moodChange: 20,
        staminaChange: -15,
        allMembersMoodChange: true,
        allMembersStaminaChange: true
      })

      result = renderHook(() => usePostGigLogic()).result

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateBand).toHaveBeenCalled()
      updateBandFn = mockUpdateBand.mock.calls[mockUpdateBand.mock.calls.length - 1][0]
      updatedBand = typeof updateBandFn === 'function' ? updateBandFn({
        members: [{ name: 'Member1', mood: 95, stamina: 10 }]
      }) : updateBandFn

      expect(updatedBand).toEqual(
        expect.objectContaining({
          members: [
            expect.objectContaining({
              mood: 100, // 95 + 20 clamped
              stamina: 0 // 10 - 15 clamped
            })
          ]
        })
      )
    })

    it('handles missing data and ego management gracefully', () => {
      // Test missing influencer
      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        followers: 50,
        platform: 'instagram',
        influencerUpdate: { id: 'nonexistent', scoreChange: 10 }
      })

      let { result } = renderHook(() => usePostGigLogic())

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateSocial).toHaveBeenCalled()

      // Test ego clear
      vi.clearAllMocks()
      GameState.useGameState.mockReturnValue(
        getBaseState({
          social: {
            instagram: 100,
            egoFocus: 'Member1'
          }
        })
      )

      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        followers: 50,
        platform: 'instagram',
        egoClear: true
      })

      result = renderHook(() => usePostGigLogic()).result

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateSocial).toHaveBeenCalled()
      let updateFn = mockUpdateSocial.mock.calls[mockUpdateSocial.mock.calls.length - 1][0]
      let updatedSocial = typeof updateFn === 'function' ? updateFn({ egoFocus: 'Member1' }) : updateFn
      expect(updatedSocial).toEqual(
        expect.objectContaining({ egoFocus: null })
      )

      // Test ego drop
      vi.clearAllMocks()

      socialEngine.resolvePost.mockReturnValueOnce({
        success: true,
        followers: 50,
        platform: 'instagram',
        egoDrop: 'Member2'
      })

      result = renderHook(() => usePostGigLogic()).result

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateSocial).toHaveBeenCalled()
      updateFn = mockUpdateSocial.mock.calls[mockUpdateSocial.mock.calls.length - 1][0]
      updatedSocial = typeof updateFn === 'function' ? updateFn({}) : updateFn
      expect(updatedSocial).toEqual(
        expect.objectContaining({ egoFocus: 'Member2' })
      )
    })

    it('returns early from handleContinue if financials are null', async () => {
      GameState.useGameState.mockReturnValue(
        getBaseState({ lastGigStats: null })
      )

      const { result } = renderHook(() => usePostGigLogic())

      act(() => {
        result.current.handleContinue()
      })

      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockChangeScene).not.toHaveBeenCalled()
    })
  })
})
