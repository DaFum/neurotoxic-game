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

describe('PostGig Component - Phase Management', () => {
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

    useGameState.mockReturnValue(getBaseState())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes in REPORT phase and displays loading when no financials', () => {
    useGameState.mockReturnValue(
      getBaseState({ lastGigStats: null, currentGig: null })
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
      getBaseState({ activeEvent: { id: 'some_event', type: 'financial' } })
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
    currentGig: { songId: 'test_song', venue: 'Test Venue' },
    player: { money: 500, fame: 100, day: 5, location: 'berlin' },
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
      influencers: { influencer1: { score: 50 } },
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

    vi.spyOn(economyEngine, 'calculateGigFinancials').mockReturnValue({
      net: 200,
      income: { total: 500, breakdown: [] },
      expenses: { total: 300, breakdown: [] }
    })

    vi.spyOn(economyEngine, 'shouldTriggerBankruptcy').mockReturnValue(false)

    vi.spyOn(socialEngine, 'generatePostOptions').mockReturnValue([
      { id: 'post_1', name: 'Test Post', platform: 'instagram', type: 'basic' }
    ])

    vi.spyOn(socialEngine, 'checkViralEvent').mockReturnValue(false)
    vi.spyOn(socialEngine, 'calculateSocialGrowth').mockReturnValue(25)
    vi.spyOn(socialEngine, 'generateBrandOffers').mockReturnValue([])

    useGameState.mockReturnValue(getBaseState())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('updates social followers when post is selected', async () => {
    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: true,
      followers: 50,
      platform: 'instagram',
      message: 'Post successful!'
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

  it('applies cross-posting when post is successful', async () => {
    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: true,
      followers: 100,
      platform: 'instagram',
      message: 'Post successful!'
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

  it('updates band harmony when post result includes harmonyChange', async () => {
    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: true,
      followers: 50,
      platform: 'instagram',
      harmonyChange: 10,
      message: 'Band loved it!'
    })

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    await waitFor(() => {
      expect(mockUpdateBand).toHaveBeenCalledWith(
        expect.objectContaining({
          harmony: 60 // 50 + 10
        })
      )
    })
  })

  it('updates band member mood when post result includes moodChange', async () => {
    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: true,
      followers: 50,
      platform: 'instagram',
      moodChange: 15,
      allMembersMoodChange: true,
      message: 'Everyone is happy!'
    })

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    await waitFor(() => {
      expect(mockUpdateBand).toHaveBeenCalledWith(
        expect.objectContaining({
          members: expect.arrayContaining([
            expect.objectContaining({ mood: 65 }), // 50 + 15
            expect.objectContaining({ mood: 65 })
          ])
        })
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

  it('updates player money when post result includes moneyChange', async () => {
    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: true,
      followers: 50,
      platform: 'instagram',
      moneyChange: 200,
      message: 'Monetized post!'
    })

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    await waitFor(() => {
      expect(mockUpdatePlayer).toHaveBeenCalledWith({
        money: 700 // 500 + 200
      })
    })
  })

  it('unlocks trait when post result includes unlockTrait', async () => {
    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: true,
      followers: 50,
      platform: 'instagram',
      unlockTrait: { memberId: 'Member1', traitId: 'social_butterfly' },
      message: 'Trait unlocked!'
    })

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    await waitFor(() => {
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

  it('updates influencer score when post result includes influencerUpdate', async () => {
    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: true,
      followers: 50,
      platform: 'instagram',
      influencerUpdate: { id: 'influencer1', scoreChange: 25 },
      message: 'Influencer noticed!'
    })

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    await waitFor(() => {
      expect(mockUpdateSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          influencers: {
            influencer1: { score: 75 } // 50 + 25
          }
        })
      )
    })
  })

  it('increments viral count when post is successful', async () => {
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
          viral: 1 // 0 + 1 for successful post
        })
      )
    })
  })

  it('adds viral bonus when gig triggers viral event', async () => {
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
})

