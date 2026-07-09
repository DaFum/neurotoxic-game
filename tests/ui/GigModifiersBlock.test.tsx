import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GigModifiersBlock } from '../../src/components/pregig/GigModifiersBlock'
import type { ModifierOption } from '../../src/hooks/usePreGigLogic'

vi.mock('../../src/utils/numberUtils', () => ({
  formatCurrency: (value: number) => `${value} EUR`
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) => key
  })
}))

describe('GigModifiersBlock', () => {
  const defaultProps = {
    t: vi.fn((key, opts) => opts?.defaultValue ?? key),
    gigModifierOptions: [
      { key: 'pyrotechnics', label: 'Pyrotechnics', cost: 100, desc: 'Fire!' },
      { key: 'lightShow', label: 'Light Show', cost: 50, desc: 'Lights!' }
    ] as ModifierOption[],
    gigModifiers: { pyrotechnics: true, lightShow: false },
    toggleModifier: vi.fn(),
    handleBandMeeting: vi.fn(),
    bandMeetingCost: 50,
    currentModifiers: { activeEffects: [] }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modifier options and reflects active state', () => {
    render(<GigModifiersBlock {...defaultProps} />)

    // Check Pyrotechnics is rendered and active
    const pyroButton = screen.getByRole('button', { name: /Pyrotechnics/i })
    expect(pyroButton).toBeInTheDocument()
    expect(pyroButton).toHaveAttribute('aria-pressed', 'true')

    // Check Light Show is rendered and inactive
    const lightButton = screen.getByRole('button', { name: /Light Show/i })
    expect(lightButton).toBeInTheDocument()
    expect(lightButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls toggleModifier when a modifier option is clicked', () => {
    render(<GigModifiersBlock {...defaultProps} />)

    const lightButton = screen.getByRole('button', { name: /Light Show/i })
    fireEvent.click(lightButton)

    expect(defaultProps.toggleModifier).toHaveBeenCalledWith('lightShow')
  })

  it('calls handleBandMeeting when band meeting button is clicked', () => {
    render(<GigModifiersBlock {...defaultProps} />)

    const meetingButton = screen.getByRole('button', {
      name: /ui:pregig.bandMeeting.label/i
    })
    fireEvent.click(meetingButton)

    expect(defaultProps.handleBandMeeting).toHaveBeenCalledTimes(1)
  })

  it('renders active effects from currentModifiers', () => {
    const props = {
      ...defaultProps,
      currentModifiers: {
        activeEffects: [
          'effect1',
          {
            key: 'effect2',
            fallback: 'Effect Two',
            options: {
              amount: 5,
              infinity: Infinity,
              booleanVal: true,
              nullVal: null,
              obj: {}
            }
          }
        ]
      }
    }

    render(<GigModifiersBlock {...props} />)

    expect(screen.getByText('effect1')).toBeInTheDocument()
    expect(screen.getByText('Effect Two')).toBeInTheDocument()
    // Verify that sanitizeEffectOptions correctly filtered out non-finite and complex object values
    expect(props.t).toHaveBeenCalledWith('effect2', {
      amount: 5,
      booleanVal: true,
      nullVal: null,
      defaultValue: 'Effect Two'
    })
  })

  it('renders fallback when no active modifiers are present', () => {
    render(<GigModifiersBlock {...defaultProps} />)

    expect(screen.getByText('ui:pregig.noModifiers')).toBeInTheDocument()
  })
})
