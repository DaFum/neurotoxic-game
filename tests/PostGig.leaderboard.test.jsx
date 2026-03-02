import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PostGig } from '../src/scenes/PostGig'
import { useGameState } from '../src/context/GameState'
import * as economyEngine from '../src/utils/economyEngine'
import * as socialEngine from '../src/utils/socialEngine'

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}))

vi.mock('../src/context/GameState', () => ({
  useGameState: vi.fn()
}))

vi.mock('../src/utils/imageGen', () => ({
  getGenImageUrl: vi.fn(),
  IMG_PROMPTS: { POST_GIG_BG: 'mock-bg' }
}))

// Mock crypto
vi.mock('../src/utils/crypto', () => ({
  secureRandom: () => 0.5
}))

vi.mock('../src/data/songs', () => ({
  SONGS_DB: [
    {
      id: 'raw_01_kranker_schrank',
      leaderboardId: 'slug-01',
      name: '01 Kranker Schrank'
    },
    {
      id: 'neurotoxic_1_raw',
      leaderboardId: 'slug-neurotoxic',
      name: 'Neurotoxic 1'
    }
  ]
}))

describe('PostGig Leaderboard Submission', () => {
  const mockFetch = vi.fn().mockResolvedValue({ ok: true })
  const mockUpdatePlayer = vi.fn()
  const mockUpdateBand = vi.fn()
  const mockUpdateSocial = vi.fn()
  const mockChangeScene = vi.fn()
  const mockTriggerEvent = vi.fn()
  const mockAddToast = vi.fn()
  const mockUnlockTrait = vi.fn()

  const getBaseState = () => ({
    currentGig: { songId: 'raw_01_kranker_schrank', venue: 'Venue A' },
    player: {
      money: 500,
      fame: 100,
      day: 5,
      playerId: 'user-uuid',
      playerName: 'TestUser'
    },
    band: { inventory: {}, members: [] },
    social: { instagram: 100, trend: 'NEUTRAL' },
    lastGigStats: { score: 12345, events: [] },
    gigModifiers: {},
    activeEvent: null,
    activeStoryFlags: [],
    triggerEvent: mockTriggerEvent,
    updatePlayer: mockUpdatePlayer,
    updateBand: mockUpdateBand,
    updateSocial: mockUpdateSocial,
    changeScene: mockChangeScene,
    addToast: mockAddToast,
    unlockTrait: mockUnlockTrait,
    reputationByRegion: {},
    setlist: [],
    addQuest: vi.fn()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch

    // Mock Economy and Social Engines to simplify flow
    vi.spyOn(economyEngine, 'calculateGigFinancials').mockReturnValue({
      net: 100,
      income: {
        total: 250,
        breakdown: [
          { labelKey: 'ticketSales', label: 'Ticket Sales', value: 200 },
          { labelKey: 'merchSales', label: 'Merch Sales', value: 50 }
        ]
      },
      expenses: {
        total: 60,
        breakdown: [
          { labelKey: 'venueCut', label: 'Venue Cut', value: 50 },
          { labelKey: 'travelCost', label: 'Travel Cost', value: 10 }
        ]
      }
    })

    vi.spyOn(socialEngine, 'generatePostOptions').mockReturnValue([
      { id: 'post_1', name: 'Selfie', platform: 'instagram', type: 'basic' }
    ])

    vi.spyOn(socialEngine, 'resolvePost').mockReturnValue({
      success: true,
      followers: 10,
      platform: 'instagram',
      message: 'Great post!'
    })

    vi.spyOn(socialEngine, 'calculateSocialGrowth').mockReturnValue(5)
    vi.spyOn(socialEngine, 'generateBrandOffers').mockReturnValue([]) // Skip deals phase

    useGameState.mockReturnValue(getBaseState())
  })

  afterEach(() => {
    delete global.fetch
    vi.restoreAllMocks()
  })

  it('submits song score to leaderboard on continue', async () => {
    render(<PostGig />)

    // Phase: REPORT
    const nextBtn = await screen.findByRole('button', {
      name: /continue|next|social/i
    })
    fireEvent.click(nextBtn)

    // Phase: SOCIAL
    // Click on the post option
    const postBtn = await screen.findByText('Selfie')
    fireEvent.click(postBtn)

    // Phase: DEALS (Skipped because mock returns empty array) -> COMPLETE
    // Phase: COMPLETE
    // Click Continue (to Overworld)
    const continueBtn = await screen.findByRole('button', {
      name: /back to tour/i
    })

    // Ensure we are in Complete phase
    expect(screen.getByText('Great post!')).toBeInTheDocument()

    // Verify fetch hasn't been called yet
    expect(mockFetch).not.toHaveBeenCalled()

    fireEvent.click(continueBtn)

    // Verify fetch call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/leaderboard/song',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            playerId: 'user-uuid',
            playerName: 'TestUser',
            songId: 'slug-01',
            score: 12345
          })
        })
      )
    })

    // Verify scene change
    expect(mockChangeScene).toHaveBeenCalledWith('OVERWORLD')
  })

  it('resolves song via setlist if currentGig.songId is missing', async () => {
    const base = getBaseState()
    useGameState.mockReturnValue({
      ...base,
      currentGig: { ...base.currentGig, songId: undefined },
      setlist: ['neurotoxic_1_raw']
    })

    render(<PostGig />)

    // Phase: REPORT
    const nextBtn = await screen.findByRole('button', {
      name: /continue|next|social/i
    })
    fireEvent.click(nextBtn)

    // Phase: SOCIAL
    const postBtn = await screen.findByText('Selfie')
    fireEvent.click(postBtn)

    // Phase: COMPLETE
    const continueBtn = await screen.findByRole('button', {
      name: /back to tour/i
    })
    fireEvent.click(continueBtn)

    // Verify fetch call resolves leaderboardId from setlist
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/leaderboard/song',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            playerId: 'user-uuid',
            playerName: 'TestUser',
            songId: 'slug-neurotoxic',
            score: 12345
          })
        })
      )
    })
  })

  it('skips leaderboard submission if playerId is missing', async () => {
    const base = getBaseState()
    useGameState.mockReturnValue({
      ...base,
      player: { ...base.player, playerId: null }, // No playerId
      setlist: []
    })

    render(<PostGig />)

    // Report -> Next
    const nextBtn = await screen.findByRole('button', {
      name: /continue|next|social/i
    })
    fireEvent.click(nextBtn)
    // Social -> Post
    fireEvent.click(await screen.findByText('Selfie'))
    // Complete -> Continue
    fireEvent.click(await screen.findByText(/Back to Tour/i))

    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockChangeScene).toHaveBeenCalledWith('OVERWORLD')
  })
})
