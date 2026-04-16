import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ScoreDisplay } from '../../src/components/hud/ScoreDisplay.tsx'

describe('ScoreDisplay', () => {
  test('renders baseline structural elements', () => {
    const { container, getByText } = render(<ScoreDisplay score={0} />)

    // Existence and Label
    expect(container).toBeTruthy()
    expect(getByText('SCORE')).toBeInTheDocument()

    // Classes
    const wrapper = container.firstChild
    expect(wrapper.className).toContain('inline-block')

    expect(wrapper.className).toContain('bg-void-black')
    expect(wrapper.className).toContain('border-toxic-green')

    // Inner score element specific styling
    const scoreEl = container.querySelector('.tabular-nums')
    expect(scoreEl).toBeTruthy()
    expect(scoreEl.className).toContain('text-toxic-green')
  })

  test('formats and updates scores correctly', () => {
    const { getByText, rerender } = render(<ScoreDisplay score={500} />)
    expect(getByText('0000500')).toBeInTheDocument()

    // Thousands formatting
    rerender(<ScoreDisplay score={1234} />)
    expect(getByText('0001234')).toBeInTheDocument()

    // Ten thousands
    rerender(<ScoreDisplay score={15000} />)
    expect(getByText('0015000')).toBeInTheDocument()

    // Huge numbers
    rerender(<ScoreDisplay score={1234567} />)
    expect(getByText('1234567')).toBeInTheDocument()

    // Zero
    rerender(<ScoreDisplay score={0} />)
    expect(getByText('0000000')).toBeInTheDocument()

    // Negative (if applicable, testing edge case)
    rerender(<ScoreDisplay score={-50} />)
    expect(getByText('0000-50')).toBeInTheDocument()

    // Fractional
    rerender(<ScoreDisplay score={100.5} />)
    expect(getByText('0000100')).toBeInTheDocument()

    rerender(<ScoreDisplay score={12345678} />)
    expect(getByText('12345678')).toBeInTheDocument()
  })
})
