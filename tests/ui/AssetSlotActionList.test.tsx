import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AssetSlotActionList } from '../../src/components/assets/AssetSlotActionList'
import type { LongTermAsset } from '../../src/types/assets'

const asset: LongTermAsset = {
  id: 'asset-1',
  kind: 'merch_workshop_chassis',
  chassisFlavor: 'legit',
  chassisTier: 1,
  condition: 100,
  baseUpkeep: 18,
  baseDailyRevenue: 15,
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  baseRiskEventChance: 0.003,
  slots: [
    {
      id: 'print',
      slotType: 'mw_print',
      position: { x: 0, y: 0 },
      installedModuleId: 'mw_4color_carousel'
    },
    {
      id: 'drying',
      slotType: 'mw_drying',
      position: { x: 0, y: 0 },
      installedModuleId: null
    }
  ]
}

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      const labels: Record<string, string> = {
        'assets:slot.mw_print': 'Print station',
        'assets:slot.mw_drying': 'Drying',
        'assets:module.mw_4color_carousel.name': '4-color carousel',
        'assets:module.mw_4color_carousel.description': '-25% merch cost',
        'assets:hub.slotState.empty': 'Empty',
        'assets:hub.slotState.installed': 'Installed',
        'assets:hub.actions.manageSlot': 'Manage',
        'assets:actions.install': 'Install',
        'assets:hub.accessibility.slotAction': `${opts?.slot} slot: ${opts?.state}`
      }
      return labels[key] ?? opts?.defaultValue ?? key
    }
  })
}))

describe('AssetSlotActionList', () => {
  it('renders installed and empty slots with accessible actions', () => {
    const onSlotClick = vi.fn()
    render(<AssetSlotActionList asset={asset} onSlotClick={onSlotClick} />)

    expect(screen.getByText('Print station')).toBeInTheDocument()
    expect(screen.getByText('4-color carousel')).toBeInTheDocument()
    expect(screen.getByText('-25% merch cost')).toBeInTheDocument()
    expect(screen.getByText('Drying')).toBeInTheDocument()
    expect(screen.getByText('Empty')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Print station slot: Installed: 4-color carousel'
      })
    )
    expect(onSlotClick).toHaveBeenCalledWith('print')
  })
})
