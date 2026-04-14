import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PostGig } from '../src/scenes/PostGig'
import { useGameState } from '../src/context/GameState'
import { GAME_PHASES } from '../src/context/gameConstants'
import * as economyEngine from '../src/utils/economyEngine'
import * as socialEngine from '../src/utils/socialEngine'
import { BRAND_ALIGNMENTS } from '../src/context/initialState'

// Mock dependencies
vi.mock('../src/context/GameState', () => ({
  useGameState: vi.fn()
}))

vi.mock('../src/utils/imageGen', () => ({
  getGenImageUrl: vi.fn(() => 'mock-url'),
  IMG_PROMPTS: { POST_GIG_BG: 'mock-bg' }
}))

vi.mock('../src/utils/crypto', () => ({
  secureRandom: () => 0.5
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

const proceedToSocialAndSelectPost = async (postName = 'Test Post') => {
  fireEvent.click(
    await screen.findByRole('button', { name: /continue|next|social/i })
  )
  fireEvent.click(await screen.findByText(postName))
}

const getLastFunctionalUpdate = mockFn =>
  [...mockFn.mock.calls]
    .map(call => call[0])
    .reverse()
    .find(updateArg => typeof updateArg === 'function')

// Module-level mock functions (shared across all describes)
const mockUpdatePlayer = vi.fn()
const mockUpdateBand = vi.fn()
const mockUpdateSocial = vi.fn()
const mockChangeScene = vi.fn()
const mockTriggerEvent = vi.fn()
const mockAddToast = vi.fn()
const mockSaveGame = vi.fn()
const mockUnlockTrait = vi.fn()
const mockAddQuest = vi.fn()

// Shared base state factory
const createBaseState = (overrides = {}) => ({
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
    activeDeals: [],
    influencers: { influencer1: { score: 50 } },
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

// Shared setup function for all describes
const setupCommonMocks = () => {
  vi.spyOn(economyEngine, 'calculateGigFinancials').mockReturnValue({
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

  vi.spyOn(economyEngine, 'shouldTriggerBankruptcy').mockReturnValue(false)

  vi.spyOn(socialEngine, 'generatePostOptions').mockReturnValue([
    {
      id: 'post_1',
      name: 'Test Post',
      platform: 'instagram',
      type: 'basic'
    }
  ])

  vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
    success: true,
    followers: 50,
    platform: 'instagram',
    message: 'Post successful!'
  })

  vi.spyOn(socialEngine, 'checkViralEvent').mockReturnValue(false)
  vi.spyOn(socialEngine, 'calculateSocialGrowth').mockReturnValue(25)
  vi.spyOn(socialEngine, 'generateBrandOffers').mockReturnValue([])

  useGameState.mockReturnValue(createBaseState())
}

describe('PostGig Component - Phase Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupCommonMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes in REPORT phase and displays loading when no financials', () => {
    useGameState.mockReturnValue(
      createBaseState({ lastGigStats: null, currentGig: null })
    )
    render(<PostGig />)
    expect(screen.getByText(/TALLYING RECEIPTS/i)).toBeInTheDocument()
  })

  it('triggers events on mount when no active event', () => {
    render(<PostGig />)
    expect(mockTriggerEvent).toHaveBeenCalledWith('financial', 'post_gig')
  })

  it('does not trigger events when an active event exists', () => {
    useGameState.mockReturnValue(
      createBaseState({ activeEvent: { id: 'some_event', type: 'financial' } })
    )
    render(<PostGig />)
    // Should not call triggerEvent when activeEvent exists
    expect(mockTriggerEvent).not.toHaveBeenCalled()
  })

  it('advances from REPORT to SOCIAL phase', async () => {
    render(<PostGig />)

    const nextBtn = await screen.findByRole('button', {
      name: /continue|next|social/i
    })
    fireEvent.click(nextBtn)

    await waitFor(() => {
      expect(screen.getByText(/SOCIAL MEDIA STRATEGY/i)).toBeInTheDocument()
    })
  })

  it('skips DEALS phase when no brand offers', async () => {
    render(<PostGig />)

    // REPORT -> SOCIAL
    fireEvent.click(
      await screen.findByRole('button', { name: /continue|next|social/i })
    )

    // SOCIAL -> Select post (should go to COMPLETE, skipping DEALS)
    fireEvent.click(await screen.findByText('Test Post'))

    await waitFor(() => {
      expect(screen.getByText(/TOUR UPDATE/i)).toBeInTheDocument()
    })
  })

  it('shows DEALS phase when brand offers are available', async () => {
    vi.spyOn(socialEngine, 'generateBrandOffers').mockReturnValue([
      {
        id: 'deal_1',
        name: 'Test Brand',
        alignment: BRAND_ALIGNMENTS.CORPORATE,
        offer: { upfront: 1000, duration: 3 },
        penalty: { loyalty: -5, controversy: 10 }
      }
    ])

    render(<PostGig />)

    // REPORT -> SOCIAL
    fireEvent.click(
      await screen.findByRole('button', { name: /continue|next|social/i })
    )

    // SOCIAL -> Select post
    fireEvent.click(await screen.findByText('Test Post'))

    await waitFor(() => {
      expect(screen.getByText(/BRAND OFFERS/i)).toBeInTheDocument()
    })
  })
})

describe('PostGig Component - Social Post Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupCommonMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('updates general social and band stats correctly when post is selected', async () => {
    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: true,
      followers: 50,
      platform: 'instagram',
      harmonyChange: 10,
      moodChange: 15,
      allMembersMoodChange: true,
      moneyChange: 200,
      unlockTrait: { memberId: 'Member1', traitId: 'social_butterfly' },
      influencerUpdate: { id: 'influencer1', scoreChange: 25 },
      message: 'Post successful!'
    })

    render(<PostGig />)
    await proceedToSocialAndSelectPost()

    await waitFor(() => {
      // Followers update + influencer
      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          instagram: expect.any(Number),
          influencers: {
            influencer1: { score: 75 } // 50 + 25
          }
        })
      )

      // Band harmony and mood
      expect(mockUpdateBand).toHaveBeenCalledWith(
        expect.objectContaining({
          harmony: 60 // 50 + 10
        })
      )

      expect(mockUpdateBand).toHaveBeenCalledWith(
        expect.objectContaining({
          members: expect.arrayContaining([
            expect.objectContaining({ mood: 65 }), // 50 + 15
            expect.objectContaining({ mood: 65 })
          ])
        })
      )

      // Player money
      expect(mockUpdatePlayer).toHaveBeenCalledWith({
        money: 700 // 500 + 200
      })

      // Trait unlock
      expect(mockUnlockTrait).toHaveBeenCalledWith(
        'Member1',
        'social_butterfly'
      )
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('SOCIAL BUTTERFLY'),
        'success'
      )
    })
  })

  it('updates specific band member when targetMember is specified', async () => {
    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: true,
      followers: 50,
      platform: 'instagram',
      moodChange: 20,
      targetMember: 'Member1',
      message: 'Member1 is thrilled!'
    })

    render(<PostGig />)
    await proceedToSocialAndSelectPost()

    await waitFor(() => {
      expect(mockUpdateBand).toHaveBeenCalledWith(
        expect.objectContaining({
          members: expect.arrayContaining([
            expect.objectContaining({ name: 'Member1', mood: 70 }), // 50 + 20
            expect.objectContaining({ name: 'Member2', mood: 50 }) // unchanged
          ])
        })
      )
    })
  })

  it('handles cross-platform posting correctly', async () => {
    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: true,
      followers: 100,
      platform: 'instagram',
      message: 'Cross-platform post!'
    })

    render(<PostGig />)
    await proceedToSocialAndSelectPost()

    await waitFor(() => {
      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          tiktok: expect.any(Number),
          youtube: expect.any(Number)
        })
      )
    })
  })

  it('adds viral bonus correctly', async () => {
    vi.spyOn(socialEngine, 'checkViralEvent').mockReturnValue(true)
    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: true,
      followers: 100,
      platform: 'instagram',
      message: 'Viral post!'
    })

    render(<PostGig />)
    await proceedToSocialAndSelectPost()

    await waitFor(() => {
      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          viral: 2 // 0 + 1 (success) + 1 (gig viral bonus)
        })
      )
    })
  })

  it('increments viral count by exactly 1 without gig bonus', async () => {
    vi.spyOn(socialEngine, 'checkViralEvent').mockReturnValue(false)
    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: true,
      followers: 100,
      platform: 'instagram',
      message: 'Viral post!'
    })

    render(<PostGig />)
    await proceedToSocialAndSelectPost()

    await waitFor(() => {
      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          viral: 1 // 0 + 1 (success)
        })
      )
    })
  })
})

