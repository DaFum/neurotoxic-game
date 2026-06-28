import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePreGigHandlers } from '../../src/hooks/preGig/usePreGigHandlers'
import { audioService } from '../../src/utils/audio/audioEngine'
import { getSafeUUID } from '../../src/utils/crypto'

vi.mock('../../src/utils/audio/audioEngine', () => ({
  audioService: {
    ensureAudioContext: vi.fn().mockResolvedValue(true)
  },
  getSongId: vi.fn(),
  audioManager: {}
}))

vi.mock('../../src/utils/crypto', () => ({
  getSafeUUID: vi.fn().mockReturnValue('mock-uuid'),
  getSafeRandom: vi.fn().mockReturnValue(0.5)
}))

vi.mock('../../src/utils/errorHandler', () => ({
  handleError: vi.fn()
}))

describe('usePreGigHandlers', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(audioService.ensureAudioContext).mockResolvedValue(true)
  })

  it('handles sessionStorage errors gracefully during handleStartShow', async () => {
    const originalGetItem = Storage.prototype.getItem
    const originalSetItem = Storage.prototype.setItem

    Storage.prototype.getItem = vi.fn().mockImplementation(() => {
      throw new Error('Mock Storage Read Error')
    })
    Storage.prototype.setItem = vi.fn().mockImplementation(() => {
      throw new Error('Mock Storage Write Error')
    })

    const startRoadieMinigame = vi.fn()
    const startKabelsalatMinigame = vi.fn()
    const startAmpCalibration = vi.fn()
    const addToast = vi.fn()
    const typedT = vi.fn().mockImplementation((key) => key)

    const props = {
      band: {},
      player: { money: 100 },
      currentGig: { id: 'test-gig' },
      setlist: [],
      gigModifiers: {},
      assetModifiers: {},
      adjustedBandMeetingCost: 10,
      selectedSongIds: new Set(),
      calculatedBudget: 0,
      typedT,
      updatePlayer: vi.fn(),
      updateBand: vi.fn(),
      setSetlist: vi.fn(),
      setGigModifiers: vi.fn(),
      addToast,
      startRoadieMinigame,
      startKabelsalatMinigame,
      startAmpCalibration
    } as any

    const { result } = renderHook(() => usePreGigHandlers(props))

    await act(async () => {
      await result.current.handleStartShow()
    })

    // Assert that a minigame was started despite storage errors
    expect(
      startRoadieMinigame.mock.calls.length +
      startKabelsalatMinigame.mock.calls.length +
      startAmpCalibration.mock.calls.length
    ).toBeGreaterThan(0)

    Storage.prototype.getItem = originalGetItem
    Storage.prototype.setItem = originalSetItem
  })
})
