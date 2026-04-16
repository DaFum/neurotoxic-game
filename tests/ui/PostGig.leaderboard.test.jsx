import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PostGig } from '../../src/scenes/PostGig'
import { useGameState } from '../../src/context/GameState'
import { GAME_PHASES } from '../../src/context/gameConstants'
import * as economyEngine from '../../src/utils/economyEngine'
import * as socialEngine from '../../src/utils/socialEngine'

// Mock lazy-loaded phase components to prevent Suspense timeout in tests
vi.mock('../../src/components/postGig/ReportPhase', () => ({
  ReportPhase: ({ financials, onNext, ...layoutProps }) => (
    <div data-testid='mock-report-phase' {...layoutProps}>
      <button type='button' onClick={onNext}>
        Continue to Socials
      </button>
    </div>
  )
}))

vi.mock('../../src/components/postGig/SocialPhase', () => ({
  SocialPhase: ({
    options = [],
    onSelect,
    trend,
    zealotryLevel,
    ...layoutProps
  }) => (
    <div
      data-testid='mock-social-phase'
      data-trend={trend}
      data-zealotry-level={zealotryLevel}
      {...layoutProps}
    >
      {options.map(opt => (
        <button type='button' key={opt.id} onClick={() => onSelect(opt)}>
          {opt.name}
        </button>
      ))}
    </div>
  )
}))

vi.mock('../../src/components/postGig/DealsPhase', () => ({
  DealsPhase: ({ offers = [], onAccept, onSkip, ...layoutProps }) => (
    <div data-testid='mock-deals-phase' {...layoutProps}>
      {offers[0] && (
        <button type='button' onClick={() => onAccept(offers[0])}>
          Accept First Deal
        </button>
      )}
      <button type='button' onClick={onSkip}>
        Skip Deals
      </button>
    </div>
  )
}))

vi.mock('../../src/components/postGig/CompletePhase', () => ({
  CompletePhase: ({
    result,
    onContinue,
    onSpinStory,
    player,
    ...layoutProps
  }) => (
    <div data-testid='mock-complete-phase' {...layoutProps}>
      {result && <div>{result.message}</div>}
      {player && (
        <button type='button' onClick={onSpinStory}>
          Spin Story
        </button>
      )}
      <button type='button' onClick={onContinue}>
        Back to Tour &gt;
      </button>
    </div>
  )
}))

// Mock dependencies

const mocks = vi.hoisted(() => ({
  mockLoggerError: vi.fn()
}))

vi.mock('../../src/utils/logger', () => ({
  logger: {
    error: mocks.mockLoggerError,
    info: vi.fn(),
    warn: vi.fn()
  },
  LOG_LEVELS: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, NONE: 4 }
}))

vi.mock('../../src/context/GameState', () => ({
  useGameState: vi.fn()
}))

vi.mock('../../src/utils/imageGen', () => ({
  getGenImageUrl: vi.fn(),
  IMG_PROMPTS: { POST_GIG_BG: 'mock-bg' }
}))

// Mock crypto
vi.mock('../../src/utils/crypto', () => ({
  secureRandom: () => 0.5
}))

vi.mock('../../src/data/songs', () => {
  const songs = [
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
  return {
    SONGS_DB: songs,
    SONGS_BY_ID: new Map(songs.map(s => [s.id, s]))
  }
})

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key, options) => {
      const template = options?.defaultValue || key
      if (!options) return template

      return template.replace(/\{\{(\w+)\}\}/g, (_, token) =>
        String(options[token] ?? `{{${token}}}`)
      )
    }
  })
}))

