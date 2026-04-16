import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ShopItem } from '../../src/ui/bandhq/ShopItem.tsx'
import * as purchaseLogicUtils from '../../src/utils/purchaseLogicUtils'

vi.mock('../../src/utils/imageGen', () => ({
  getGenImageUrl: vi.fn(desc => `mock-url-${desc}`),
  IMG_PROMPTS: { 'item-img': 'prompt-for-item-img' }
}))

vi.mock('../../src/utils/purchaseLogicUtils', () => ({
  getPrimaryEffect: vi.fn()
}))

vi.mock('../../src/ui/GlitchButton', () => ({
  GlitchButton: ({ children, onClick, disabled, isLoading }) => (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled || isLoading}
      data-loading={isLoading}
    >
      {children}
      {isLoading && <span data-testid='loader'>Loading</span>}
    </button>
  )
}))

describe('ShopItem', () => {
  const mockItem = {
    id: 'test-item',
    name: 'items:test-item.name',
    description: 'items:test-item.description',
    cost: 100,
    currency: 'money',
    img: 'item-img'
  }

  const defaultProps = {
    item: mockItem,
    isOwned: false,
    isDisabled: false,
    onBuy: vi.fn(),
    processingItemId: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
    purchaseLogicUtils.getPrimaryEffect.mockReturnValue({})
  })

  it('renders item details correctly', () => {
    const { getByText, getByAltText } = render(<ShopItem {...defaultProps} />)
    expect(getByText('items:test-item.name')).toBeInTheDocument()
    expect(getByText('items:test-item.description')).toBeInTheDocument()
    expect(getByText(/100/)).toBeInTheDocument()
    expect(getByText(/€/)).toBeInTheDocument()
    expect(getByAltText('items:test-item.name')).toBeInTheDocument()
  })

  it('renders fame currency correctly', () => {
    const fameItem = { ...mockItem, currency: 'fame' }
    const { getByText } = render(<ShopItem {...defaultProps} item={fameItem} />)
    expect(getByText(/★/)).toBeInTheDocument()
  })

  it('renders adjusted cost when provided', () => {
    const { getByText } = render(
      <ShopItem {...defaultProps} adjustedCost={80} />
    )
    expect(getByText('80')).toBeInTheDocument()
    expect(getByText('100')).toHaveClass('line-through')
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
    purchaseLogicUtils.getPrimaryEffect.mockReturnValue({
      type: 'inventory_set'
    })
    const { getByText } = render(<ShopItem {...defaultProps} isOwned={true} />)
    expect(getByText('OWNED')).toBeInTheDocument()
  })

  it('shows BUY when isOwned is true but item is consumable', () => {
    purchaseLogicUtils.getPrimaryEffect.mockReturnValue({
      type: 'inventory_add'
    })
    const { getByText } = render(<ShopItem {...defaultProps} isOwned={true} />)
    expect(getByText('BUY')).toBeInTheDocument()
  })

  it('shows loading state on button when processingItemId matches', () => {
    const { getByTestId } = render(
      <ShopItem {...defaultProps} processingItemId='test-item' />
    )
    expect(getByTestId('loader')).toBeInTheDocument()
  })

  it('does not call onBuy when another item is processing', () => {
    const onBuy = vi.fn()
    const { getByText } = render(
      <ShopItem {...defaultProps} onBuy={onBuy} processingItemId='other-item' />
    )
    const button = getByText('BUY').closest('button')
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onBuy).not.toHaveBeenCalled()
  })
})
