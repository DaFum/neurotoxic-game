import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { ScoreDisplay } from '../src/components/hud/ScoreDisplay.jsx'

describe('ScoreDisplay', () => {
  test('renders SCORE label', () => {
    render(<ScoreDisplay score={0} />)
    expect(screen.getByText('SCORE')).toBeInTheDocument()
  })

  test('pads score of 0 to 7 digits', () => {
    render(<ScoreDisplay score={0} />)
    expect(screen.getByText('0000000')).toBeInTheDocument()
  })

  test('pads score of 1 to 7 digits', () => {
    render(<ScoreDisplay score={1} />)
    expect(screen.getByText('0000001')).toBeInTheDocument()
  })

  test('pads score of 123 to 7 digits', () => {
    render(<ScoreDisplay score={123} />)
    expect(screen.getByText('0000123')).toBeInTheDocument()
  })

  test('displays 7-digit score without padding', () => {
    render(<ScoreDisplay score={1234567} />)
    expect(screen.getByText('1234567')).toBeInTheDocument()
  })

  test('displays score larger than 7 digits without truncation', () => {
    render(<ScoreDisplay score={12345678} />)
    expect(screen.getByText('12345678')).toBeInTheDocument()
  })

  test('floors fractional score values', () => {
    render(<ScoreDisplay score={100.9} />)
    expect(screen.getByText('0000100')).toBeInTheDocument()
  })

  test('floors score of 999999.99 to 999999', () => {
    render(<ScoreDisplay score={999999.99} />)
    expect(screen.getByText('0999999')).toBeInTheDocument()
  })

  test('floors score of 1234567.5 to 1234567', () => {
    render(<ScoreDisplay score={1234567.5} />)
    expect(screen.getByText('1234567')).toBeInTheDocument()
  })

  test('score element has tabular-nums class for consistent digit width', () => {
    const { container } = render(<ScoreDisplay score={100} />)
    const scoreEl = container.querySelector('.tabular-nums')
    expect(scoreEl).not.toBeNull()
    expect(scoreEl.textContent).toBe('0000100')
  })

  test('renders with correct outer container styling', () => {
    const { container } = render(<ScoreDisplay score={500} />)
    expect(container.firstChild.className).toContain('bg-void-black')
    expect(container.firstChild.className).toContain('inline-block')
  })

  test('score text has toxic-green styling', () => {
    const { container } = render(<ScoreDisplay score={500} />)
    const scoreEl = container.querySelector('.tabular-nums')
    expect(scoreEl.className).toContain('text-toxic-green')
  })

  test('pads score of 9999999 exactly to 7 digits (no extra padding)', () => {
    render(<ScoreDisplay score={9999999} />)
    expect(screen.getByText('9999999')).toBeInTheDocument()
  })

  test('handles score of 0.4 floored to 0', () => {
    render(<ScoreDisplay score={0.4} />)
    expect(screen.getByText('0000000')).toBeInTheDocument()
  })
})
