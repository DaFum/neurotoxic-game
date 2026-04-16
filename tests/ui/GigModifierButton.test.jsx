import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import GigModifierButton from '../../src/ui/GigModifierButton.jsx'

const mockItem = {
  key: 'test-modifier',
  label: 'Test Modifier',
  desc: 'This is a test description',
  cost: 50
}

test('GigModifierButton renders item details correctly', () => {
  render(
    <GigModifierButton item={mockItem} isActive={false} onClick={() => {}} />
  )

  expect(screen.getByText('Test Modifier')).toBeInTheDocument()
  expect(screen.getByText('This is a test description')).toBeInTheDocument()
  expect(screen.getByText('50€')).toBeInTheDocument()
})

test('GigModifierButton calls onClick with correct key', () => {
  const handleClick = vi.fn()
  render(
    <GigModifierButton item={mockItem} isActive={false} onClick={handleClick} />
  )

  const button = screen.getByRole('button')
  fireEvent.click(button)

  expect(handleClick).toHaveBeenCalledWith('test-modifier')
})

test('GigModifierButton applies active states correctly', () => {
  const { container } = render(
    <GigModifierButton item={mockItem} isActive={true} onClick={() => {}} />
  )

  const button = screen.getByRole('button')
  expect(button).toHaveAttribute('aria-pressed', 'true')
  expect(button).toHaveClass('bg-toxic-green')

  // Shimmer div should NOT be present when active
  const shimmer = container.querySelector(
    '.group-hover\\:animate-\\[shimmer_0\\.8s_ease-out\\]'
  )
  expect(shimmer).toBeNull()
})

test('GigModifierButton applies inactive states correctly', () => {
  const { container } = render(
    <GigModifierButton item={mockItem} isActive={false} onClick={() => {}} />
  )

  const button = screen.getByRole('button')
  expect(button).toHaveAttribute('aria-pressed', 'false')
  expect(button).toHaveClass('border-ash-gray/30')

  // Shimmer div SHOULD be present when inactive
  const shimmer = container.querySelector(
    '.group-hover\\:animate-\\[shimmer_0\\.8s_ease-out\\]'
  )
  expect(shimmer).toBeInTheDocument()
})
