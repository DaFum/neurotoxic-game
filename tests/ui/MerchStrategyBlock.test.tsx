import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MerchStrategyBlock } from '../../src/components/pregig/MerchStrategyBlock'
import { DEFAULT_MERCH_PRICES, MERCH_MAX_PRICES } from '../../src/data/merch'
import { gameReducer } from '../../src/context/gameReducer'
import { createRestockMerchAction } from '../../src/context/actionCreators'
import { createInitialState } from '../../src/context/initialState'
import { getActiveAssetModifiers } from '../../src/utils/assets/assetSelectors/stateAggregation'
import { finiteNumberOr } from '../../src/utils/gameState'
import type { GameState } from '../../src/types'

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

  describe('display/settlement parity', () => {
    const shirtsIndex = Object.keys(DEFAULT_MERCH_PRICES).indexOf('shirts')

    const installed = (kind: string, slotType: string, moduleId: string) => ({
      id: `asset_${moduleId}`,
      kind,
      chassisFlavor: 'legit',
      chassisTier: 3,
      condition: 100,
      baseUpkeep: 0,
      baseDailyRevenue: 0,
      baseRiskEventChance: 0,
      acquiredOnDay: 1,
      acquisitionMode: 'cash',
      slots: [
        {
          id: `slot_${moduleId}`,
          slotType,
          position: { x: 0, y: 0 },
          installedModuleId: moduleId
        }
      ]
    })

    const careerWith = (
      inventory: Record<string, unknown>,
      assets: unknown[] = []
    ): GameState => {
      const base = createInitialState()
      return {
        ...base,
        player: { ...base.player, money: 500 },
        band: { ...base.band, inventory },
        assets
      } as GameState
    }

    /** Hovers the shirts restock button, with props wired as PreGig wires them. */
    const displayedShirtQuote = (state: GameState): string => {
      const modifiers = getActiveAssetModifiers(state.assets ?? [])
      render(
        <MerchStrategyBlock
          bandInventory={state.band.inventory}
          customPrices={{}}
          onUpdatePrice={vi.fn()}
          onRestock={vi.fn()}
          restockCostMultiplier={modifiers.merchCostMultiplier}
          merchCapacityBonus={modifiers.merchCapacityBonus}
          playerMoney={state.player.money}
        />
      )
      const button = screen.getAllByRole('button', { name: 'Restock' })[
        shirtsIndex
      ]
      expect(button).toBeEnabled()
      fireEvent.mouseEnter(button!)
      return screen.getByText(/^Cost: /).textContent ?? ''
    }

    /** The cost and units the RESTOCK_MERCH reducer actually settles. */
    const settledShirtQuote = (state: GameState): string => {
      const next = gameReducer(state, createRestockMerchAction('shirts'))
      const cost = state.player.money - next.player.money
      const amount =
        finiteNumberOr(next.band.inventory.shirts, 0) -
        finiteNumberOr(state.band.inventory.shirts, 0)
      return `Cost: ${cost} EUR (+${amount})`
    }

    it.each([
      {
        name: 'discounted partial stock',
        state: () =>
          careerWith({ patches: 95 }, [
            installed(
              'merch_workshop_chassis',
              'mw_print',
              'mw_4color_carousel'
            )
          ]),
        // ceil(ceil(150 * 0.75) * 5/25) = 23
        expected: 'Cost: 23 EUR (+5)'
      },
      {
        name: 'combined capacity with a capacity bonus',
        state: () =>
          careerWith({ shirts: 60, patches: 35 }, [
            installed('tourbus_chassis', 'tb_roof', 'tb_roof_rack')
          ]),
        expected: 'Cost: 150 EUR (+25)'
      },
      {
        name: 'malformed stock',
        state: () =>
          careerWith({
            shirts: 'lots',
            patches: Number.NaN,
            hoodies: Number.POSITIVE_INFINITY,
            vinyl: 90
          }),
        expected: 'Cost: 60 EUR (+10)'
      }
    ])('shows the quote the reducer settles: $name', ({ state, expected }) => {
      const s = state()
      const displayed = displayedShirtQuote(s)
      expect(displayed).toBe(expected)
      expect(settledShirtQuote(s)).toBe(displayed)
    })
  })

  it.each([
    ['missing', undefined, 'Stock: 0'],
    ['NaN', Number.NaN, 'Stock: 0'],
    ['Infinity', Number.POSITIVE_INFINITY, 'Stock: 0'],
    ['-Infinity', Number.NEGATIVE_INFINITY, 'Stock: 0'],
    ['a string', 'lots', 'Stock: 0'],
    ['finite', 7, 'Stock: 7']
  ])('shows only finite stock (%s)', (_label, shirts, expected) => {
    render(
      <MerchStrategyBlock
        bandInventory={{ shirts }}
        customPrices={{}}
        onUpdatePrice={vi.fn()}
        onRestock={vi.fn()}
        playerMoney={1000}
      />
    )
    const rows = screen.getAllByText(/^Stock: /)
    const shirtsIndex = Object.keys(DEFAULT_MERCH_PRICES).indexOf('shirts')
    expect(rows).toHaveLength(Object.keys(DEFAULT_MERCH_PRICES).length)
    expect(rows[shirtsIndex]).toHaveTextContent(expected)
  })
})
