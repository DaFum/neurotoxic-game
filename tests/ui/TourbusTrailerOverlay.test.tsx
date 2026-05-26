import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TourbusTrailerOverlay } from '../../src/components/assets/sections/TourbusTrailerOverlay'
import type { LongTermAsset, SlotType } from '../../src/types/assets'

vi.mock('../../src/ui/shared/GeneratedImagePanel', () => ({
  GeneratedImagePanel: ({ alt }: { alt: string }) => (
    <div data-testid='generated-image-panel' role='img' aria-label={alt} />
  )
}))

vi.mock('../../src/utils/imageGen', () => ({
  getTrailerImagePrompt: vi.fn((flavor: string) => `trailer:${flavor}`)
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

  it('renders one hotspot button per tb_trailer_addon slot', () => {
    const asset = mockAsset([
      { id: 'slot-1', slotType: 'tb_trailer_addon', installedModuleId: null },
      { id: 'slot-2', slotType: 'tb_trailer_addon', installedModuleId: null }
    ])
    render(<TourbusTrailerOverlay asset={asset} onSlotClick={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('calls onSlotClick with the slot id when a hotspot is clicked', () => {
    const onSlotClick = vi.fn()
    const asset = mockAsset([
      {
        id: 'trailer-slot-abc',
        slotType: 'tb_trailer_addon',
        installedModuleId: null
      }
    ])
    render(<TourbusTrailerOverlay asset={asset} onSlotClick={onSlotClick} />)
    const button = screen.getByRole('button', { name: 'slot tb_trailer_addon' })
    fireEvent.click(button)
    expect(onSlotClick).toHaveBeenCalledWith('trailer-slot-abc')
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
