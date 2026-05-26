import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { WorkshopProductionLineView } from '../../src/components/assets/sections/WorkshopProductionLineView'
import type { LongTermAsset, SlotType } from '../../src/types/assets'

interface CapturedPanelProps {
  alt: string
  aspectRatio?: string
  className?: string
  sizeHint?: { width: number; height: number }
}

const capturedPanels: CapturedPanelProps[] = []

vi.mock('../../src/ui/shared/GeneratedImagePanel', () => ({
  GeneratedImagePanel: (props: CapturedPanelProps) => {
    capturedPanels.push(props)
    return (
      <div
        role='img'
        aria-label={props.alt}
        data-testid='generated-image-panel'
        data-aspect-ratio={props.aspectRatio}
        className={props.className}
      />
    )
  }
}))

vi.mock('../../src/utils/imageGen', () => ({
  getSectionBackgroundPrompt: vi.fn(
    (kind: string, flavor: string) => `bg:${kind}:${flavor}`
  ),
  getModuleImagePrompt: vi.fn((moduleId: string) => `module:${moduleId}`)
}))

const translations: Record<string, string> = {
  'assets:section.workshop.alt': 'Localized workshop production line',
  'assets:slot.mw_print': 'Print station',
  'assets:slot.mw_drying': 'Drying',
  'assets:slot.mw_storage': 'Storage',
  'assets:slot.mw_specialty': 'Specialty',
  'assets:slot.mw_automation': 'Automation',
  'assets:slot.mw_sales': 'Sales channel',
  'assets:module.mw_4color_carousel.name': '4-color carousel'
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
  id: 'asset-workshop-1',
  kind: 'merch_workshop_chassis',
  chassisFlavor: 'legit',
  chassisTier: 3,
  condition: 100,
  baseUpkeep: 18,
  baseDailyRevenue: 15,
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  baseRiskEventChance: 0.003,
  slots: slots.map(s => ({
    id: s.id,
    slotType: s.slotType,
    position: { x: 0, y: 0 },
    installedModuleId: s.installedModuleId
  }))
})

describe('WorkshopProductionLineView', () => {
  beforeEach(() => {
    capturedPanels.length = 0
    vi.clearAllMocks()
  })

  it('renders 21:9 ultrawide background', () => {
    const asset = mockAsset([
      { id: 's1', slotType: 'mw_print', installedModuleId: null }
    ])
    render(<WorkshopProductionLineView asset={asset} onSlotClick={vi.fn()} />)

    expect(
      screen.getByRole('img', { name: 'Localized workshop production line' })
    ).toBeInTheDocument()
    expect(capturedPanels[0]).toMatchObject({
      alt: 'Localized workshop production line',
      aspectRatio: '21:9',
      sizeHint: { width: 1680, height: 720 }
    })
  })

  it('stations are laid out horizontally along the production line', () => {
    const asset = mockAsset([
      { id: 'print', slotType: 'mw_print', installedModuleId: null },
      { id: 'drying', slotType: 'mw_drying', installedModuleId: null },
      { id: 'cutting', slotType: 'mw_cutting', installedModuleId: null },
      { id: 'packaging', slotType: 'mw_packaging', installedModuleId: null },
      { id: 'storage', slotType: 'mw_storage', installedModuleId: null }
    ])
    render(<WorkshopProductionLineView asset={asset} onSlotClick={vi.fn()} />)

    const print = screen.getByRole('button', { name: 'Print station' })
    const drying = screen.getByRole('button', {
      name: 'Drying'
    })
    const storage = screen.getByRole('button', {
      name: 'Storage'
    })

    expect(print.style.left).toBe('2.5%')
    expect(print.style.top).toBe('25%')
    expect(Number.parseFloat(drying.style.left)).toBeGreaterThan(
      Number.parseFloat(print.style.left)
    )
    expect(Number.parseFloat(storage.style.left)).toBeGreaterThan(
      Number.parseFloat(drying.style.left)
    )
    expect(storage.style.top).toBe('25%')
  })

  it('automation and specialty render above while sales renders at the right gate', () => {
    const asset = mockAsset([
      { id: 'specialty', slotType: 'mw_specialty', installedModuleId: null },
      { id: 'automation', slotType: 'mw_automation', installedModuleId: null },
      { id: 'sales', slotType: 'mw_sales', installedModuleId: null }
    ])
    render(<WorkshopProductionLineView asset={asset} onSlotClick={vi.fn()} />)

    const specialty = screen.getByRole('button', {
      name: 'Specialty'
    })
    const automation = screen.getByRole('button', {
      name: 'Automation'
    })
    const sales = screen.getByRole('button', { name: 'Sales channel' })

    expect(specialty.style.top).toBe('5%')
    expect(automation.style.top).toBe('5%')
    expect(sales.style.left).toBe('82.5%')
    expect(sales.style.height).toBe('80%')
  })

  it('renders installed modules through GeneratedImagePanel and handles slot clicks', () => {
    const onSlotClick = vi.fn()
    const asset = mockAsset([
      {
        id: 'slot-print-xyz',
        slotType: 'mw_print',
        installedModuleId: 'mw_4color_carousel'
      }
    ])
    render(
      <WorkshopProductionLineView asset={asset} onSlotClick={onSlotClick} />
    )

    const button = screen.getByRole('button', {
      name: 'Print station: 4-color carousel'
    })
    within(button).getByRole('img', {
      name: '4-color carousel'
    })
    fireEvent.click(button)
    expect(onSlotClick).toHaveBeenCalledWith('slot-print-xyz')
  })
})
