import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useRef } from 'react'
import { useVanMaintenance } from '../../src/hooks/travel/useVanMaintenance'

vi.mock('../../src/i18n', () => ({
  default: {
    language: 'en',
    changeLanguage: vi.fn(),
    options: {},
    t: (_key: string, options?: { defaultValue?: string; cost?: string }) =>
      options?.defaultValue?.replace('{{cost}}', options.cost ?? '') ?? ''
  }
}))

vi.mock('../../src/utils/numberUtils', async importOriginal => ({
  ...(await importOriginal<typeof import('../../src/utils/numberUtils')>()),
  formatCurrency: (value: number) => `€${value}`
}))

const createParams = (dailyObligations: number) => ({
  isTravelingRef: { current: false },
  player: {
    money: 100,
    van: { fuel: 100, condition: 100, upgrades: [] }
  },
  band: { members: [] },
  updatePlayer: vi.fn(),
  updateBand: vi.fn(),
  advanceDay: vi.fn(),
  dailyObligations,
  addToast: vi.fn()
})

describe('useVanMaintenance', () => {
  it('formats non-finite rest confirmation daily obligations as zero', () => {
    const params = createParams(Number.NaN)
    const { result } = renderHook(() => {
      const isTravelingRef = useRef(false)
      return useVanMaintenance({ ...params, isTravelingRef })
    })

    act(() => {
      result.current.handleRestInVan()
    })

    expect(params.addToast).toHaveBeenCalledWith(
      expect.not.stringContaining('NaN'),
      'warning'
    )
    expect(params.addToast).toHaveBeenCalledWith(
      expect.stringContaining('€0'),
      'warning'
    )
  })

  it('keeps refuel/repair referentially stable across unrelated player changes', () => {
    const params = createParams(0)
    const { result, rerender } = renderHook(
      ({ player }) => {
        const isTravelingRef = useRef(false)
        return useVanMaintenance({ ...params, player, isTravelingRef })
      },
      { initialProps: { player: params.player } }
    )
    const { handleRefuel, handleRepair } = result.current

    // Same van and money, but a new player object with unrelated fields changed.
    rerender({ player: { ...params.player, fame: 99, day: 7 } as never })
    expect(result.current.handleRefuel).toBe(handleRefuel)
    expect(result.current.handleRepair).toBe(handleRepair)

    // A changed van invalidates them, since the handlers read it.
    rerender({
      player: {
        ...params.player,
        van: { ...params.player.van, fuel: 10 }
      }
    })
    expect(result.current.handleRefuel).not.toBe(handleRefuel)
    expect(result.current.handleRepair).not.toBe(handleRepair)
  })

  describe('rest inside an expedition (#3365)', () => {
    const restTwice = (
      overrides: Record<string, unknown>,
      currentNodeId: string | null = 'exp_2_0'
    ) => {
      const params = {
        ...createParams(0),
        recordExpeditionObligationSignal: vi.fn(),
        ...overrides
      }
      params.player = { ...params.player, currentNodeId } as never
      const { result } = renderHook(() => {
        const isTravelingRef = useRef(false)
        return useVanMaintenance({ ...params, isTravelingRef })
      })
      act(() => {
        result.current.handleRestInVan()
      })
      act(() => {
        result.current.handleRestInVan()
      })
      return params
    }

    it('banks the rest signal against the current node before the day passes', () => {
      const params = restTwice({ expeditionStatus: 'active' })
      expect(params.recordExpeditionObligationSignal).toHaveBeenCalledTimes(1)
      expect(params.recordExpeditionObligationSignal).toHaveBeenCalledWith(
        'rest',
        'exp_2_0'
      )
      expect(params.advanceDay).toHaveBeenCalledTimes(1)
    })

    it('records nothing outside an active run', () => {
      const params = restTwice({ expeditionStatus: 'idle' })
      expect(params.recordExpeditionObligationSignal).not.toHaveBeenCalled()
      expect(params.advanceDay).toHaveBeenCalledTimes(1)
    })
  })

  describe('protected expedition cash', () => {
    const lowVan = { fuel: 0, condition: 10, upgrades: [] }
    const render = (protectedCash: number) => {
      const params = createParams(0)
      const player = { ...params.player, money: 1000, van: lowVan }
      const hook = renderHook(() => {
        const isTravelingRef = useRef(false)
        return useVanMaintenance({
          ...params,
          player,
          protectedCash,
          isTravelingRef
        })
      })
      return { params, result: hook.result }
    }

    it('refuses refuel and repair that would dip into protected cash', () => {
      const { params, result } = render(999)
      act(() => {
        result.current.handleRefuel()
        result.current.handleRepair()
      })
      expect(params.updatePlayer).not.toHaveBeenCalled()
      expect(params.addToast).toHaveBeenCalledTimes(2)
      expect(params.addToast).not.toHaveBeenCalledWith(
        expect.anything(),
        'success'
      )
    })

    it('still pays from the spendable slice', () => {
      const { params, result } = render(500)
      act(() => {
        result.current.handleRefuel()
      })
      expect(params.updatePlayer).toHaveBeenCalledTimes(1)
      const [update] = params.updatePlayer.mock.calls[0]
      expect(update.money).toBeGreaterThanOrEqual(500)
      expect(params.addToast).toHaveBeenCalledWith(
        expect.any(String),
        'success'
      )
    })
  })
})
