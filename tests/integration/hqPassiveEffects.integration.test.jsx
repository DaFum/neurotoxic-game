import { describe, test, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePurchaseLogic } from '../../src/ui/bandhq/hooks/usePurchaseLogic.js'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: key => key })
}))

describe('usePurchaseLogic Integration', () => {
  test('handles hq_room_label purchase completely', () => {
    const updatePlayer = vi.fn()
    const updateBand = vi.fn()
    const addToast = vi.fn()

    const player = {
      money: 5000,
      fame: 5000,
      van: { upgrades: [] },
      hqUpgrades: []
    }
    const band = { members: [], harmony: 50 }
    const inventory = {}
    const performance = {}
    const social = {}
    const quests = {}
    const updateSocial = vi.fn()

    const { result } = renderHook(() =>
      usePurchaseLogic({
        player,
        band,
        updatePlayer,
        updateBand,
        addToast,
        inventory,
        performance,
        social,
        updateSocial,
        quests
      })
    )

    const item = {
      id: 'hq_room_label',
      name: 'Label',
      cost: 5000,
      currency: 'fame',
      effects: [{ type: 'unlock_hq', id: 'hq_room_label' }]
    }

    let success
    act(() => {
      success = result.current.handleBuy(item)
    })

    expect(success).toBe(true)

    // applyUnlockHQ should have been applied correctly via handleBuy.
    // Initial cost applied: fame becomes 0.
    // applyUnlockHQ adds 500 money.
    expect(updatePlayer).toHaveBeenCalledWith(
      expect.objectContaining({
        money: 5500,
        fame: 0,
        hqUpgrades: ['hq_room_label']
      })
    )
  })
})
