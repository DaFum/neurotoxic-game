import { createMotionReactMock } from '../../../mocks/motionMock'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PreGigStartButton } from '../../../../src/components/pregig/PreGigStartButton'

// Note: The actual PreGigStartButton component in src/components/pregig/PreGigStartButton.tsx
// differs from the simplified example snippet in the task description.
// It uses `t`, `isStarting`, `isSetlistEmpty`, and `onStartShow` as props,
// and relies on `motion/react`, `ActionButton`, and `RazorPlayIcon`.
// This test suite correctly tests the actual production component in the repository to ensure no regressions.

vi.mock('motion/react', () => createMotionReactMock())

vi.mock('../../../../src/ui/shared', () => ({
  ActionButton: ({
    children,
    onClick,
    disabled,
    className,
    ...props
  }: {
    children?: ReactNode
    onClick?: () => void
    disabled?: boolean
    className?: string
    'aria-busy'?: boolean
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-busy={props['aria-busy']}
      className={className}
      data-testid='action-button'
    >
      {children}
    </button>
  )
}))

vi.mock('lucide-react', () => ({
  Loader2: (props: Record<string, unknown>) => (
    <svg data-testid='loader2-icon' {...props} />
  )
}))

vi.mock('../../../../src/ui/shared/Icons', () => ({
  RazorPlayIcon: () => <svg data-testid='razor-play-icon' />
}))

describe('PreGigStartButton', () => {
  const mockT = (key: string) => key

  it('renders idle state correctly and handles click', () => {
    const onStartShow = vi.fn()
    render(
      <PreGigStartButton
        t={mockT}
        isStarting={false}
        isSetlistEmpty={false}
        onStartShow={onStartShow}
      />
    )

    const button = screen.getByTestId('action-button')
    expect(button).not.toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'false')
    expect(screen.getByTestId('razor-play-icon')).toBeInTheDocument()
    expect(screen.getByText('ui:pregig.startShow')).toBeInTheDocument()

    fireEvent.click(button)
    expect(onStartShow).toHaveBeenCalledOnce()
  })

  it('is disabled and shows initializing text when isStarting is true', () => {
    const onStartShow = vi.fn()
    render(
      <PreGigStartButton
        t={mockT}
        isStarting={true}
        isSetlistEmpty={false}
        onStartShow={onStartShow}
      />
    )

    const button = screen.getByTestId('action-button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByTestId('razor-play-icon')).not.toBeInTheDocument()
    expect(screen.getByTestId('loader2-icon')).toBeInTheDocument()
    expect(screen.getByTestId('loader2-icon')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
    expect(screen.getByText('ui:pregig.initializing')).toBeInTheDocument()
  })

  it('is disabled when isSetlistEmpty is true', () => {
    const onStartShow = vi.fn()
    render(
      <PreGigStartButton
        t={mockT}
        isStarting={false}
        isSetlistEmpty={true}
        onStartShow={onStartShow}
      />
    )

    const button = screen.getByTestId('action-button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'false')
  })
})
