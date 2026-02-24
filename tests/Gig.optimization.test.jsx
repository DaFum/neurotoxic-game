
/* eslint-disable @eslint-react/no-unnecessary-use-prefix */
import { test, describe, afterEach, beforeEach, mock } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { render } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

// Mock dependencies before importing the component
const getGenImageUrlMock = mock.fn((prompt) => `mocked-url-${prompt ? prompt.substring(0, 10) : 'none'}`)

mock.module('../src/utils/imageGen.js', {
  namedExports: {
    getGenImageUrl: getGenImageUrlMock,
    IMG_PROMPTS: {
      VENUE_CLUB: 'club',
      VENUE_KAMINSTUBE: 'kaminstube',
      VENUE_FESTIVAL: 'festival',
      VENUE_DIVE_BAR: 'dive_bar',
      VENUE_GALACTIC: 'galactic',
      MATZE_PLAYING: 'matze_playing',
      LARS_PLAYING: 'lars_playing',
      MARIUS_PLAYING: 'marius_playing',
      MATZE_ANGRY: 'matze_angry',
      LARS_DRINKING: 'lars_drinking',
      MARIUS_IDLE: 'marius_idle',
      MARIUS_SCREAMING: 'marius_screaming'
    }
  }
})

mock.module('../src/components/PixiStage', {
  namedExports: {
    PixiStage: () => React.createElement('div', { 'data-testid': 'pixi-stage' })
  }
})

mock.module('../src/components/GigHUD', {
  namedExports: {
    GigHUD: () => React.createElement('div', { 'data-testid': 'gig-hud' })
  }
})

// Mock GlitchButton since it's used in Gig
mock.module('../src/ui/GlitchButton', {
  namedExports: {
    GlitchButton: ({ children, onClick }) => React.createElement('button', { onClick }, children)
  }
})

// Mock audioManager
mock.module('../src/utils/AudioManager', {
  namedExports: {
    audioManager: {
      ensureAudioContext: async () => true
    }
  }
})

// Mock hooks
const mockUseGameState = {
  currentGig: { name: 'Test Gig', diff: 3 },
  changeScene: mock.fn(),
  addToast: mock.fn(),
  activeEvent: null,
  setActiveEvent: mock.fn(),
  setLastGigStats: mock.fn(),
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
    retryAudioInitialization: mock.fn(),
    registerInput: mock.fn(),
    activateToxicMode: mock.fn()
  },
  gameStateRef: { current: {} }
}

const mockUseGigEffects = {
  chaosContainerRef: { current: null },
  chaosStyle: {},
  triggerBandAnimation: mock.fn(),
  setBandMemberRef: (_id) => (_el) => {}
}

const mockUseGigInput = {
  handleLaneInput: mock.fn()
}

// We need to mock these modules to return our mock objects
mock.module('../src/context/GameState', {
  namedExports: {
    useGameState: () => mockUseGameState
  }
})

mock.module('../src/hooks/useRhythmGameLogic', {
  namedExports: {
    useRhythmGameLogic: () => mockUseRhythmGameLogic
  }
})

mock.module('../src/hooks/useGigEffects', {
  namedExports: {
    useGigEffects: () => mockUseGigEffects
  }
})

mock.module('../src/hooks/useGigInput', {
  namedExports: {
    useGigInput: () => mockUseGigInput
  }
})

// Import Gig after mocking
const { Gig } = await import('../src/scenes/Gig.jsx')

describe('Gig Optimization', () => {
  beforeEach(() => {
    setupJSDOM()
    getGenImageUrlMock.mock.resetCalls()
  })

  afterEach(() => {
    teardownJSDOM()
    mock.reset()
  })

  test('calls getGenImageUrl multiple times on render', async () => {
    // Initial render
    const { rerender } = render(React.createElement(Gig))

    // Check initial calls
    // 1 for bgUrl + 3 for band members = 4 calls
    const initialCalls = getGenImageUrlMock.mock.calls.length
    assert.ok(initialCalls >= 4, `Expected at least 4 calls, got ${initialCalls}`)

    // Re-render with same props/state (simulating parent re-render or hook update)
    // We can simulate a hook update by changing the return value of the mocked hook and re-rendering
    // But since we can't easily change the mocked hook's return value for the *same* component instance without reloading modules or using a mutable mock

    // Instead, let's just force a re-render by rendering the component again with same props (if it had props)
    // or rely on the fact that `render` creates a fresh tree.

    // Actually, to test re-renders avoiding calculation, we need to update the hook's return value
    // and see if the memoization works. But here the hook is mocked globally.

    // Let's use a mutable stats object in our mock
    mockUseRhythmGameLogic.stats = { ...mockUseRhythmGameLogic.stats, score: 100 }

    // Re-rendering the component. In a real app, the hook would return a new object, triggering re-render.
    // Here we manually rerender.
    rerender(React.createElement(Gig))

    const afterReRenderCalls = getGenImageUrlMock.mock.calls.length

    // With memoization, it should NOT call again.
    // 4 initial + 0 re-render = 4 calls
    assert.strictEqual(afterReRenderCalls, initialCalls, `Expected no new calls on re-render, got ${afterReRenderCalls} (initial: ${initialCalls})`)
  })
})
