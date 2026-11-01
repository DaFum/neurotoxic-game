import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RepairConfirmModal } from '../../src/components/assets/RepairConfirmModal'
import { ChassisAcquisitionModal } from '../../src/components/assets/ChassisAcquisitionModal'
import {
  calculateChassisRepairCost,
  CHASSIS_CONFIG
} from '../../src/utils/assets/assetConfig'
import {
  calculateTotalRepayment,
  computeAmortization,
  LOAN_PROFILES
} from '../../src/utils/assets/loanProfiles'
import { formatCurrency } from '../../src/utils/numberUtils'
import type { LongTermAsset } from '../../src/types/assets'

// #3464: the action creators gate on spendable cash, so the modals must too.
// Each test holds exactly the price on hand but protects all of it.
const repairChassisMock = vi.hoisted(() => vi.fn())
const purchaseChassisMock = vi.hoisted(() => vi.fn())

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
    purchaseChassis: purchaseChassisMock,
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
    // Interpolated values are appended so cost previews can be asserted.
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}(${Object.values(options).join('|')})` : key
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
    purchaseChassisMock.mockReset()
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

  // #3499 finding 12: a refused purchase keeps the modal open (toast shown).
  it('ChassisAcquisitionModal stays open when the purchase is refused', () => {
    mockState.player.money = 100_000
    const onClose = vi.fn()
    purchaseChassisMock.mockReturnValue(false)
    render(
      <ChassisAcquisitionModal
        kind='tourbus_chassis'
        isOpen
        onClose={onClose}
      />
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'assets:actions.purchase' })
    )
    expect(purchaseChassisMock).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('ChassisAcquisitionModal closes when the purchase is accepted', () => {
    mockState.player.money = 100_000
    const onClose = vi.fn()
    purchaseChassisMock.mockReturnValue(true)
    render(
      <ChassisAcquisitionModal
        kind='tourbus_chassis'
        isOpen
        onClose={onClose}
      />
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'assets:actions.purchase' })
    )
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // #3499 finding 11: daily payment, upkeep and total repayment are visible
  // before purchase, priced by the reducer's own loan math.
  it('ChassisAcquisitionModal previews upkeep, daily payment and total repayment', () => {
    const cfg = CHASSIS_CONFIG.tourbus_chassis.legit[1]
    render(
      <ChassisAcquisitionModal
        kind='tourbus_chassis'
        isOpen
        onClose={vi.fn()}
      />
    )
    expect(
      screen.getByText(
        `assets:chassisAcquisition.upkeep(${formatCurrency(cfg.upkeep, 'en')})`
      )
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'assets:mode.loan' }))

    const profile = LOAN_PROFILES.shortTerm
    const daily = computeAmortization(
      cfg.price,
      profile.interestRate,
      profile.termDays
    )
    const total = calculateTotalRepayment(daily, profile.termDays)
    expect(total).toBeGreaterThan(cfg.price)
    expect(
      screen.getByText(
        `assets:loan.quote(${formatCurrency(daily, 'en')}|${formatCurrency(total, 'en')})`
      )
    ).toBeInTheDocument()
  })

  // #3499 finding 12: the grid applies the creator's eligibility predicate,
  // so an ineligible profile cannot be submitted into a refusal.
  describe('LoanProfileChoiceGrid eligibility', () => {
    const renderLoanMode = () => {
      render(
        <ChassisAcquisitionModal
          kind='tourbus_chassis'
          isOpen
          onClose={vi.fn()}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: 'assets:mode.loan' }))
      return screen.getByRole('button', { name: /assets:loan\.profile\.coop/ })
    }

    beforeEach(() => {
      mockState.social.scenePresence = 0
    })

    it('disables a profile whose scene presence gate is unmet and names the requirement', () => {
      const coop = renderLoanMode()
      const minScenePresence = LOAN_PROFILES.coop.minScenePresenceRequired
      expect(minScenePresence).toBe(50)

      expect(coop).toBeDisabled()
      const requirement = screen.getByText(
        `assets:loan.requirement.scenePresence(${minScenePresence})`
      )
      expect(coop).toHaveAttribute('aria-describedby', requirement.id)
      expect(
        screen.getByRole('button', { name: /assets:loan\.profile\.shortTerm/ })
      ).toBeEnabled()
    })

    it('enables the profile once scene presence meets the gate', () => {
      mockState.social.scenePresence = 50
      expect(renderLoanMode()).toBeEnabled()
    })
  })
})
