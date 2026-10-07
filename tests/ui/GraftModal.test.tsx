import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GraftModal } from '../../src/components/clinic/GraftModal'
import { NEURO_OVERCLOCK_GRAFT_COST } from '../../src/context/gameConstants'
import { getNeuroOverclockEffects } from '../../src/utils/traitUtils'

vi.mock('../../src/ui/shared/Modal', () => ({
  Modal: ({
    isOpen,
    children
  }: {
    isOpen: boolean
    children: React.ReactNode
  }) => (isOpen ? <div role='dialog'>{children}</div> : null)
}))

vi.mock('../../src/utils/numberUtils', () => ({
  formatCurrency: (value: number) => `${value} EUR`
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (_key: string, options?: Record<string, unknown>) =>
      String(options?.defaultValue ?? _key).replace(
        /\{\{(\w+)\}\}/g,
        (_m, name: string) => String(options?.[name])
      )
  })
}))

describe('GraftModal', () => {
  it('states the real one-off and per-gig costs of the graft', () => {
    const { stressPerGig, staminaPerGig } = getNeuroOverclockEffects()

    render(
      <GraftModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        memberName='Matze'
        cost={8500}
      />
    )

    expect(
      screen.getByText(
        `Band Stress: +${NEURO_OVERCLOCK_GRAFT_COST.STRESS} now, +${stressPerGig} after every gig`
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        `Stamina: -${NEURO_OVERCLOCK_GRAFT_COST.STAMINA} now, -${Math.abs(staminaPerGig)} after every gig`
      )
    ).toBeInTheDocument()
    // The graft has no health cost: the member model has no health field.
    expect(screen.queryByText(/HP|Health/i)).not.toBeInTheDocument()
  })
})
