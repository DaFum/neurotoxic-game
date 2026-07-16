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
})
