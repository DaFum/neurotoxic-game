import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ShopItem } from '../../src/ui/bandhq/ShopItem'
import * as purchaseLogicUtils from '../../src/utils/purchaseLogicUtils'

vi.mock('../../src/utils/purchaseLogicUtils', () => ({
  LABEL_CONTRACT_ADVANCE: 500
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (options?.defaultValue) return options.defaultValue
      if (key === 'ui:hq.owned') return 'OWNED'
      if (key === 'ui:hq.buy') return 'BUY'
      return key
    },
    i18n: { language: 'en-US' }
  })
}))

const mockItem = {
  id: 'test_item',
  name: 'Test Item',
  cost: 100,
  currency: 'money',
  description: 'Test Description'
}

const mockDecision = {
  cost: 100,
  canAfford: true,
  isOwned: false,
  isConsumable: false,
  canPurchase: true
}

const defaultProps = {
  item: mockItem,
  decision: mockDecision,
  isDisabled: false,
  onBuy: vi.fn()
}

describe('ShopItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders item details correctly', () => {
    const { getByText } = render(<ShopItem {...defaultProps} />)
    expect(getByText('Test Item')).toBeInTheDocument()
    expect(getByText('Test Description')).toBeInTheDocument()
    expect(getByText('€100')).toBeInTheDocument()
  })

  it('renders fame currency correctly', () => {
    const fameItem = { ...mockItem, currency: 'fame', cost: 50 }
    const fameDecision = { ...mockDecision, cost: 50 }
    const { getByText } = render(<ShopItem {...defaultProps} item={fameItem} decision={fameDecision} />)
    expect(getByText('50 ★')).toBeInTheDocument()
  })

  it('renders adjusted cost when provided', () => {
    const decisionWithDiscount = { ...mockDecision, cost: 80 }
    const { getByText } = render(
      <ShopItem {...defaultProps} decision={decisionWithDiscount} />
    )
    expect(getByText('€80')).toBeInTheDocument()
    expect(getByText('€100')).toHaveClass('line-through')
  })

  it('calls onBuy when clicking Buy button', () => {
    const onBuy = vi.fn()
    const { getByText } = render(<ShopItem {...defaultProps} onBuy={onBuy} />)
    fireEvent.click(getByText('BUY'))
    expect(onBuy).toHaveBeenCalledWith(mockItem)
  })

  it('is disabled when isDisabled prop is true', () => {
    const onBuy = vi.fn()
    const { getByText } = render(
      <ShopItem {...defaultProps} isDisabled={true} onBuy={onBuy} />
    )
    const button = getByText('BUY').closest('button')
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onBuy).not.toHaveBeenCalled()
  })

  it('shows OWNED when isOwned is true and item is not consumable', () => {
    const ownedDecision = { ...mockDecision, isOwned: true, isConsumable: false }
    const { getByText } = render(<ShopItem {...defaultProps} decision={ownedDecision} />)
    expect(getByText('OWNED')).toBeInTheDocument()
  })

  it('shows BUY when isOwned is true but item is consumable', () => {
    const consumableDecision = { ...mockDecision, isOwned: true, isConsumable: true }
    const { getByText } = render(<ShopItem {...defaultProps} decision={consumableDecision} />)
    expect(getByText('BUY')).toBeInTheDocument()
  })

  it('shows loading state on button when processingItemId matches', () => {
    const { container } = render(
      <ShopItem {...defaultProps} processingItemId='test_item' />
    )
    const svg = container.querySelector('svg.animate-spin')
    expect(svg).toBeInTheDocument()
  })
})
