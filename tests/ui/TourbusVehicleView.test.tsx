import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { TourbusVehicleView } from '../../src/components/assets/sections/TourbusVehicleView'
import type { LongTermAsset, SlotType } from '../../src/types/assets'

vi.mock('../../src/ui/shared/GeneratedImagePanel', () => ({
  GeneratedImagePanel: ({
    alt,
    className
  }: {
    alt: string
    className?: string
  }) => (
    <img
      data-testid='generated-image-panel'
      alt={alt}
      className={className}
      src='mock'
    />
  )
}))

vi.mock('../../src/utils/imageGen', () => ({
  getSectionBackgroundPrompt: vi.fn(
    (kind: string, flavor: string) => `bg:${kind}:${flavor}`
  ),
  getModuleImagePrompt: vi.fn((moduleId: string) => `module:${moduleId}`),
  resolveGenImageUrl: vi.fn(
    (prompt: string) => `http://mock.gen/${encodeURIComponent(prompt)}`
  ),
  appendImageSize: vi.fn(
    (url: string, w: number, h: number) => `${url}?width=${w}&height=${h}`
  )
}))

vi.mock('../../src/components/assets/sections/TourbusTrailerOverlay', () => ({
  TourbusTrailerOverlay: () => <div data-testid='trailer-overlay' />
}))

const translations: Record<string, string> = {
  'assets:section.tourbus.alt': 'Localized tourbus side view',
  'assets:slot.tb_roof': 'slot tb_roof',
  'assets:slot.tb_front': 'slot tb_front',
  'assets:slot.tb_audio': 'slot tb_audio',
  'assets:slot.tb_decal': 'slot tb_decal'
}

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      translations[key] ?? options?.defaultValue ?? key
  })
}))

const mockAsset = (
  slots: Array<{
    id: string
    slotType: SlotType
    installedModuleId: string | null
  }>
): LongTermAsset => ({
  id: 'asset-1',
  kind: 'tourbus_chassis',
  chassisFlavor: 'legit',
  chassisTier: 1,
  condition: 100,
  baseUpkeep: 10,
  baseDailyRevenue: 0,
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  baseRiskEventChance: 0.05,
  slots: slots.map(s => ({
    id: s.id,
    slotType: s.slotType,
    position: { x: 0, y: 0 },
    installedModuleId: s.installedModuleId
  }))
})

describe('TourbusVehicleView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses localized background alt text', () => {
    const asset = mockAsset([
      { id: 's1', slotType: 'tb_roof', installedModuleId: null }
    ])
    render(<TourbusVehicleView asset={asset} onSlotClick={vi.fn()} />)
    expect(
      screen.getByRole('img', { name: 'Localized tourbus side view' })
    ).toBeInTheDocument()
  })

  it('renders one button per non-trailer-addon slot', () => {
    const asset = mockAsset([
      { id: 's1', slotType: 'tb_roof', installedModuleId: null },
      { id: 's2', slotType: 'tb_front', installedModuleId: null },
      { id: 's3', slotType: 'tb_audio', installedModuleId: null },
      { id: 's4', slotType: 'tb_decal', installedModuleId: null }
    ])
    render(<TourbusVehicleView asset={asset} onSlotClick={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  it('renders an img inside the button when a module is installed', () => {
    const asset = mockAsset([
      { id: 's1', slotType: 'tb_roof', installedModuleId: 'tb_solar_panel' },
      { id: 's2', slotType: 'tb_front', installedModuleId: null }
    ])
    render(<TourbusVehicleView asset={asset} onSlotClick={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    const installedButton = buttons.find(
      btn => btn.getAttribute('aria-label') === 'slot tb_roof: tb_solar_panel'
    )
    expect(installedButton).toBeDefined()
    within(installedButton!).getByRole('img')
  })

  it('calls onSlotClick with slot id when button is clicked', () => {
    const onSlotClick = vi.fn()
    const asset = mockAsset([
      { id: 'slot-abc', slotType: 'tb_roof', installedModuleId: null }
    ])
    render(<TourbusVehicleView asset={asset} onSlotClick={onSlotClick} />)
    const button = screen.getByRole('button', { name: 'slot tb_roof' })
    fireEvent.click(button)
    expect(onSlotClick).toHaveBeenCalledWith('slot-abc')
  })

  it('renders TourbusTrailerOverlay when tb_trailer_hitch is installed', () => {
    const asset = mockAsset([
      { id: 's1', slotType: 'tb_roof', installedModuleId: 'tb_trailer_hitch' }
    ])
    render(<TourbusVehicleView asset={asset} onSlotClick={vi.fn()} />)
    expect(screen.getByTestId('trailer-overlay')).toBeDefined()
  })

  it('does not render TourbusTrailerOverlay when no hitch is installed', () => {
    const asset = mockAsset([
      { id: 's1', slotType: 'tb_roof', installedModuleId: null }
    ])
    render(<TourbusVehicleView asset={asset} onSlotClick={vi.fn()} />)
    expect(screen.queryByTestId('trailer-overlay')).toBeNull()
  })

  it('filters out tb_trailer_addon slots from hotspot buttons', () => {
    const asset = mockAsset([
      { id: 's1', slotType: 'tb_roof', installedModuleId: null },
      { id: 's2', slotType: 'tb_trailer_addon', installedModuleId: null }
    ])
    render(<TourbusVehicleView asset={asset} onSlotClick={vi.fn()} />)
    // Only tb_roof should produce a button (tb_trailer_addon is filtered out)
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})
