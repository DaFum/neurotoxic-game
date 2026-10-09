import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TourbusTrailerOverlay } from '../../src/components/assets/sections/TourbusTrailerOverlay'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry'
import type { LongTermAsset, SlotType } from '../../src/types/assets'

vi.mock('../../src/ui/shared/GeneratedImagePanel', () => ({
  GeneratedImagePanel: ({ alt }: { alt: string }) => (
    <div data-testid='generated-image-panel' role='img' aria-label={alt} />
  )
}))

vi.mock('../../src/utils/imageGen', () => ({
  getTrailerImagePrompt: vi.fn((flavor: string) => `trailer:${flavor}`),
  getModuleImagePrompt: vi.fn(() => 'module image')
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

describe('TourbusTrailerOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('labels empty addon slots unavailable with the production registry', () => {
    const asset = mockAsset([
      { id: 'slot-1', slotType: 'tb_trailer_addon', installedModuleId: null },
      { id: 'slot-2', slotType: 'tb_trailer_addon', installedModuleId: null }
    ])
    render(<TourbusTrailerOverlay asset={asset} onSlotClick={vi.fn()} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(
      screen.getByText('Trailer addons are not available yet.')
    ).toBeDefined()
  })

  it('keeps saved installations manageable even without addon definitions', () => {
    const onSlotClick = vi.fn()
    const asset = mockAsset([
      {
        id: 'trailer-slot-abc',
        slotType: 'tb_trailer_addon',
        installedModuleId: 'retired-addon'
      }
    ])
    render(<TourbusTrailerOverlay asset={asset} onSlotClick={onSlotClick} />)
    const button = screen.getByRole('button', { name: 'slot tb trailer addon' })
    fireEvent.click(button)
    expect(onSlotClick).toHaveBeenCalledWith('trailer-slot-abc')
  })

  const testModuleId = 'test_trailer_overlay_addon'
  const originalModule = MODULE_REGISTRY[testModuleId]
  afterEach(() => {
    if (originalModule === undefined) delete MODULE_REGISTRY[testModuleId]
    else MODULE_REGISTRY[testModuleId] = originalModule
  })

  it('enables empty addon controls when a compatible module is registered', () => {
    MODULE_REGISTRY[testModuleId] = {
      ...MODULE_REGISTRY.tb_trailer_hitch,
      id: testModuleId,
      slotType: 'tb_trailer_addon',
      addsSlots: undefined
    }
    const onSlotClick = vi.fn()
    render(
      <TourbusTrailerOverlay
        asset={mockAsset([
          {
            id: 'empty-slot',
            slotType: 'tb_trailer_addon',
            installedModuleId: null
          }
        ])}
        onSlotClick={onSlotClick}
      />
    )
    expect(
      screen.queryByText('Trailer addons are not available yet.')
    ).toBeNull()
    fireEvent.click(screen.getByRole('button'))
    expect(onSlotClick).toHaveBeenCalledWith('empty-slot')
  })

  it('renders zero hotspot buttons when asset has no addon slots', () => {
    const asset = mockAsset([
      { id: 's1', slotType: 'tb_roof', installedModuleId: null }
    ])
    render(<TourbusTrailerOverlay asset={asset} onSlotClick={vi.fn()} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    // The image panel is still rendered
    expect(screen.getByTestId('generated-image-panel')).toBeDefined()
  })
})
