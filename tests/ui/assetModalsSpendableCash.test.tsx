import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RepairConfirmModal } from '../../src/components/assets/RepairConfirmModal'
import { ChassisAcquisitionModal } from '../../src/components/assets/ChassisAcquisitionModal'
import {
  calculateChassisRepairCost,
  CHASSIS_CONFIG
} from '../../src/utils/assets/assetConfig'
import type { LongTermAsset } from '../../src/types/assets'

// #3464: the action creators gate on spendable cash, so the modals must too.
// Each test holds exactly the price on hand but protects all of it.
const repairChassisMock = vi.hoisted(() => vi.fn())

const mockState = vi.hoisted(() => ({
  expedition: undefined as unknown,
  player: { money: 1000, fame: 0 },
  social: { scenePresence: 0 },
  assets: [],
  acquisitionCampaigns: []
}))

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({
    repairChassis: repairChassisMock,
    purchaseChassis: vi.fn(),
    startCrowdfund: vi.fn()
  }),
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
    t: (key: string) => key
  })
}))

const damagedAsset: LongTermAsset = {
  id: 'asset-1',
  kind: 'tourbus_chassis',
  chassisFlavor: 'legit',
  chassisTier: 1,
  condition: 80,
  baseUpkeep: 20,
  baseDailyRevenue: 0,
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  baseRiskEventChance: 0.005,
  slots: []
}

describe('asset modals gate on spendable Expedition cash (#3464)', () => {
  const protectEverything = (money: number) => {
    mockState.player.money = money
    mockState.expedition = { status: 'active', protectedCareerCash: money }
  }

  beforeEach(() => {
    mockState.expedition = undefined
    mockState.player.money = 1000
    repairChassisMock.mockReset()
  })

  // #3485 item 4: a refusal keeps the modal open next to its toast.
  it('RepairConfirmModal closes only when the repair was accepted', () => {
    const onClose = vi.fn()
    repairChassisMock.mockReturnValue(true)
    render(<RepairConfirmModal asset={damagedAsset} isOpen onClose={onClose} />)
    fireEvent.click(
      screen.getByRole('button', { name: 'assets:actions.repair' })
    )
    expect(repairChassisMock).toHaveBeenCalledWith(damagedAsset.id)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('RepairConfirmModal stays open when the creator refuses the repair', () => {
    const onClose = vi.fn()
    repairChassisMock.mockReturnValue(false)
    render(<RepairConfirmModal asset={damagedAsset} isOpen onClose={onClose} />)
    fireEvent.click(
      screen.getByRole('button', { name: 'assets:actions.repair' })
    )
    expect(repairChassisMock).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('RepairConfirmModal disables a repair only protected cash could pay', () => {
    const cost = calculateChassisRepairCost(damagedAsset.condition)
    expect(cost).toBeGreaterThan(0)
    protectEverything(cost)

    render(<RepairConfirmModal asset={damagedAsset} isOpen onClose={vi.fn()} />)

    expect(
      screen.getByRole('button', { name: 'assets:actions.repair' })
    ).toBeDisabled()
  })

  it('ChassisAcquisitionModal flags a cash purchase only protected cash could pay', () => {
    protectEverything(CHASSIS_CONFIG.tourbus_chassis.legit[1].price)
    render(
      <ChassisAcquisitionModal
        kind='tourbus_chassis'
        isOpen
        onClose={vi.fn()}
      />
    )

    expect(
      screen.getAllByText('assets:purchaseFailed.insufficient_funds').length
    ).toBeGreaterThan(0)
  })
})
