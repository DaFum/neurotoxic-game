import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { ToxicHazardTicker } from '../src/components/hud/ToxicHazardTicker.jsx'

vi.mock('../src/ui/shared', () => ({
  HazardTicker: ({ message }) => (
    <div data-testid='hazard-ticker' data-message={message} />
  )
}))

describe('ToxicHazardTicker', () => {
  test('renders nothing when isToxicMode is false', () => {
    const { container } = render(<ToxicHazardTicker isToxicMode={false} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders HazardTicker when isToxicMode is true', () => {
    render(<ToxicHazardTicker isToxicMode={true} />)
    expect(screen.getByTestId('hazard-ticker')).toBeInTheDocument()
  })

  test('passes translation key message to HazardTicker', () => {
    render(<ToxicHazardTicker isToxicMode={true} />)
    const ticker = screen.getByTestId('hazard-ticker')
    expect(ticker.getAttribute('data-message')).toBe('ui:hazard.toxicOverload')
  })

  test('wraps HazardTicker in a container with absolute positioning at top', () => {
    const { container } = render(<ToxicHazardTicker isToxicMode={true} />)
    const wrapper = container.firstChild
    expect(wrapper.className).toContain('absolute')
    expect(wrapper.className).toContain('top-0')
    expect(wrapper.className).toContain('w-full')
  })

  test('wrapper has high z-index to appear above game elements', () => {
    const { container } = render(<ToxicHazardTicker isToxicMode={true} />)
    const wrapper = container.firstChild
    expect(wrapper.className).toContain('z-20')
  })

  test('does not render HazardTicker when isToxicMode is false (no ticker in DOM)', () => {
    render(<ToxicHazardTicker isToxicMode={false} />)
    expect(screen.queryByTestId('hazard-ticker')).not.toBeInTheDocument()
  })

  test('transitions correctly from false to true (rerender)', () => {
    const { rerender, container } = render(
      <ToxicHazardTicker isToxicMode={false} />
    )
    expect(container.firstChild).toBeNull()

    rerender(<ToxicHazardTicker isToxicMode={true} />)
    expect(screen.getByTestId('hazard-ticker')).toBeInTheDocument()
  })

  test('transitions correctly from true to false (rerender)', () => {
    const { rerender } = render(<ToxicHazardTicker isToxicMode={true} />)
    expect(screen.getByTestId('hazard-ticker')).toBeInTheDocument()

    rerender(<ToxicHazardTicker isToxicMode={false} />)
    expect(screen.queryByTestId('hazard-ticker')).not.toBeInTheDocument()
  })
})