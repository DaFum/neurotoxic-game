import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { BandhausCrossSectionView } from '../../src/components/assets/sections/BandhausCrossSectionView'
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

const translations: Record<string, string> = {
  'assets:slot.bh_stage': 'Stage area',
  'assets:slot.bh_kitchen': 'Kitchen',
  'assets:slot.bh_sleeping': 'Sleeping quarters',
  'assets:slot.bh_secret': 'Secret room',
  'assets:slot.bh_identity': 'House identity',
  'assets:module.bh_wall_mural.name': 'Wall mural'
}

vi.mock('react-i18next', () => ({
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
  }>,
  chassisTier: number = 3
): LongTermAsset => ({
  id: 'asset-bandhaus-1',
  kind: 'bandhaus_chassis',
  chassisFlavor: 'punk',
  chassisTier,
  condition: 100,
  baseUpkeep: 30,
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

describe('BandhausCrossSectionView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders one button per visible slot at tier 3', () => {
    const asset = mockAsset(
      [
        { id: 's1', slotType: 'bh_stage', installedModuleId: null },
        { id: 's2', slotType: 'bh_kitchen', installedModuleId: null },
        { id: 's3', slotType: 'bh_sleeping', installedModuleId: null },
        { id: 's4', slotType: 'bh_secret', installedModuleId: null }
      ],
      3
    )
    render(<BandhausCrossSectionView asset={asset} onSlotClick={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  it('hides bh_secret slot when chassisTier < 3', () => {
    const asset = mockAsset(
      [
        { id: 's1', slotType: 'bh_stage', installedModuleId: null },
        { id: 's2', slotType: 'bh_kitchen', installedModuleId: null },
        { id: 's3', slotType: 'bh_sleeping', installedModuleId: null },
        { id: 's4', slotType: 'bh_secret', installedModuleId: null }
      ],
      2
    )
    render(<BandhausCrossSectionView asset={asset} onSlotClick={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: 'Secret room' })).toBeNull()
  })

  it('renders a GeneratedImagePanel thumbnail inside bh_identity button when module is installed', () => {
    const asset = mockAsset(
      [
        {
          id: 's1',
          slotType: 'bh_identity',
          installedModuleId: 'bh_wall_mural'
        }
      ],
      3
    )
    render(<BandhausCrossSectionView asset={asset} onSlotClick={vi.fn()} />)
    const muralButton = screen.getByRole('button', {
      name: 'House identity: Wall mural'
    })
    within(muralButton).getByRole('img')
  })

  it('calls onSlotClick with the correct slot id when a zone button is clicked', () => {
    const onSlotClick = vi.fn()
    const asset = mockAsset([
      { id: 'slot-stage-xyz', slotType: 'bh_stage', installedModuleId: null }
    ])
    render(<BandhausCrossSectionView asset={asset} onSlotClick={onSlotClick} />)
    const button = screen.getByRole('button', {
      name: 'Stage area'
    })
    fireEvent.click(button)
    expect(onSlotClick).toHaveBeenCalledWith('slot-stage-xyz')
  })

  it('computes correct zone position for bh_stage', () => {
    // bh_stage: { x: 0.3, y: 0.55, w: 0.4, h: 0.2 }
    // left: (0.3 - 0.4/2) * 100 = 10%
    // top:  (0.55 - 0.2/2) * 100 = 45%
    // width: 0.4 * 100 = 40%
    // height: 0.2 * 100 = 20%
    const asset = mockAsset([
      { id: 's1', slotType: 'bh_stage', installedModuleId: null }
    ])
    render(<BandhausCrossSectionView asset={asset} onSlotClick={vi.fn()} />)
    const button = screen.getByRole('button', {
      name: 'Stage area'
    })
    expect(button.style.left).toBe('10%')
    expect(button.style.top).toBe('45%')
    expect(button.style.width).toBe('40%')
    expect(button.style.height).toBe('20%')
  })
})
