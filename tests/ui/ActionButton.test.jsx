import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { ActionButton } from '../../src/ui/shared/ActionButton.tsx'

test('ActionButton renders children and handles clicks', () => {
  const handleClick = vi.fn()
  render(<ActionButton onClick={handleClick}>Click Me</ActionButton>)

  const button = screen.getByRole('button', { name: 'Click Me' })
  expect(button).toBeInTheDocument()

  fireEvent.click(button)
  expect(handleClick).toHaveBeenCalledTimes(1)
})

test('ActionButton applies custom classes and type', () => {
  render(
    <ActionButton type='submit' className='custom-class'>
      Submit
    </ActionButton>
  )

  const button = screen.getByRole('button', { name: 'Submit' })
  expect(button).toHaveAttribute('type', 'submit')
  expect(button).toHaveClass('custom-class')
})

test('ActionButton passes through additional props and uses ref', () => {
  const mockRef = vi.fn()
  render(
    <ActionButton ref={mockRef} aria-label='custom-aria'>
      Custom Props
    </ActionButton>
  )

  const button = screen.getByRole('button', { name: 'custom-aria' })
  expect(button).toBeInTheDocument()
  expect(mockRef).toHaveBeenCalled()
})

test('ActionButton keeps a mobile-friendly touch target', () => {
  render(<ActionButton>Touch Action</ActionButton>)

  const button = screen.getByRole('button', { name: 'Touch Action' })
  expect(button).toHaveClass('min-h-11')
  expect(button).toHaveClass('touch-manipulation')
})
