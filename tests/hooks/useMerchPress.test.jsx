import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMerchPress } from '../../src/hooks/useMerchPress'
import * as GameStateContext from '../../src/context/GameState'
import { secureRandom } from '../../src/utils/crypto'

vi.mock('../../src/utils/crypto', () => ({ secureRandom: vi.fn() }))

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

  describe('press outcome', () => {
    const press = roll => {
      const merchPress = vi.fn()
      GameStateContext.useGameActions.mockReturnValue({
        merchPress,
        player: { fameLevel: 2, money: 1000 },
        band: { harmony: 80 }
      })
      secureRandom.mockReturnValue(roll)
      const { result } = renderHook(() => useMerchPress())
      result.current.triggerPress()
      return {
        payload: merchPress.mock.calls[0][0],
        config: result.current.config
      }
    }

    it('grants no gains on a failed press but still charges cash and harmony', () => {
      const { payload, config } = press(0.1)

      expect(payload).toMatchObject({
        cost: config.cost,
        loyaltyGain: 0,
        controversyGain: 0,
        fameGain: 0,
        harmonyCost: config.harmonyCostOnFail
      })
      expect(payload.successToast).toEqual({
        messageKey: 'ui:merch_press.failure_toast',
        type: 'warning'
      })
    })

    it('grants the configured gains on a successful press', () => {
      const { payload, config } = press(0.9)

      expect(payload).toMatchObject({
        cost: config.cost,
        loyaltyGain: config.loyaltyGain,
        controversyGain: config.controversyGain,
        fameGain: config.fameGain,
        harmonyCost: 0
      })
      expect(payload.successToast.messageKey).toBe(
        'ui:merch_press.success_toast'
      )
    })
  })
})
