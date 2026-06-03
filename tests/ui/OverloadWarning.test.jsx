import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { OverloadWarning } from '../../src/components/hud/OverloadWarning.tsx'

vi.mock('../../src/ui/shared/Icons', () => ({
  VoidSkullIcon: ({ className }) => (
    <div data-testid='void-skull-icon' className={className} />
  )
}))

describe('OverloadWarning', () => {
  test('hides below or at the overload threshold when toxic mode is off', () => {
    for (const overload of [0, 50, 90]) {
      const { container, unmount } = render(
        <OverloadWarning overload={overload} isToxicMode={false} />
      )
      expect(container.firstChild).toBeNull()
      unmount()
    }
  })

  test('renders when overload exceeds the threshold or toxic mode is active', () => {
    for (const props of [
      { overload: 91, isToxicMode: false },
      { overload: 100, isToxicMode: false },
      { overload: 0, isToxicMode: true },
      { overload: 90, isToxicMode: true },
      { overload: 95, isToxicMode: true }
    ]) {
      const { unmount } = render(<OverloadWarning {...props} />)
      expect(screen.getByTestId('void-skull-icon')).toBeInTheDocument()
      unmount()
    }
  })

  test('applies non-blocking alert styling to the rendered warning', () => {
    const { container } = render(
      <OverloadWarning overload={91} isToxicMode={false} />
    )
    const icon = screen.getByTestId('void-skull-icon')
    expect(icon.className).toContain('animate-pulse')
    expect(icon.className).toContain('text-blood-red')
    expect(container.firstChild.className).toContain('pointer-events-none')
    expect(container.firstChild.className).toContain('absolute')
  })
})
