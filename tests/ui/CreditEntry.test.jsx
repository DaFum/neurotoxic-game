import { describe, expect, test } from 'vitest'
import { render } from '@testing-library/react'
import { CreditEntry } from '../../src/scenes/credits/CreditEntry.tsx'

describe('CreditEntry Component', () => {
  test('renders the credit entry with role and name', () => {
    const roleText = 'VOCAL CODE VOMIT'
    const nameText = 'Jules Agent'

    const { getByText } = render(
      <CreditEntry role={roleText} name={nameText} delay={0.5} />
    )

    expect(getByText(roleText)).toBeInTheDocument()
    expect(getByText(nameText)).toBeInTheDocument()
  })

  test('wraps long names and pads the row for phone widths', () => {
    const nameText = 'Motion for React // Framegrind Frenzy'
    const { getByText, container } = render(
      <CreditEntry role='ANIMATION' name={nameText} delay={0} />
    )

    const name = getByText(nameText)
    expect(name).toHaveClass(
      'text-xl',
      'sm:text-2xl',
      'text-balance',
      'break-words'
    )
    expect(getByText('ANIMATION')).toHaveClass('break-words')
    expect(container.firstElementChild).toHaveClass('px-4')
  })
})
