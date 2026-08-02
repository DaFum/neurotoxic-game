import { render, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { BandStatusPanel } from '../../src/ui/hud/shared/SharedHUDComponents'

// `m` is a required, dense BandMember: sanitizeBand guarantees band.members
// carries no null/undefined holes, so BandMemberRow reads `m.` directly.
// Entries are deliberately not exercised with holes here — that would assert a
// contract the component does not have. Density is covered at the sanitizer.
const members = [
  { id: 'm1', name: 'Ada', mood: 82, stamina: 64 },
  { id: 'm2', name: '  Bax  ', mood: 20, stamina: 12 },
  { id: 'm3', name: '', mood: 55, stamina: 40 }
]

const t = (key, options) => options?.defaultValue ?? key

afterEach(cleanup)

describe('BandMemberRow via BandStatusPanel', () => {
  test('renders each member name, mood, and stamina', () => {
    const { getByText, getByLabelText } = render(
      <BandStatusPanel band={{ harmony: 70, members }} t={t} />
    )

    expect(getByText('Ada')).toBeInTheDocument()
    // Names are trimmed before display.
    expect(getByText('Bax')).toBeInTheDocument()
    // A blank name falls back to the localized placeholder.
    expect(getByText('Member')).toBeInTheDocument()

    expect(getByLabelText('Ada Mood')).toHaveAttribute('aria-valuenow', '82')
    expect(getByLabelText('Ada Stamina')).toHaveAttribute('aria-valuenow', '64')
    expect(getByLabelText('Bax Mood')).toHaveAttribute('aria-valuenow', '20')
    expect(getByLabelText('Bax Stamina')).toHaveAttribute('aria-valuenow', '12')
    expect(getByLabelText('Member Mood')).toHaveAttribute('aria-valuenow', '55')
    expect(getByLabelText('Member Stamina')).toHaveAttribute(
      'aria-valuenow',
      '40'
    )
  })

  test('renders one row per member without dropping entries', () => {
    const { getAllByRole } = render(
      <BandStatusPanel band={{ harmony: 70, members }} t={t} />
    )

    // Two bars per member, plus the panel's harmony bar.
    expect(getAllByRole('progressbar')).toHaveLength(members.length * 2 + 1)
  })
})
