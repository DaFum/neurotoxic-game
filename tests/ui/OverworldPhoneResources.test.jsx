import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import { OverworldPhoneResources } from '../../src/ui/overworld/OverworldPhoneResources'

afterEach(cleanup)

const t = (_key, options) => options?.defaultValue ?? _key

describe('OverworldPhoneResources', () => {
  const renderStrip = overrides =>
    render(
      <OverworldPhoneResources
        money={480}
        fuel={80}
        condition={75}
        language='en'
        t={t}
        {...overrides}
      />
    )

  it('shows cash, fuel and van condition on one phone-only line', () => {
    renderStrip({})
    const strip = screen.getByTestId('overworld-phone-resources')

    expect(strip).toHaveClass('sm:hidden')
    expect(strip).toHaveTextContent('€480')
    expect(screen.getByLabelText('Fuel Level: 80%')).toBeInTheDocument()
    expect(screen.getByLabelText('Van Condition: 75%')).toBeInTheDocument()
  })

  it('warns in red when cash, fuel or condition run low', () => {
    renderStrip({ money: 10, fuel: 5, condition: 10 })

    expect(screen.getByText('€10').closest('span')).toHaveClass(
      'text-blood-red'
    )
    expect(screen.getByLabelText('Fuel Level: 5%')).toHaveClass(
      'text-blood-red'
    )
    expect(screen.getByLabelText('Van Condition: 10%')).toHaveClass(
      'text-blood-red'
    )
  })

  it('keeps healthy readings out of the warning colour', () => {
    renderStrip({})

    expect(screen.getByText('€480').closest('span')).not.toHaveClass(
      'text-blood-red'
    )
    expect(screen.getByLabelText('Fuel Level: 80%')).not.toHaveClass(
      'text-blood-red'
    )
  })

  it('treats a missing van reading as empty rather than rendering NaN', () => {
    renderStrip({ fuel: undefined, condition: null })

    expect(screen.getByLabelText('Fuel Level: 0%')).toBeInTheDocument()
    expect(screen.getByLabelText('Van Condition: 0%')).toBeInTheDocument()
  })
})