describe('PostGig Component - Brand Deals', () => {
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
    currentGig: { songId: 'test_song', venue: 'Test Venue' },
    player: { money: 500, fame: 100, day: 5, location: 'berlin' },
    band: {
      inventory: {},
      members: [],
      harmony: 50
    },
    social: {
      instagram: 100,
      trend: 'NEUTRAL',
      viral: 0,
      controversyLevel: 20,
      loyalty: 50,
      reputationCooldown: 0,
      egoFocus: null,
      sponsorActive: false,
      activeDeals: [],
      influencers: {},
      brandReputation: { CORPORATE: 30, SUSTAINABLE: 40 }
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

    vi.spyOn(economyEngine, 'calculateGigFinancials').mockReturnValue({
      net: 200,
      income: { total: 500, breakdown: [] },
      expenses: { total: 300, breakdown: [] }
    })

    vi.spyOn(economyEngine, 'shouldTriggerBankruptcy').mockReturnValue(false)

    vi.spyOn(socialEngine, 'generatePostOptions').mockReturnValue([
      { id: 'post_1', name: 'Test Post', platform: 'instagram', type: 'basic' }
    ])

    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: true,
      followers: 50,
      platform: 'instagram',
      message: 'Post successful!'
    })

    vi.spyOn(socialEngine, 'checkViralEvent').mockReturnValue(false)
    vi.spyOn(socialEngine, 'calculateSocialGrowth').mockReturnValue(25)

    useGameState.mockReturnValue(getBaseState())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accepts brand deal with upfront payment', async () => {
    vi.spyOn(socialEngine, 'generateBrandOffers').mockReturnValue([
      {
        id: 'deal_1',
        name: 'Mega Corp',
        alignment: BRAND_ALIGNMENTS.CORPORATE,
        offer: { upfront: 1000, duration: 3 },
        penalty: { loyalty: -5, controversy: 10 }
      }
    ])

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    // Should now be in DEALS phase
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /^BRAND OFFERS$/i })
      ).toBeInTheDocument()
    })

    // Accept the deal
    const acceptBtn = await screen.findByRole('button', { name: /accept/i })
    fireEvent.click(acceptBtn)

    await waitFor(() => {
      expect(mockUpdatePlayer).toHaveBeenCalledWith(expect.objectContaining({
        money: 1500
      }))
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Mega Corp'),
        'success'
      )
    })
  })

  it('accepts brand deal with item reward', async () => {
    vi.spyOn(socialEngine, 'generateBrandOffers').mockReturnValue([
      {
        id: 'deal_2',
        name: 'Cool Brand',
        alignment: BRAND_ALIGNMENTS.INDIE,
        offer: { item: 'special_guitar', duration: 2 },
        penalty: null
      }
    ])

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    const acceptBtn = await screen.findByRole('button', { name: /accept/i })
    fireEvent.click(acceptBtn)

    await waitFor(() => {
      expect(mockUpdateBand).toHaveBeenCalledWith(expect.any(Function))
    })

    const updateBandFn = getLastFunctionalUpdate(mockUpdateBand)
    expect(updateBandFn).toEqual(expect.any(Function))
    expect(updateBandFn({ inventory: {} })).toEqual({
      inventory: { special_guitar: true }
    })
  })

  it('applies brand deal penalties to loyalty and controversy', async () => {
    vi.spyOn(socialEngine, 'generateBrandOffers').mockReturnValue([
      {
        id: 'deal_3',
        name: 'Evil Corp',
        alignment: BRAND_ALIGNMENTS.EVIL,
        offer: { upfront: 2000, duration: 5 },
        penalty: { loyalty: -15, controversy: 30 }
      }
    ])

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    const acceptBtn = await screen.findByRole('button', { name: /accept/i })
    fireEvent.click(acceptBtn)

    await waitFor(() => {
      expect(mockUpdateSocial).toHaveBeenCalledWith(expect.any(Function))
    })

    // Get the update function and test it
    const updateFn = getLastFunctionalUpdate(mockUpdateSocial)
    expect(updateFn).toEqual(expect.any(Function))
    const prevSocial = {
      loyalty: 50,
      controversyLevel: 20,
      brandReputation: { EVIL: 0 }
    }
    const result = updateFn(prevSocial)

    expect(result.loyalty).toBe(35) // 50 - 15
    expect(result.controversyLevel).toBe(50) // 20 + 30
  })

  it('updates brand reputation and reduces opposing alignment', async () => {
    vi.spyOn(socialEngine, 'generateBrandOffers').mockReturnValue([
      {
        id: 'deal_4',
        name: 'Green Brand',
        alignment: BRAND_ALIGNMENTS.SUSTAINABLE,
        offer: { upfront: 500, duration: 2 },
        penalty: null
      }
    ])

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    const acceptBtn = await screen.findByRole('button', { name: /accept/i })
    fireEvent.click(acceptBtn)

    await waitFor(() => {
      expect(mockUpdateSocial).toHaveBeenCalled()
    })

    const updateFn = getLastFunctionalUpdate(mockUpdateSocial)
    expect(updateFn).toEqual(expect.any(Function))
    const prevSocial = {
      brandReputation: { SUSTAINABLE: 40, EVIL: 20 }
    }
    const result = updateFn(prevSocial)

    expect(result.brandReputation.SUSTAINABLE).toBe(45) // 40 + 5
    expect(result.brandReputation.EVIL).toBe(17) // 20 - 3
  })

  it('adds accepted deal to activeDeals', async () => {
    vi.spyOn(socialEngine, 'generateBrandOffers').mockReturnValue([
      {
        id: 'deal_5',
        name: 'Test Brand',
        alignment: BRAND_ALIGNMENTS.CORPORATE,
        offer: { upfront: 300, duration: 4 },
        penalty: null
      }
    ])

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    const acceptBtn = await screen.findByRole('button', { name: /accept/i })
    fireEvent.click(acceptBtn)

    await waitFor(() => {
      expect(mockUpdateSocial).toHaveBeenCalled()
    })

    const updateFn = getLastFunctionalUpdate(mockUpdateSocial)
    expect(updateFn).toEqual(expect.any(Function))
    const prevSocial = { activeDeals: [] }
    const result = updateFn(prevSocial)

    expect(result.activeDeals).toEqual([
      expect.objectContaining({
        id: 'deal_5',
        remainingGigs: 4
      })
    ])
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
    currentGig: { songId: 'test_song', venue: 'Test Venue' },
    player: { money: 500, fame: 100, day: 5, location: 'berlin' },
    band: { inventory: {}, members: [], harmony: 50 },
    social: {
      instagram: 100,
      trend: 'NEUTRAL',
      viral: 0,
      controversyLevel: 50,
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

    vi.spyOn(economyEngine, 'calculateGigFinancials').mockReturnValue({
      net: 200,
      income: { total: 500, breakdown: [] },
      expenses: { total: 300, breakdown: [] }
    })

    vi.spyOn(economyEngine, 'shouldTriggerBankruptcy').mockReturnValue(false)

    vi.spyOn(socialEngine, 'generatePostOptions').mockReturnValue([
      { id: 'post_1', name: 'Test Post', platform: 'instagram', type: 'basic' }
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

    useGameState.mockReturnValue(getBaseState())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('spins story to reduce controversy when player has enough money', async () => {
    useGameState.mockReturnValue(
      getBaseState({
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
          sponsorActive: false,
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
      expect(mockUpdatePlayer).toHaveBeenCalledWith(expect.objectContaining({
        money: 300
      }))
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
      getBaseState({
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
          sponsorActive: false,
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

  it('updates player money and fame on continue', async () => {
    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    const continueBtn = await screen.findByRole('button', {
      name: /back to tour/i
    })
    fireEvent.click(continueBtn)

    await waitFor(() => {
      expect(mockUpdatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          money: 700, // 500 + 200 (net)
          fame: expect.any(Number)
        })
      )
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

  it('adds apology tour quest when cancel_quest_active flag is set', async () => {
    useGameState.mockReturnValue(
      getBaseState({ activeStoryFlags: ['cancel_quest_active'] })
    )

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    const continueBtn = await screen.findByRole('button', {
      name: /back to tour/i
    })
    fireEvent.click(continueBtn)

    await waitFor(() => {
      expect(mockAddQuest).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'quest_apology_tour',
          deadline: 19, // day 5 + 14
          required: 3
        })
      )
    })
  })

  it('adds ego management quest when breakup_quest_active flag is set', async () => {
    useGameState.mockReturnValue(
      getBaseState({ activeStoryFlags: ['breakup_quest_active'] })
    )

    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    const continueBtn = await screen.findByRole('button', {
      name: /back to tour/i
    })
    fireEvent.click(continueBtn)

    await waitFor(() => {
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

  it('saves game and returns to overworld on successful continue', async () => {
    render(<PostGig />)

    await proceedToSocialAndSelectPost()

    const continueBtn = await screen.findByRole('button', {
      name: /back to tour/i
    })
    fireEvent.click(continueBtn)

    await waitFor(() => {
      expect(mockSaveGame).toHaveBeenCalledWith(false)
      expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
    })
  })
})

describe('PostGig Component - Edge Cases', () => {
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
    currentGig: { songId: 'test_song', venue: 'Test Venue' },
    player: { money: 500, fame: 100, day: 5, location: 'berlin' },
    band: { inventory: {}, members: [], harmony: 50 },
    social: {
      instagram: 100,
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

    vi.spyOn(economyEngine, 'calculateGigFinancials').mockReturnValue({
      net: 200,
      income: { total: 500, breakdown: [] },
      expenses: { total: 300, breakdown: [] }
    })

    vi.spyOn(economyEngine, 'shouldTriggerBankruptcy').mockReturnValue(false)

    vi.spyOn(socialEngine, 'generatePostOptions').mockReturnValue([
      { id: 'post_1', name: 'Test Post', platform: 'instagram', type: 'basic' }
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

    useGameState.mockReturnValue(getBaseState())
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
      getBaseState({
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
      getBaseState({
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
      getBaseState({
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
