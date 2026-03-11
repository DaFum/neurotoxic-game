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
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('initializes in REPORT phase', () => {
      const { result } = renderHook(() => usePostGigLogic())
      expect(result.current.phase).toBe('REPORT')
    })

    it('calculates financials on mount', async () => {
      renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(economyEngine.calculateGigFinancials).toHaveBeenCalledWith(
          expect.objectContaining({
            gigData: expect.objectContaining({ songId: 'test_song' }),
            performanceScore: expect.any(Number)
          })
        )
      })
    })

    it('generates post options on mount', async () => {
      renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(socialEngine.generatePostOptions).toHaveBeenCalled()
      })
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

    it('calculates performance score correctly', async () => {
      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      // Score of 50000 / 500 = 100, clamped to max
      expect(economyEngine.calculateGigFinancials).toHaveBeenCalledWith(
        expect.objectContaining({
          performanceScore: 100
        })
      )
    })

    it('clamps performance score to minimum', async () => {
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

  describe('event triggering', () => {
    it('triggers financial event on mount when no active event', () => {
      renderHook(() => usePostGigLogic())
      expect(mockTriggerEvent).toHaveBeenCalledWith('financial', 'post_gig')
    })

    it('does not trigger events when an active event exists', () => {
      GameState.useGameState.mockReturnValue(
        getBaseState({ activeEvent: { id: 'some_event', type: 'financial' } })
      )

      renderHook(() => usePostGigLogic())
      expect(mockTriggerEvent).not.toHaveBeenCalled()
    })

    it('triggers special event if financial event does not trigger', () => {
      mockTriggerEvent.mockReturnValueOnce(null)
      renderHook(() => usePostGigLogic())

      expect(mockTriggerEvent).toHaveBeenCalledWith('financial', 'post_gig')
      expect(mockTriggerEvent).toHaveBeenCalledWith('special', 'post_gig')
    })

    it('triggers band event if financial and special events do not trigger', () => {
      mockTriggerEvent.mockReturnValueOnce(null).mockReturnValueOnce(null)
      renderHook(() => usePostGigLogic())

      expect(mockTriggerEvent).toHaveBeenCalledWith('financial', 'post_gig')
      expect(mockTriggerEvent).toHaveBeenCalledWith('special', 'post_gig')
      expect(mockTriggerEvent).toHaveBeenCalledWith('band', 'post_gig')
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
        expect(result.current.postOptions).toHaveLength(1)
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

    it('updates social followers when post is selected', async () => {
      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          instagram: expect.any(Number)
        })
      )
    })

    it('applies cross-posting to other platforms on successful post', async () => {
      socialEngine.resolvePost.mockReturnValue({
        success: true,
        followers: 100,
        platform: 'instagram',
        message: 'Viral!'
      })

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          tiktok: expect.any(Number),
          youtube: expect.any(Number)
        })
      )
    })

    it('increments viral count on successful post', async () => {
      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          viral: 1
        })
      )
    })

    it('adds gig viral bonus when checkViralEvent returns true', async () => {
      socialEngine.checkViralEvent.mockReturnValue(true)

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          viral: 2 // 1 for success + 1 for gig viral
        })
      )
    })

    it('updates band harmony when harmonyChange is provided', async () => {
      socialEngine.resolvePost.mockReturnValue({
        success: true,
        followers: 50,
        platform: 'instagram',
        harmonyChange: 15
      })

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateBand).toHaveBeenCalledWith(
        expect.objectContaining({
          harmony: 65 // 50 + 15
        })
      )
    })

    it('updates all member mood when allMembersMoodChange is true', async () => {
      socialEngine.resolvePost.mockReturnValue({
        success: true,
        followers: 50,
        platform: 'instagram',
        moodChange: 20,
        allMembersMoodChange: true
      })

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateBand).toHaveBeenCalledWith(
        expect.objectContaining({
          members: expect.arrayContaining([
            expect.objectContaining({ mood: 70 }),
            expect.objectContaining({ mood: 70 })
          ])
        })
      )
    })

    it('updates specific member when targetMember is specified', async () => {
      socialEngine.resolvePost.mockReturnValue({
        success: true,
        followers: 50,
        platform: 'instagram',
        moodChange: 25,
        targetMember: 'Member1'
      })

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
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
    })

    it('updates player money when moneyChange is provided', async () => {
      socialEngine.resolvePost.mockReturnValue({
        success: true,
        followers: 50,
        platform: 'instagram',
        moneyChange: 300
      })

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith({
        money: 800 // 500 + 300
      })
    })

    it('unlocks trait when unlockTrait is provided', async () => {
      socialEngine.resolvePost.mockReturnValue({
        success: true,
        followers: 50,
        platform: 'instagram',
        unlockTrait: { memberId: 'Member1', traitId: 'social_butterfly' }
      })

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUnlockTrait).toHaveBeenCalledWith(
        'Member1',
        'social_butterfly'
      )
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('SOCIAL BUTTERFLY'),
        'success'
      )
    })

    it('updates influencer score when influencerUpdate is provided', async () => {
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

      socialEngine.resolvePost.mockReturnValue({
        success: true,
        followers: 50,
        platform: 'instagram',
        influencerUpdate: { id: 'influencer1', scoreChange: 30 }
      })

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          influencers: {
            influencer1: { score: 70 } // 40 + 30
          }
        })
      )
    })

    it('advances to DEALS phase when brand offers are generated', async () => {
      socialEngine.generateBrandOffers.mockReturnValue([
        {
          id: 'deal_1',
          name: 'Test Brand',
          offer: { upfront: 1000, duration: 3 }
        }
      ])

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      await waitFor(() => {
        expect(result.current.phase).toBe('DEALS')
        expect(result.current.brandOffers).toHaveLength(1)
      })
    })

    it('advances to COMPLETE phase when no brand offers', async () => {
      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

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
    it('accepts deal with upfront payment', async () => {
      const deal = {
        id: 'deal_1',
        name: 'Mega Corp',
        alignment: 'CORPORATE',
        offer: { upfront: 1000, duration: 3 },
        penalty: null
      }

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      act(() => {
        result.current.handleAcceptDeal(deal)
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith(expect.any(Function))
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Mega Corp'),
        'success'
      )
    })

    it('accepts deal with item reward', async () => {
      const deal = {
        id: 'deal_2',
        name: 'Cool Brand',
        offer: { item: 'special_guitar', duration: 2 },
        penalty: null
      }

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      act(() => {
        result.current.handleAcceptDeal(deal)
      })

      expect(mockUpdateBand).toHaveBeenCalledWith(expect.any(Function))
    })

    it('applies brand deal penalties', async () => {
      const deal = {
        id: 'deal_3',
        name: 'Evil Corp',
        alignment: 'EVIL',
        offer: { upfront: 2000, duration: 5 },
        penalty: { loyalty: -15, controversy: 30 }
      }

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      act(() => {
        result.current.handleAcceptDeal(deal)
      })

      expect(mockUpdateSocial).toHaveBeenCalledWith(expect.any(Function))
    })

    it('handles errors gracefully in handleAcceptDeal', async () => {
      const deal = {
        id: 'deal_error',
        name: 'Error Corp',
        alignment: 'CORPORATE',
        offer: { upfront: 1000, duration: 3 },
        penalty: null
      }

      mockUpdatePlayer.mockImplementationOnce(() => {
        throw new Error('Database Error')
      })

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      // The try/catch should prevent the error from bubbling up
      expect(() => {
        act(() => {
          result.current.handleAcceptDeal(deal)
        })
      }).not.toThrow()

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Deal failed'),
        'error'
      )
    })

    it('rejects all deals and advances to COMPLETE', async () => {
      socialEngine.generateBrandOffers.mockReturnValue([
        {
          id: 'deal_1',
          name: 'Test Brand',
          offer: { upfront: 500, duration: 2 }
        }
      ])

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      await waitFor(() => {
        expect(result.current.phase).toBe('DEALS')
      })

      act(() => {
        result.current.handleRejectDeals()
      })

      expect(result.current.phase).toBe('COMPLETE')
      expect(result.current.brandOffers).toHaveLength(0)
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Skipped'),
        'info'
      )
    })
  })

  describe('spin story', () => {
    it('reduces controversy when player has enough money', async () => {
      const { result } = renderHook(() => usePostGigLogic())

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
    })

    it('rejects spin story when player lacks funds', async () => {
      GameState.useGameState.mockReturnValue(
        getBaseState({
          player: { money: 100, fame: 100, day: 5, location: 'berlin' }
        })
      )

      const { result } = renderHook(() => usePostGigLogic())

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
    it('updates player money and fame on continue', async () => {
      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      act(() => {
        result.current.handleContinue()
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          money: 700, // 500 + 200 net
          fame: expect.any(Number)
        })
      )
    })

    it('triggers bankruptcy when shouldTriggerBankruptcy returns true', async () => {
      economyEngine.shouldTriggerBankruptcy.mockReturnValue(true)
      economyEngine.calculateGigFinancials.mockReturnValue({
        net: -600,
        income: { total: 100, breakdown: [] },
        expenses: { total: 700, breakdown: [] }
      })

      const { result } = renderHook(() => usePostGigLogic())

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

    it('saves game and returns to overworld on success', async () => {
      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      act(() => {
        result.current.handleContinue()
      })

      await waitFor(() => {
        expect(mockSaveGame).toHaveBeenCalledWith(false)
        expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
      })
    })

    it('adds apology tour quest when cancel_quest_active flag is set', async () => {
      GameState.useGameState.mockReturnValue(
        getBaseState({ activeStoryFlags: ['cancel_quest_active'] })
      )

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      act(() => {
        result.current.handleContinue()
      })

      expect(mockAddQuest).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'quest_apology_tour',
          deadline: 19, // day 5 + 14
          required: 3
        })
      )
    })

    it('adds ego management quest when breakup_quest_active flag is set', async () => {
      GameState.useGameState.mockReturnValue(
        getBaseState({ activeStoryFlags: ['breakup_quest_active'] })
      )

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.financials).toBeTruthy()
      })

      act(() => {
        result.current.handleContinue()
      })

      expect(mockAddQuest).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'quest_ego_management',
          deadline: 10, // day 5 + 5
          required: 1,
          failurePenalty: { type: 'game_over' }
        })
      )
    })
  })

  describe('edge cases', () => {
    it('clamps band harmony to valid range', async () => {
      socialEngine.resolvePost.mockReturnValue({
        success: true,
        followers: 50,
        platform: 'instagram',
        harmonyChange: 100 // Would exceed max
      })

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateBand).toHaveBeenCalledWith(
        expect.objectContaining({
          harmony: 100 // Clamped to max
        })
      )
    })

    it('clamps member mood and stamina to valid range', async () => {
      GameState.useGameState.mockReturnValue(
        getBaseState({
          band: {
            inventory: {},
            members: [{ name: 'Member1', mood: 95, stamina: 10 }],
            harmony: 50
          }
        })
      )

      socialEngine.resolvePost.mockReturnValue({
        success: true,
        followers: 50,
        platform: 'instagram',
        moodChange: 20,
        staminaChange: -15,
        allMembersMoodChange: true,
        allMembersStaminaChange: true
      })

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateBand).toHaveBeenCalledWith(
        expect.objectContaining({
          members: [
            expect.objectContaining({
              mood: 100, // Clamped to max
              stamina: 0 // Clamped to min (10 - 15 = -5 -> 0)
            })
          ]
        })
      )
    })

    it('handles missing influencer gracefully', async () => {
      socialEngine.resolvePost.mockReturnValue({
        success: true,
        followers: 50,
        platform: 'instagram',
        influencerUpdate: { id: 'nonexistent', scoreChange: 10 }
      })

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      // Should not crash
      expect(mockUpdateSocial).toHaveBeenCalled()
    })

    it('clears egoFocus when egoClear is true', async () => {
      GameState.useGameState.mockReturnValue(
        getBaseState({
          social: {
            instagram: 100,
            egoFocus: 'Member1'
          }
        })
      )

      socialEngine.resolvePost.mockReturnValue({
        success: true,
        followers: 50,
        platform: 'instagram',
        egoClear: true
      })

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          egoFocus: null
        })
      )
    })

    it('sets egoFocus when egoDrop is provided', async () => {
      socialEngine.resolvePost.mockReturnValue({
        success: true,
        followers: 50,
        platform: 'instagram',
        egoDrop: 'Member2'
      })

      const { result } = renderHook(() => usePostGigLogic())

      await waitFor(() => {
        expect(result.current.postOptions).toHaveLength(1)
      })

      act(() => {
        result.current.handlePostSelection(result.current.postOptions[0])
      })

      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          egoFocus: 'Member2'
        })
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

      // Should not call any update functions
      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockChangeScene).not.toHaveBeenCalled()
    })
  })
})
