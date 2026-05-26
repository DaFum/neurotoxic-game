import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ModulePickerModal } from '../../src/components/assets/ModulePickerModal'
import type { LongTermAsset } from '../../src/types/assets'

const captured = vi.hoisted(() => ({ className: '' }))

const mockState = vi.hoisted(() => ({
  player: { fame: 0, money: 500 },
  social: { scenePresence: 0 },
  activeStoryFlags: [],
  band: {},
  assets: []
}))

vi.mock('../../src/ui/shared/Modal', () => ({
  Modal: ({ className }: { className?: string }) => {
    captured.className = className ?? ''
    return <div data-testid='modal' />
  }
}))

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({ installModule: vi.fn() }),
  useGameSelector: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState)
}))

vi.mock('../../src/utils/assetSelectors', () => ({
  getModulePoolForAsset: () => [],
  getSlotConflicts: () => ({
    canInstall: true,
    conflictingModuleIds: []
  })
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key
  })
}))

const asset: LongTermAsset = {
  id: 'asset-1',
  kind: 'tourbus_chassis',
  chassisFlavor: 'legit',
  chassisTier: 1,
  condition: 100,
  baseUpkeep: 10,
  baseDailyRevenue: 0,
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  baseRiskEventChance: 0.005,
  slots: [
    {
      id: 'slot-1',
      slotType: 'tb_roof',
      position: { x: 0, y: 0 },
      installedModuleId: null
    }
  ]
}

describe('asset modal sheet classes', () => {
  it('passes the mobile sheet class to ModulePickerModal', () => {
    render(
      <ModulePickerModal
        asset={asset}
        slotId='slot-1'
        isOpen
        onClose={vi.fn()}
      />
    )

    expect(captured.className).toContain('assets-modal-sheet')
  })
})
