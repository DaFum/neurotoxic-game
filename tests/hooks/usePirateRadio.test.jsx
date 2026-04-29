import { describe, it, vi, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  usePirateRadio,
  PIRATE_RADIO_CONFIG
} from '../../src/hooks/usePirateRadio'

vi.mock('../../src/utils/audio/AudioManager', () => ({
  audioManager: { playSFX: vi.fn() }
}))

// Mock useGameState
const mockGameState = {
  player: { day: 5, money: 500, van: { upgrades: [] } },
  band: { harmony: 50 },
  social: { lastPirateBroadcastDay: 0 },
  pirateBroadcast: vi.fn(),
  hasUpgrade: vi.fn()
}

vi.mock('../../src/context/GameState.tsx', () => ({
  useGameState: () => mockGameState
}))

describe('usePirateRadio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset default mock state before each test
    mockGameState.player = { day: 5, money: 500, van: { upgrades: [] } }
    mockGameState.band = { harmony: 50 }
    mockGameState.social = { lastPirateBroadcastDay: 0 }
  })

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => usePirateRadio())
    expect(result.current.showPirateRadio).toBe(false)
    expect(result.current.hasBroadcastedToday).toBe(false)
    expect(result.current.canBroadcast).toBe(true)
  })

  it('can open and close pirate radio', () => {
    const { result } = renderHook(() => usePirateRadio())

    act(() => {
      result.current.openPirateRadio()
    })
    expect(result.current.showPirateRadio).toBe(true)

    act(() => {
      result.current.closePirateRadio()
    })
    expect(result.current.showPirateRadio).toBe(false)
  })

  it('cannot broadcast if already broadcasted today', () => {
    mockGameState.social.lastPirateBroadcastDay = 5
    const { result } = renderHook(() => usePirateRadio())

    expect(result.current.hasBroadcastedToday).toBe(true)
    expect(result.current.canBroadcast).toBe(false)
  })

  it('cannot broadcast if not enough money', () => {
    mockGameState.player.money = 199
    const { result } = renderHook(() => usePirateRadio())

    expect(result.current.canBroadcast).toBe(false)
  })

  it('cannot broadcast if not enough harmony', () => {
    mockGameState.band.harmony = 9
    const { result } = renderHook(() => usePirateRadio())

    expect(result.current.canBroadcast).toBe(false)
  })

  it('disables broadcast instead of throwing when state invariants are corrupt', () => {
    mockGameState.player.money = Number.POSITIVE_INFINITY

    const { result } = renderHook(() => usePirateRadio())

    expect(result.current.canBroadcast).toBe(false)
  })

  it('triggerBroadcast does nothing if canBroadcast is false', async () => {
    mockGameState.player.money = 0
    const { result } = renderHook(() => usePirateRadio())

    const { audioManager } = await import('../../src/utils/audio/AudioManager')

    act(() => {
      result.current.triggerBroadcast()
    })

    expect(audioManager.playSFX).not.toHaveBeenCalled()
    expect(mockGameState.pirateBroadcast).not.toHaveBeenCalled()
  })

  it('triggerBroadcast succeeds when conditions are met', async () => {
    const { result } = renderHook(() => usePirateRadio())

    const { audioManager } = await import('../../src/utils/audio/AudioManager')

    // Open radio first to test if it closes
    act(() => {
      result.current.openPirateRadio()
    })
    expect(result.current.showPirateRadio).toBe(true)

    act(() => {
      result.current.triggerBroadcast()
    })

    expect(audioManager.playSFX).toHaveBeenCalledWith('cash')
    expect(mockGameState.pirateBroadcast).toHaveBeenCalledWith({
      cost: PIRATE_RADIO_CONFIG.COST,
      fameGain: PIRATE_RADIO_CONFIG.FAME_GAIN,
      zealotryGain: PIRATE_RADIO_CONFIG.ZEALOTRY_GAIN,
      controversyGain: PIRATE_RADIO_CONFIG.CONTROVERSY_GAIN,
      harmonyCost: PIRATE_RADIO_CONFIG.HARMONY_COST,
      successToast: {
        message: 'ui:pirate_radio.success',
        type: 'success'
      }
    })
    expect(result.current.showPirateRadio).toBe(false)
  })
})
