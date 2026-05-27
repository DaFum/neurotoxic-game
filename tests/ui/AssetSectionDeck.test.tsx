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
})
