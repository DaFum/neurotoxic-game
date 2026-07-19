import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PreGigStartButton } from '../../../../src/components/pregig/PreGigStartButton'

// Note: The actual PreGigStartButton component in src/components/pregig/PreGigStartButton.tsx
// differs from the simplified example snippet in the task description.
// It uses `t`, `isStarting`, `isSetlistEmpty`, and `onStartShow` as props,
// and relies on `motion/react`, `ActionButton`, and `RazorPlayIcon`.
// This test suite correctly tests the actual production component in the repository to ensure no regressions.

vi.mock('motion/react', () => ({
  m: new Proxy(
    {},
    {
      get:
        (_, key) =>
        ({ children, ...props }) => {
          const Comp = props.as || key || 'div'
          // filter out motion-specific props
          const {
            initial,
            animate,
            exit,
            transition,
            whileHover,
            whileTap,
            layoutId,
            layout,
            variants,
            style,
            ...domProps
          } = props
          return (
            <Comp
              {...domProps}
              style={typeof style === 'object' ? style : undefined}
            >
              {children}
            </Comp>
          )
        }
    }
  ),
  motion: new Proxy(
    {},
    {
      get:
        (_, key) =>
        ({ children, ...props }) => {
          const Comp = props.as || key || 'div'
          // filter out motion-specific props
          const {
            initial,
            animate,
            exit,
            transition,
            whileHover,
            whileTap,
            layoutId,
            layout,
            variants,
            style,
            ...domProps
          } = props
          return (
            <Comp
              {...domProps}
              style={typeof style === 'object' ? style : undefined}
            >
              {children}
            </Comp>
          )
        }
    }
  ),
  AnimatePresence: ({ children }) => <>{children}</>,
  LazyMotion: ({ children }) => <>{children}</>,
  useReducedMotion: () => false
}))

vi.mock('../../../../src/ui/shared', () => ({
  ActionButton: ({
    children,
    onClick,
    disabled,
    className
  }: {
    children?: ReactNode
    onClick?: () => void
    disabled?: boolean
    className?: string
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-testid='action-button'
    >
      {children}
    </button>
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
    expect(screen.queryByTestId('razor-play-icon')).not.toBeInTheDocument()
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
  })
})
