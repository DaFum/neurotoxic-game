import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

import React from 'react'
import { render, cleanup } from '@testing-library/react'

import { MapNode } from '../../src/components/MapNode.jsx'

describe('MapNode Optimization', () => {
  beforeEach(() => {
    //  removed (handled by vitest env)
  })

  afterEach(() => {
    cleanup()

  })

  test('MapNode: style object for position should be referentially stable across re-renders', async () => {
    const node = {
      id: '1',
      type: 'GIG',
      x: 50,
      y: 50,
      venue: { name: 'Venue', capacity: 100, pay: 100, price: 10, diff: 1 }
    }
    const handleTravel = () => {}
    const setHoveredNode = () => {}

    const { container, rerender } = render(
      <MapNode
        node={node}
        isCurrent={false}
        isTraveling={false}
        visibility="visible"
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={handleTravel}
        setHoveredNode={setHoveredNode}
        iconUrl="icon.png"
        vanUrl="van.png"
      />
    )

    // Helper to get React props from DOM node
    const getProps = (domNode) => {
      const key = Object.keys(domNode).find(k => k.startsWith('__reactProps$'))
      return key ? domNode[key] : null
    }

    const div = container.firstChild
    const props1 = getProps(div)
    const style1 = props1.style

    // Rerender with a prop change that forces re-render but shouldn't affect position
    // Changing isTraveling to true
    rerender(
      <MapNode
        node={node}
        isCurrent={false}
        isTraveling={true}
        visibility="visible"
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={handleTravel}
        setHoveredNode={setHoveredNode}
        iconUrl="icon.png"
        vanUrl="van.png"
      />
    )

    const div2 = container.firstChild
    const props2 = getProps(div2)
    const style2 = props2.style

    expect(style1).toEqual(style2)
    expect(style1).toBe(style2)
  })
})
