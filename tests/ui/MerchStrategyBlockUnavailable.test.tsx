import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MerchStrategyBlock } from '../../src/components/pregig/MerchStrategyBlock'
import { DEFAULT_MERCH_PRICES } from '../../src/data/merch'
import { gameReducer } from '../../src/context/gameReducer'
import { createRestockMerchAction } from '../../src/context/actionCreators'
import { createInitialState } from '../../src/context/initialState'

// A rendered merch key with no HQ restock bundle: the canonical quote is null
// and the reducer refuses the purchase, so the UI must not offer one either.
const MISSING_KEY = 'neuro_bowl'

vi.mock('../../src/data/hqItems', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/data/hqItems')>()
  const map = new Map(actual.HQ_ITEMS_BY_MERCH_KEY)
  map.delete('neuro_bowl')
  return { ...actual, HQ_ITEMS_BY_MERCH_KEY: map }
})

vi.mock('../../src/utils/numberUtils', () => ({
  formatCurrency: (value: number) => `${value} EUR`
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, opts?: Record<string, string | number>) => {
      if (key === 'ui:pregig.merchStrategy.restock') return 'Restock'
      if (key === 'ui:pregig.merchStrategy.restockUnavailable') {
        return 'Restock unavailable'
      }
      if (key === 'ui:pregig.merchStrategy.restockCost') {
        return `Cost: ${opts?.cost} (+${opts?.amount})`
      }
      return opts?.defaultValue ?? key
    }
  })
}))

describe('MerchStrategyBlock without a canonical restock quote', () => {
  it('keeps the row but marks restocking unavailable, matching settlement', () => {
    const onRestock = vi.fn()
    render(
      <MerchStrategyBlock
        bandInventory={{}}
        customPrices={{}}
        onUpdatePrice={vi.fn()}
        onRestock={onRestock}
        playerMoney={1000}
      />
    )

    const keys = Object.keys(DEFAULT_MERCH_PRICES)
    const buttons = screen.getAllByRole('button', { name: 'Restock' })
    expect(buttons).toHaveLength(keys.length)

    const missing = buttons[keys.indexOf(MISSING_KEY)]
    expect(missing).toBeDisabled()
    fireEvent.click(missing!)
    expect(onRestock).not.toHaveBeenCalled()
    fireEvent.mouseEnter(missing!.parentElement!)
    expect(screen.getByText('Restock unavailable')).toBeInTheDocument()
    expect(screen.queryByText(/^Cost: /)).not.toBeInTheDocument()

    // Settlement agrees: the reducer charges nothing and adds no stock.
    const base = createInitialState()
    const state = {
      ...base,
      player: { ...base.player, money: 1000 },
      band: { ...base.band, inventory: {} }
    }
    expect(gameReducer(state, createRestockMerchAction(MISSING_KEY))).toBe(
      state
    )
  })

  it('still quotes the keys that have a canonical bundle', () => {
    render(
      <MerchStrategyBlock
        bandInventory={{}}
        customPrices={{}}
        onUpdatePrice={vi.fn()}
        onRestock={vi.fn()}
        playerMoney={1000}
      />
    )
    const shirts = screen.getAllByRole('button', { name: 'Restock' })[
      Object.keys(DEFAULT_MERCH_PRICES).indexOf('shirts')
    ]
    expect(shirts).toBeEnabled()
    fireEvent.mouseEnter(shirts!)
    expect(screen.getByText('Cost: 150 EUR (+25)')).toBeInTheDocument()
  })
})
