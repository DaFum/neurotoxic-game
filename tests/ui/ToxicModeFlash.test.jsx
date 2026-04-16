import { render } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { ToxicModeFlash } from '../../src/components/hud/ToxicModeFlash.jsx'

describe('ToxicModeFlash', () => {
  test('renders nothing when isToxicMode is false', () => {
    const { container } = render(<ToxicModeFlash isToxicMode={false} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders nothing when isToxicMode is undefined (falsy)', () => {
    const { container } = render(<ToxicModeFlash />)
    expect(container.firstChild).toBeNull()
  })

  test('renders flash div when isToxicMode is true', () => {
    const { container } = render(<ToxicModeFlash isToxicMode={true} />)
    expect(container.firstChild).not.toBeNull()
  })

  test('flash div has toxic-border-flash class', () => {
    const { container } = render(<ToxicModeFlash isToxicMode={true} />)
    expect(container.firstChild.className).toContain('toxic-border-flash')
  })

  test('flash div has absolute inset-0 positioning to fill parent', () => {
    const { container } = render(<ToxicModeFlash isToxicMode={true} />)
    expect(container.firstChild.className).toContain('absolute')
    expect(container.firstChild.className).toContain('inset-0')
  })

  test('flash div has pointer-events-none to avoid blocking interactions', () => {
    const { container } = render(<ToxicModeFlash isToxicMode={true} />)
    expect(container.firstChild.className).toContain('pointer-events-none')
  })

  test('flash div has z-0 to remain behind other elements', () => {
    const { container } = render(<ToxicModeFlash isToxicMode={true} />)
    expect(container.firstChild.className).toContain('z-0')
  })

  test('transitions from false to true (rerender shows flash)', () => {
    const { rerender, container } = render(
      <ToxicModeFlash isToxicMode={false} />
    )
    expect(container.firstChild).toBeNull()

    rerender(<ToxicModeFlash isToxicMode={true} />)
    expect(container.firstChild).not.toBeNull()
    expect(container.firstChild.className).toContain('toxic-border-flash')
  })

  test('transitions from true to false (rerender hides flash)', () => {
    const { rerender, container } = render(
      <ToxicModeFlash isToxicMode={true} />
    )
    expect(container.firstChild).not.toBeNull()

    rerender(<ToxicModeFlash isToxicMode={false} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders a single div element (no nested children)', () => {
    const { container } = render(<ToxicModeFlash isToxicMode={true} />)
    expect(container.firstChild.tagName).toBe('DIV')
    expect(container.firstChild.children.length).toBe(0)
  })
})
