import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

afterEach(cleanup)

describe('PauseButton', () => {
  test('renders pause button with correct icon', async () => {
    const { PauseButton } =
      await import('../src/components/hud/PauseButton.jsx')
    const mockToggle = vi.fn()

    render(<PauseButton onTogglePause={mockToggle} isGameOver={false} />)

    const button = screen.getByRole('button', { name: /pause game/i })
    expect(button).toBeTruthy()

    // Check SVG icon is present
    const svg = button.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  test('calls onTogglePause when clicked', async () => {
    const { PauseButton } =
      await import('../src/components/hud/PauseButton.jsx')
    const mockToggle = vi.fn()
    const user = userEvent.setup()

    render(<PauseButton onTogglePause={mockToggle} isGameOver={false} />)

    const button = screen.getByRole('button', { name: /pause game/i })
    await user.click(button)

    expect(mockToggle).toHaveBeenCalledOnce()
  })

  test('is disabled when game is over', async () => {
    const { PauseButton } =
      await import('../src/components/hud/PauseButton.jsx')
    const mockToggle = vi.fn()

    render(<PauseButton onTogglePause={mockToggle} isGameOver={true} />)

    const button = screen.getByRole('button', { name: /pause game/i })
    expect(button.disabled).toBe(true)
  })

  test('is enabled when game is not over', async () => {
    const { PauseButton } =
      await import('../src/components/hud/PauseButton.jsx')
    const mockToggle = vi.fn()

    render(<PauseButton onTogglePause={mockToggle} isGameOver={false} />)

    const button = screen.getByRole('button', { name: /pause game/i })
    expect(button.disabled).toBe(false)
  })

  test('applies correct styling when game is over', async () => {
    const { PauseButton } =
      await import('../src/components/hud/PauseButton.jsx')
    const mockToggle = vi.fn()

    const { container } = render(
      <PauseButton onTogglePause={mockToggle} isGameOver={true} />
    )

    const button = container.querySelector('button')
    expect(button.className).toContain('opacity-50')
    expect(button.className).toContain('pointer-events-none')
  })

  test('does not have disabled styles when game is active', async () => {
    const { PauseButton } =
      await import('../src/components/hud/PauseButton.jsx')
    const mockToggle = vi.fn()

    const { container } = render(
      <PauseButton onTogglePause={mockToggle} isGameOver={false} />
    )

    const button = container.querySelector('button')
    // Should have hover styles, not disabled styles
    expect(button.className).toContain('hover:bg-(--toxic-green)')
  })

  test('renders without onTogglePause prop (should not crash)', async () => {
    const { PauseButton } =
      await import('../src/components/hud/PauseButton.jsx')

    // Component should handle missing prop gracefully
    render(<PauseButton isGameOver={false} />)

    const button = screen.getByRole('button', { name: /pause game/i })
    expect(button).toBeTruthy()
  })
})