describe('PostGig Component - Brand Deals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupCommonMocks()
    useGameState.mockReturnValue(
      createBaseState({
        social: {
          ...createBaseState().social,
          controversyLevel: 20,
          brandReputation: { CORPORATE: 30, SUSTAINABLE: 40 }
        }
      })
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('processes accepting a complex brand deal correctly', async () => {
    vi.spyOn(socialEngine, 'generateBrandOffers').mockReturnValue([
      {
        id: 'deal_mega',
        name: 'Mega Corp',
        alignment: BRAND_ALIGNMENTS.EVIL,
        offer: { upfront: 1000, duration: 5, item: 'special_guitar' },
        penalty: { loyalty: -15, controversy: 30 }
      }
    ])

    render(<PostGig />)
    await proceedToSocialAndSelectPost()

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /^BRAND OFFERS$/i })
      ).toBeInTheDocument()
    })

    const acceptBtn = await screen.findByRole('button', { name: /accept/i })
    fireEvent.click(acceptBtn)

    await waitFor(() => {
      expect(mockUpdatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({ money: 1500 })
      )
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Mega Corp'),
        'success'
      )

      // Check inventory item added
      const updateBandFn = getLastFunctionalUpdate(mockUpdateBand)
      expect(updateBandFn).toEqual(expect.any(Function))
      expect(updateBandFn({ inventory: {} })).toEqual({
        inventory: { special_guitar: true }
      })

      // Check loyalty, controversy, reputation and active deals in one go
      const updateFn = getLastFunctionalUpdate(mockUpdateSocial)
      expect(updateFn).toEqual(expect.any(Function))
      const prevSocial = {
        loyalty: 50,
        controversyLevel: 20,
        brandReputation: { EVIL: 0, SUSTAINABLE: 40 },
        activeDeals: []
      }
      const result = updateFn(prevSocial)

      expect(result.loyalty).toBe(35) // 50 - 15
      expect(result.controversyLevel).toBe(50) // 20 + 30
      expect(result.brandReputation.EVIL).toBe(5) // 0 + 5
      expect(result.brandReputation.SUSTAINABLE).toBe(37) // 40 - 3 (opposing)
      expect(result.activeDeals).toEqual([
        expect.objectContaining({ id: 'deal_mega', remainingGigs: 5 })
      ])
    })
  })

  it('rejects all deals and advances to COMPLETE phase', async () => {
    vi.spyOn(socialEngine, 'generateBrandOffers').mockReturnValue([
      {
        id: 'deal_6',
        name: 'Skip Me',
        alignment: BRAND_ALIGNMENTS.CORPORATE,
        offer: { upfront: 500, duration: 2 },
        penalty: null
      }
    ])

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /^BRAND OFFERS$/i })
      ).toBeInTheDocument()
    })

    const rejectBtn = await screen.findByRole('button', {
      name: /reject|skip/i
    })
    fireEvent.click(rejectBtn)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /^TOUR UPDATE$/i })
      ).toBeInTheDocument()
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Skipped'),
        'info'
      )
    })
  })
})

