import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ShopTab } from '../../src/ui/bandhq/ShopTab.tsx'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue || key,
    i18n: { language: 'en-US' }
  })
}))

vi.mock('../../src/data/hqItems', () => ({
  HQ_ITEMS: {
    gear: [
      { id: 'gear1', name: 'Gear 1', cost: 100, currency: 'money' },
      {
        id: 'passive1',
        name: 'Passive 1',
        cost: 150,
        currency: 'money',
        effect: { type: 'passive', key: 'harmonyRegenTravel', value: true }
      }
    ],
    instruments: [
      { id: 'inst1', name: 'Instrument 1', cost: 500, currency: 'money' },
      {
        id: 'instPerformance',
        name: 'Performance Instrument',
        cost: 650,
        currency: 'money',
        effect: {
          type: 'stat_modifier',
          target: 'performance',
          stat: 'guitarDifficulty',
          value: -0.1
        }
      }
    ]
  }
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

describe('ShopTab', () => {
  const player = { money: 1000 }
  let handleBuy
  let getPurchaseDecision
  let isItemDisabled

  beforeEach(() => {
    vi.clearAllMocks()
    handleBuy = vi.fn()
    getPurchaseDecision = vi.fn(item => ({
      cost: item.cost * 0.5,
      isOwned: item.id === 'gear1',
      isConsumable: false,
      canPurchase: item.id !== 'gear1',
      canAfford: true
    }))
    isItemDisabled = vi.fn(item => item.id === 'inst1')
  })

  test('renders player funds display correctly', () => {
    render(
      <ShopTab
        player={player}
        handleBuy={handleBuy}
        getPurchaseDecision={getPurchaseDecision}
        isItemDisabled={isItemDisabled}
      />
    )
    expect(screen.getByText(/€1,000/)).toBeInTheDocument()
    expect(screen.getByText(/ui:bandhq\.funds/)).toBeInTheDocument()
  })

  test('renders combined shop items from gear and instruments', () => {
    render(
      <ShopTab
        player={player}
        handleBuy={handleBuy}
        getPurchaseDecision={getPurchaseDecision}
        isItemDisabled={isItemDisabled}
      />
    )
    expect(screen.getByTestId('shop-item-gear1')).toBeInTheDocument()
    expect(screen.getByTestId('shop-item-passive1')).toBeInTheDocument()
    expect(screen.getByTestId('shop-item-inst1')).toBeInTheDocument()
    expect(screen.getByTestId('shop-item-instPerformance')).toBeInTheDocument()
    expect(screen.getAllByTestId(/^shop-item-/)).toHaveLength(4)
  })

  test('passes correct props to ShopItem', () => {
    render(
      <ShopTab
        player={player}
        handleBuy={handleBuy}
        getPurchaseDecision={getPurchaseDecision}
        isItemDisabled={isItemDisabled}
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
        getPurchaseDecision={getPurchaseDecision}
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
