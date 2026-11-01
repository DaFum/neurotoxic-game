import { createMotionReactMock } from '../../../mocks/motionMock'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PreGigStartButton } from '../../../../src/components/pregig/PreGigStartButton'

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
    'aria-describedby'?: string
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-busy={props['aria-busy']}
      aria-describedby={props['aria-describedby']}
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

  it('is disabled and renders tooltip when isSetlistEmpty is true', () => {
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

    if (button.parentElement) {
      fireEvent.mouseEnter(button.parentElement)
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'ui:bandhq.setlist.selectOne'
      )
    }
  })

  it.each([
    [
      'an empty setlist',
      { isSetlistEmpty: true },
      'ui:bandhq.setlist.selectOne'
    ],
    [
      'a blocked start',
      { isSetlistEmpty: false, isStartBlocked: true },
      'ui:pregig.startBlocked'
    ]
  ])(
    'explains %s inline and links the reason with aria-describedby',
    (_label, flags, reasonKey) => {
      render(
        <PreGigStartButton
          t={mockT}
          isStarting={false}
          onStartShow={vi.fn()}
          {...flags}
        />
      )

      const button = screen.getByTestId('action-button')
      expect(button).toBeDisabled()
      // Rendered without hovering or focusing anything. (toBeVisible cannot
      // be used: the real motion wrapper keeps its initial opacity in jsdom.)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
      const reason = screen.getByText(reasonKey)
      expect(reason).not.toHaveAttribute('hidden')
      expect(reason.id).not.toBe('')
      expect(button.getAttribute('aria-describedby')?.split(' ')).toContain(
        reason.id
      )

      // The tooltip wrapper stays keyboard focusable.
      const wrapper = button.parentElement
      expect(wrapper).toHaveAttribute('tabindex', '0')
      if (wrapper) fireEvent.focus(wrapper)
      expect(screen.getByRole('tooltip')).toHaveTextContent(reasonKey)
      expect(wrapper?.getAttribute('aria-describedby')?.split(' ')).toContain(
        reason.id
      )
    }
  )

  it('shows no inline reason while starting or when Start is available', () => {
    const { rerender } = render(
      <PreGigStartButton
        t={mockT}
        isStarting={false}
        isSetlistEmpty={false}
        onStartShow={vi.fn()}
      />
    )
    expect(screen.getByTestId('action-button')).not.toHaveAttribute(
      'aria-describedby'
    )
    expect(screen.queryByText('ui:pregig.startBlocked')).not.toBeInTheDocument()

    rerender(
      <PreGigStartButton
        t={mockT}
        isStarting={true}
        isSetlistEmpty={false}
        onStartShow={vi.fn()}
      />
    )
    expect(screen.getByTestId('action-button')).not.toHaveAttribute(
      'aria-describedby'
    )
  })
})