describe('PostGig Leaderboard Submission', () => {
  const mockFetch = vi.fn().mockResolvedValue({ ok: true })
  const mockUpdatePlayer = vi.fn()
  const mockUpdateBand = vi.fn()
  const mockUpdateSocial = vi.fn()
  const mockChangeScene = vi.fn()
  const mockTriggerEvent = vi.fn()
  const mockAddToast = vi.fn()
  const mockSaveGame = vi.fn()
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
    lastGigStats: {
      score: 12345,
      accuracy: 95,
      events: [],
      songStats: [
        { songId: 'raw_01_kranker_schrank', score: 12345, accuracy: 95 }
      ]
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
    expect(
      mockFetch.mock.calls.filter(c => c[0] === '/api/leaderboard/song').length
    ).toBe(0)

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
            score: 12345,
            accuracy: 95
          })
        })
      )
    })

    // Verify autosave and scene change order
    await waitFor(() =>
      expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
    )
    expect(mockSaveGame).toHaveBeenCalled()
    expect(mockSaveGame.mock.invocationCallOrder[0]).toBeLessThan(
      mockChangeScene.mock.invocationCallOrder[0]
    )
  })

  it('resolves song via setlist if currentGig.songId is missing and songStats is undefined', async () => {
    const base = getBaseState()
    useGameState.mockReturnValue({
      ...base,
      currentGig: { ...base.currentGig, songId: undefined },
      lastGigStats: { score: 12345, accuracy: 95, songStats: undefined },
      setlist: ['neurotoxic_1_raw']
    })

    render(<PostGig />)

    // Report -> Next
    let nextBtn = await screen.findByRole('button', {
      name: /continue|next|social/i
    })
    fireEvent.click(nextBtn)

    // Social -> Post
    let postBtn = await screen.findByText('Selfie')
    fireEvent.click(postBtn)

    // Complete -> Overworld
    let finishBtn = await screen.findByRole('button', {
      name: /back to tour|continue/i
    })
    fireEvent.click(finishBtn)

    // Verify fetch call resolves leaderboardId from setlist
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/leaderboard/song',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            playerId: 'user-uuid',
            playerName: 'TestUser',
            songId: 'slug-neurotoxic',
            score: 12345,
            accuracy: 95
          })
        })
      )
    })
  })

  it('skips leaderboard submission if playerName is missing', async () => {
    const base = getBaseState()
    useGameState.mockReturnValue({
      ...base,
      player: { ...base.player, playerName: null }, // No playerName
      setlist: []
    })

    render(<PostGig />)

    // Report -> Next
    let nextBtn = await screen.findByRole('button', {
      name: /continue|next|social/i
    })
    fireEvent.click(nextBtn)

    // Social -> Post
    let postBtn = await screen.findByText('Selfie')
    fireEvent.click(postBtn)

    // Complete -> Overworld
    let finishBtn = await screen.findByRole('button', {
      name: /back to tour|continue/i
    })
    fireEvent.click(finishBtn)

    // Should not call fetch
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  it('skips unknown songs gracefully without making a fetch call', async () => {
    const base = getBaseState()
    useGameState.mockReturnValue({
      ...base,
      currentGig: { ...base.currentGig, songId: 'unknown_song_not_in_db' },
      lastGigStats: { score: 100, accuracy: 100, songStats: undefined }
    })

    render(<PostGig />)

    // Report -> Next
    let nextBtn = await screen.findByRole('button', {
      name: /continue|next|social/i
    })
    fireEvent.click(nextBtn)

    // Social -> Post
    let postBtn = await screen.findByText('Selfie')
    fireEvent.click(postBtn)

    // Complete -> Overworld
    let finishBtn = await screen.findByRole('button', {
      name: /back to tour|continue/i
    })
    fireEvent.click(finishBtn)

    // Should not call fetch because song is unknown
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  it('submits mixed songStats list, processing knowns and skipping unknowns', async () => {
    const base = getBaseState()
    useGameState.mockReturnValue({
      ...base,
      lastGigStats: {
        score: 200,
        accuracy: 95,
        songStats: [
          { songId: 'unknown_song', score: 50, accuracy: 90 },
          { songId: 'raw_01_kranker_schrank', score: 150, accuracy: 99 }
        ]
      }
    })

    render(<PostGig />)

    // Report -> Next
    const nextBtn = await screen.findByRole('button', {
      name: /continue|next|social/i
    })
    fireEvent.click(nextBtn)

    // Social -> Post
    let postBtn = await screen.findByText('Selfie')
    fireEvent.click(postBtn)

    // Complete -> Overworld
    const finishBtn = await screen.findByRole('button', {
      name: /back to tour|continue/i
    })
    fireEvent.click(finishBtn)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/leaderboard/song',
        expect.objectContaining({
          body: expect.stringContaining('"songId":"slug-01"')
        })
      )
    })
  })

  it('logs an error when fetch response is not ok', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      })
    )

    render(<PostGig />)

    let nextBtn = await screen.findByRole('button', {
      name: /continue|next|social/i
    })
    fireEvent.click(nextBtn)

    let postBtn = await screen.findByText('Selfie')
    fireEvent.click(postBtn)

    let finishBtn = await screen.findByRole('button', {
      name: /back to tour|continue/i
    })
    fireEvent.click(finishBtn)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(mocks.mockLoggerError).toHaveBeenCalledWith(
        'PostGig',
        expect.stringContaining('Score submit failed for slug-01'),
        expect.anything()
      )
    })
  })

  it('logs an error when fetch promise rejects', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

    render(<PostGig />)

    // Phase: REPORT
    let nextBtn = await screen.findByRole('button', {
      name: /continue|next|social/i
    })
    fireEvent.click(nextBtn)

    // Phase: SOCIAL
    const postBtn = await screen.findByText('Selfie')
    fireEvent.click(postBtn)

    // Phase: COMPLETE
    let finishBtn = await screen.findByRole('button', {
      name: /back to tour|continue/i
    })
    fireEvent.click(finishBtn)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(mocks.mockLoggerError).toHaveBeenCalledWith(
        'PostGig',
        expect.stringContaining('Score submit failed for slug-01'),
        expect.any(Error)
      )
    })
  })

  it('submits multiple leaderboard entries for multiple songs in songStats', async () => {
    const base = getBaseState()
    useGameState.mockReturnValue({
      ...base,
      lastGigStats: {
        score: 20000,
        accuracy: 90,
        events: [],
        songStats: [
          { songId: 'raw_01_kranker_schrank', score: 10000, accuracy: 80 },
          { songId: 'neurotoxic_1_raw', score: 10000, accuracy: 100 }
        ]
      }
    })

    render(<PostGig />)

    // Phase: REPORT -> SOCIAL -> COMPLETE -> Continue
    fireEvent.click(
      await screen.findByRole('button', { name: /continue|next|social/i })
    )
    fireEvent.click(await screen.findByText('Selfie'))
    fireEvent.click(
      await screen.findByRole('button', { name: /back to tour/i })
    )

    // Should fetch twice, one for each song
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)

      // Song 1
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/leaderboard/song',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            playerId: 'user-uuid',
            playerName: 'TestUser',
            songId: 'slug-01',
            score: 10000,
            accuracy: 80
          })
        })
      )

      // Song 2
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/leaderboard/song',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            playerId: 'user-uuid',
            playerName: 'TestUser',
            songId: 'slug-neurotoxic',
            score: 10000,
            accuracy: 100
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
    await waitFor(() =>
      expect(mockChangeScene).toHaveBeenCalledWith(GAME_PHASES.OVERWORLD)
    )
    expect(mockSaveGame).toHaveBeenCalled()
    expect(mockSaveGame.mock.invocationCallOrder[0]).toBeLessThan(
      mockChangeScene.mock.invocationCallOrder[0]
    )
  })
})
