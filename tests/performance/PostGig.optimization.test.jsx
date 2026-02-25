import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import React from 'react'
import { render, cleanup } from '@testing-library/react'

import { SocialPhase } from '../../src/components/postGig/SocialPhase.jsx'

describe('PostGig Optimization', () => {
  beforeEach(() => {
    //  removed (handled by vitest env)
  })

  afterEach(() => {
    cleanup()

  })

  test('SocialPhase: buttons receive new onClick handlers on every render', async () => {
    const options = [
      { title: 'Op1', platform: 'P1', viralChance: 0.1 },
      { title: 'Op2', platform: 'P2', viralChance: 0.2 }
    ]
    const onSelect = () => {}

    const { getByText, getAllByRole, rerender } = render(
      <SocialPhase options={options} onSelect={onSelect} />
    )

    const btn1 = getAllByRole('button')[0]

    // Helper to get React props from DOM node
    const getProps = (node) => {
      const key = Object.keys(node).find(k => k.startsWith('__reactProps$') || k.startsWith('__reactEventHandlers$'))
      return key ? node[key] : null
    }

    const props1 = getProps(btn1)
    // The onClick might be wrapped by framer-motion, but if the component re-renders and creates a new function,
    // even the wrapper or the direct handler should arguably be different or trigger an update.
    // However, checking strictly the function reference on the DOM node might be checking the *bound* handler from React or Framer.
    // Let's assume React attaches a stable listener for the event type, but the internal mapping updates.

    // Actually, checking props on the DOM node is checking what React passed to the DOM.
    // React passes the `onClick` prop (which is the inline function) to the synthetic event system?
    // No, React attaches a global listener. The `onClick` prop is stored in the fiber.
    // Accessing `__reactProps` gives us the props of the fiber.

    const onClick1 = props1.onClick

    // Rerender with SAME props
    rerender(<SocialPhase options={options} onSelect={onSelect} />)

    const btn1_after = getAllByRole('button')[0]
    const props2 = getProps(btn1_after)
    const onClick2 = props2.onClick

    // Verify we can access props
    expect(props1).toBeTruthy()
    expect(onClick1).toBeTruthy()

    // Assert that onClick handler has NOT changed
    // Because we optimized it to use a memoized component with stable callbacks.
    expect(onClick1).toBe(onClick2)
  })
})
