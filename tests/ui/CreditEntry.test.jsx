import { describe, expect, test } from 'vitest'
import { render } from '@testing-library/react'
import { CreditEntry } from '../../src/scenes/credits/CreditEntry.jsx'

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
})
