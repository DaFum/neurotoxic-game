import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { GlitchButton } from '../src/ui/GlitchButton'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import assert from 'node:assert'

describe('GlitchButton', () => {
  beforeEach(() => {
    setupJSDOM()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
    mock.restoreAll()
  })

  it('renders children correctly', () => {
    const { getByText } = render(<GlitchButton onClick={() => {}}>Click Me</GlitchButton>)
    const button = getByText('Click Me')
    assert.ok(button)
  })

  it('handles click events', () => {
    const handleClick = mock.fn()
    const { getByText } = render(<GlitchButton onClick={handleClick}>Click Me</GlitchButton>)
    const button = getByText('Click Me')
    fireEvent.click(button)
    assert.strictEqual(handleClick.mock.calls.length, 1)
  })

  it('applies disabled state correctly', () => {
    const handleClick = mock.fn()
    const { getByText } = render(
      <GlitchButton onClick={handleClick} disabled>
        Disabled
      </GlitchButton>
    )
    const button = getByText('Disabled').closest('button')
    assert.ok(button.disabled)
    fireEvent.click(button)
    assert.strictEqual(handleClick.mock.calls.length, 0)
  })

  it('shows loading state correctly', () => {
    const { getByRole } = render(
      <GlitchButton onClick={() => {}} isLoading>
        Loading
      </GlitchButton>
    )
    const button = getByRole('button')
    assert.ok(button.disabled, 'Button should be disabled when loading')
    assert.strictEqual(
      button.getAttribute('aria-busy'),
      'true',
      'Should have aria-busy=true'
    )

    // Check if opacity is applied to children wrapper
    // The children are wrapped in a span with relative z-10 ...
    // We can't easily query that span without a testid, but we can check if button has the loader
    // The loader is an svg inside the button.
    // assert.ok(button.querySelector('svg'), 'Should contain loader SVG')
  })

  it('applies small size classes', () => {
    const { container } = render(
      <GlitchButton onClick={() => {}} size='sm'>
        Small Button
      </GlitchButton>
    )
    const button = container.querySelector('button')
    assert.ok(button.className.includes('px-4'), 'Should have small padding X')
    assert.ok(button.className.includes('py-2'), 'Should have small padding Y')
    assert.ok(button.className.includes('text-sm'), 'Should have small text')
  })

  it('applies owned variant style correctly', () => {
    const { container } = render(
      <GlitchButton onClick={() => {}} variant='owned' disabled>
        Owned
      </GlitchButton>
    )
    const button = container.querySelector('button')
    // Should NOT have opacity-60 even if disabled
    assert.ok(!button.className.includes('opacity-60'), 'Owned variant should not have opacity-60')
    assert.ok(button.className.includes('opacity-100'), 'Owned variant should have opacity-100')
    assert.ok(button.className.includes('cursor-default'), 'Owned variant should have default cursor')
  })
})