describe('PostGig Component - Complete Phase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupCommonMocks()
    useGameState.mockReturnValue(
      createBaseState({
        social: {
          ...createBaseState().social,
          controversyLevel: 50
        }
      })
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('spins story to reduce controversy when player has enough money', async () => {
    useGameState.mockReturnValue(
      createBaseState({
        player: {
          money: 500,
          fame: 100,
          day: 5,
          location: 'berlin',
          hqUpgrades: ['pr_manager_contract']
        },
        social: {
          instagram: 100,
          trend: 'NEUTRAL',
          viral: 0,
          controversyLevel: 75,
          loyalty: 50,
          reputationCooldown: 0,
          egoFocus: null,
          activeDeals: [],
          influencers: {},
          brandReputation: {}
        }
      })
    )

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    // Should be in COMPLETE phase
    await waitFor(() => {
      expect(screen.getByText(/TOUR UPDATE/i)).toBeInTheDocument()
    })

    const spinBtn = await screen.findByRole('button', { name: /spin/i })
    fireEvent.click(spinBtn)

    await waitFor(() => {
      expect(mockUpdatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          money: 300
        })
      )
      expect(mockUpdateSocial).toHaveBeenCalledWith(expect.any(Function))
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Controversy reduced'),
        'success'
      )
    })

    const updateSocialFn = getLastFunctionalUpdate(mockUpdateSocial)
    expect(updateSocialFn).toEqual(expect.any(Function))
    expect(updateSocialFn({ controversyLevel: 75 })).toEqual({
      controversyLevel: 50
    })
  })

  it('rejects spin story when player does not have enough money', async () => {
    useGameState.mockReturnValue(
      createBaseState({
        player: {
          money: 100,
          fame: 100,
          day: 5,
          hqUpgrades: ['pr_manager_contract']
        },
        social: {
          instagram: 100,
          trend: 'NEUTRAL',
          viral: 0,
          controversyLevel: 80,
          loyalty: 50,
          reputationCooldown: 0,
          egoFocus: null,
          activeDeals: [],
          influencers: {},
          brandReputation: {}
        }
      })
    )

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    const initialUpdateSocialCalls = mockUpdateSocial.mock.calls.length

    const spinBtn = await screen.findByRole('button', { name: /spin/i })
    fireEvent.click(spinBtn)

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Not enough cash'),
        'error'
      )
    })

    // verify it wasn't called with a new money object
    expect(mockUpdatePlayer).not.toHaveBeenCalled()
    expect(mockUpdateSocial).toHaveBeenCalledTimes(initialUpdateSocialCalls)
  })

  it('handles multiple continue effects correctly', async () => {
    vi.spyOn(economyEngine, 'shouldTriggerBankruptcy').mockReturnValue(false)
    useGameState.mockReturnValue(
      createBaseState({
        activeStoryFlags: ['cancel_quest_active', 'breakup_quest_active']
      })
    )

    render(<PostGig />)
    await proceedToSocialAndSelectPost()

    const continueBtn = await screen.findByRole('button', {
      name: /back to tour/i
    })
    fireEvent.click(continueBtn)

    await waitFor(() => {
      // Updates player
      expect(mockUpdatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          money: 700, // 500 + 200 (net)
          fame: expect.any(Number)
        })
      )

      // Adds both quests
      expect(mockAddQuest).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'quest_apology_tour',
          deadline: 19,
          required: 3
        })
      )
      expect(mockAddQuest).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'quest_ego_management',
          deadline: 10,
          required: 1,
          failurePenalty: { type: 'game_over' }
        })
      )

      // Saves and changes scene
      expect(mockSaveGame).toHaveBeenCalledWith(false)
      expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
    })
  })

  it('triggers bankruptcy when shouldTriggerBankruptcy returns true', async () => {
    vi.spyOn(economyEngine, 'shouldTriggerBankruptcy').mockReturnValue(true)
    vi.spyOn(economyEngine, 'calculateGigFinancials').mockReturnValue({
      net: -600,
      income: { total: 100, breakdown: [] },
      expenses: { total: 700, breakdown: [] }
    })

    render(<PostGig />)
    await proceedToSocialAndSelectPost()

    const continueBtn = await screen.findByRole('button', {
      name: /back to tour/i
    })
    fireEvent.click(continueBtn)

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('BANKRUPT'),
        'error'
      )
      expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.GAMEOVER)
    })
  })
})

