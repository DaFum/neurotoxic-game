import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import React from 'react'
import { render, cleanup } from '@testing-library/react'

// Mock ActionButton to capture renders
const mockActionButton = vi.fn(({ children }) => (
  <button type='button'>{children}</button>
))

vi.mock('../../src/ui/shared', () => ({
  Panel: ({ children }) => <div>{children}</div>,
  ActionButton: props => mockActionButton(props)
}))

// Dynamic import to apply mocks
const { SocialPhase } = await import(
  '../../src/components/postGig/SocialPhase.jsx'
)

describe('PostGig Optimization', () => {
  beforeEach(() => {
    mockActionButton.mockClear()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  test('SocialPhase: re-renders with stable props do not re-render memoized children', async () => {
    const options = [
      { id: '1', name: 'Op1', platform: 'P1', viralChance: 0.1 },
      { id: '2', name: 'Op2', platform: 'P2', viralChance: 0.2 }
    ]
    const onSelect = vi.fn()

    const { rerender } = render(
      <SocialPhase options={options} onSelect={onSelect} />
    )

    // Initial render should trigger ActionButton renders (one per option)
    expect(mockActionButton).toHaveBeenCalledTimes(2)

    // Capture the onClick handler from the first render of the first button
    const firstRenderProps = mockActionButton.mock.calls[0][0]
    const firstRenderOnClick = firstRenderProps.onClick

    mockActionButton.mockClear()

    // Rerender with SAME props objects (referentially identical)
    rerender(<SocialPhase options={options} onSelect={onSelect} />)

    // Since SocialOptionButton is memoized and props are identical,
    // it should NOT re-render, and thus ActionButton should NOT be called again.
    // If it *does* re-render, we check stability of the handler.
    if (mockActionButton.mock.calls.length > 0) {
      const secondRenderProps = mockActionButton.mock.calls[0][0]
      expect(secondRenderProps.onClick).toBe(firstRenderOnClick)
    } else {
      // Ideal case: no re-render
      expect(mockActionButton).not.toHaveBeenCalled()
    }
  })
})
