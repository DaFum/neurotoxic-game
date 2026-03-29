import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VoidTraderTab } from '../../src/ui/bandhq/VoidTraderTab.jsx'
import React from 'react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}))

describe('VoidTraderTab Component', () => {
  const player = { fame: 2000 }
  const handleTrade = vi.fn()
  const isItemOwned = vi.fn((item) => false)
  const isItemDisabled = vi.fn((item) => false)

  it('renders the Void Trader tab title', () => {
    render(
      <VoidTraderTab
        player={player}
        handleTrade={handleTrade}
        isItemOwned={isItemOwned}
        isItemDisabled={isItemDisabled}
      />
    )
    expect(screen.getByText('ui:hq.voidTrader.title')).toBeInTheDocument()
  })

  it('disables trade button if fame is too low', () => {
    const poorPlayer = { fame: 100 }
    render(
      <VoidTraderTab
        player={poorPlayer}
        handleTrade={handleTrade}
        isItemOwned={isItemOwned}
        isItemDisabled={isItemDisabled}
      />
    )

    const buttons = screen.getAllByRole('button', { name: /ui:hq.voidTrader.trade/i })
    expect(buttons[0]).toBeDisabled()
  })

  it('calls handleTrade when clicking trade button', () => {
    render(
      <VoidTraderTab
        player={player}
        handleTrade={handleTrade}
        isItemOwned={isItemOwned}
        isItemDisabled={isItemDisabled}
      />
    )

    const buttons = screen.getAllByRole('button', { name: /ui:hq.voidTrader.trade/i })
    fireEvent.click(buttons[0])
    expect(handleTrade).toHaveBeenCalled()
  })
})
