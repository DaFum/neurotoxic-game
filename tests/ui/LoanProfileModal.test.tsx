import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LoanProfileModal } from '../../src/components/assets/LoanProfileModal'
import { LOAN_PROFILES } from '../../src/utils/loanProfiles'

const profileLabels: Record<string, string> = {
  'assets.loan.profile.shortTerm': 'Short term',
  'assets.loan.profile.mediumTerm': 'Medium term',
  'assets.loan.profile.longTerm': 'Long term',
  'assets.loan.profile.loanShark': 'Loan shark',
  'assets.loan.profile.coop': 'Co-op'
}

vi.mock('../../src/ui/shared/GeneratedImagePanel', () => ({
  GeneratedImagePanel: ({ alt }: { alt: string }) => (
    <div data-testid='loan-profile-image'>{alt}</div>
  )
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string, options?: { days?: number; rate?: string }) => {
      const labels: Record<string, string> = {
        'assets:mode.loan': 'Loan',
        ...profileLabels,
        'ui:closeModal': 'Close modal'
      }
      if (key === 'assets:loan.profileMeta') {
        return `${options?.days ?? 0} days / ${options?.rate ?? '0'}%`
      }
      return labels[key] ?? key
    }
  })
}))

describe('LoanProfileModal', () => {
  it('renders every configured loan profile', () => {
    render(<LoanProfileModal isOpen onClose={vi.fn()} onSelect={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Loan' })).toBeVisible()

    for (const profile of Object.values(LOAN_PROFILES)) {
      expect(
        screen.getAllByText(profileLabels[profile.labelKey]).length
      ).toBeGreaterThan(0)
    }
  })

  it('selects a profile and closes the modal', () => {
    const onClose = vi.fn()
    const onSelect = vi.fn()

    render(<LoanProfileModal isOpen onClose={onClose} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', { name: /Short term/ }))

    expect(onSelect).toHaveBeenCalledWith('shortTerm')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
