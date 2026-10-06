import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMerchPress } from '../../src/hooks/useMerchPress'
import * as GameStateContext from '../../src/context/GameState'

vi.mock('../../src/context/GameState', () => {
  const useGameActions = vi.fn()
  return {
    useGameActions,
    useGameSelector: selector => selector(useGameActions())
  }
})

const mockState = (player, band = { harmony: 80 }) =>
  GameStateContext.useGameActions.mockReturnValue({
    merchPress: vi.fn(),
    player,
    band
  })

describe('useMerchPress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('scales the config with the fame level', () => {
    mockState({ fameLevel: 2, money: 1000 })
    const { result } = renderHook(() => useMerchPress())

    // multiplier = 1 + 2 * 0.5 = 2
    expect(result.current.config.cost).toBe(300)
    expect(result.current.config.fameGain).toBe(200)
    expect(result.current.canPress).toBe(true)
  })

  it.each([NaN, Infinity, undefined, '3'])(
    'ignores a non-finite fameLevel (%s) instead of poisoning the multiplier',
    fameLevel => {
      mockState({ fameLevel, money: 1000 })
      const { result } = renderHook(() => useMerchPress())

      expect(result.current.config.cost).toBe(150)
      expect(Number.isFinite(result.current.config.fameGain)).toBe(true)
      expect(result.current.canPress).toBe(true)
    }
  )

  it('cannot press with non-finite money or harmony', () => {
    mockState({ fameLevel: 0, money: NaN })
    expect(renderHook(() => useMerchPress()).result.current.canPress).toBe(
      false
    )

    mockState({ fameLevel: 0, money: 1000 }, { harmony: NaN })
    expect(renderHook(() => useMerchPress()).result.current.canPress).toBe(
      false
    )
  })
})
