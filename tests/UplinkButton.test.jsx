import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test } from 'vitest'
import { UplinkButton } from '../src/ui/shared/BrutalistUI.jsx'
import React from 'react'

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
  expect(screen.getByText('Test Link')).toBeInTheDocument()
  expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
  expect(screen.getByTestId('dummy-icon')).toBeInTheDocument()

  // Before hover, no glitch effect div
  expect(
    container.querySelector('.bg-\\(--toxic-green\\)\\/10')
  ).not.toBeInTheDocument()

  fireEvent.mouseEnter(link)

  // After hover, glitch effect div appears
  expect(
    container.querySelector('.bg-\\(--toxic-green\\)\\/10')
  ).toBeInTheDocument()

  fireEvent.mouseLeave(link)

  // Gone again
  expect(
    container.querySelector('.bg-\\(--toxic-green\\)\\/10')
  ).not.toBeInTheDocument()
})
