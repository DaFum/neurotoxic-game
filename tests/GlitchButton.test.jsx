import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { GlitchButton } from '../src/ui/GlitchButton'



describe('GlitchButton', () => {
  beforeEach(() => {
    //  removed (handled by vitest env)
  })

  afterEach(() => {
    cleanup()

    vi.restoreAllMocks()
  })

  it('renders children correctly', () => {
    const { getByText } = render(<GlitchButton onClick={() => {}}>Click Me</GlitchButton>)
    const button = getByText('Click Me')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Click Me')

  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    const { getByText } = render(<GlitchButton onClick={handleClick}>Click Me</GlitchButton>)
    const button = getByText('Click Me')
    fireEvent.click(button)
    expect(handleClick.mock.calls.length).toBe(1)
  })

  it('applies disabled state correctly', () => {
    const handleClick = vi.fn()
    const { getByText } = render(
      <GlitchButton onClick={handleClick} disabled>
        Disabled
      </GlitchButton>
    )
    const button = getByText('Disabled').closest('button')
    expect(button.disabled)
    fireEvent.click(button)
    expect(handleClick.mock.calls.length).toBe(0)
  })

  it('shows loading state correctly', () => {
    const { getByRole } = render(
      <GlitchButton onClick={() => {}} isLoading>
        Loading
      </GlitchButton>
    )
    const button = getByRole('button')
    expect(button.disabled).toBe(true)
    expect(button).toHaveAttribute('aria-busy', 'true')

    // Check if opacity is applied to children wrapper
    // The children are wrapped in a span with relative z-10 ...
    // We can't easily query that span without a testid, but we can check if button has the loader
    // The loader is an svg inside the button.
    expect(button.querySelector('svg')).toBeInTheDocument()  })

  it('applies small size classes', () => {
    const { container } = render(
      <GlitchButton onClick={() => {}} size='sm'>
        Small Button
      </GlitchButton>
    )
    const button = container.querySelector('button')
    expect(button.className).toContain('px-4')
    expect(button.className).toContain('py-2')
    expect(button.className).toContain('text-sm')
  })

  it('applies owned variant style correctly', () => {
    const { container } = render(
      <GlitchButton onClick={() => {}} variant='owned' disabled>
        Owned
      </GlitchButton>
    )
    const button = container.querySelector('button')
    // Should NOT have opacity-60 even if disabled
    expect(button.className).not.toContain('opacity-60')
    expect(button.className).toContain('opacity-100')
    expect(button.className).toContain('cursor-default')
  })

  it('forwards additional props to the button element', () => {
    const { getByRole } = render(
      <GlitchButton onClick={() => {}} aria-label="Custom Label" data-testid="custom-btn">
        Props Test
      </GlitchButton>
    )
    const button = getByRole('button')
    expect(button.getAttribute('aria-label')).toBe('Custom Label')
    expect(button.getAttribute('data-testid')).toBe('custom-btn')
  })

  it('applies warning variant style correctly', () => {
    const { container } = render(
      <GlitchButton onClick={() => {}} variant='warning'>
        Warning
      </GlitchButton>
    )
    const button = container.querySelector('button')
    expect(button.className).toContain('border-(--warning-yellow)')
    expect(button.className).toContain('text-(--warning-yellow)')
  })
})
