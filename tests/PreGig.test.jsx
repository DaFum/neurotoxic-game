import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
/* eslint-disable @eslint-react/no-unnecessary-use-prefix */

import React from 'react'
import { render, fireEvent } from '@testing-library/react'


// Mocks

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
      div: ({ children, ...props }) => React.createElement('div', props, children),
      button: ({ children, ...props }) => React.createElement('button', { ...props, type: props.type || 'button' }, children)
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
    <button type="button" onClick={() => onClick(item.key)}>
      {item.label}
    </button>
  )
}))

// Mock utility functions
vi.mock('../src/utils/simulationUtils', () => ({
    getGigModifiers: vi.fn(() => ({ activeEffects: [] }))
  }))
vi.mock('../src/utils/economyEngine', () => ({
    MODIFIER_COSTS: { soundcheck: 50, promo: 100, merch: 75, catering: 60, guestlist: 80 }
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
  startRoadieMinigame: vi.fn()
}

vi.mock('../src/context/GameState', () => ({
    useGameState: () => mockUseGameState
  }))
// Import PreGig after mocks
const { PreGig } = await import('../src/scenes/PreGig.jsx')

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
  })

  afterEach(() => {

    vi.clearAllMocks()
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

})
