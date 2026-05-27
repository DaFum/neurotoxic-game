import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AssetsStatusStrip } from '../../src/components/assets/AssetsStatusStrip'

const mockState = vi.hoisted(() => ({
  player: { money: 1234 },
  band: {},
  social: {},
  assets: [],
  liabilities: [{ id: 'l1', principalRemaining: 450, dailyPayment: 12 }],
  crowdfundCampaigns: [{ id: 'c1' }]
}))

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState)
}))

vi.mock('../../src/utils/assetSelectors', () => ({
  getTotalDailyObligations: () => 37,
  getTotalDebt: () => 450
}))

vi.mock('../../src/utils/numberUtils', () => ({
  formatCurrency: (value: number, _language?: string, sign?: string) =>
    sign === 'always'
      ? value >= 0
        ? `+${value} EUR`
        : `${value} EUR`
      : `${value} EUR`
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) => {
      const labels: Record<string, string> = {
        'assets:scene.title': 'Investments',
        'assets:hub.status.cash': 'Cash',
        'assets:hub.status.daily': 'Daily',
        'assets:hub.status.debt': 'Debt',
        'assets:hub.status.campaigns': 'Campaigns'
      }
      return labels[key] ?? key
    }
  })
}))

describe('AssetsStatusStrip', () => {
  it('shows cash, daily obligations, debt, and campaign count', () => {
    render(<AssetsStatusStrip />)

    expect(screen.getByText('Investments')).toBeInTheDocument()
    expect(screen.getByText('Cash')).toBeInTheDocument()
    expect(screen.getByText('1234 EUR')).toBeInTheDocument()
    expect(screen.getByText('Daily')).toBeInTheDocument()
    expect(screen.getByText('-37 EUR')).toBeInTheDocument()
    expect(screen.getByText('Debt')).toBeInTheDocument()
    expect(screen.getByText('450 EUR')).toBeInTheDocument()
    expect(screen.getByText('Campaigns')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
