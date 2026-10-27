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
    canAffordModifier: vi.fn(() => true),
    toggleModifier: vi.fn(),
    handleBandMeeting: vi.fn(),
    bandMeetingCost: 50,
    canAffordBandMeeting: true,
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

  it('disables an unaffordable modifier that is not yet active', () => {
    const canAffordModifier = vi.fn((key: string) => key !== 'lightShow')
    render(
      <GigModifiersBlock
        {...defaultProps}
        canAffordModifier={canAffordModifier}
      />
    )

    const lightButton = screen.getByRole('button', { name: /Light Show/i })
    expect(lightButton).toBeDisabled()
    fireEvent.click(lightButton)
    expect(defaultProps.toggleModifier).not.toHaveBeenCalled()
  })

  it('keeps an active modifier switchable off even when it is no longer affordable', () => {
    render(
      <GigModifiersBlock {...defaultProps} canAffordModifier={() => false} />
    )

    const pyroButton = screen.getByRole('button', { name: /Pyrotechnics/i })
    expect(pyroButton).not.toBeDisabled()
    fireEvent.click(pyroButton)
    expect(defaultProps.toggleModifier).toHaveBeenCalledWith('pyrotechnics')
  })

  it('calls handleBandMeeting when band meeting button is clicked', () => {
    render(<GigModifiersBlock {...defaultProps} />)

    const meetingButton = screen.getByRole('button', {
      name: /ui:pregig.bandMeeting.label/i
    })
    fireEvent.click(meetingButton)

    expect(defaultProps.handleBandMeeting).toHaveBeenCalledTimes(1)
  })

  it('disables the band meeting button and shows a tooltip when the meeting is unaffordable', () => {
    const handleBandMeeting = vi.fn()
    render(
      <GigModifiersBlock
        {...defaultProps}
        handleBandMeeting={handleBandMeeting}
        canAffordBandMeeting={false}
      />
    )
    const button = screen
      .getByText('ui:pregig.bandMeeting.label')
      .closest('button')
    expect(button).toBeDisabled()
    if (button) fireEvent.click(button)
    expect(handleBandMeeting).not.toHaveBeenCalled()

    // Hover or focus to reveal tooltip
    const wrapper = button?.parentElement
    if (wrapper) fireEvent.mouseEnter(wrapper)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
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

  it('drops forbidden prototype keys from active effect options', () => {
    const options = JSON.parse(
      '{"amount":5,"__proto__":{"polluted":true},"constructor":"bad","prototype":5}'
    )
    const props = {
      ...defaultProps,
      currentModifiers: {
        activeEffects: [{ key: 'effect2', fallback: 'Effect Two', options }]
      }
    }

    render(<GigModifiersBlock {...props} />)

    const translatedOptions = props.t.mock.calls.find(
      ([key]) => key === 'effect2'
    )?.[1]
    expect(translatedOptions).toEqual({ amount: 5, defaultValue: 'Effect Two' })
    for (const key of ['__proto__', 'constructor', 'prototype']) {
      expect(Object.hasOwn(translatedOptions ?? {}, key)).toBe(false)
    }
  })

  it('renders fallback when no active modifiers are present', () => {
    render(<GigModifiersBlock {...defaultProps} />)

    expect(screen.getByText('ui:pregig.noModifiers')).toBeInTheDocument()
  })

  it('has no phone height cap and scrolls internally only from lg', () => {
    render(<GigModifiersBlock {...defaultProps} />)

    const root = screen.getByRole('heading', { level: 3 }).parentElement
    expect(root?.className).not.toContain('max-h-[38svh]')
    expect(root?.className).toContain('lg:overflow-y-auto')
  })
})
