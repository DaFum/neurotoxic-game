import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { GigControlsCluster } from '../../src/components/hud/GigControlsCluster'

// Mock useAudioControl hook
vi.mock('../../src/hooks/useAudioControl', () => ({
  useAudioControl: () => ({
    audioState: { isMuted: false },
    handleAudioChange: { toggleMute: vi.fn() }
  })
}))

describe('GigControlsCluster', () => {
  test('renders menu toggle button and expands controls on click', () => {
    render(<GigControlsCluster onTogglePause={vi.fn()} />)

    const menuToggle = screen.getByRole('button', { name: /toggle game controls/i })
    expect(menuToggle).toBeInTheDocument()

    // Expand controls
    fireEvent.click(menuToggle)

    const pauseButton = screen.getByRole('button', { name: /pause game/i })
    expect(pauseButton).toBeInTheDocument()
    expect(pauseButton).not.toHaveAttribute('aria-disabled', 'true')
  })

  test('pause button uses aria-disabled and does not invoke callback when isGameOver is true', () => {
    const onTogglePause = vi.fn()
    render(<GigControlsCluster onTogglePause={onTogglePause} isGameOver={true} />)

    const menuToggle = screen.getByRole('button', { name: /toggle game controls/i })
    fireEvent.click(menuToggle)

    const pauseButton = screen.getByRole('button', { name: /pause game/i })
    expect(pauseButton).toHaveAttribute('aria-disabled', 'true')
    expect(pauseButton).toHaveClass('cursor-not-allowed')

    fireEvent.click(pauseButton)
    expect(onTogglePause).not.toHaveBeenCalled()
  })
})
