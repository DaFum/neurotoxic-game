import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MerchWorkshopSection } from '../../src/components/assets/sections/MerchWorkshopSection'
import { SECTION_VIEWS } from '../../src/components/assets/sectionRegistry'
import type { Liability, LongTermAsset, SlotType } from '../../src/types/assets'

const mockState = vi.hoisted(() => ({
  assets: [] as LongTermAsset[],
  crowdfundCampaigns: [],
  liabilities: [] as Liability[]
}))

const mockRefinanceLiability = vi.hoisted(() => vi.fn())

const capturedProductionLineProps = vi.hoisted(
  () =>
    [] as Array<{
      asset: LongTermAsset
      onSlotClick: (slotId: string) => void
    }>
)

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({
    refinanceLiability: mockRefinanceLiability
  }),
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

vi.mock('../../src/components/assets/AssetSlotActionList', () => ({
  AssetSlotActionList: ({
    asset,
    onSlotClick
  }: {
    asset: LongTermAsset
    onSlotClick: (slotId: string) => void
  }) => (
    <button
      type='button'
      data-testid='slot-action-list'
      onClick={() => onSlotClick(asset.slots[0]?.id ?? 'missing')}
    >
      slot list
    </button>
  )
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
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => (key === 'assets:mode.loan' ? 'Loan' : key),
    i18n: { language: 'en', changeLanguage: vi.fn(), options: {} }
  })
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
    mockState.liabilities = []
    capturedProductionLineProps.length = 0
    mockRefinanceLiability.mockClear()
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

  it('opens module picker from the compact slot action list', () => {
    mockState.assets = [mockAsset('workshop-1', 'merch_workshop_chassis')]

    render(<MerchWorkshopSection />)
    fireEvent.click(screen.getByTestId('slot-action-list'))

    expect(screen.getByTestId('module-picker')).toHaveTextContent(
      'workshop-1:workshop-1-slot'
    )
  })

  it('opens merch workshop acquisition modal when no workshop exists', () => {
    render(<MerchWorkshopSection />)

    fireEvent.click(
      screen.getByRole('button', { name: 'assets:hub.actions.acquire' })
    )

    expect(screen.getByTestId('acquire-modal')).toHaveTextContent(
      'merch_workshop_chassis'
    )
  })

  it('translates liability source labels', () => {
    mockState.assets = [mockAsset('workshop-1', 'merch_workshop_chassis')]
    mockState.liabilities = [
      {
        id: 'liability-1',
        source: 'loan',
        assetId: 'workshop-1',
        principalRemaining: 1000,
        interestRate: 0.08,
        dailyPayment: 50,
        termDaysRemaining: 20,
        defaultCounter: 0
      }
    ]

    render(<MerchWorkshopSection />)

    expect(screen.getByText('Loan')).toBeInTheDocument()
  })
})
