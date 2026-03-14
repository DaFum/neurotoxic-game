import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { SocialPhase } from '../src/components/postGig/SocialPhase.jsx'

vi.mock('../src/ui/shared/index.jsx', () => ({
  Panel: ({ children, title, className, contentClassName }) => (
    <div data-testid='panel' className={className}>
      {title}
      <div data-testid='panel-content' className={contentClassName}>
        {children}
      </div>
    </div>
  ),
  AnimatedSubtitle: ({ children }) => <div>{children}</div>,
  ActionButton: ({ children, onClick }) => (
    <button type='button' onClick={onClick}>
      {children}
    </button>
  )
}))

vi.mock('../src/ui/shared/Icons', () => ({
  InstaIcon: () => <svg data-testid='insta-icon' />,
  TikTokIcon: () => <svg data-testid='tiktok-icon' />,
  YouTubeIcon: () => <svg data-testid='youtube-icon' />,
  BlogIcon: () => <svg data-testid='blog-icon' />,
  BandcampIcon: () => <svg data-testid='bandcamp-icon' />
}))

test('SocialPhase renders correctly and calls onSelect', async () => {
  const user = userEvent.setup()
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

  expect(screen.getByText('ui:postOptions.insta.name')).toBeInTheDocument()

  // Verify that SocialPhase correctly wires contentClassName='space-y-6' to the Panel mock
  const panelContent = screen.getByTestId('panel-content')
  expect(panelContent).toHaveClass('space-y-6')

  const button = screen.getByRole('button', {
    name: /ui:postOptions.insta.name/i
  })
  await user.click(button)

  expect(handleSelect).toHaveBeenCalledWith(mockOptions[0])
})
