import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import fs from 'node:fs/promises'
import path from 'node:path'

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
vi.mock('../../src/utils/audio/AudioManager', () => ({
  audioManager: {
    ensureAudioContext: vi.fn(() => Promise.resolve(true)),
    play: vi.fn()
  }
}))
// Mock MerchStrategyBlock to avoid HQ_ITEMS/economyEngine dependency in these tests
const mockOnUpdatePrice = vi.fn()
const mockOnRestock = vi.fn()
vi.mock('../../src/components/pregig/MerchStrategyBlock', () => ({
  MerchStrategyBlock: ({ onUpdatePrice, onRestock, ...props }) => {
    // store refs so tests can call them
    mockOnUpdatePrice.mockImplementation(onUpdatePrice)
    mockOnRestock.mockImplementation(onRestock)
    return (
      <div {...props}>
        <h3>ui:pregig.merchStrategy.title</h3>
        <button
          type='button'
          aria-label='ui:pregig.merchStrategy.decreasePrice shirts'
          onClick={() => onUpdatePrice('shirts', 19)}
        >
          -
        </button>
        <button
          type='button'
          aria-label='ui:pregig.merchStrategy.increasePrice shirts'
          onClick={() => onUpdatePrice('shirts', 21)}
        >
          +
        </button>
        <button type='button' onClick={() => onRestock('shirts')}>
          ui:pregig.merchStrategy.restock
        </button>
      </div>
    )
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
  },
  DEFAULT_MERCH_PRICES: {
    shirts: 20,
    hoodies: 45,
    patches: 5,
    vinyl: 35,
    cds: 15
  }
}))
vi.mock('../../src/utils/audio/songUtils', () => ({
  getSongId: vi.fn(s => s.id)
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
  band: { harmony: 50, inventory: { shirts: 10 }, merchPrices: {} },
  updateBand: vi.fn(),
  addToast: vi.fn(),
  assets: [],
  startRoadieMinigame: vi.fn(),
  startKabelsalatMinigame: vi.fn(),
  startAmpCalibration: vi.fn()
}

vi.mock('../../src/context/GameState', () => ({
  useGameState: () => mockUseGameState,
  useGameActions: () => mockUseGameState,
  useGameSelector: selector => selector(mockUseGameState)
}))
// Import PreGig after mocks
const { PreGig } = await import('../../src/scenes/PreGig.tsx')
const { __testInternals } = await import('../../src/hooks/usePreGigLogic')
const { getSafeRandom } = await import('../../src/utils/crypto')

const makeAssetWithModule = ({
  kind = 'tourbus_chassis',
  slotType = 'tb_roof',
  moduleId
}) => ({
  id: `asset_${moduleId}`,
  kind,
  chassisFlavor: 'legit',
  chassisTier: 3,
  condition: 100,
  baseUpkeep: 0,
  baseDailyRevenue: 0,
  baseRiskEventChance: 0,
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  slots: [
    {
      id: `slot_${moduleId}`,
      slotType,
      position: { x: 0, y: 0 },
      installedModuleId: moduleId
    }
  ]
})

describe('PreGig', () => {
  test('exposes minigame fallback reset only through test internals', () => {
    expect(__testInternals?.resetLastMinigameFallback).toBeTypeOf('function')
  })

  test('guards test internals runtime detection for browsers without process', async () => {
    const source = await fs.readFile(
      path.join(process.cwd(), 'src', 'hooks', 'usePreGigLogic.ts'),
      'utf8'
    )

    expect(source).toContain("typeof process !== 'undefined'")
    expect(source).toContain("process.env?.NODE_ENV === 'test'")
  })

  beforeEach(() => {
    //  removed (handled by vitest env)
    // Reset mocks
    Object.values(mockUseGameState).forEach(fn => {
      if (typeof fn === 'function' && fn.mockReset) fn.mockReset()
    })
    // Restore default state
    mockUseGameState.player = { money: 1000 }
    mockUseGameState.gigModifiers = {}
    mockUseGameState.assets = []

    // Clean up sessionStorage state to ensure isolated tests
    try {
      sessionStorage.removeItem('neurotoxic_last_minigame')
    } catch (_e) {
      // Ignored
    }

    // Reset fallback memory
    if (typeof __testInternals?.resetLastMinigameFallback === 'function') {
      __testInternals.resetLastMinigameFallback()
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

  test('band meeting cost uses asset training cost multiplier', async () => {
    mockUseGameState.player.money = 500
    mockUseGameState.band.harmony = 50
    mockUseGameState.assets = [
      makeAssetWithModule({
        kind: 'bandhaus_chassis',
        slotType: 'bh_stage',
        moduleId: 'bh_pro_pa_system'
      })
    ]

    const { findByText } = render(React.createElement(PreGig))

    const meetingBtn = await findByText(/ui:pregig.bandMeeting.label/i)
    fireEvent.click(meetingBtn)

    expect(mockUseGameState.updatePlayer).toHaveBeenCalledWith({ money: 457 })
    expect(mockUseGameState.updateBand).toHaveBeenCalledWith({ harmony: 65 })
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
    const { audioManager } = await import('../../src/utils/audio/AudioManager')
    const originalEnsure = audioManager.ensureAudioContext
    audioManager.ensureAudioContext = vi.fn().mockResolvedValueOnce(false)
    mockUseGameState.addToast.mockClear()

    try {
      mockUseGameState.setlist = [{ id: 'song1' }]
      const { findByText } = render(React.createElement(PreGig))
      const startBtn = await findByText(/ui:pregig.startShow/i)

      fireEvent.click(startBtn)
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockUseGameState.addToast).toHaveBeenCalledWith(
        'ui:pregig.toasts.audioFail',
        'error'
      )
      expect(mockUseGameState.startRoadieMinigame).not.toHaveBeenCalled()
      expect(mockUseGameState.startKabelsalatMinigame).not.toHaveBeenCalled()
      expect(mockUseGameState.startAmpCalibration).not.toHaveBeenCalled()
    } finally {
      audioManager.ensureAudioContext = originalEnsure
    }
  })

  test('aborts startup and shows toast when audio context rejects', async () => {
    const { audioManager } = await import('../../src/utils/audio/AudioManager')
    const originalEnsure = audioManager.ensureAudioContext
    audioManager.ensureAudioContext = vi
      .fn()
      .mockRejectedValueOnce(new Error('Audio failed'))
    mockUseGameState.addToast.mockClear()

    try {
      mockUseGameState.setlist = [{ id: 'song1' }]
      const { findByText } = render(React.createElement(PreGig))
      const startBtn = await findByText(/ui:pregig.startShow/i)

      fireEvent.click(startBtn)
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert the toast was shown by mockUseGameState via handleError
      expect(mockUseGameState.addToast).toHaveBeenCalledWith(
        expect.any(String),
        'warning'
      )
      expect(mockUseGameState.startRoadieMinigame).not.toHaveBeenCalled()
      expect(mockUseGameState.startKabelsalatMinigame).not.toHaveBeenCalled()
      expect(mockUseGameState.startAmpCalibration).not.toHaveBeenCalled()
    } finally {
      audioManager.ensureAudioContext = originalEnsure
    }
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

  test('switches to Merch tab and renders merch strategy controls', async () => {
    const { findByText } = render(React.createElement(PreGig))

    const merchTabBtn = await findByText(/ui:pregig.tabs.merch/i)
    fireEvent.click(merchTabBtn)

    // MerchStrategyBlock title should appear
    const title = await findByText(/ui:pregig.merchStrategy.title/i)
    expect(title).toBeTruthy()
  })

  test('merch tab price decrease button invokes updateBand with lower price', async () => {
    mockUseGameState.band = {
      harmony: 50,
      inventory: { shirts: 5 },
      merchPrices: { shirts: 20 }
    }

    const { findByText, findAllByLabelText } = render(
      React.createElement(PreGig)
    )

    const merchTabBtn = await findByText(/ui:pregig.tabs.merch/i)
    fireEvent.click(merchTabBtn)

    // Wait for merch controls to render
    await findByText(/ui:pregig.merchStrategy.title/i)

    const decreaseBtns = await findAllByLabelText(
      /ui:pregig.merchStrategy.decreasePrice/i
    )
    expect(decreaseBtns.length).toBeGreaterThan(0)

    fireEvent.click(decreaseBtns[0])

    expect(mockUseGameState.updateBand).toHaveBeenCalled()
    // Apply the captured updater to a sample band state and verify the result
    const updater = mockUseGameState.updateBand.mock.calls[0][0]
    const nextBand =
      typeof updater === 'function'
        ? updater({
            harmony: 50,
            inventory: { shirts: 5 },
            merchPrices: { shirts: 20 }
          })
        : updater
    expect(nextBand.merchPrices.shirts).toBe(19)
  })

  test('merch tab restock button invokes updatePlayer for cost deduction', async () => {
    mockUseGameState.band = {
      harmony: 50,
      inventory: { shirts: 0 },
      merchPrices: {}
    }
    mockUseGameState.player = { money: 500 }

    const { findByText, findAllByText } = render(React.createElement(PreGig))

    const merchTabBtn = await findByText(/ui:pregig.tabs.merch/i)
    fireEvent.click(merchTabBtn)

    await findByText(/ui:pregig.merchStrategy.title/i)

    const restockBtns = await findAllByText(/ui:pregig.merchStrategy.restock/i)
    expect(restockBtns.length).toBeGreaterThan(0)

    fireEvent.click(restockBtns[0])

    // Restock must do both: deduct money AND add inventory
    expect(mockUseGameState.updatePlayer).toHaveBeenCalled()
    expect(mockUseGameState.updateBand).toHaveBeenCalled()
  })

  test('merch restock cost uses asset merch cost multiplier', async () => {
    mockUseGameState.band = {
      harmony: 50,
      inventory: { shirts: 0 },
      merchPrices: {}
    }
    mockUseGameState.player = { money: 500 }
    mockUseGameState.assets = [
      makeAssetWithModule({
        kind: 'merch_workshop_chassis',
        slotType: 'mw_print',
        moduleId: 'mw_4color_carousel'
      })
    ]

    const { findByText, findAllByText } = render(React.createElement(PreGig))

    const merchTabBtn = await findByText(/ui:pregig.tabs.merch/i)
    fireEvent.click(merchTabBtn)
    await findByText(/ui:pregig.merchStrategy.title/i)

    const restockBtns = await findAllByText(/ui:pregig.merchStrategy.restock/i)
    fireEvent.click(restockBtns[0])

    expect(mockUseGameState.updatePlayer).toHaveBeenCalledWith({ money: 387 })
  })

  test('merch capacity blocks restock until an asset raises the ceiling', async () => {
    mockUseGameState.band = {
      harmony: 50,
      inventory: { shirts: 100 },
      merchPrices: {}
    }
    mockUseGameState.player = { money: 500 }

    const { findByText, findAllByText, rerender } = render(
      React.createElement(PreGig)
    )

    const merchTabBtn = await findByText(/ui:pregig.tabs.merch/i)
    fireEvent.click(merchTabBtn)
    await findByText(/ui:pregig.merchStrategy.title/i)
    let restockBtns = await findAllByText(/ui:pregig.merchStrategy.restock/i)
    fireEvent.click(restockBtns[0])

    expect(mockUseGameState.updatePlayer).not.toHaveBeenCalled()
    expect(mockUseGameState.addToast).toHaveBeenCalledWith(
      'ui:pregig.toasts.merchCapacityFull',
      'error'
    )

    mockUseGameState.updatePlayer.mockClear()
    mockUseGameState.addToast.mockClear()
    mockUseGameState.assets = [
      makeAssetWithModule({
        slotType: 'tb_roof',
        moduleId: 'tb_roof_rack'
      })
    ]

    rerender(React.createElement(PreGig))
    restockBtns = await findAllByText(/ui:pregig.merchStrategy.restock/i)
    fireEvent.click(restockBtns[0])

    expect(mockUseGameState.updatePlayer).toHaveBeenCalledWith({ money: 350 })
  })
})
