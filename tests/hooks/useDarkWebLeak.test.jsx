import { describe, it, vi, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDarkWebLeak } from '../../src/hooks/useDarkWebLeak'
import { logger } from '../../src/utils/logger'
import { BALANCE_CONFIG } from '../../src/config/balance'

vi.mock('../../src/utils/audio/audioEngine', () => {
  const playSFX = vi.fn()
  return {
    audioManager: { playSFX },
    audioService: { playSFX }
  }
})

const mockGameState = {
  player: { day: 5, money: 1000 },
  band: { harmony: 50 },
  social: { controversyLevel: 60, lastDarkWebLeakDay: 0 },
  darkWebLeak: vi.fn()
}

vi.mock('../../src/context/GameState.tsx', () => ({
  useGameActions: () => mockGameState,
  useGameSelector: selector => selector(mockGameState)
}))

// The tuning constants are module-private; production reads them through the
// hook's return value, so the tests do the same.
const readLeakConfig = () => {
  const { result, unmount } = renderHook(() => useDarkWebLeak())
  const config = result.current.DARK_WEB_LEAK_CONFIG
  unmount()
  return config
}

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

  it('gates on the shared high-controversy threshold from BALANCE_CONFIG', () => {
    expect(readLeakConfig().REQUIRED_CONTROVERSY).toBe(
      BALANCE_CONFIG.social.highControversyThreshold
    )
  })

  it('cannot leak below the required controversy threshold', () => {
    mockGameState.social.controversyLevel =
      readLeakConfig().REQUIRED_CONTROVERSY - 1
    const { result } = renderHook(() => useDarkWebLeak())

    expect(result.current.canLeak).toBe(false)
  })

  it('handles errors when validating dark web leak', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
    const originalMoney = mockGameState.player.money

    Object.defineProperty(mockGameState.player, 'money', {
      get() {
        throw new Error('Test Error')
      },
      configurable: true
    })

    try {
      const { result } = renderHook(() => useDarkWebLeak())

      expect(result.current.canLeak).toBe(false)
      expect(errorSpy).toHaveBeenCalledWith(
        'DarkWebLeak',
        'validateDarkWebLeak failed while deriving canLeak',
        expect.objectContaining({ error: expect.any(Error) })
      )
    } finally {
      Object.defineProperty(mockGameState.player, 'money', {
        value: originalMoney,
        writable: true,
        configurable: true,
        enumerable: true
      })
      errorSpy.mockRestore()
    }
  })

  it('cannot leak without enough money for the cost', () => {
    mockGameState.player.money = readLeakConfig().COST - 1
    const { result } = renderHook(() => useDarkWebLeak())

    expect(result.current.canLeak).toBe(false)
  })

  it('cannot leak without enough harmony', () => {
    mockGameState.band.harmony = readLeakConfig().HARMONY_COST - 1
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

  it('triggerLeak dispatches only the toast (the reducer prices it) and closes the modal on success', async () => {
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
      successToast: {
        messageKey: 'ui:dark_web_leak.success',
        type: 'success'
      }
    })
    expect(result.current.showDarkWebLeak).toBe(false)
  })
})
