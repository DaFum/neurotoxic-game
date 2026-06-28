import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePreGigHandlers, UsePreGigHandlersProps } from '../../src/hooks/preGig/usePreGigHandlers'
import { audioService } from '../../src/utils/audio/audioEngine'

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

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('handles sessionStorage errors gracefully during handleStartShow', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Mock Storage Read Error')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
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
    } as unknown as UsePreGigHandlersProps

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

    // Spies are automatically restored in afterEach
  })
})
