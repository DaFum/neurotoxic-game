import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi
} from 'vitest'

/* eslint-disable @eslint-react/no-unnecessary-use-prefix */

import React from 'react'
import { render } from '@testing-library/react'

// Mock dependencies before importing the component
const getGenImageUrlMock = vi.fn(
  prompt => `mocked-url-${prompt ? prompt.substring(0, 10) : 'none'}`
)

vi.mock('../src/utils/imageGen.js', () => ({
  getGenImageUrl: getGenImageUrlMock,
  IMG_PROMPTS: {
    VENUE_CLUB: 'club',
    VENUE_KAMINSTUBE: 'kaminstube',
    VENUE_FESTIVAL: 'festival',
    VENUE_DIVE_BAR: 'dive_bar',
    VENUE_GALACTIC: 'galactic',
    MATZE_PLAYING: 'matze_playing',
    MARIUS_PLAYING: 'Marius_playing',
    LARS_PLAYING: 'Lars_playing',
    MATZE_ANGRY: 'matze_angry',
    MARIUS_DRINKING: 'Marius_drinking',
    LARS_IDLE: 'Lars_idle',
    LARS_SCREAMING: 'Lars_screaming'
  }
}))
vi.mock('../src/components/PixiStage', () => ({
  PixiStage: () => React.createElement('div', { 'data-testid': 'pixi-stage' })
}))
vi.mock('../src/components/GigHUD', () => ({
  GigHUD: () => React.createElement('div', { 'data-testid': 'gig-hud' })
}))
// Mock GlitchButton since it's used in Gig
vi.mock('../src/ui/GlitchButton', () => ({
  GlitchButton: ({ children, onClick }) =>
    React.createElement('button', { type: 'button', onClick }, children)
}))
// Mock audioManager
vi.mock('../src/utils/AudioManager', () => ({
  audioManager: {
    ensureAudioContext: vi.fn().mockResolvedValue(true)
  }
}))
// Mock audioEngine to prevent Tone.js initialization crash
vi.mock('../src/utils/audioEngine', () => ({
  pauseAudio: vi.fn(),
  resumeAudio: vi.fn(),
  stopAudio: vi.fn(),
  setupAudio: vi.fn(),
  ensureAudioContext: vi.fn().mockResolvedValue(true),
  getAudioContextTimeSec: vi.fn().mockReturnValue(0),
  getToneStartTimeSec: vi.fn().mockReturnValue(0),
  disposeAudio: vi.fn()
}))
// Mock hooks
const mockUseGameState = {
  currentGig: { name: 'Test Gig', diff: 3 },
  changeScene: vi.fn(),
  addToast: vi.fn(),
  activeEvent: null,
  setActiveEvent: vi.fn(),
  setLastGigStats: vi.fn(),
  band: { harmony: 50, performance: 50 }
}

const mockUseRhythmGameLogic = {
  stats: {
    score: 0,
    combo: 0,
    health: 100,
    overload: 0,
    isToxicMode: false,
    isGameOver: false,
    isAudioReady: true,
    accuracy: 100
  },
  actions: {
    retryAudioInitialization: vi.fn(),
    registerInput: vi.fn(),
    activateToxicMode: vi.fn()
  },
  gameStateRef: { current: {} }
}

const mockUseGigEffects = {
  chaosContainerRef: { current: null },
  chaosStyle: {},
  triggerBandAnimation: vi.fn(),
  setBandMemberRef: _id => _el => {}
}

const mockUseGigInput = {
  handleLaneInput: vi.fn()
}

// We need to mock these modules to return our mock objects
vi.mock('../src/context/GameState', () => ({
  useGameState: () => mockUseGameState
}))
vi.mock('../src/hooks/useRhythmGameLogic', () => ({
  useRhythmGameLogic: () => mockUseRhythmGameLogic
}))
vi.mock('../src/hooks/useGigEffects', () => ({
  useGigEffects: () => mockUseGigEffects
}))
vi.mock('../src/hooks/useGigInput', () => ({
  useGigInput: () => mockUseGigInput
}))
// Import Gig after mocking
const { Gig } = await import('../src/scenes/Gig.jsx')

describe('Gig Optimization', () => {
  beforeEach(() => {
    //  removed (handled by vitest env)
    getGenImageUrlMock.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('calls getGenImageUrl multiple times on render', async () => {
    // Initial render
    const { rerender } = render(React.createElement(Gig))

    // Check initial calls
    // 1 for bgUrl + 3 for band members = 4 calls
    const initialCalls = getGenImageUrlMock.mock.calls.length
    expect(initialCalls).toBeGreaterThanOrEqual(4)

    // Re-render with same props/state (simulating parent re-render or hook update)
    // We can simulate a hook update by changing the return value of the mocked hook and re-rendering
    // But since we can't easily change the mocked hook's return value for the *same* component instance without reloading modules or using a mutable mock

    // Instead, let's just force a re-render by rendering the component again with same props (if it had props)
    // or rely on the fact that `render` creates a fresh tree.

    // Actually, to test re-renders avoiding calculation, we need to update the hook's return value
    // and see if the memoization works. But here the hook is mocked globally.

    // Let's use a mutable stats object in our mock
    mockUseRhythmGameLogic.stats = {
      ...mockUseRhythmGameLogic.stats,
      score: 100
    }

    // Re-rendering the component. In a real app, the hook would return a new object, triggering re-render.
    // Here we manually rerender.
    rerender(React.createElement(Gig))

    const afterReRenderCalls = getGenImageUrlMock.mock.calls.length

    // With memoization, it should NOT call again.
    // 4 initial + 0 re-render = 4 calls
    expect(afterReRenderCalls).toBe(initialCalls)
  })
})
