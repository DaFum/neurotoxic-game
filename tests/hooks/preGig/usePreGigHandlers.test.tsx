import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { usePreGigHandlers } from '../../../src/hooks/preGig/usePreGigHandlers'

// Mock preGigUtils
vi.mock('../../../src/hooks/preGig/preGigUtils', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    getLastMinigameFallback: vi.fn(() => null),
    setLastMinigameFallback: vi.fn()
  }
})

// Mock audio engine
vi.mock('../../../src/utils/audio/audioEngine', () => ({
  audioService: {
    ensureAudioContext: vi.fn().mockResolvedValue(true)
  },
  audioManager: {},
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
      currentGig: null,
      setlist: [],
      setlistMax: 3,
      gigModifiers: {},
      assetModifiers: {
        merchCostMultiplier: 1,
        merchCapacityBonus: 0
      },
      adjustedBandMeetingCost: 10,
      spendableMoney: 100,
      selectedSongIds: new Set(),
      calculatedBudget: 0,
      typedT: vi.fn(k => k),
      holdBandMeeting: vi.fn(),
      restockMerch: vi.fn(),
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

  describe('setlist toggling', () => {
    const song = { id: 'song1', name: 'Anarchy Anthem' }

    it('adds a song while the setlist is editable', () => {
      const { result } = renderHook(() => usePreGigHandlers(mockProps))

      act(() => result.current.toggleSong(song as never))

      expect(mockProps.setSetlist).toHaveBeenCalledWith([{ id: 'song1' }])
    })

    it('ignores toggles once the run has committed its setlist', () => {
      mockProps.isSetlistFrozen = true
      const { result } = renderHook(() => usePreGigHandlers(mockProps))

      act(() => result.current.toggleSong(song as never))

      expect(mockProps.setSetlist).not.toHaveBeenCalled()
    })
  })

  describe('modifier affordability', () => {
    it('canAffordModifier compares the projected budget with the spendable cash', () => {
      const { result: cheap } = renderHook(() =>
        usePreGigHandlers({
          ...mockProps,
          spendableMoney: 1_000_000,
          calculatedBudget: 0
        })
      )
      expect(cheap.current.canAffordModifier('catering')).toBe(true)

      const { result: broke } = renderHook(() =>
        usePreGigHandlers({
          ...mockProps,
          spendableMoney: 0,
          calculatedBudget: 0
        })
      )
      expect(broke.current.canAffordModifier('catering')).toBe(false)
    })

    it('protected run cash cannot unlock a modifier', () => {
      // A wealthy Career whose cash is all protected during the run.
      const { result } = renderHook(() =>
        usePreGigHandlers({
          ...mockProps,
          player: { money: 1_000_000 },
          spendableMoney: 0,
          isExpeditionActive: true
        })
      )
      expect(result.current.canAffordModifier('catering')).toBe(false)
      act(() => result.current.toggleModifier('catering'))
      expect(mockProps.setGigModifiers).not.toHaveBeenCalled()
    })

    it('toggleModifier refuses an unaffordable activation but still switches an active one off', () => {
      const { result: broke } = renderHook(() =>
        usePreGigHandlers({ ...mockProps, spendableMoney: 0 })
      )
      act(() => broke.current.toggleModifier('catering'))
      expect(mockProps.setGigModifiers).not.toHaveBeenCalled()
      expect(mockProps.addToast).toHaveBeenCalledWith(
        'ui:pregig.toasts.noMoneyUpgrade',
        'error'
      )

      const { result: active } = renderHook(() =>
        usePreGigHandlers({
          ...mockProps,
          spendableMoney: 0,
          gigModifiers: { catering: true }
        })
      )
      act(() => active.current.toggleModifier('catering'))
      expect(mockProps.setGigModifiers).toHaveBeenCalledWith({
        catering: false
      })
    })
  })

  it('does not charge or mutate Career stock during an active Expedition', () => {
    const { result } = renderHook(() =>
      usePreGigHandlers({
        ...mockProps,
        spendableMoney: 1_000_000,
        isExpeditionActive: true
      })
    )

    act(() => result.current.handleRestockMerch('shirts'))

    expect(mockProps.restockMerch).not.toHaveBeenCalled()
    expect(mockProps.updateBand).not.toHaveBeenCalled()
  })

  it('restock dispatches one atomic payment-and-stock action', () => {
    const { result } = renderHook(() =>
      usePreGigHandlers({ ...mockProps, spendableMoney: 1_000_000 })
    )

    act(() => result.current.handleRestockMerch('shirts'))

    expect(mockProps.restockMerch).toHaveBeenCalledTimes(1)
    expect(mockProps.restockMerch).toHaveBeenCalledWith('shirts')
    expect(mockProps.updateBand).not.toHaveBeenCalled()
    expect(mockProps.addToast).toHaveBeenCalledWith(
      'ui:pregig.toasts.restocked',
      'success'
    )
  })

  it('restock refuses with a toast when spendable cash is short', () => {
    // A shirt bundle costs 150; 149 spendable cannot pay.
    const { result } = renderHook(() =>
      usePreGigHandlers({ ...mockProps, spendableMoney: 149 })
    )

    act(() => result.current.handleRestockMerch('shirts'))

    expect(mockProps.restockMerch).not.toHaveBeenCalled()
    expect(mockProps.addToast).toHaveBeenCalledWith(
      'ui:pregig.toasts.noMoneyUpgrade',
      'error'
    )
  })
})
