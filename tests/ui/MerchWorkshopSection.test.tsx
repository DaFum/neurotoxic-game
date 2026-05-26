import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MerchWorkshopSection } from '../../src/components/assets/sections/MerchWorkshopSection'
import { SECTION_VIEWS } from '../../src/components/assets/sectionRegistry'
import type { LongTermAsset, SlotType } from '../../src/types/assets'

const mockState = vi.hoisted(() => ({
  assets: [] as LongTermAsset[]
}))

const capturedProductionLineProps = vi.hoisted(
  () =>
    [] as Array<{
      asset: LongTermAsset
      onSlotClick: (slotId: string) => void
    }>
)

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState)
}))

vi.mock(
  '../../src/components/assets/sections/WorkshopProductionLineView',
  () => ({
    WorkshopProductionLineView: (props: {
      asset: LongTermAsset
      onSlotClick: (slotId: string) => void
    }) => {
      capturedProductionLineProps.push(props)
      return (
        <button
          type='button'
          data-testid='workshop-line'
          onClick={() => props.onSlotClick('slot-print-1')}
        >
          {props.asset.id}
        </button>
      )
    }
  })
)

vi.mock('../../src/components/assets/ModulePickerModal', () => ({
  ModulePickerModal: ({
    asset,
    slotId,
    isOpen
  }: {
    asset: LongTermAsset
    slotId: string
    isOpen: boolean
  }) =>
    isOpen ? (
      <div data-testid='module-picker'>
        {asset.id}:{slotId}
      </div>
    ) : null
}))

vi.mock('../../src/components/assets/ChassisAcquisitionModal', () => ({
  ChassisAcquisitionModal: ({
    kind,
    isOpen
  }: {
    kind: string
    isOpen: boolean
  }) => (isOpen ? <div data-testid='acquire-modal'>{kind}</div> : null)
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

const mockAsset = (id: string, kind: LongTermAsset['kind']): LongTermAsset => ({
  id,
  kind,
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
      id: `${id}-slot`,
      slotType: (kind === 'merch_workshop_chassis'
        ? 'mw_print'
        : 'st_control') as SlotType,
      position: { x: 0, y: 0 },
      installedModuleId: null
    }
  ]
})

describe('MerchWorkshopSection', () => {
  beforeEach(() => {
    mockState.assets = []
    capturedProductionLineProps.length = 0
    vi.clearAllMocks()
  })

  it('is registered with the warning-yellow accent', () => {
    expect(SECTION_VIEWS.merch_workshop_chassis).toMatchObject({
      Component: MerchWorkshopSection,
      accent: 'var(--color-warning-yellow)'
    })
  })

  it('renders production line views for workshop assets only', () => {
    mockState.assets = [
      mockAsset('workshop-1', 'merch_workshop_chassis'),
      mockAsset('studio-1', 'studio_chassis')
    ]

    render(<MerchWorkshopSection />)

    expect(screen.getAllByTestId('workshop-line')).toHaveLength(1)
    expect(capturedProductionLineProps[0]?.asset.id).toBe('workshop-1')
  })

  it('opens module picker when a production-line slot is selected', () => {
    mockState.assets = [mockAsset('workshop-1', 'merch_workshop_chassis')]

    render(<MerchWorkshopSection />)
    fireEvent.click(screen.getByTestId('workshop-line'))

    expect(screen.getByTestId('module-picker')).toHaveTextContent(
      'workshop-1:slot-print-1'
    )
  })

  it('opens merch workshop acquisition modal when no workshop exists', () => {
    render(<MerchWorkshopSection />)

    fireEvent.click(
      screen.getByRole('button', { name: 'assets:actions.purchase' })
    )

    expect(screen.getByTestId('acquire-modal')).toHaveTextContent(
      'merch_workshop_chassis'
    )
  })
})
