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
vi.mock('../../src/utils/AudioManager', () => ({
  audioManager: {
    ensureAudioContext: vi.fn(() => Promise.resolve(true)),
    play: vi.fn()
  }
}))
// Mock GigModifierButton to inspect props
vi.mock('../../src/ui/GigModifierButton', () => ({
  default: ({ item, onClick }) => (
    <button type='button' onClick={() => onClick(item.key)}>
      {item.label}
    </button>
  )
}))

// Mock utility functions
vi.mock('../../src/utils/crypto', () => ({
  secureRandom: vi.fn(() => 0.5),
  getSafeRandom: vi.fn(() => 0.5),
  getSafeUUID: vi.fn(() => 'mock-uuid')
}))
vi.mock('../../src/utils/simulationUtils', () => ({
  getGigModifiers: vi.fn(() => ({ activeEffects: [] }))
}))
vi.mock('../../src/utils/economyEngine', () => ({
  MODIFIER_COSTS: {
    soundcheck: 50,
    promo: 100,
    merch: 75,
    catering: 60,
    guestlist: 80
  }
}))
vi.mock('../../src/utils/audio/songUtils', () => ({
  getSongId: vi.fn(s => s.id)
}))
vi.mock('../../src/utils/errorHandler', () => ({
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
  startKabelsalatMinigame: vi.fn(),
  startAmpCalibration: vi.fn()
}

vi.mock('../../src/context/GameState', () => ({
  useGameState: () => mockUseGameState
}))
// Import PreGig after mocks
const { PreGig, _resetLastMinigameFallback } =
  await import('../../src/scenes/PreGig.tsx')
const { getSafeRandom } = await import('../../src/utils/crypto')

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

  test('gives minigames proper chances to start based on weight', async () => {
    // We need to set up a valid setlist so the start button is enabled
    mockUseGameState.setlist = [{ id: 'song1' }]

    // Total weight normally is 3. 0.1 * 3 = 0.3 < 1, so it's roadie
    vi.mocked(getSafeRandom).mockReturnValue(0.1)

    const { findByText, unmount } = render(React.createElement(PreGig))

    const startBtn = await findByText(/ui:pregig.startShow/i)
    fireEvent.click(startBtn)

    // Needs to wait for async click handler
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockUseGameState.startRoadieMinigame).toHaveBeenCalledTimes(1)
    expect(mockUseGameState.startKabelsalatMinigame).toHaveBeenCalledTimes(0)
    expect(mockUseGameState.startAmpCalibration).toHaveBeenCalledTimes(0)
    unmount()
  })

  test('gives kabelsalat minigame a 33% chance to start', async () => {
    mockUseGameState.setlist = [{ id: 'song1' }]

    // Test Kabelsalat Minigame (secureRandom >= 0.5)
    vi.mocked(getSafeRandom).mockReturnValue(0.5)

    const { findByText } = render(React.createElement(PreGig))
    const startBtn = await findByText(/ui:pregig.startShow/i)
    fireEvent.click(startBtn)

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockUseGameState.startKabelsalatMinigame).toHaveBeenCalledTimes(1)
    expect(mockUseGameState.startRoadieMinigame).toHaveBeenCalledTimes(0)
    expect(mockUseGameState.startAmpCalibration).toHaveBeenCalledTimes(0)
  })

  test('gives amp calibration minigame a 33% chance to start', async () => {
    mockUseGameState.setlist = [{ id: 'song1' }]

    // Test Amp Calibration Minigame (secureRandom >= 0.66)
    // 0.8 * 3 = 2.4 > 2, so it's amp calibration
    vi.mocked(getSafeRandom).mockReturnValue(0.8)

    const { findByText } = render(React.createElement(PreGig))
    const startBtn = await findByText(/ui:pregig.startShow/i)
    fireEvent.click(startBtn)

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockUseGameState.startAmpCalibration).toHaveBeenCalledTimes(1)
    expect(mockUseGameState.startRoadieMinigame).toHaveBeenCalledTimes(0)
    expect(mockUseGameState.startKabelsalatMinigame).toHaveBeenCalledTimes(0)
  })

  test('applies streak breaker when roadie was played last (25% chance)', async () => {
    mockUseGameState.setlist = [{ id: 'song1' }]

    // Set sessionStorage to roadie to trigger streak breaker
    sessionStorage.setItem('neurotoxic_last_minigame', 'roadie')

    // 0.3 is >= 0.25 threshold, so Kabelsalat should be picked
    vi.mocked(getSafeRandom).mockReturnValue(0.3)

    const { findByText } = render(React.createElement(PreGig))
    const startBtn = await findByText(/ui:pregig.startShow/i)
    fireEvent.click(startBtn)

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockUseGameState.startKabelsalatMinigame).toHaveBeenCalledTimes(1)
    expect(mockUseGameState.startRoadieMinigame).toHaveBeenCalledTimes(0)
  })

  test('applies streak breaker when kabelsalat was played last (75% chance)', async () => {
    mockUseGameState.setlist = [{ id: 'song1' }]

    // Set sessionStorage to kabelsalat to trigger streak breaker
    sessionStorage.setItem('neurotoxic_last_minigame', 'kabelsalat')

    // 0.6 is < 0.75 threshold, so Roadie should be picked
    vi.mocked(getSafeRandom).mockReturnValue(0.2)

    const { findByText } = render(React.createElement(PreGig))
    const startBtn = await findByText(/ui:pregig.startShow/i)
    fireEvent.click(startBtn)

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockUseGameState.startRoadieMinigame).toHaveBeenCalledTimes(1)
    expect(mockUseGameState.startKabelsalatMinigame).toHaveBeenCalledTimes(0)
  })

  test('band meeting costs 50 and adds 15 harmony', async () => {
    mockUseGameState.player.money = 500
    mockUseGameState.band.harmony = 50

    const { findByText } = render(React.createElement(PreGig))

    const meetingBtn = await findByText(/ui:pregig.bandMeeting.label/i)
    fireEvent.click(meetingBtn)

    expect(mockUseGameState.updatePlayer).toHaveBeenCalledWith({ money: 450 })
    expect(mockUseGameState.updateBand).toHaveBeenCalledWith({ harmony: 65 })
    expect(mockUseGameState.addToast).toHaveBeenCalledWith(
      'ui:pregig.toasts.meetingHeld',
      'success'
    )
  })

  test('band meeting fails when insufficient money', async () => {
    mockUseGameState.player.money = 30

    const { findByText } = render(React.createElement(PreGig))

    const meetingBtn = await findByText(/ui:pregig.bandMeeting.label/i)
    fireEvent.click(meetingBtn)

    expect(mockUseGameState.updatePlayer).not.toHaveBeenCalled()
    expect(mockUseGameState.updateBand).not.toHaveBeenCalled()
    expect(mockUseGameState.addToast).toHaveBeenCalledWith(
      'ui:pregig.toasts.noMoneySnacks',
      'error'
    )
  })

  test('band meeting caps harmony at 100', async () => {
    mockUseGameState.player.money = 500
    mockUseGameState.band.harmony = 92

    const { findByText } = render(React.createElement(PreGig))

    const meetingBtn = await findByText(/ui:pregig.bandMeeting.label/i)
    fireEvent.click(meetingBtn)

    expect(mockUseGameState.updateBand).toHaveBeenCalledWith({ harmony: 100 })
  })

  test('allows starting gig when harmony is low (handled by arrival check)', async () => {
    mockUseGameState.setlist = [{ id: 'song1' }]
    mockUseGameState.band.harmony = 5

    const { findByText } = render(React.createElement(PreGig))

    const startBtn = await findByText(/ui:pregig.startShow/i)
    fireEvent.click(startBtn)

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockUseGameState.addToast).not.toHaveBeenCalledWith(
      'ui:pregig.toasts.harmonyLow',
      'error'
    )
    // Should start one of the minigames
    expect(
      mockUseGameState.startRoadieMinigame.mock.calls.length +
        mockUseGameState.startKabelsalatMinigame.mock.calls.length
    ).toBe(1)
  })

  test('prevents toggling modifier when insufficient budget', async () => {
    mockUseGameState.player.money = 40
    mockUseGameState.gigModifiers = {}

    const { findByText } = render(React.createElement(PreGig))

    // Try to toggle soundcheck (costs 50)
    const soundcheckBtn = await findByText(/Soundcheck/i)
    fireEvent.click(soundcheckBtn)

    expect(mockUseGameState.addToast).toHaveBeenCalledWith(
      'ui:pregig.toasts.noMoneyUpgrade',
      'error'
    )
    expect(mockUseGameState.setGigModifiers).not.toHaveBeenCalled()
  })

  test('allows toggling modifier off regardless of budget', async () => {
    mockUseGameState.player.money = 10
    mockUseGameState.gigModifiers = { soundcheck: true }

    const { findByText } = render(React.createElement(PreGig))

    const soundcheckBtn = await findByText(/Soundcheck/i)
    fireEvent.click(soundcheckBtn)

    expect(mockUseGameState.setGigModifiers).toHaveBeenCalledWith({
      soundcheck: false
    })
  })
  test('aborts startup and shows toast when audio context fails', async () => {
    // Override the global mock just for this test
    const { audioManager } = await import('../../src/utils/AudioManager')
    audioManager.ensureAudioContext.mockResolvedValueOnce(false)

    mockUseGameState.setlist = [{ id: 'song1' }]
    const { findByText } = render(React.createElement(PreGig))
    const startBtn = await findByText(/ui:pregig.startShow/i)

    fireEvent.click(startBtn)
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockUseGameState.addToast).toHaveBeenCalledWith('ui:pregig.toasts.audioFail', 'error')
    expect(mockUseGameState.startRoadieMinigame).not.toHaveBeenCalled()
    expect(mockUseGameState.startKabelsalatMinigame).not.toHaveBeenCalled()
    expect(mockUseGameState.startAmpCalibration).not.toHaveBeenCalled()
  })


  test('handles sessionStorage errors gracefully', async () => {
    mockUseGameState.setlist = [{ id: 'song1' }]

    // Mock sessionStorage to throw
    const originalSetItem = sessionStorage.setItem
    sessionStorage.setItem = vi.fn(() => {
      throw new Error('Storage error')
    })

    try {
      const { findByText } = render(React.createElement(PreGig))
      const startBtn = await findByText(/ui:pregig.startShow/i)

      await expect(async () => {
        fireEvent.click(startBtn)
        await new Promise(resolve => setTimeout(resolve, 0))
      }).not.toThrow()
    } finally {
      sessionStorage.setItem = originalSetItem
    }
  })
})
