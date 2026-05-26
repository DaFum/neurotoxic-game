import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { StudioFloorplanView } from '../../src/components/assets/sections/StudioFloorplanView'
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
  getModuleImagePrompt: vi.fn((moduleId: string) => `module:${moduleId}`)
}))

// Identity `t` so aria-labels surface the raw key in test assertions.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

const mockAsset = (
  slots: Array<{
    id: string
    slotType: SlotType
    installedModuleId: string | null
  }>
): LongTermAsset => ({
  id: 'asset-studio-1',
  kind: 'studio_chassis',
  chassisFlavor: 'legit',
  chassisTier: 1,
  condition: 100,
  baseUpkeep: 20,
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

describe('StudioFloorplanView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders one zone button per slot whose slotType has a STUDIO_SLOT_ZONES entry', () => {
    const asset = mockAsset([
      { id: 's1', slotType: 'st_control', installedModuleId: null },
      { id: 's2', slotType: 'st_mic', installedModuleId: null },
      { id: 's3', slotType: 'st_monitoring', installedModuleId: null }
    ])
    render(<StudioFloorplanView asset={asset} onSlotClick={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('computes correct zone position for st_control', () => {
    // st_control: { x: 0.5, y: 0.55, w: 0.3, h: 0.2 }
    // left: (0.5 - 0.3/2) * 100 = 35%
    // top:  (0.55 - 0.2/2) * 100 = 45%
    // width: 0.3 * 100 = 30%
    // height: 0.2 * 100 = 20%
    const asset = mockAsset([
      { id: 's1', slotType: 'st_control', installedModuleId: null }
    ])
    render(<StudioFloorplanView asset={asset} onSlotClick={vi.fn()} />)
    const button = screen.getByRole('button', {
      name: 'assets:slot.st_control'
    })
    expect(button.style.left).toBe('35%')
    expect(button.style.top).toBe('45%')
    expect(button.style.width).toBe('30%')
    expect(button.style.height).toBe('20%')
  })

  it('renders a GeneratedImagePanel thumbnail inside the button when a module is installed', () => {
    const asset = mockAsset([
      { id: 's1', slotType: 'st_control', installedModuleId: 'st_ssl_console' },
      { id: 's2', slotType: 'st_mic', installedModuleId: null }
    ])
    render(<StudioFloorplanView asset={asset} onSlotClick={vi.fn()} />)
    const installedButton = screen.getByRole('button', {
      name: 'assets:slot.st_control'
    })
    // The mock renders GeneratedImagePanel as <img>, so there should be an img inside
    within(installedButton).getByRole('img')
  })

  it('calls onSlotClick with the correct slot id when a zone button is clicked', () => {
    const onSlotClick = vi.fn()
    const asset = mockAsset([
      { id: 'slot-ctrl-xyz', slotType: 'st_control', installedModuleId: null }
    ])
    render(<StudioFloorplanView asset={asset} onSlotClick={onSlotClick} />)
    const button = screen.getByRole('button', {
      name: 'assets:slot.st_control'
    })
    fireEvent.click(button)
    expect(onSlotClick).toHaveBeenCalledWith('slot-ctrl-xyz')
  })
})
