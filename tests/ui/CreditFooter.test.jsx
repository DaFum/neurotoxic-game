import { describe, expect, test } from 'vitest'
import { render } from '@testing-library/react'
import { CreditFooter } from '../../src/scenes/credits/CreditFooter.tsx'

describe('CreditFooter Component', () => {
  test('renders the credit footer with translated text', () => {
    const { getByText } = render(<CreditFooter />)

    expect(getByText('NEUROTOXIC: GRIND THE VOID v3.0')).toBeInTheDocument()
    expect(
      getByText('DEATH GRINDCORE FROM STENDAL // 2026')
    ).toBeInTheDocument()
  })
})
