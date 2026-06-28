import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { usePreGigHandlers } from '../../../src/hooks/preGig/usePreGigHandlers'

// Mock preGigUtils
vi.mock('../../../src/hooks/preGig/preGigUtils', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getLastMinigameFallback: vi.fn(() => null),
    setLastMinigameFallback: vi.fn(),
  }
})

// Mock audio engine
vi.mock('../../../src/utils/audio/audioEngine', () => ({
  audioService: {
    ensureAudioContext: vi.fn().mockResolvedValue(true)
  },
  getSongId: vi.fn(s => s.id)
}))

// Mock crypto
vi.mock('../../../src/utils/crypto', () => ({
  getSafeRandom: vi.fn(() => 0), // Default to 0 to always pick 'roadie'
  getSafeUUID: vi.fn(() => 'mock-uuid')
}))

describe('usePreGigHandlers', () => {
  let mockProps

  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()

    mockProps = {
      band: { harmony: 50, inventory: {}, merchPrices: {} },
      player: { money: 100 },
      currentGig: null,
      setlist: [],
      gigModifiers: {},
      assetModifiers: {
        merchCostMultiplier: 1,
        merchCapacityBonus: 0
      },
      adjustedBandMeetingCost: 10,
      selectedSongIds: new Set(),
      calculatedBudget: 0,
      typedT: vi.fn(k => k),
      updatePlayer: vi.fn(),
      updateBand: vi.fn(),
      setSetlist: vi.fn(),
      setGigModifiers: vi.fn(),
      addToast: vi.fn(),
      startRoadieMinigame: vi.fn(),
      startKabelsalatMinigame: vi.fn(),
      startAmpCalibration: vi.fn()
    }
  })

  it('ignores storage errors when fetching last minigame in handleStartShow', async () => {
    const originalGetItem = sessionStorage.getItem
    sessionStorage.getItem = vi.fn(() => {
      throw new Error('SecurityError: The operation is insecure.')
    })

    const { result } = renderHook(() => usePreGigHandlers(mockProps))

    await act(async () => {
      await result.current.handleStartShow()
    })

    // Expect not to throw and default logic to run
    expect(mockProps.startRoadieMinigame).toHaveBeenCalled()

    sessionStorage.getItem = originalGetItem
  })

  it('ignores storage errors when setting last minigame in handleStartShow', async () => {
    const originalSetItem = sessionStorage.setItem
    sessionStorage.setItem = vi.fn(() => {
      throw new Error('SecurityError: The operation is insecure.')
    })

    const { result } = renderHook(() => usePreGigHandlers(mockProps))

    await act(async () => {
      await result.current.handleStartShow()
    })

    // Expect not to throw and default logic to run
    expect(mockProps.startRoadieMinigame).toHaveBeenCalled()

    sessionStorage.setItem = originalSetItem
  })
})
