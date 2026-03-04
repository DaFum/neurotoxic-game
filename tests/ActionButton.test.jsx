import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { ActionButton } from '../src/ui/shared/ActionButton.jsx'
import React from 'react'

test('ActionButton renders children and handles clicks', () => {
  const handleClick = vi.fn()
  render(<ActionButton onClick={handleClick}>Click Me</ActionButton>)

  const button = screen.getByRole('button', { name: 'Click Me' })
  expect(button).toBeInTheDocument()

  fireEvent.click(button)
  expect(handleClick).toHaveBeenCalledTimes(1)
})

test('ActionButton applies custom classes and type', () => {
  render(<ActionButton type="submit" className="custom-class">Submit</ActionButton>)

  const button = screen.getByRole('button', { name: 'Submit' })
  expect(button).toHaveAttribute('type', 'submit')
  expect(button.className).toContain('custom-class')
})
