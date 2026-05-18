import { describe, it, vi, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useDarkWebLeak,
  DARK_WEB_LEAK_CONFIG
} from '../../src/hooks/useDarkWebLeak'

vi.mock('../../src/utils/audio/audioEngine', () => ({
  audioService: { playSFX: vi.fn() }
}))

const mockGameState = {
  player: { day: 5, money: 1000 },
  band: { harmony: 50 },
  social: { controversyLevel: 60, lastDarkWebLeakDay: 0 },
  darkWebLeak: vi.fn()
}

vi.mock('../../src/context/GameState.tsx', () => ({
  useGameState: () => mockGameState,
  useGameActions: () => mockGameState,
  useGameSelector: selector => selector(mockGameState)
}))

describe('useDarkWebLeak', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGameState.player = { day: 5, money: 1000 }
    mockGameState.band = { harmony: 50 }
    mockGameState.social = { controversyLevel: 60, lastDarkWebLeakDay: 0 }
  })

  it('initializes with showDarkWebLeak=false and canLeak=true', () => {
    const { result } = renderHook(() => useDarkWebLeak())
    expect(result.current.showDarkWebLeak).toBe(false)
    expect(result.current.hasLeakedToday).toBe(false)
    expect(result.current.canLeak).toBe(true)
  })

  it('opens and closes the modal', () => {
    const { result } = renderHook(() => useDarkWebLeak())

    act(() => {
      result.current.openDarkWebLeak()
    })
    expect(result.current.showDarkWebLeak).toBe(true)

    act(() => {
      result.current.closeDarkWebLeak()
    })
    expect(result.current.showDarkWebLeak).toBe(false)
  })

  it('cannot leak if already leaked today', () => {
    mockGameState.social.lastDarkWebLeakDay = 5
    const { result } = renderHook(() => useDarkWebLeak())

    expect(result.current.hasLeakedToday).toBe(true)
    expect(result.current.canLeak).toBe(false)
  })

  it('cannot leak below the required controversy threshold', () => {
    mockGameState.social.controversyLevel =
      DARK_WEB_LEAK_CONFIG.REQUIRED_CONTROVERSY - 1
    const { result } = renderHook(() => useDarkWebLeak())

    expect(result.current.canLeak).toBe(false)
  })

  it('cannot leak without enough money for the cost', () => {
    mockGameState.player.money = DARK_WEB_LEAK_CONFIG.COST - 1
    const { result } = renderHook(() => useDarkWebLeak())

    expect(result.current.canLeak).toBe(false)
  })

  it('cannot leak without enough harmony', () => {
    mockGameState.band.harmony = DARK_WEB_LEAK_CONFIG.HARMONY_COST - 1
    const { result } = renderHook(() => useDarkWebLeak())

    expect(result.current.canLeak).toBe(false)
  })

  it('triggerLeak does nothing when canLeak is false', async () => {
    mockGameState.player.money = 0
    const { result } = renderHook(() => useDarkWebLeak())

    const { audioService } = await import('../../src/utils/audio/audioEngine')

    act(() => {
      result.current.triggerLeak()
    })

    expect(audioService.playSFX).not.toHaveBeenCalled()
    expect(mockGameState.darkWebLeak).not.toHaveBeenCalled()
  })

  it('triggerLeak dispatches with config and closes the modal on success', async () => {
    const { result } = renderHook(() => useDarkWebLeak())

    const { audioService } = await import('../../src/utils/audio/audioEngine')

    act(() => {
      result.current.openDarkWebLeak()
    })
    expect(result.current.showDarkWebLeak).toBe(true)

    act(() => {
      result.current.triggerLeak()
    })

    expect(audioService.playSFX).toHaveBeenCalledWith('cash')
    expect(mockGameState.darkWebLeak).toHaveBeenCalledWith({
      cost: DARK_WEB_LEAK_CONFIG.COST,
      fameGain: DARK_WEB_LEAK_CONFIG.FAME_GAIN,
      zealotryGain: DARK_WEB_LEAK_CONFIG.ZEALOTRY_GAIN,
      controversyGain: DARK_WEB_LEAK_CONFIG.CONTROVERSY_GAIN,
      harmonyCost: DARK_WEB_LEAK_CONFIG.HARMONY_COST,
      successToast: {
        messageKey: 'ui:dark_web_leak.success',
        type: 'success'
      }
    })
    expect(result.current.showDarkWebLeak).toBe(false)
  })
})
