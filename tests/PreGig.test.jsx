import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import React from 'react'
import { render, fireEvent } from '@testing-library/react'

// Mocks

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) =>
      React.createElement('div', props, children),
    button: ({ children, ...props }) =>
      React.createElement(
        'button',
        { ...props, type: props.type || 'button' },
        children
      )
  },
  AnimatePresence: ({ children }) => children
}))
// Mock audioManager
vi.mock('../src/utils/AudioManager', () => ({
  audioManager: {
    ensureAudioContext: vi.fn(),
    play: vi.fn()
  }
}))
// Mock GigModifierButton to inspect props
vi.mock('../src/ui/GigModifierButton', () => ({
  default: ({ item, onClick }) => (
    <button type='button' onClick={() => onClick(item.key)}>
      {item.label}
    </button>
  )
}))

// Mock utility functions
vi.mock('../src/utils/simulationUtils', () => ({
  getGigModifiers: vi.fn(() => ({ activeEffects: [] }))
}))
vi.mock('../src/utils/economyEngine', () => ({
  MODIFIER_COSTS: {
    soundcheck: 50,
    promo: 100,
    merch: 75,
    catering: 60,
    guestlist: 80
  }
}))
vi.mock('../src/utils/audio/songUtils', () => ({
  getSongId: vi.fn(s => s.id)
}))
vi.mock('../src/utils/errorHandler', () => ({
  handleError: vi.fn()
}))
// Mock useGameState
const mockUseGameState = {
  currentGig: { id: 'gig1', name: 'Test Gig' },
  changeScene: vi.fn(),
  setSetlist: vi.fn(),
  setlist: [],
  gigModifiers: {},
  setGigModifiers: vi.fn(),
  player: { money: 1000 },
  updatePlayer: vi.fn(),
  triggerEvent: vi.fn(),
  activeEvent: null,
  band: { harmony: 50 },
  updateBand: vi.fn(),
  addToast: vi.fn(),
  startRoadieMinigame: vi.fn(),
  startKabelsalatMinigame: vi.fn()
}

vi.mock('../src/context/GameState', () => ({
  useGameState: () => mockUseGameState
}))
// Import PreGig after mocks
const { PreGig, _resetLastMinigameFallback } = await import('../src/scenes/PreGig.jsx')

describe('PreGig', () => {
  beforeEach(() => {
    //  removed (handled by vitest env)
    // Reset mocks
    Object.values(mockUseGameState).forEach(fn => {
      if (typeof fn === 'function' && fn.mockReset) fn.mockReset()
    })
    // Restore default state
    mockUseGameState.player = { money: 1000 }
    mockUseGameState.gigModifiers = {}

    // Clean up sessionStorage state to ensure isolated tests
    try {
      sessionStorage.removeItem('neurotoxic_last_minigame')
    } catch (_e) {
      // Ignored
    }

    // Reset fallback memory
    if (typeof _resetLastMinigameFallback === 'function') {
      _resetLastMinigameFallback()
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    try {
      sessionStorage.removeItem('neurotoxic_last_minigame')
    } catch (_e) {
      // Ignored
    }
  })

  test('renders modifiers and toggles correctly', async () => {
    const { findByText } = render(React.createElement(PreGig))

    // Find a modifier button (e.g. "Soundcheck")
    const soundcheckBtn = await findByText(/Soundcheck/i)
    expect(soundcheckBtn).toBeTruthy()

    // Click it
    fireEvent.click(soundcheckBtn)

    // Verify setGigModifiers called with correct payload
    expect(mockUseGameState.setGigModifiers).toHaveBeenCalledTimes(1)
    const callArgs = mockUseGameState.setGigModifiers.mock.calls[0][0]
    // Expect { soundcheck: true } (toggling from undefined/false)
    expect(callArgs).toEqual({ soundcheck: true })
  })

  test('gives both minigames a 50% chance to start', async () => {
    // We need to set up a valid setlist so the start button is enabled
    mockUseGameState.setlist = [{ id: 'song1' }]

    try {
      // Test Roadie Minigame (Math.random < 0.5)
      vi.spyOn(Math, 'random').mockReturnValue(0.4)

      const { findByText } = render(React.createElement(PreGig))

      const startBtn = await findByText(/ui:pregig.startShow/i)
      fireEvent.click(startBtn)

      // Needs to wait for async click handler
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockUseGameState.startRoadieMinigame).toHaveBeenCalledTimes(1)
      expect(mockUseGameState.startKabelsalatMinigame).toHaveBeenCalledTimes(0)

    } finally {
      // Clean up spy
      if (Math.random.mockRestore) {
        Math.random.mockRestore()
      }
    }
  })

  test('gives kabelsalat minigame a 50% chance to start', async () => {
    mockUseGameState.setlist = [{ id: 'song1' }]

    try {
      // Test Kabelsalat Minigame (Math.random >= 0.5)
      vi.spyOn(Math, 'random').mockReturnValue(0.6)

      const { findByText } = render(React.createElement(PreGig))
      const startBtn = await findByText(/ui:pregig.startShow/i)
      fireEvent.click(startBtn)

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockUseGameState.startKabelsalatMinigame).toHaveBeenCalledTimes(1)
      expect(mockUseGameState.startRoadieMinigame).toHaveBeenCalledTimes(0)
    } finally {
      if (Math.random.mockRestore) {
        Math.random.mockRestore()
      }
    }
  })

  test('applies streak breaker when roadie was played last (25% chance)', async () => {
    mockUseGameState.setlist = [{ id: 'song1' }]

    // Set sessionStorage to roadie to trigger streak breaker
    sessionStorage.setItem('neurotoxic_last_minigame', 'roadie')

    try {
      // 0.3 is >= 0.25 threshold, so Kabelsalat should be picked
      vi.spyOn(Math, 'random').mockReturnValue(0.3)

      const { findByText } = render(React.createElement(PreGig))
      const startBtn = await findByText(/ui:pregig.startShow/i)
      fireEvent.click(startBtn)

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockUseGameState.startKabelsalatMinigame).toHaveBeenCalledTimes(1)
      expect(mockUseGameState.startRoadieMinigame).toHaveBeenCalledTimes(0)
    } finally {
      if (Math.random.mockRestore) {
        Math.random.mockRestore()
      }
    }
  })

  test('applies streak breaker when kabelsalat was played last (75% chance)', async () => {
    mockUseGameState.setlist = [{ id: 'song1' }]

    // Set sessionStorage to kabelsalat to trigger streak breaker
    sessionStorage.setItem('neurotoxic_last_minigame', 'kabelsalat')

    try {
      // 0.6 is < 0.75 threshold, so Roadie should be picked
      vi.spyOn(Math, 'random').mockReturnValue(0.6)

      const { findByText } = render(React.createElement(PreGig))
      const startBtn = await findByText(/ui:pregig.startShow/i)
      fireEvent.click(startBtn)

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockUseGameState.startRoadieMinigame).toHaveBeenCalledTimes(1)
      expect(mockUseGameState.startKabelsalatMinigame).toHaveBeenCalledTimes(0)
    } finally {
      if (Math.random.mockRestore) {
        Math.random.mockRestore()
      }
    }
  })
})
