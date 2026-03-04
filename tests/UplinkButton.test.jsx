import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test } from 'vitest'
import { UplinkButton } from '../src/ui/shared/BrutalistUI.jsx'
import React from 'react'

test('UplinkButton renders correctly and handles hover', () => {
  const DummyIcon = () => <svg data-testid="dummy-icon" />
  render(
    <UplinkButton
      title="Test Link"
      url="https://example.com"
      subtitle="Test Subtitle"
      type="test-type"
      Icon={DummyIcon}
    />
  )

  const link = screen.getByRole('link')
  expect(link).toHaveAttribute('href', 'https://example.com')
  expect(screen.getByText('Test Link')).toBeInTheDocument()
  expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
  expect(screen.getByTestId('dummy-icon')).toBeInTheDocument()

  // Test hover state changes
  fireEvent.mouseEnter(link)
  // Just ensuring it doesn't crash on hover, classes update internally
  fireEvent.mouseLeave(link)
})
