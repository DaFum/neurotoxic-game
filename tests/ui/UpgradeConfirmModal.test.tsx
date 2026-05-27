import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UpgradeConfirmModal } from '../../src/components/assets/UpgradeConfirmModal'
import type { LongTermAsset } from '../../src/types/assets'

const mockUpgradeChassisTier = vi.fn()
const mockState = vi.hoisted(() => ({
  player: { money: 10000 }
}))

const asset: LongTermAsset = {
  id: 'asset-1',
  kind: 'tourbus_chassis',
  chassisFlavor: 'legit',
  chassisTier: 1,
  condition: 100,
  baseUpkeep: 20,
  baseDailyRevenue: 0,
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  baseRiskEventChance: 0.005,
  slots: []
}

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({ upgradeChassisTier: mockUpgradeChassisTier }),
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

vi.mock('../../src/utils/numberUtils', () => ({
  formatCurrency: (value: number) => `${value} EUR`
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, opts?: Record<string, string | number>) => {
      const labels: Record<string, string> = {
        'assets:actions.upgrade': 'Upgrade',
        'assets:actions.upgradeConfirm': `Confirm upgrade for ${opts?.amount}?`,
        'assets:kind.tourbus_chassis': 'Tourbus',
        'assets:chassisTier.1': 'Tier I',
        'assets:chassisTier.2': 'Tier II',
        'assets:purchaseFailed.insufficient_funds': 'Not enough money.',
        'ui:action_cancel': 'Cancel'
      }
      return labels[key] ?? key
    }
  })
}))

describe('UpgradeConfirmModal', () => {
  beforeEach(() => {
    mockState.player.money = 10000
    mockUpgradeChassisTier.mockClear()
  })

  it('upgrades to the next chassis tier after confirmation', () => {
    const onClose = vi.fn()
    render(<UpgradeConfirmModal asset={asset} isOpen onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }))

    expect(mockUpgradeChassisTier).toHaveBeenCalledWith('asset-1', 2)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('keeps confirmation disabled when the player cannot afford the upgrade', () => {
    mockState.player.money = 0

    render(<UpgradeConfirmModal asset={asset} isOpen onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Upgrade' })).toBeDisabled()
    expect(screen.getByText('Not enough money.')).toBeInTheDocument()
  })
})
