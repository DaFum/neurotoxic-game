import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SellConfirmModal } from '../../src/components/assets/SellConfirmModal'
import { CHASSIS_CONFIG } from '../../src/utils/assetConfig'
import type { LongTermAsset } from '../../src/types/assets'

const { mockSellChassis, mockState } = vi.hoisted(() => ({
  mockSellChassis: vi.fn(),
  mockState: {
    player: { day: 10 },
    liabilities: [] as Array<{
      assetId: string
      principalRemaining: number
    }>
  }
}))

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({ sellChassis: mockSellChassis }),
  useGameSelector: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState)
}))

vi.mock('../../src/ui/shared/GeneratedImagePanel', () => ({
  GeneratedImagePanel: ({ alt }: { alt: string }) => <div>{alt}</div>
}))

vi.mock('../../src/ui/shared/Modal', () => ({
  Modal: ({
    children,
    isOpen,
    title
  }: {
    children: React.ReactNode
    isOpen: boolean
    title: string
  }) =>
    isOpen ? (
      <div role='dialog' aria-label={title}>
        {children}
      </div>
    ) : null
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, options?: Record<string, unknown>) => {
      const labels: Record<string, string> = {
        'assets:actions.sell': 'Sell',
        'assets:sellFailed.liability_exceeds_value': 'Debt exceeds sale value',
        'assets:kind.tourbus_chassis': 'Tourbus',
        'ui:action_cancel': 'Cancel'
      }
      return labels[key] ?? String(options?.defaultValue ?? key)
    }
  })
}))

const makeAsset = (): LongTermAsset => {
  const config = CHASSIS_CONFIG.tourbus_chassis.legit[1]
  return {
    id: 'asset-1',
    kind: 'tourbus_chassis',
    chassisFlavor: 'legit',
    chassisTier: 1,
    condition: 100,
    baseUpkeep: config.upkeep,
    baseDailyRevenue: config.revenue,
    acquiredOnDay: 10,
    acquisitionMode: 'loan',
    baseRiskEventChance: config.baseRiskEventChance,
    slots: []
  }
}

describe('SellConfirmModal', () => {
  it('blocks the sale when sanitized liability debt exceeds gross sale value', () => {
    const asset = makeAsset()
    const grossSaleValue = CHASSIS_CONFIG.tourbus_chassis.legit[1].price
    mockState.liabilities = [
      {
        assetId: asset.id,
        principalRemaining: grossSaleValue + 1
      },
      {
        assetId: asset.id,
        principalRemaining: Number.NaN
      },
      {
        assetId: asset.id,
        principalRemaining: -10000
      }
    ]

    render(<SellConfirmModal asset={asset} isOpen onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Sell' })).toBeDisabled()
    expect(screen.getByText('Debt exceeds sale value')).toBeInTheDocument()
  })
})
