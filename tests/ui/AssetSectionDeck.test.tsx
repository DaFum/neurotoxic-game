import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AssetSectionDeck } from '../../src/components/assets/AssetSectionDeck'
import type { ChassisTier, LongTermAsset } from '../../src/types/assets'

const makeAsset = (chassisTier: ChassisTier): LongTermAsset => ({
  id: 'asset-1',
  kind: 'tourbus_chassis',
  chassisFlavor: 'legit',
  chassisTier,
  condition: 100,
  baseUpkeep: 20,
  baseDailyRevenue: 0,
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  baseRiskEventChance: 0.005,
  slots: []
})

vi.mock('../../src/components/assets/AssetSlotActionList', () => ({
  AssetSlotActionList: () => <div data-testid='slot-list' />
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        'assets:kind.tourbus_chassis': 'Tourbus',
        'assets:flavor.legit': 'Legit',
        'assets:chassisTier.1': 'Tier I',
        'assets:chassisTier.2': 'Tier II',
        'assets:chassisTier.3': 'Tier III',
        'assets:mode.cash': 'Cash',
        'assets:actions.repair': 'Repair',
        'assets:actions.upgrade': 'Upgrade',
        'assets:actions.sell': 'Sell'
      }
      return labels[key] ?? key
    }
  })
}))

describe('AssetSectionDeck', () => {
  it('enables chassis upgrades below max tier', () => {
    const onUpgrade = vi.fn()

    render(
      <AssetSectionDeck
        asset={makeAsset(2)}
        hero={<div />}
        onSlotClick={vi.fn()}
        onRepair={vi.fn()}
        onUpgrade={onUpgrade}
        onSell={vi.fn()}
      />
    )

    const upgrade = screen.getByRole('button', { name: 'Upgrade' })
    expect(upgrade).toBeEnabled()

    fireEvent.click(upgrade)
    expect(onUpgrade).toHaveBeenCalledOnce()
  })

  it('disables chassis upgrades at max tier', () => {
    render(
      <AssetSectionDeck
        asset={makeAsset(3)}
        hero={<div />}
        onSlotClick={vi.fn()}
        onRepair={vi.fn()}
        onUpgrade={vi.fn()}
        onSell={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Upgrade' })).toBeDisabled()
  })

  it('allows repair whenever the canonical repair rule has a positive cost', () => {
    render(
      <AssetSectionDeck
        asset={{ ...makeAsset(2), condition: 75 }}
        hero={<div />}
        onSlotClick={vi.fn()}
        onRepair={vi.fn()}
        onUpgrade={vi.fn()}
        onSell={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Repair' })).toBeEnabled()
  })

  it('styles unavailable actions as muted secondary buttons and available ones as primary', () => {
    render(
      <AssetSectionDeck
        asset={makeAsset(3)}
        hero={<div />}
        onSlotClick={vi.fn()}
        onRepair={vi.fn()}
        onUpgrade={vi.fn()}
        onSell={vi.fn()}
      />
    )

    for (const name of ['Repair', 'Upgrade']) {
      const button = screen.getByRole('button', { name })
      expect(button).toHaveClass('assets-hub-secondary-button')
      expect(button).not.toHaveClass('assets-hub-primary-button')
      expect(button).toHaveStyle({ backgroundColor: 'rgba(0, 0, 0, 0)' })
    }

    render(
      <AssetSectionDeck
        asset={{ ...makeAsset(1), id: 'asset-2', condition: 50 }}
        hero={<div />}
        onSlotClick={vi.fn()}
        onRepair={vi.fn()}
        onUpgrade={vi.fn()}
        onSell={vi.fn()}
      />
    )

    const enabled = screen
      .getAllByRole('button', { name: /^(Repair|Upgrade)$/ })
      .filter(button => !(button as HTMLButtonElement).disabled)
    expect(enabled).toHaveLength(2)
    for (const button of enabled) {
      expect(button).toHaveClass('assets-hub-primary-button')
      expect(button).not.toHaveClass('assets-hub-secondary-button')
    }
  })
})
