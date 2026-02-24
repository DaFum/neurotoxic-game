/* eslint-disable @eslint-react/no-unnecessary-use-prefix */
import { test, describe, afterEach, beforeEach, mock } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

// Mocks

// Mock framer-motion
mock.module('framer-motion', {
  namedExports: {
    motion: {
      div: ({ children, ...props }) => React.createElement('div', props, children),
      button: ({ children, ...props }) => React.createElement('button', props, children)
    },
    AnimatePresence: ({ children }) => children
  }
})

// Mock audioManager
mock.module('../src/utils/AudioManager', {
  namedExports: {
    audioManager: {
      ensureAudioContext: mock.fn(),
      play: mock.fn()
    }
  }
})

// Mock GigModifierButton to inspect props
const mockGigModifierButton = mock.fn(({ onClick, item }) => {
  return React.createElement('button', { 'data-testid': `btn-${item.key}`, onClick: () => onClick(item.key) }, item.label)
})

mock.module('../src/ui/GigModifierButton', {
  defaultExport: mockGigModifierButton
})

// Mock utility functions
mock.module('../src/utils/simulationUtils', {
  namedExports: {
    getGigModifiers: mock.fn(() => ({ activeEffects: [] }))
  }
})

mock.module('../src/utils/economyEngine', {
  namedExports: {
    MODIFIER_COSTS: { soundcheck: 50, promo: 100, merch: 75, catering: 60, guestlist: 80 }
  }
})

mock.module('../src/utils/audio/songUtils', {
  namedExports: {
    getSongId: mock.fn(s => s.id)
  }
})

mock.module('../src/utils/errorHandler', {
  namedExports: {
    handleError: mock.fn()
  }
})

// Mock useGameState
const mockUseGameState = {
  currentGig: { id: 'gig1', name: 'Test Gig' },
  changeScene: mock.fn(),
  setSetlist: mock.fn(),
  setlist: [],
  gigModifiers: {},
  setGigModifiers: mock.fn(),
  player: { money: 1000 },
  updatePlayer: mock.fn(),
  triggerEvent: mock.fn(),
  activeEvent: null,
  band: { harmony: 50 },
  updateBand: mock.fn(),
  addToast: mock.fn(),
  startRoadieMinigame: mock.fn()
}

mock.module('../src/context/GameState', {
  namedExports: {
    useGameState: () => mockUseGameState
  }
})

// Import PreGig after mocks
const { PreGig } = await import('../src/scenes/PreGig.jsx')

describe('PreGig', () => {
  beforeEach(() => {
    setupJSDOM()
    // Reset mocks
    Object.values(mockUseGameState).forEach(fn => {
        if (typeof fn === 'function' && fn.mock && fn.mock.resetCalls) fn.mock.resetCalls()
    })
    // Restore default state
    mockUseGameState.player = { money: 1000 }
    mockUseGameState.gigModifiers = {}
  })

  afterEach(() => {
    teardownJSDOM()
    mock.reset()
  })

  test('renders modifiers and toggles correctly', async () => {
    const { findByText } = render(React.createElement(PreGig))

    // Find a modifier button (e.g. "Soundcheck")
    const soundcheckBtn = await findByText('Soundcheck')
    assert.ok(soundcheckBtn, 'Soundcheck button should exist')

    // Click it
    fireEvent.click(soundcheckBtn)

    // Verify setGigModifiers called with correct payload
    assert.strictEqual(mockUseGameState.setGigModifiers.mock.calls.length, 1)
    const callArgs = mockUseGameState.setGigModifiers.mock.calls[0].arguments[0]
    // Expect { soundcheck: true } (toggling from undefined/false)
    assert.deepStrictEqual(callArgs, { soundcheck: true })
  })

})
