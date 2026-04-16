import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { PauseButton } from '../../src/components/hud/PauseButton.jsx'

afterEach(cleanup)

describe('PauseButton', () => {
  test('renders pause button with correct accessibility and focus classes', async () => {
    const mockToggle = vi.fn()

    const { rerender } = render(
      <PauseButton onTogglePause={mockToggle} isGameOver={false} />
    )

    let button = screen.getByRole('button', { name: 'Pause Game' })
    expect(button).toBeTruthy()
    expect(button.className).toContain('focus-visible:outline-none')
    expect(button.className).toContain('focus-visible:ring-2')
    expect(button.className).toContain('focus-visible:ring-toxic-green')
    expect(button.disabled).toBe(false)

    rerender(<PauseButton onTogglePause={mockToggle} isGameOver={true} />)
    button = screen.getByRole('button', { name: 'Pause Game' })
    expect(button.disabled).toBe(true)
  })

  test('renders pause button with correct icon', async () => {
    const mockToggle = vi.fn()

    render(<PauseButton onTogglePause={mockToggle} isGameOver={false} />)

    const button = screen.getByRole('button', { name: 'Pause Game' })
    expect(button).toBeTruthy()

    // Check SVG icon is present
    const svg = button.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  test('calls onTogglePause when clicked', async () => {
    const mockToggle = vi.fn()
    const user = userEvent.setup()

    render(<PauseButton onTogglePause={mockToggle} isGameOver={false} />)

    const button = screen.getByRole('button', { name: 'Pause Game' })
    await user.click(button)

    expect(mockToggle).toHaveBeenCalledOnce()
  })

  test('is disabled when game is over', async () => {
    const mockToggle = vi.fn()

    render(<PauseButton onTogglePause={mockToggle} isGameOver={true} />)

    const button = screen.getByRole('button', { name: 'Pause Game' })
    expect(button.disabled).toBe(true)
  })

  test('is enabled when game is not over', async () => {
    const mockToggle = vi.fn()

    render(<PauseButton onTogglePause={mockToggle} isGameOver={false} />)

    const button = screen.getByRole('button', { name: 'Pause Game' })
    expect(button.disabled).toBe(false)
  })

  test('applies correct styling when game is over', async () => {
    const mockToggle = vi.fn()

    const { container } = render(
      <PauseButton onTogglePause={mockToggle} isGameOver={true} />
    )

    const button = container.querySelector('button')
    expect(button.className).toContain('opacity-50')
    expect(button.className).toContain('pointer-events-none')
  })

  test('does not have disabled styles when game is active', async () => {
    const mockToggle = vi.fn()

    const { container } = render(
      <PauseButton onTogglePause={mockToggle} isGameOver={false} />
    )

    const button = container.querySelector('button')
    // Should have hover styles, not disabled styles
    expect(button.className).toContain('hover:bg-toxic-green')
  })

  test('renders without onTogglePause prop (should not crash)', async () => {
    // Component should handle missing prop gracefully
    render(<PauseButton isGameOver={false} />)

    const button = screen.getByRole('button', { name: 'Pause Game' })
    expect(button).toBeTruthy()
  })
})
