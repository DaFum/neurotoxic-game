/**
 * Tests for the post-gig continue guard (Finding #4):
 *  1. handleContinue called twice synchronously settles exactly once.
 *  2. PostGig passes isProcessingAction to CompletePhase.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PostGig } from '../../src/scenes/PostGig'
import { useGameState } from '../../src/context/GameState'
import * as economyEngine from '../../src/utils/economyEngine'
import * as socialEngine from '../../src/utils/socialEngine'
import * as brandDealLogic from '../../src/utils/brandDealLogic'

// ----- Phase component mocks -----

vi.mock('../../src/components/postGig/ReportPhase', () => ({
  ReportPhase: ({ onNext }) => (
    <div data-testid='mock-report-phase'>
      <button type='button' onClick={onNext}>
        Continue to Socials
      </button>
    </div>
  )
}))

vi.mock('../../src/components/postGig/SocialPhase', () => ({
  SocialPhase: ({ options = [], onSelect }) => (
    <div data-testid='mock-social-phase'>
      {options.map(opt => (
        <button type='button' key={opt.id} onClick={() => onSelect(opt)}>
          {opt.name}
        </button>
      ))}
    </div>
  )
}))

vi.mock('../../src/components/postGig/DealsPhase', () => ({
  DealsPhase: ({ onSkip }) => (
    <div data-testid='mock-deals-phase'>
      <button type='button' onClick={onSkip}>
        Skip Deals
      </button>
    </div>
  )
}))

// This mock forwards isProcessingAction as a data attribute so tests can
// assert that PostGig passes it through.
vi.mock('../../src/components/postGig/CompletePhase', () => ({
  CompletePhase: ({ onContinue, isProcessingAction }) => (
    <div
      data-testid='mock-complete-phase'
      data-is-processing={String(isProcessingAction)}
    >
      <button type='button' onClick={onContinue}>
        back to tour
      </button>
    </div>
  )
}))

// ----- Infrastructure mocks -----

vi.mock('../../src/context/GameState', () => {
  const useGameState = vi.fn()
  return {
    useGameState,
    useGameActions: useGameState,
    useGameSelector: selector => selector(useGameState())
  }
})

vi.mock('../../src/utils/imageGen', () => ({
  isImageGenerationAvailable: () => true,
  resolveGenImageUrl: () => 'mock-url',
  getGeneratedImageFallbackUrl: () => 'mock-fallback',
  getGenImageUrl: vi.fn(() => 'mock-url'),
  IMG_PROMPTS: { POST_GIG_BG: 'mock-bg' }
}))

vi.mock('../../src/utils/crypto', () => ({
  secureRandom: () => 0.5
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

// ----- Shared helpers -----

const mockUpdatePlayer = vi.fn()
const mockUpdateBand = vi.fn()
const mockUpdateSocial = vi.fn()
const mockChangeScene = vi.fn()
const mockTriggerEvent = vi.fn()
const mockAddToast = vi.fn()
const mockAddQuest = vi.fn()
const mockApplyQuestEvent = vi.fn()

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
    members: [],
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
    influencers: {},
    brandReputation: {}
  },
  lastGigStats: { score: 50000, accuracy: 95, events: [] },
  gigModifiers: {},
  assets: [],
  activeEvent: null,
  activeStoryFlags: [],
  triggerEvent: mockTriggerEvent,
  updatePlayer: mockUpdatePlayer,
  updateBand: mockUpdateBand,
  updateSocial: mockUpdateSocial,
  changeScene: mockChangeScene,
  addToast: mockAddToast,
  unlockTrait: vi.fn(),
  reputationByRegion: { berlin: 50 },
  setlist: [],
  addQuest: mockAddQuest,
  applyQuestEvent: mockApplyQuestEvent,
  ...overrides
})

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
  vi.spyOn(brandDealLogic, 'generateBrandOffers').mockReturnValue([])
  useGameState.mockReturnValue(createBaseState())
}

/** Navigate from REPORT → SOCIAL → COMPLETE (skipping DEALS). */
const advanceToCompletePhase = async () => {
  fireEvent.click(
    await screen.findByRole('button', { name: /continue to socials/i })
  )
  fireEvent.click(await screen.findByRole('button', { name: /test post/i }))
  await screen.findByTestId('mock-complete-phase')
}

// ----- Tests -----

describe('PostGig Continue Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupCommonMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('passes isProcessingAction prop to CompletePhase (initially false)', async () => {
    render(<PostGig />)
    await advanceToCompletePhase()

    const completeEl = screen.getByTestId('mock-complete-phase')
    // Before clicking continue, processing should be false
    expect(completeEl).toHaveAttribute('data-is-processing', 'false')
  })

  it('handleContinue called twice synchronously settles exactly once', async () => {
    render(<PostGig />)
    await advanceToCompletePhase()

    const continueBtn = screen.getByRole('button', { name: /back to tour/i })

    // Click twice in immediate succession — the second click must be a no-op
    fireEvent.click(continueBtn)
    fireEvent.click(continueBtn)

    await waitFor(() => {
      expect(mockChangeScene).toHaveBeenCalledTimes(1)
    })

    // Settlement side-effects must run exactly once
    expect(mockUpdatePlayer).toHaveBeenCalledTimes(1)
    // Merch deduction: soldMerch is undefined in base state, so updateBand for
    // merch is not called — but the call count for the harmony/quest path must
    // also be exactly 1 (no neurotoxicPedal in base state → 0 band calls from continue)
    expect(mockAddQuest).toHaveBeenCalledTimes(0)
  })
})
