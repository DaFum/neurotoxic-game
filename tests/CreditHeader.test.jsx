import { describe, expect, test } from 'vitest'
import { render } from '@testing-library/react'
import { CreditHeader } from '../src/scenes/credits/CreditHeader.jsx'

describe('CreditHeader Component', () => {
  test('renders the credit header with translated text and appropriate styling', () => {
    const { getByText } = render(<CreditHeader />)

    // We expect the mock translation key to be rendered, as per vitest.setup.js
    const heading = getByText('CREDITS')
    expect(heading).toBeInTheDocument()

    // Check that it has the expected classes
    expect(heading).toHaveClass('animate-neon-flicker')
    expect(heading).toHaveClass('text-toxic-green')
    expect(heading).toHaveClass('font-[Metal_Mania]')
  })
})
