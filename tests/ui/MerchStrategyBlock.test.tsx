import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MerchStrategyBlock } from '../../src/components/pregig/MerchStrategyBlock'
import { DEFAULT_MERCH_PRICES, MERCH_MAX_PRICES } from '../../src/data/merch'

vi.mock('../../src/utils/numberUtils', () => ({
  formatCurrency: (value: number) => `${value} EUR`
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, opts?: Record<string, string | number>) => {
      if (key === 'ui:pregig.merchStrategy.restock') return 'Restock'
      if (key === 'ui:pregig.merchStrategy.restockCost') {
        return `Cost: ${opts?.cost} (+${opts?.amount})`
      }
      if (key === 'ui:pregig.merchStrategy.maxCapacity') {
        return 'Max merch capacity reached'
      }
      if (key === 'ui:pregig.merchStrategy.unaffordable') {
        return `Insufficient funds (${opts?.cost})`
      }
      if (key === 'ui:pregig.merchStrategy.expeditionRestockLocked') {
        return 'Expedition stock is committed before the run.'
      }
      if (key === 'ui:pregig.merchStrategy.stock') {
        return `Stock: ${opts?.count}`
      }
      return opts?.defaultValue ?? key
    }
  })
}))

describe('MerchStrategyBlock', () => {
  it('surfaces prorated restock amount and cost near capacity', () => {
    render(
      <MerchStrategyBlock
        bandInventory={{ shirts: 95 }}
        customPrices={{}}
        onUpdatePrice={vi.fn()}
        onRestock={vi.fn()}
        restockCostMultiplier={1}
        merchCapacityBonus={0}
        playerMoney={1000}
      />
    )

    const restockButtons = screen.getAllByRole('button', { name: 'Restock' })
    fireEvent.mouseEnter(restockButtons[1])

    expect(screen.getByText('Cost: 30 EUR (+5)')).toBeInTheDocument()
  })

  it('disables restock controls and shows capacity tooltip when no capacity remains', () => {
    const onRestock = vi.fn()

    render(
      <MerchStrategyBlock
        bandInventory={{ shirts: 100 }}
        customPrices={{}}
        onUpdatePrice={vi.fn()}
        onRestock={onRestock}
        restockCostMultiplier={1}
        merchCapacityBonus={0}
        playerMoney={1000}
      />
    )

    const restockButtons = screen.getAllByRole('button', { name: 'Restock' })
    expect(restockButtons.length).toBeGreaterThan(0)
    expect(restockButtons[0]).toBeDisabled()

    fireEvent.click(restockButtons[0])

    expect(onRestock).not.toHaveBeenCalled()

    const wrapper = restockButtons[0].parentElement
    if (wrapper) fireEvent.mouseEnter(wrapper)

    expect(screen.getByText('Max merch capacity reached')).toBeInTheDocument()
  })

  it('shows unaffordable tooltip when player funds are insufficient', () => {
    const onRestock = vi.fn()

    render(
      <MerchStrategyBlock
        bandInventory={{ shirts: 0 }}
        customPrices={{}}
        onUpdatePrice={vi.fn()}
        onRestock={onRestock}
        restockCostMultiplier={1}
        merchCapacityBonus={0}
        playerMoney={0}
      />
    )

    const restockButtons = screen.getAllByRole('button', { name: 'Restock' })
    expect(restockButtons[0]).toBeDisabled()

    fireEvent.click(restockButtons[0])
    expect(onRestock).not.toHaveBeenCalled()

    const wrapper = restockButtons[0].parentElement
    if (wrapper) fireEvent.mouseEnter(wrapper)

    expect(screen.getByText('Insufficient funds (50 EUR)')).toBeInTheDocument()
  })

  it('disables Career restocking and shows locked tooltip when the run has committed its cargo', () => {
    const onRestock = vi.fn()

    render(
      <MerchStrategyBlock
        bandInventory={{ shirts: 7 }}
        customPrices={{}}
        onUpdatePrice={vi.fn()}
        onRestock={onRestock}
        restockCostMultiplier={1}
        merchCapacityBonus={0}
        playerMoney={1000}
        restockingEnabled={false}
      />
    )

    const restockButtons = screen.getAllByRole('button', { name: 'Restock' })
    expect(restockButtons[0]).toBeDisabled()
    expect(restockButtons[0]).not.toHaveAttribute('title')

    fireEvent.click(restockButtons[0])
    expect(onRestock).not.toHaveBeenCalled()

    const wrapper = restockButtons[0].parentElement
    if (wrapper) fireEvent.mouseEnter(wrapper)

    expect(
      screen.getByText('Expedition stock is committed before the run.')
    ).toBeInTheDocument()
  })

  describe('price decrease button', () => {
    const shirtsIndex = Object.keys(DEFAULT_MERCH_PRICES).indexOf('shirts')

    const renderWithShirtPrice = (
      price: number,
      onUpdatePrice: (merchKey: string, newPrice: number) => void
    ) => {
      render(
        <MerchStrategyBlock
          bandInventory={{ shirts: 10 }}
          customPrices={{ shirts: price }}
          onUpdatePrice={onUpdatePrice}
          onRestock={vi.fn()}
          playerMoney={1000}
        />
      )
      return screen.getAllByRole('button', {
        name: 'ui:pregig.merchStrategy.decreasePrice'
      })[shirtsIndex]
    }

    it('lowers the price by one above the minimum', () => {
      const onUpdatePrice = vi.fn()
      const button = renderWithShirtPrice(5, onUpdatePrice)
      expect(button).not.toBeDisabled()
      fireEvent.click(button!)
      expect(onUpdatePrice).toHaveBeenCalledWith('shirts', 4)
    })

    it('stops at the minimum price ($1)', () => {
      const onUpdatePrice = vi.fn()
      const button = renderWithShirtPrice(1, onUpdatePrice)
      expect(button).toBeDisabled()
      fireEvent.click(button!)
      expect(onUpdatePrice).not.toHaveBeenCalled()
    })
  })

  describe('price increase button', () => {
    const shirtsIndex = Object.keys(DEFAULT_MERCH_PRICES).indexOf('shirts')
    const maxShirts = MERCH_MAX_PRICES.shirts ?? 0

    const renderWithShirtPrice = (
      price: number,
      onUpdatePrice: (merchKey: string, newPrice: number) => void
    ) => {
      render(
        <MerchStrategyBlock
          bandInventory={{ shirts: 10 }}
          customPrices={{ shirts: price }}
          onUpdatePrice={onUpdatePrice}
          onRestock={vi.fn()}
          playerMoney={1000}
        />
      )
      return screen.getAllByRole('button', {
        name: 'ui:pregig.merchStrategy.increasePrice'
      })[shirtsIndex]
    }

    it('raises the price by one below the maximum', () => {
      const onUpdatePrice = vi.fn()
      const button = renderWithShirtPrice(maxShirts - 1, onUpdatePrice)
      expect(button).not.toBeDisabled()
      fireEvent.click(button!)
      expect(onUpdatePrice).toHaveBeenCalledWith('shirts', maxShirts)
    })

    it('stops at the canonical maximum price', () => {
      const onUpdatePrice = vi.fn()
      const button = renderWithShirtPrice(maxShirts, onUpdatePrice)
      expect(button).toBeDisabled()
      fireEvent.click(button!)
      expect(onUpdatePrice).not.toHaveBeenCalled()
    })
  })
})
