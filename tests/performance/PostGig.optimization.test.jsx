import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { render, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils.js'
import { SocialPhase } from '../../src/scenes/PostGig.jsx'

describe('PostGig Optimization', () => {
  beforeEach(() => {
    setupJSDOM()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('SocialPhase: buttons receive new onClick handlers on every render', async () => {
    const options = [
      { title: 'Op1', platform: 'P1', viralChance: 0.1 },
      { title: 'Op2', platform: 'P2', viralChance: 0.2 }
    ]
    const onSelect = () => {}

    const { getByText, rerender } = render(
      <SocialPhase options={options} onSelect={onSelect} />
    )

    const btn1 = getByText('Op1').closest('button')

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

    const btn1_after = getByText('Op1').closest('button')
    const props2 = getProps(btn1_after)
    const onClick2 = props2.onClick

    // Verify we can access props
    assert.ok(props1, 'Should access React props on DOM node')
    assert.ok(onClick1, 'Should have onClick handler')

    // Assert that onClick handler has NOT changed
    // Because we optimized it to use a memoized component with stable callbacks.
    assert.strictEqual(onClick1, onClick2, 'onClick handler should be stable after optimization')
  })
})
