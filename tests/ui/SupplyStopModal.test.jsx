import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SupplyStopModal } from '../../src/ui/SupplyStopModal'
import * as GameState from '../../src/context/GameState'

// Mocked purchase logic: handleBuy reports a successful purchase synchronously.
const mockHandleBuy = vi.fn(() => true)
vi.mock('../../src/ui/bandhq/hooks/usePurchaseLogic', () => ({
  usePurchaseLogic: () => ({
    handleBuy: mockHandleBuy,
    getAdjustedCost: () => 100,
    isItemOwned: () => false,
    isItemDisabled: () => false
  })
}))

// Structural ShopItem mock: forwards processingItemId to disable the button,
// matching real phase behavior, and fires onBuy on click.
vi.mock('../../src/ui/bandhq/ShopItem', () => ({
  ShopItem: ({ item, onBuy, processingItemId }) => (
    <button
      type='button'
      data-testid={`buy-${item.id}`}
      disabled={
        processingItemId != null && String(processingItemId) === String(item.id)
      }
      onClick={() => onBuy(item)}
    >
      buy {item.id}
    </button>
  )
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue ?? key
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}))

describe('SupplyStopModal purchase lock', () => {
  const mockAddToast = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    const state = { player: { fame: 100 }, band: {}, social: {} }
    vi.spyOn(GameState, 'useGameSelector').mockImplementation(sel => sel(state))
    vi.spyOn(GameState, 'useGameActions').mockReturnValue({
      updatePlayer: vi.fn(),
      updateBand: vi.fn(),
      addToast: mockAddToast
    })
  })

  it('double-clicking the same item triggers exactly one purchase + one consequence toast', async () => {
    const inventory = [{ id: 'c_item', name: 'Item', cost: 100 }]
    render(<SupplyStopModal inventory={inventory} onClose={() => {}} />)

    const btn = screen.getByTestId('buy-c_item')
    await act(async () => {
      fireEvent.click(btn)
      // Second synchronous click before the lock state re-renders.
      fireEvent.click(btn)
    })

    expect(mockHandleBuy).toHaveBeenCalledTimes(1)
    const warningToasts = mockAddToast.mock.calls.filter(
      c => c[1] === 'warning'
    )
    expect(warningToasts).toHaveLength(1)
  })
})
