import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MinigameSkipButton } from '../../src/components/MinigameSkipButton'

describe('MinigameSkipButton', () => {
  it('renders skip button with accessible aria-label and visible text', () => {
    const handleClick = vi.fn()
    render(<MinigameSkipButton onClick={handleClick} />)

    const button = screen.getByRole('button', { name: /Skip minigame/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveTextContent(/SKIP/i)
  })

  it('invokes onClick callback when clicked', () => {
    const handleClick = vi.fn()
    render(<MinigameSkipButton onClick={handleClick} />)

    const button = screen.getByRole('button', { name: /Skip minigame/i })
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('includes focus-visible styles for keyboard accessibility', () => {
    render(<MinigameSkipButton onClick={vi.fn()} />)

    const button = screen.getByRole('button', { name: /Skip minigame/i })
    expect(button).toHaveClass('focus-visible:ring-2')
    expect(button).toHaveClass('focus-visible:ring-toxic-green')
  })
})
