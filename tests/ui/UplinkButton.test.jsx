import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test } from 'vitest'
import { vi } from 'vitest'
import { UplinkButton, CrisisModal, DeadmanButton } from '../../src/ui/shared/BrutalistUI.tsx'

test('UplinkButton renders correctly and handles hover states properly', () => {
  const DummyIcon = () => <svg data-testid='dummy-icon' />
  const { container } = render(
    <UplinkButton
      title='Test Link'
      url='https://example.com'
      subtitle='Test Subtitle'
      type='test-type'
      Icon={DummyIcon}
    />
  )

  const link = screen.getByRole('link')
  expect(link).toHaveAttribute('href', 'https://example.com')
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')

  expect(screen.getByText('Test Link')).toBeInTheDocument()
  expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
  expect(screen.getByTestId('dummy-icon')).toBeInTheDocument()

  // Before hover, no glitch effect div
  expect(
    container.querySelector('.bg-toxic-green\\/10')
  ).not.toBeInTheDocument()

  fireEvent.mouseEnter(link)

  // After hover, glitch effect div appears
  expect(container.querySelector('.bg-toxic-green\\/10')).toBeInTheDocument()

  fireEvent.mouseLeave(link)

  // Gone again
  expect(
    container.querySelector('.bg-toxic-green\\/10')
  ).not.toBeInTheDocument()

  // Focus-visible ring utilities present
  expect(link).toHaveClass(
    'focus-visible:ring-2',
    'focus-visible:ring-toxic-green'
  )
})

test('CrisisModal formats action button ARIA attributes correctly with and without metadata', () => {
  render(
    <CrisisModal
      isOpen={true}
      title='Crisis Alert'
      description='Critical decision required.'
      actions={[
        {
          id: 'opt1',
          label: 'EMERGENCY LOAN',
          meta: '[HIGH RISK]',
          variant: 'danger'
        },
        {
          id: 'opt2',
          label: 'ACCEPT TERMS',
          variant: 'safe'
        }
      ]}
    />
  )

  const buttons = screen.getAllByRole('button')
  expect(buttons[0]).toHaveAttribute(
    'aria-label',
    'EMERGENCY LOAN - [HIGH RISK]'
  )
  expect(buttons[1]).not.toHaveAttribute('aria-label')
})

test('DeadmanButton renders accessibility attributes, progressbar role, and handles disabled state', () => {
  const onConfirm = vi.fn()
  const { rerender } = render(
    <DeadmanButton label='PURGE SAVE' onConfirm={onConfirm} />
  )

  const button = screen.getByRole('button')
  expect(button).toHaveAttribute(
    'aria-label',
    expect.stringMatching(/^PURGE SAVE - /)
  )

  const progressbar = screen.getByRole('progressbar')
  expect(progressbar).toHaveAttribute('aria-valuenow', '0')
  expect(progressbar).toHaveAttribute('aria-valuemin', '0')
  expect(progressbar).toHaveAttribute('aria-valuemax', '100')

  // Rerender as disabled
  rerender(<DeadmanButton label='PURGE SAVE' disabled onConfirm={onConfirm} />)
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute('aria-disabled', 'true')
  expect(button).toHaveClass('opacity-50', 'cursor-not-allowed')
})
