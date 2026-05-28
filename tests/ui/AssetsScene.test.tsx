import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AssetsScene } from '../../src/components/assets/AssetsScene'

const mockChangeScene = vi.fn()
const mockDismissForeclosureNotice = vi.fn()
const mockState = vi.hoisted(() => ({
  player: { money: 1000 },
  band: {},
  social: {},
  assets: [],
  liabilities: [],
  crowdfundCampaigns: [],
  pendingForeclosureNotices: []
}))

const pendingTourbusCampaign = {
  id: 'camp_1',
  assetSpec: {
    kind: 'tourbus_chassis',
    flavor: 'legit',
    chassisTier: 1
  },
  targetAmount: 4000,
  fameStake: 20,
  daysRemaining: 14,
  plannedSuccessRoll: 0.4,
  plannedSuccessProbability: 0.5,
  materializedAssetId: 'campaign_asset',
  materializedSlotIds: []
}

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({
    changeScene: mockChangeScene,
    dismissForeclosureNotice: mockDismissForeclosureNotice
  }),
  useGameSelector: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState)
}))

vi.mock('../../src/utils/assetSelectors', () => ({
  getTotalDailyObligations: () => 0,
  getTotalDebt: () => 0,
  hasActiveAssetAcquisition: (state: typeof mockState, kind: string): boolean =>
    state.assets.some(asset => asset.kind === kind) ||
    state.crowdfundCampaigns.some(campaign => campaign.assetSpec.kind === kind)
}))

vi.mock('../../src/utils/numberUtils', () => ({
  formatCurrency: (value: number) => `${value} EUR`
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) => {
      const labels: Record<string, string> = {
        'assets:scene.title': 'Investments',
        'assets:scene.subtitle': 'Long-term assets and finances',
        'assets:scene.back': 'Back',
        'assets:hub.accessibility.sectionTabs': 'Asset sections',
        'assets:hub.status.cash': 'Cash',
        'assets:hub.status.daily': 'Daily',
        'assets:hub.status.debt': 'Debt',
        'assets:hub.status.noDebt': 'No debt',
        'assets:hub.status.campaigns': 'Campaigns',
        'assets:section.tourbus.title': 'Tourbus',
        'assets:section.studio.title': 'Studio',
        'assets:section.bandhaus.title': 'Band House',
        'assets:section.workshop.title': 'Workshop',
        'assets:kind.tourbus_chassis': 'Tourbus',
        'assets:kind.studio_chassis': 'Studio',
        'assets:kind.bandhaus_chassis': 'Band House',
        'assets:kind.merch_workshop_chassis': 'Workshop',
        'assets:section.tourbus.description': 'Rolling stage',
        'assets:section.studio.description': 'Cut songs',
        'assets:section.bandhaus.description': 'HQ',
        'assets:section.workshop.description': 'Print merch',
        'assets:hub.actions.acquire': 'Acquire',
        'assets:hub.finance.title': 'Finance',
        'assets:hub.finance.noCampaigns': 'No active campaigns',
        'assets:foreclosure': 'Foreclosure',
        'ui:closeModal': 'Close modal',
        'ui:action_close': 'Close',
        'assets:purchaseFailed.acquisition_already_active':
          'Acquisition already in progress',
        'assets:liability.foreclosureNotice': 'Foreclosure notice issued.',
        'assets:liability.paymentDue': 'Payment due: -'
      }
      return labels[key] ?? key
    }
  })
}))

describe('AssetsScene', () => {
  beforeEach(() => {
    mockState.player = { money: 1000 }
    mockState.assets = []
    mockState.liabilities = []
    mockState.crowdfundCampaigns = []
    mockState.pendingForeclosureNotices = []
    mockChangeScene.mockClear()
    mockDismissForeclosureNotice.mockClear()
  })

  it('renders mobile shell with preserved tab ids and panel ids', () => {
    render(<AssetsScene />)

    const tablist = screen.getByRole('tablist', { name: 'Asset sections' })
    expect(tablist).toBeInTheDocument()
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'id',
      'assets-panel-tourbus_chassis'
    )

    const studioTab = screen.getByRole('tab', { name: /Studio/ })
    expect(studioTab).toHaveAttribute('id', 'assets-tab-studio_chassis')
    expect(studioTab).toHaveAttribute(
      'aria-controls',
      'assets-panel-studio_chassis'
    )

    fireEvent.click(studioTab)
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'id',
      'assets-panel-studio_chassis'
    )
  })

  it('does not allow a second acquisition while a section campaign is pending', () => {
    mockState.crowdfundCampaigns = [pendingTourbusCampaign]

    render(<AssetsScene />)

    expect(screen.getByRole('button', { name: 'Acquire' })).toBeDisabled()
    expect(
      screen.getByText('Acquisition already in progress')
    ).toBeInTheDocument()
  })

  it('renders and dismisses the pending foreclosure notice', () => {
    mockState.pendingForeclosureNotices = ['tourbus_chassis']

    render(<AssetsScene />)

    expect(screen.getByRole('dialog', { name: 'Foreclosure' })).toBeVisible()
    expect(
      screen.getByText('Foreclosure notice issued. (Tourbus)')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(mockDismissForeclosureNotice).toHaveBeenCalledWith('tourbus_chassis')
  })
})
