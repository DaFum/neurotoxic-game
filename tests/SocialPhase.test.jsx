import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { SocialPhase } from '../src/components/postGig/SocialPhase.jsx'
import React from 'react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}))

test('SocialPhase renders correctly and calls onSelect', () => {
  const handleSelect = vi.fn()
  const mockOptions = [
    {
      id: 'insta',
      name: 'Post Insta',
      platform: 'Instagram',
      category: 'Social',
      badges: ['📱']
    }
  ]

  render(<SocialPhase onSelect={handleSelect} options={mockOptions} />)

  expect(screen.getByText('Post Insta')).toBeInTheDocument()

  const button = screen.getByText('Post Insta').closest('button')
  fireEvent.click(button)

  expect(handleSelect).toHaveBeenCalledWith(mockOptions[0])
})
