import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LiabilitiesPanel } from '../../src/components/assets/LiabilitiesPanel'
import { calculateRefinanceFee } from '../../src/utils/assets/loanProfiles'

// #3485 item 2: the refinance creator refuses an unaffordable fee (spendable
// view during a run), so the panel's button must apply the same gate.
const PRINCIPAL = 2000
const FEE = calculateRefinanceFee(PRINCIPAL)

const mockState = vi.hoisted(() => ({
  player: { money: 0 },
  expedition: { status: 'idle' } as Record<string, unknown>,
  liabilities: {
    'loan-1': {
      id: 'loan-1',
      source: 'loan',
      assetId: 'asset-1',
      principalRemaining: 2000,
      interestRate: 0.1,
      dailyPayment: 50,
      termDaysRemaining: 30,
      defaultCounter: 0
    }
  }
}))

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({ refinanceLiability: vi.fn() }),
  useGameSelector: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState)
}))

vi.mock('../../src/components/assets/LoanProfileModal', () => ({
  LoanProfileModal: () => null
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) => key
  })
}))

const getRefinanceButton = () =>
  screen.getByRole('button', { name: 'assets:loan.refinance' })

describe('LiabilitiesPanel refinance affordability', () => {
  beforeEach(() => {
    mockState.expedition = { status: 'idle' }
  })

  afterEach(() => {
    cleanup()
  })

  it('disables refinance when the fee is unaffordable outside a run', () => {
    mockState.player.money = FEE - 1
    render(<LiabilitiesPanel />)
    expect(getRefinanceButton()).toBeDisabled()
  })

  it('disables refinance when only protected Expedition cash covers the fee', () => {
    mockState.player.money = FEE
    mockState.expedition = { status: 'active', protectedCareerCash: 1 }
    render(<LiabilitiesPanel />)
    expect(getRefinanceButton()).toBeDisabled()
  })

  it('enables refinance when the fee is affordable', () => {
    mockState.player.money = FEE
    render(<LiabilitiesPanel />)
    expect(getRefinanceButton()).toBeEnabled()
  })
})
