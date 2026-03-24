import { describe, expect, test } from 'vitest'
import { render } from '@testing-library/react'
import { CreditFooter } from '../src/scenes/credits/CreditFooter.jsx'

describe('CreditFooter Component', () => {
  test('renders the credit footer with translated text', () => {
    const { getByText } = render(<CreditFooter />)

    // Check for the translation keys
    expect(getByText('ui:creditFooter.title')).toBeInTheDocument()
    expect(getByText('ui:creditFooter.subtitle')).toBeInTheDocument()
  })
})
