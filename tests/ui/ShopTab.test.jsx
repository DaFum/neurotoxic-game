import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ShopTab } from '../../src/ui/bandhq/ShopTab.tsx'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue || key
  })
}))

vi.mock('../../src/data/hqItems', () => ({
  HQ_ITEMS: {
    gear: [{ id: 'gear1', name: 'Gear 1', cost: 100, currency: 'money' }],
    instruments: [
      { id: 'inst1', name: 'Instrument 1', cost: 500, currency: 'money' }
    ]
  }
}))

vi.mock('../../src/ui/bandhq/ShopItem', () => ({
  ShopItem: ({
    item,
    isOwned,
    isDisabled,
    adjustedCost,
    onBuy,
    processingItemId
  }) => (
    <div data-testid={`shop-item-${item.id}`}>
      <span>{item.name}</span>
      <span data-testid={`is-owned-${item.id}`}>{isOwned ? 'Yes' : 'No'}</span>
      <span data-testid={`is-disabled-${item.id}`}>
        {isDisabled ? 'Yes' : 'No'}
      </span>
      {adjustedCost !== undefined && adjustedCost !== null && (
        <span data-testid={`adjusted-cost-${item.id}`}>{adjustedCost}</span>
      )}
      <button type='button' onClick={() => onBuy(item)}>
        Buy
      </button>
      {processingItemId === item.id && (
        <span data-testid='processing'>Processing</span>
      )}
    </div>
  )
}))

describe('ShopTab', () => {
  const player = { money: 1000 }
  let handleBuy
  let isItemOwned
  let isItemDisabled

  beforeEach(() => {
    vi.clearAllMocks()
    handleBuy = vi.fn()
    isItemOwned = vi.fn(item => item.id === 'gear1')
    isItemDisabled = vi.fn(item => item.id === 'inst1')
  })

  test('renders player funds display correctly', () => {
    render(
      <ShopTab
        player={player}
        handleBuy={handleBuy}
        isItemOwned={isItemOwned}
        isItemDisabled={isItemDisabled}
      />
    )
    expect(screen.getByText(/1000€/)).toBeInTheDocument()
    expect(screen.getByText(/ui:bandhq\.funds/)).toBeInTheDocument()
  })

  test('renders combined shop items from gear and instruments', () => {
    render(
      <ShopTab
        player={player}
        handleBuy={handleBuy}
        isItemOwned={isItemOwned}
        isItemDisabled={isItemDisabled}
      />
    )
    expect(screen.getByTestId('shop-item-gear1')).toBeInTheDocument()
    expect(screen.getByTestId('shop-item-inst1')).toBeInTheDocument()
  })

  test('passes correct props to ShopItem', () => {
    render(
      <ShopTab
        player={player}
        handleBuy={handleBuy}
        isItemOwned={isItemOwned}
        isItemDisabled={isItemDisabled}
        getAdjustedCost={item => item.cost * 0.5}
        processingItemId='gear1'
      />
    )

    expect(screen.getByTestId('is-owned-gear1').textContent).toBe('Yes')
    expect(screen.getByTestId('is-owned-inst1').textContent).toBe('No')

    expect(screen.getByTestId('is-disabled-gear1').textContent).toBe('No')
    expect(screen.getByTestId('is-disabled-inst1').textContent).toBe('Yes')

    expect(screen.getByTestId('adjusted-cost-gear1').textContent).toBe('50')
    expect(screen.getByTestId('adjusted-cost-inst1').textContent).toBe('250')

    expect(screen.getByTestId('processing')).toBeInTheDocument()
  })

  test('calls handleBuy when Buy is clicked on ShopItem', () => {
    render(
      <ShopTab
        player={player}
        handleBuy={handleBuy}
        isItemOwned={isItemOwned}
        isItemDisabled={isItemDisabled}
      />
    )
    const buttons = screen.getAllByText('Buy')
    fireEvent.click(buttons[0]) // click gear1
    expect(handleBuy).toHaveBeenCalledWith({
      id: 'gear1',
      name: 'Gear 1',
      cost: 100,
      currency: 'money'
    })
  })
})
