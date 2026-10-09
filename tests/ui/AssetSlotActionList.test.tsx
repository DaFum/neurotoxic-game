import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AssetSlotActionList } from '../../src/components/assets/AssetSlotActionList'
import { AssetSectionDeck } from '../../src/components/assets/AssetSectionDeck'
import { TourbusTrailerOverlay } from '../../src/components/assets/sections/TourbusTrailerOverlay'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry'
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
        'assets:slot.tb_trailer_addon': 'Trailer addon',
        'assets:hub.slotState.damaged': 'Damaged',
        'ui:assets.tourbus.addons_unavailable':
          'Trailer addons are not available yet.',
        'assets:module.mw_4color_carousel.name': '4-color carousel',
        'assets:module.mw_4color_carousel.description': '-25% merch cost',
        'assets:hub.slotState.empty': 'Empty',
        'assets:hub.slotState.installed': 'Installed',
        'assets:hub.actions.manageSlot': 'Manage',
        'assets:actions.install': 'Install',
        'assets:hub.accessibility.slotAction': `${opts?.slot} slot: ${opts?.state}`
      }
      return labels[key] ?? opts?.defaultValue ?? key
    },
    i18n: { language: 'en' }
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
    fireEvent.click(screen.getByRole('button', { name: 'Drying slot: Empty' }))
    expect(onSlotClick).toHaveBeenCalledWith('drying')
  })
})

vi.mock('../../src/ui/shared/GeneratedImagePanel', () => ({
  GeneratedImagePanel: ({ alt }: { alt: string }) => (
    <div role='img' aria-label={alt} />
  )
}))
vi.mock('../../src/utils/imageGen', () => ({
  getTrailerImagePrompt: () => 'trailer image',
  getModuleImagePrompt: () => 'module image'
}))

const addonId = 'test_action_list_trailer_addon'
const originalAddon = MODULE_REGISTRY[addonId]
afterEach(() => {
  if (originalAddon === undefined) delete MODULE_REGISTRY[addonId]
  else MODULE_REGISTRY[addonId] = originalAddon
})

const trailerAsset = (
  installedModuleId: string | null = null
): LongTermAsset => ({
  ...asset,
  kind: 'tourbus_chassis',
  slots: [
    {
      id: 'addon-slot',
      slotType: 'tb_trailer_addon',
      position: { x: 0, y: 0 },
      installedModuleId
    }
  ]
})

describe.each(['list', 'deck'] as const)(
  'trailer availability in the %s',
  surface => {
    const renderSurface = (
      trailer: LongTermAsset,
      onSlotClick: (slotId: string) => void
    ) =>
      render(
        surface === 'list' ? (
          <AssetSlotActionList asset={trailer} onSlotClick={onSlotClick} />
        ) : (
          <AssetSectionDeck
            asset={trailer}
            hero={
              <TourbusTrailerOverlay
                asset={trailer}
                onSlotClick={onSlotClick}
              />
            }
            onSlotClick={onSlotClick}
            onRepair={vi.fn()}
            onUpgrade={vi.fn()}
            onSell={vi.fn()}
          />
        )
      )

    it('retains the empty row without any route into an empty addon picker', () => {
      const onSlotClick = vi.fn()
      renderSurface(trailerAsset(), onSlotClick)
      expect(screen.getByText('Trailer addon')).toBeInTheDocument()
      expect(
        screen.getAllByText('Trailer addons are not available yet.')
      ).toHaveLength(surface === 'deck' ? 2 : 1)
      expect(
        screen.queryByRole('button', { name: 'Trailer addon slot: Empty' })
      ).toBeNull()
      // Deck lifecycle buttons are unrelated to the picker; clicking any rendered
      // control must still never call the slot-selection callback here.
      for (const button of screen.queryAllByRole('button'))
        fireEvent.click(button)
      expect(onSlotClick).not.toHaveBeenCalled()
    })

    it('keeps saved installed modules manageable without registry definitions', () => {
      const onSlotClick = vi.fn()
      renderSurface(trailerAsset('retired-addon'), onSlotClick)
      const manage = screen.getByRole('button', {
        name: 'Trailer addon slot: Installed: retired-addon'
      })
      fireEvent.click(manage)
      expect(onSlotClick).toHaveBeenCalledWith('addon-slot')
      expect(
        screen.queryByText('Trailer addons are not available yet.')
      ).toBeNull()
    })

    it('retains picker controls for compatible but locked catalog entries', () => {
      MODULE_REGISTRY[addonId] = {
        ...MODULE_REGISTRY.tb_trailer_hitch,
        id: addonId,
        slotType: 'tb_trailer_addon',
        addsSlots: undefined
      }
      expect(MODULE_REGISTRY[addonId].unlock.minChassisTier).toBe(3)
      const onSlotClick = vi.fn()
      renderSurface(trailerAsset(), onSlotClick)
      expect(
        screen.queryByText('Trailer addons are not available yet.')
      ).toBeNull()
      fireEvent.click(
        screen.getByRole('button', { name: 'Trailer addon slot: Empty' })
      )
      expect(onSlotClick).toHaveBeenCalledWith('addon-slot')
    })

    it('ignores addon definitions for a different asset kind', () => {
      MODULE_REGISTRY[addonId] = {
        ...MODULE_REGISTRY.tb_trailer_hitch,
        id: addonId,
        ownerKind: 'merch_workshop_chassis',
        slotType: 'tb_trailer_addon',
        addsSlots: undefined
      }
      renderSurface(trailerAsset(), vi.fn())
      expect(
        screen.queryByRole('button', { name: 'Trailer addon slot: Empty' })
      ).toBeNull()
      expect(
        screen.getAllByText('Trailer addons are not available yet.')
      ).toHaveLength(surface === 'deck' ? 2 : 1)
    })
  }
)
