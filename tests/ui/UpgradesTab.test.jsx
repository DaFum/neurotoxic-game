import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { UpgradesTab } from '../../src/ui/bandhq/UpgradesTab.tsx'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue || key,
    i18n: { language: 'en-US' }
  })
}))

vi.mock('../../src/ui/bandhq/ShopItem', () => ({
  ShopItem: ({ item, decision, isDisabled, onBuy, processingItemId }) => (
    <div data-testid={`shop-item-${item.id}`}>
      <span>{item.name}</span>
      <span data-testid={`is-owned-${item.id}`}>
        {decision.isOwned ? 'Yes' : 'No'}
      </span>
      <span data-testid={`is-disabled-${item.id}`}>
        {isDisabled ? 'Yes' : 'No'}
      </span>
      {decision.cost !== undefined && decision.cost !== null && (
        <span data-testid={`adjusted-cost-${item.id}`}>{decision.cost}</span>
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
  const player = { money: 1000, fame: 50 }
  const upgrades = [
    { id: 'upg1', name: 'Upgrade 1', cost: 100, currency: 'money' },
    { id: 'upg2', name: 'Upgrade 2', cost: 10, currency: 'fame' }
  ]
  let handleBuy
  let getPurchaseDecision
  let isItemDisabled

  beforeEach(() => {
    vi.clearAllMocks()
    handleBuy = vi.fn()
    getPurchaseDecision = vi.fn(item => ({
      cost: item.cost * 0.5,
      isOwned: item.id === 'upg1',
      isConsumable: false,
      canPurchase: item.id !== 'upg1',
      canAfford: true
    }))
    isItemDisabled = vi.fn(item => item.id === 'upg2')
  })

  test('renders shop items', () => {
    render(
      <UpgradesTab
        player={player}
        upgrades={upgrades}
        handleBuy={handleBuy}
        getPurchaseDecision={getPurchaseDecision}
        isItemDisabled={isItemDisabled}
      />
    )
    expect(screen.getByTestId('shop-item-upg1')).toBeInTheDocument()
    expect(screen.getByTestId('shop-item-upg2')).toBeInTheDocument()
    expect(screen.getAllByTestId(/^shop-item-/)).toHaveLength(2)
  })

  test('passes props to ShopItem correctly', () => {
    render(
      <UpgradesTab
        player={player}
        upgrades={upgrades}
        handleBuy={handleBuy}
        getPurchaseDecision={getPurchaseDecision}
        isItemDisabled={isItemDisabled}
        processingItemId='upg1'
      />
    )

    expect(screen.getByTestId('is-owned-upg1').textContent).toBe('Yes')
    expect(screen.getByTestId('is-owned-upg2').textContent).toBe('No')

    expect(screen.getByTestId('is-disabled-upg1').textContent).toBe('No')
    expect(screen.getByTestId('is-disabled-upg2').textContent).toBe('Yes')

    expect(screen.getByTestId('adjusted-cost-upg1').textContent).toBe('50')
    expect(screen.getByTestId('adjusted-cost-upg2').textContent).toBe('5')

    expect(screen.getByTestId('processing')).toBeInTheDocument()
  })

  test('calls handleBuy when Buy is clicked on ShopItem', () => {
    render(
      <UpgradesTab
        player={player}
        upgrades={upgrades}
        handleBuy={handleBuy}
        getPurchaseDecision={getPurchaseDecision}
        isItemDisabled={isItemDisabled}
      />
    )
    const buttons = screen.getAllByText('Buy')
    fireEvent.click(buttons[0]) // click upg1
    expect(handleBuy).toHaveBeenCalledWith({
      id: 'upg1',
      name: 'Upgrade 1',
      cost: 100,
      currency: 'money'
    })
  })
})
