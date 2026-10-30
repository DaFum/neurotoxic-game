import { describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PauseOverlay } from '../../src/components/minigames/gig/PauseOverlay'

describe('PauseOverlay Component', () => {
  test('does not render when isPaused is false', () => {
    const { container } = render(
      <PauseOverlay isPaused={false} onResume={() => {}} onQuit={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  test('renders dialog and title when isPaused is true', () => {
    render(
      <PauseOverlay isPaused={true} onResume={() => {}} onQuit={() => {}} />
    )
    const dialog = screen.getByRole('dialog')
    const heading = screen.getByRole('heading', { name: /paused/i })

    expect(dialog).toBeInTheDocument()
    expect(heading).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-labelledby', heading.id)
    expect(heading.id).toBe('pause-overlay-title')
  })

  test('calls onResume when Escape key is pressed', async () => {
    const user = userEvent.setup()
    const onResumeMock = vi.fn()

    render(
      <PauseOverlay isPaused={true} onResume={onResumeMock} onQuit={() => {}} />
    )

    await user.keyboard('{Escape}')
    expect(onResumeMock).toHaveBeenCalledTimes(1)
  })

  test('traps focus between resume and quit buttons', async () => {
    const user = userEvent.setup()

    render(
      <PauseOverlay isPaused={true} onResume={() => {}} onQuit={() => {}} />
    )

    const dialog = screen.getByRole('dialog')
    const resumeBtn = screen.getByRole('button', { name: /resume/i })
    const quitBtn = screen.getByRole('button', { name: /quit gig/i })

    await waitFor(() => expect(dialog).toHaveFocus())

    await user.tab()
    expect(resumeBtn).toHaveFocus()

    await user.tab()
    expect(quitBtn).toHaveFocus()

    await user.tab()
    expect(resumeBtn).toHaveFocus()

    await user.tab({ shift: true })
    expect(quitBtn).toHaveFocus()
  })
})
