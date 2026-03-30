import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VoidTraderTab } from '../../src/ui/bandhq/VoidTraderTab.jsx'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}))

describe('VoidTraderTab Component', () => {
  const player = { fame: 2000 }
  const handleTrade = vi.fn()
  const isItemOwned = vi.fn(_item => false)
  const isItemDisabled = vi.fn(_item => false)

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
    // Update the mock to reflect the actual fame-based disabling logic now handled centrally in BandHQ
    const _isItemDisabled = vi.fn(item => {
      const fameCost = item.rarity === 'epic' ? 1000 : 400
      return poorPlayer.fame < fameCost || (!item.stackable && isItemOwned(item))
    })

    render(
      <VoidTraderTab
        player={poorPlayer}
        handleTrade={handleTrade}
        isItemOwned={isItemOwned}
        isItemDisabled={_isItemDisabled}
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
        processingItemId={null}
      />
    )

    const buttons = screen.getAllByRole('button', { name: /ui:hq.voidTrader.trade/i })
    fireEvent.click(buttons[0])
    expect(handleTrade).toHaveBeenCalled()
  })

  it('shows processing state and disables buttons when processingItemId is set', () => {
    render(
      <VoidTraderTab
        player={player}
        handleTrade={handleTrade}
        isItemOwned={isItemOwned}
        isItemDisabled={isItemDisabled}
        processingItemId='c_phantom_strings'
      />
    )

    const loadingButtons = screen.getAllByRole('button', { name: /ui:loading/i })
    expect(loadingButtons.length).toBeGreaterThan(0)

    // Check that all buttons are actually disabled, either because they are processing or because another item is processing
    const allButtons = screen.getAllByRole('button')
    allButtons.forEach(btn => {
      expect(btn).toBeDisabled()
    })
  })
})
