import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AssetNotifications } from '../../src/components/assets/AssetNotifications'
import type { AssetKind, RiskEventDescriptor } from '../../src/types/assets'

const mockDismissForeclosureNotice = vi.fn()
const mockSetPendingRiskEvent = vi.fn()
const mockState = vi.hoisted(() => ({
  pendingForeclosureNotices: [] as AssetKind[],
  pendingRiskEvent: null as RiskEventDescriptor | null
}))

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({
    dismissForeclosureNotice: mockDismissForeclosureNotice,
    setPendingRiskEvent: mockSetPendingRiskEvent
  }),
  useGameSelector: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState)
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, options?: Record<string, string>) => {
      const labels: Record<string, string> = {
        'assets:foreclosure': 'Foreclosure',
        'assets:risk.event.fire': 'Fire',
        'assets:kind.tourbus_chassis': 'Tourbus',
        'ui:closeModal': 'Close modal',
        'ui:action_close': 'Close',
        'assets:liability.foreclosureNotice': 'Foreclosure notice issued.',
        'assets:liability.foreclosureNoticeWithAsset':
          'Foreclosure notice issued. {{asset}} was removed.'
      }
      const label = labels[key] ?? key
      return options?.asset ? label.replace('{{asset}}', options.asset) : label
    }
  })
}))

describe('AssetNotifications (global asset modal owner)', () => {
  beforeEach(() => {
    mockState.pendingForeclosureNotices = []
    mockState.pendingRiskEvent = null
    mockDismissForeclosureNotice.mockClear()
    mockSetPendingRiskEvent.mockClear()
  })

  it('renders nothing when there are no pending asset notifications', () => {
    render(<AssetNotifications />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('surfaces a pending risk event modal without an Assets scene wrapper', async () => {
    mockState.pendingRiskEvent = {
      assetId: 'asset_1',
      eventType: 'fire',
      conditionLoss: 15
    }

    render(<AssetNotifications />)

    expect(await screen.findByRole('dialog', { name: 'Fire' })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(mockSetPendingRiskEvent).toHaveBeenCalledWith(null)
  })

  it('surfaces and dismisses a pending foreclosure notice', () => {
    mockState.pendingForeclosureNotices = ['tourbus_chassis']

    render(<AssetNotifications />)

    expect(screen.getByRole('dialog', { name: 'Foreclosure' })).toBeVisible()
    expect(
      screen.getByText('Foreclosure notice issued. Tourbus was removed.')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(mockDismissForeclosureNotice).toHaveBeenCalledWith('tourbus_chassis')
  })
})
