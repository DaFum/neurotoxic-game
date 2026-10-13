import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TFunction } from 'i18next'
import { StatMiniBar } from '../../src/ui/shared/StatMiniBar'
import { BandStatusPanel } from '../../src/ui/hud/shared/SharedHUDComponents'

const locale = vi.hoisted(() => ({ language: 'de' }))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
    i18n: { language: locale.language, changeLanguage: vi.fn(), options: {} }
  })
}))

const t = ((key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue ?? key) as unknown as TFunction

// Testing Library normalizes the German no-break space before "%" to a space.
describe('HUD percent readouts follow the selected language', () => {
  it('floors the stacked StatMiniBar readout and keeps half points inline', () => {
    const { rerender } = render(
      <StatMiniBar
        value={42.7}
        label='Fuel'
        threshold={20}
        color='bg-toxic-green'
        variant='stacked'
      />
    )
    expect(screen.getByText('42 %')).toBeInTheDocument()

    rerender(
      <StatMiniBar
        value={50.5}
        label='Mood'
        threshold={20}
        color='bg-toxic-green'
        variant='inline'
      />
    )
    expect(screen.getByText('50,5 %')).toBeInTheDocument()
  })

  it('renders band harmony as a locale percentage', () => {
    render(<BandStatusPanel band={{ harmony: 73.9, members: [] }} t={t} />)
    expect(screen.getByText('73 %')).toBeInTheDocument()
  })
})
