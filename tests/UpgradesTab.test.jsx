import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { UpgradesTab } from '../src/ui/bandhq/UpgradesTab.jsx'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue || key
  })
}))

vi.mock('../src/ui/bandhq/ShopItem', () => ({
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

describe('UpgradesTab', () => {
  const player = { money: 1000, fame: 500 }
  const upgrades = [
    { id: 'item1', name: 'Upgrade 1', cost: 100 },
    { id: 'item2', name: 'Upgrade 2', cost: 200 }
  ]
  const handleBuy = vi.fn()
  const isItemOwned = vi.fn(item => item.id === 'item1')
  const isItemDisabled = vi.fn(item => item.id === 'item2')

  test('renders player currency displays correctly', () => {
    render(
      <UpgradesTab
        player={player}
        upgrades={[]}
        handleBuy={handleBuy}
        isItemOwned={isItemOwned}
        isItemDisabled={isItemDisabled}
      />
    )
    expect(screen.getByText(/500★/)).toBeInTheDocument()
    expect(screen.getByText(/1000€/)).toBeInTheDocument()
    expect(screen.getByText(/FAME:/)).toBeInTheDocument()
    expect(screen.getByText(/MONEY:/)).toBeInTheDocument()
  })

  test('renders shop items', () => {
    render(
      <UpgradesTab
        player={player}
        upgrades={upgrades}
        handleBuy={handleBuy}
        isItemOwned={isItemOwned}
        isItemDisabled={isItemDisabled}
      />
    )
    expect(screen.getByTestId('shop-item-item1')).toBeInTheDocument()
    expect(screen.getByTestId('shop-item-item2')).toBeInTheDocument()
  })

  test('passes props to ShopItem correctly', () => {
    render(
      <UpgradesTab
        player={player}
        upgrades={upgrades}
        handleBuy={handleBuy}
        isItemOwned={isItemOwned}
        isItemDisabled={isItemDisabled}
        getAdjustedCost={item => item.cost * 0.9}
        processingItemId='item1'
      />
    )

    expect(screen.getByTestId('is-owned-item1').textContent).toBe('Yes')
    expect(screen.getByTestId('is-owned-item2').textContent).toBe('No')

    expect(screen.getByTestId('is-disabled-item1').textContent).toBe('No')
    expect(screen.getByTestId('is-disabled-item2').textContent).toBe('Yes')

    expect(screen.getByTestId('adjusted-cost-item1').textContent).toBe('90')
    expect(screen.getByTestId('adjusted-cost-item2').textContent).toBe('180')

    expect(screen.getByTestId('processing')).toBeInTheDocument()
  })

  test('calls handleBuy when Buy is clicked on ShopItem', () => {
    render(
      <UpgradesTab
        player={player}
        upgrades={upgrades}
        handleBuy={handleBuy}
        isItemOwned={isItemOwned}
        isItemDisabled={isItemDisabled}
      />
    )
    const buttons = screen.getAllByText('Buy')
    fireEvent.click(buttons[0])
    expect(handleBuy).toHaveBeenCalledWith(upgrades[0])
  })
})
