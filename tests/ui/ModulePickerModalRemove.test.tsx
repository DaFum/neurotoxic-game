import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ModulePickerModal } from '../../src/components/assets/ModulePickerModal'
import type { AssetModule, LongTermAsset } from '../../src/types/assets'

const { mockInstallModule, mockRemoveModule, mockGetModulePoolForAsset } =
  vi.hoisted(() => ({
    mockInstallModule: vi.fn(),
    mockRemoveModule: vi.fn(),
    mockGetModulePoolForAsset: vi.fn()
  }))
const mockState = vi.hoisted(() => ({
  player: { fame: 50, money: 1000 },
  social: { scenePresence: 0 },
  activeStoryFlags: [],
  band: {},
  assets: []
}))

const asset: LongTermAsset = {
  id: 'asset-1',
  kind: 'tourbus_chassis',
  chassisFlavor: 'legit',
  chassisTier: 2,
  condition: 100,
  baseUpkeep: 20,
  baseDailyRevenue: 0,
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  baseRiskEventChance: 0.005,
  slots: [
    {
      id: 'audio-slot',
      slotType: 'tb_audio',
      position: { x: 0, y: 0 },
      installedModuleId: 'tb_subwoofer_stack'
    }
  ]
}

const ecoInkModule: AssetModule = {
  id: 'mw_eco_ink_supply',
  ownerKind: 'merch_workshop_chassis',
  slotType: 'mw_storage',
  flavor: 'legit',
  cost: 500,
  installCost: 0,
  removalRefundFraction: 0.2,
  boni: { avgMerchSalePriceBonus: 0.03 },
  unlock: {
    requiredOtherModuleInstalled: ['mw_4color_carousel', 'mw_manual_press']
  },
  imagePromptKey: 'mw_eco_ink_supply'
}

const storyLockedModule: AssetModule = {
  id: 'tb_vintage_stereo',
  ownerKind: 'tourbus_chassis',
  slotType: 'tb_audio',
  flavor: 'legit',
  cost: 650,
  installCost: 0,
  removalRefundFraction: 0.2,
  boni: { bandMoodPerDay: 2 },
  unlock: { requiredStoryFlags: ['found_record_collection'] },
  imagePromptKey: 'tb_vintage_stereo'
}

const workshopAsset: LongTermAsset = {
  id: 'workshop-1',
  kind: 'merch_workshop_chassis',
  chassisFlavor: 'legit',
  chassisTier: 1,
  condition: 100,
  baseUpkeep: 12,
  baseDailyRevenue: 0,
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  baseRiskEventChance: 0.005,
  slots: [
    {
      id: 'storage-slot',
      slotType: 'mw_storage',
      position: { x: 0, y: 0 },
      installedModuleId: null
    }
  ]
}

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({
    installModule: mockInstallModule,
    removeModule: mockRemoveModule
  }),
  useGameSelector: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState)
}))

vi.mock('../../src/ui/shared/GeneratedImagePanel', () => ({
  GeneratedImagePanel: ({ alt }: { alt: string }) => <div>{alt}</div>
}))

vi.mock('../../src/ui/shared/Modal', () => ({
  Modal: ({
    children,
    isOpen,
    title
  }: {
    children: React.ReactNode
    isOpen: boolean
    title: string
  }) =>
    isOpen ? (
      <div role='dialog' aria-label={title}>
        {children}
      </div>
    ) : null
}))

vi.mock('../../src/utils/assetSelectors', () => ({
  getModulePoolForAsset: mockGetModulePoolForAsset,
  selectAssetSlotsMap: (asset: LongTermAsset) => {
    const map = new Map()
    for (const s of asset.slots) map.set(s.id, s)
    return map
  },
  getSlotConflicts: () => ({
    canInstall: true,
    conflictingModuleIds: []
  })
}))

vi.mock('../../src/utils/numberUtils', () => ({
  formatCurrency: (value: number) => `${value} EUR`
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, opts?: Record<string, string | number>) => {
      const labels: Record<string, string> = {
        'assets:modulePicker.title': 'Choose a module',
        'assets:module.tb_subwoofer_stack.name': 'Subwoofer Stack',
        'assets:module.tb_subwoofer_stack.description': '+10% tips at gigs',
        'assets:module.tb_vintage_stereo.name': 'Vintage Stereo',
        'assets:module.tb_vintage_stereo.description': '+2 mood per day',
        'assets:module.mw_eco_ink_supply.name': 'Eco-ink supply',
        'assets:module.mw_eco_ink_supply.description': '+3% avg merch price',
        'assets:module.mw_4color_carousel.name': '4-color carousel',
        'assets:module.mw_manual_press.name': 'Manual press',
        'assets:modulePicker.removeRefund': `Refund: ${opts?.amount}`,
        'assets:actions.removeModuleConfirm': `Remove module (refund ${opts?.amount})?`,
        'assets:modulePicker.installCost': `Install cost: ${opts?.amount}`,
        'assets:module.unlock.otherModule': `Requires module: ${opts?.moduleRefs}`,
        'assets:module.unlock.story': `Requires story progress: ${opts?.flag}`,
        'assets:storyFlag.found_record_collection': 'Found record collection',
        'assets:actions.remove': 'Remove',
        'assets:actions.install': 'Install'
      }
      return labels[key] ?? opts?.defaultValue ?? key
    }
  })
}))

describe('ModulePickerModal remove flow', () => {
  beforeEach(() => {
    mockInstallModule.mockClear()
    mockRemoveModule.mockClear()
    mockGetModulePoolForAsset.mockReturnValue([])
  })

  it('lets players remove an installed module with refund preview', () => {
    const onClose = vi.fn()

    render(
      <ModulePickerModal
        asset={asset}
        slotId='audio-slot'
        isOpen
        onClose={onClose}
      />
    )

    expect(screen.getAllByText('Subwoofer Stack')).not.toHaveLength(0)
    expect(screen.getByText('Refund: 240 EUR')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(mockRemoveModule).toHaveBeenCalledWith('asset-1', 'audio-slot')
    expect(mockInstallModule).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders required-module lock reasons with localized module names', () => {
    mockGetModulePoolForAsset.mockReturnValue([
      {
        module: ecoInkModule,
        unlocked: false,
        lockReasons: [
          {
            kind: 'otherModule',
            refs: ['mw_4color_carousel', 'mw_manual_press']
          }
        ]
      }
    ])

    render(
      <ModulePickerModal
        asset={workshopAsset}
        slotId='storage-slot'
        isOpen
        onClose={vi.fn()}
      />
    )

    expect(
      screen.getByText('Requires module: 4-color carousel, Manual press')
    ).toBeInTheDocument()
    expect(screen.queryByText(/mw_4color_carousel/)).not.toBeInTheDocument()
    expect(screen.queryByText(/mw_manual_press/)).not.toBeInTheDocument()
  })

  it('renders story lock reasons with localized flag names', () => {
    mockGetModulePoolForAsset.mockReturnValue([
      {
        module: storyLockedModule,
        unlocked: false,
        lockReasons: [
          {
            kind: 'story',
            ref: 'found_record_collection'
          }
        ]
      }
    ])

    render(
      <ModulePickerModal
        asset={{
          ...asset,
          slots: [
            {
              id: 'audio-slot',
              slotType: 'tb_audio',
              position: { x: 0, y: 0 },
              installedModuleId: null
            }
          ]
        }}
        slotId='audio-slot'
        isOpen
        onClose={vi.fn()}
      />
    )

    expect(
      screen.getByText('Requires story progress: Found record collection')
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/found_record_collection/)
    ).not.toBeInTheDocument()
  })
})