describe('PostGig Component - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupCommonMocks()
    useGameState.mockReturnValue(createBaseState())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('clamps band harmony to valid range', async () => {
    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: true,
      followers: 50,
      platform: 'instagram',
      harmonyChange: 100, // Would exceed 100
      message: 'Amazing!'
    })

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    await waitFor(() => {
      expect(mockUpdateBand).toHaveBeenCalledWith(
        expect.objectContaining({
          harmony: 100 // Clamped to max
        })
      )
    })
  })

  it('clamps member mood to valid range', async () => {
    useGameState.mockReturnValue(
      createBaseState({
        band: {
          inventory: {},
          members: [{ name: 'Member1', mood: 95, stamina: 50 }],
          harmony: 50
        }
      })
    )

    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: true,
      followers: 50,
      platform: 'instagram',
      moodChange: 20, // Would exceed 100
      allMembersMoodChange: true,
      message: 'Ecstatic!'
    })

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    await waitFor(() => {
      expect(mockUpdateBand).toHaveBeenCalledWith(
        expect.objectContaining({
          members: [
            expect.objectContaining({
              mood: 100 // Clamped to max
            })
          ]
        })
      )
    })
  })

  it('handles negative follower gains gracefully', async () => {
    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: false,
      followers: -30,
      platform: 'instagram',
      message: 'Bad post!'
    })

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    await waitFor(() => {
      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          instagram: expect.any(Number)
        })
      )
    })
  })

  it('calculates performance score with clamping', async () => {
    useGameState.mockReturnValue(
      createBaseState({
        lastGigStats: { score: 1000000, accuracy: 100, events: [] }
      })
    )

    render(<PostGig />)

    // Performance score should be clamped to PERF_SCORE_MAX (100)
    await waitFor(() => {
      expect(economyEngine.calculateGigFinancials).toHaveBeenCalledWith(
        expect.objectContaining({
          performanceScore: 100 // Max clamped
        })
      )
    })
  })

  it('handles missing optional social properties', async () => {
    useGameState.mockReturnValue(
      createBaseState({
        social: {
          instagram: 100,
          // Missing many optional properties
          trend: 'NEUTRAL'
        }
      })
    )

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    // Should not crash and should handle undefined values
    await waitFor(() => {
      expect(mockUpdateSocial).toHaveBeenCalled()
    })
  })
})
