import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { OverloadWarning } from '../../src/components/hud/OverloadWarning.tsx'

vi.mock('../../src/ui/shared/Icons', () => ({
  VoidSkullIcon: ({ className }) => (
    <div data-testid='void-skull-icon' className={className} />
  )
}))

describe('OverloadWarning', () => {
  test('renders nothing when overload is at 90 and isToxicMode is false', () => {
    const { container } = render(
      <OverloadWarning overload={90} isToxicMode={false} />
    )
    expect(container.firstChild).toBeNull()
  })

  test('renders nothing when overload is below 90 and isToxicMode is false', () => {
    const { container } = render(
      <OverloadWarning overload={50} isToxicMode={false} />
    )
    expect(container.firstChild).toBeNull()
  })

  test('renders nothing when overload is 0 and isToxicMode is false', () => {
    const { container } = render(
      <OverloadWarning overload={0} isToxicMode={false} />
    )
    expect(container.firstChild).toBeNull()
  })

  test('renders VoidSkullIcon when overload exceeds 90', () => {
    render(<OverloadWarning overload={91} isToxicMode={false} />)
    expect(screen.getByTestId('void-skull-icon')).toBeInTheDocument()
  })

  test('renders VoidSkullIcon when overload is exactly 91 (boundary above 90)', () => {
    render(<OverloadWarning overload={91} isToxicMode={false} />)
    expect(screen.getByTestId('void-skull-icon')).toBeInTheDocument()
  })

  test('renders VoidSkullIcon when overload is 100', () => {
    render(<OverloadWarning overload={100} isToxicMode={false} />)
    expect(screen.getByTestId('void-skull-icon')).toBeInTheDocument()
  })

  test('renders VoidSkullIcon when isToxicMode is true regardless of low overload', () => {
    render(<OverloadWarning overload={0} isToxicMode={true} />)
    expect(screen.getByTestId('void-skull-icon')).toBeInTheDocument()
  })

  test('renders VoidSkullIcon when isToxicMode is true and overload is at 90', () => {
    render(<OverloadWarning overload={90} isToxicMode={true} />)
    expect(screen.getByTestId('void-skull-icon')).toBeInTheDocument()
  })

  test('renders VoidSkullIcon when both overload > 90 and isToxicMode is true', () => {
    render(<OverloadWarning overload={95} isToxicMode={true} />)
    expect(screen.getByTestId('void-skull-icon')).toBeInTheDocument()
  })

  test('VoidSkullIcon receives animate-pulse and blood-red styling', () => {
    render(<OverloadWarning overload={91} isToxicMode={false} />)
    const icon = screen.getByTestId('void-skull-icon')
    expect(icon.className).toContain('animate-pulse')
    expect(icon.className).toContain('text-blood-red')
  })

  test('container has pointer-events-none so it does not block interaction', () => {
    const { container } = render(
      <OverloadWarning overload={91} isToxicMode={false} />
    )
    expect(container.firstChild.className).toContain('pointer-events-none')
  })

  test('container has absolute positioning', () => {
    const { container } = render(
      <OverloadWarning overload={91} isToxicMode={false} />
    )
    expect(container.firstChild.className).toContain('absolute')
  })

  test('overload at boundary 90 does not render (boundary off-by-one regression)', () => {
    const { container } = render(
      <OverloadWarning overload={90} isToxicMode={false} />
    )
    expect(container.firstChild).toBeNull()
  })
})
