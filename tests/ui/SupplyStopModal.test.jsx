import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { SupplyStopModal } from '../../src/ui/SupplyStopModal'
import * as GameState from '../../src/context/GameState'

// We need to simulate the transformPlayerPatch that gets called during handleBuy.
let mockedTransformPlayerPatch = null;

// Mocked purchase logic: handleBuy reports a successful purchase synchronously.
vi.mock('../../src/ui/bandhq/hooks/usePurchaseLogic', () => ({
  usePurchaseLogic: (params) => {
    mockedTransformPlayerPatch = params.transformPlayerPatch;
    return {
      handleBuy: () => {
        // execute transformPlayerPatch when handleBuy is called to simulate the logic
        if(mockedTransformPlayerPatch) mockedTransformPlayerPatch({ fame: 100 });
        return true;
      },
      getPurchaseDecision: () => ({
        cost: 100,
        canAfford: true,
        isOwned: false,
        isConsumable: false,
        canPurchase: true
      }),
      isItemDisabled: () => false
    };
  }
}))

let isLocked = false;
vi.mock('../../src/ui/bandhq/hooks/usePurchaseLock', () => ({
  usePurchaseLock: () => ({
    processingItemId: null,
    runWithLock: vi.fn(async (id, cb) => {
      if (isLocked) return;
      isLocked = true;
      await cb();
      isLocked = false;
    })
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
    t: (key, options) => {
      if (key === 'ui:shop.black_market_purchase') {
        return `Purchased from Black Market! Lost ${options.amount} Fame.`
      }
      return options?.defaultValue ?? key
    }
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}))

describe('SupplyStopModal purchase lock', () => {
  const mockAddToast = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    isLocked = false;
    mockedTransformPlayerPatch = null;
    const state = { player: { fame: 100 }, band: {}, social: {} }
    vi.spyOn(GameState, 'useGameSelector').mockImplementation(sel => sel(state))
    vi.spyOn(GameState, 'useGameActions').mockReturnValue({
      updatePlayer: vi.fn(),
      updateBand: vi.fn(),
      addToast: mockAddToast
    })
  })

  it('double-clicking the same item triggers exactly one purchase + one consequence toast', async () => {
    const inventory = [
      { id: 'item_a', name: 'Item A', cost: 100, currency: 'money' }
    ]

    render(<SupplyStopModal inventory={inventory} onClose={vi.fn()} />)
    const btn = screen.getByTestId('buy-item_a')

    // Simulate rapid double-click before the lock re-renders disabled state
    fireEvent.click(btn)
    fireEvent.click(btn)

    // Wait for the async lock resolution
    await waitFor(() => {
      // The black-market penalty (and its toast) is applied exactly once
      expect(mockAddToast).toHaveBeenCalledTimes(1)
      expect(mockAddToast).toHaveBeenCalledWith(
        'Purchased from Black Market! Lost 5 Fame.',
        'warning'
      )
    })
  })
})
