import React from 'react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { TravelingVan } from '../../../../src/components/overworld/TravelingVan'
import type { MapNode } from '../../../../src/types/components'

// Mock framer-motion to simplify testing animations
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onAnimationComplete, className, style, ...props }: any) => {
      // Create a wrapper that fires onAnimationComplete when clicked
      return (
        <div
          data-testid="motion-wrapper"
          className={className}
          style={style}
          onClick={onAnimationComplete}
          {...props}
        >
          {children}
        </div>
      )
    }
  }
}))

describe('TravelingVan', () => {
  const mockNode1: MapNode = { id: 'node1', x: 10, y: 20, type: 'gigs' }
  const mockNode2: MapNode = { id: 'node2', x: 80, y: 90, type: 'gigs' }
  const mockVanUrl = 'http://example.com/van.png'
  const mockT = vi.fn((key) => key)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns null when isTraveling is false', () => {
    const travelCompletedRef = { current: false }
    const { container } = render(
      <TravelingVan
        t={mockT}
        isTraveling={false}
        currentNode={mockNode1}
        travelTarget={mockNode2}
        vanUrl={mockVanUrl}
        travelCompletedRef={travelCompletedRef}
        onTravelComplete={vi.fn()}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  test('returns null when currentNode is missing', () => {
    const travelCompletedRef = { current: false }
    const { container } = render(
      <TravelingVan
        t={mockT}
        isTraveling={true}
        currentNode={null}
        travelTarget={mockNode2}
        vanUrl={mockVanUrl}
        travelCompletedRef={travelCompletedRef}
        onTravelComplete={vi.fn()}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  test('returns null when travelTarget is missing', () => {
    const travelCompletedRef = { current: false }
    const { container } = render(
      <TravelingVan
        t={mockT}
        isTraveling={true}
        currentNode={mockNode1}
        travelTarget={null}
        vanUrl={mockVanUrl}
        travelCompletedRef={travelCompletedRef}
        onTravelComplete={vi.fn()}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  test('renders van image when traveling', () => {
    const travelCompletedRef = { current: false }
    render(
      <TravelingVan
        t={mockT}
        isTraveling={true}
        currentNode={mockNode1}
        travelTarget={mockNode2}
        vanUrl={mockVanUrl}
        travelCompletedRef={travelCompletedRef}
        onTravelComplete={vi.fn()}
      />
    )

    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', mockVanUrl)
    expect(img).toHaveAttribute('alt', 'ui:overworld.traveling_van')
    expect(img).toHaveAttribute('crossorigin', 'anonymous')
  })

  test('omits crossorigin for data URLs', () => {
    const travelCompletedRef = { current: false }
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

    render(
      <TravelingVan
        t={mockT}
        isTraveling={true}
        currentNode={mockNode1}
        travelTarget={mockNode2}
        vanUrl={dataUrl}
        travelCompletedRef={travelCompletedRef}
        onTravelComplete={vi.fn()}
      />
    )

    const img = screen.getByRole('img')
    expect(img).not.toHaveAttribute('crossorigin')
  })

  test('calls onTravelComplete when animation completes and ref is false', () => {
    const travelCompletedRef = { current: false }
    const onTravelComplete = vi.fn()

    render(
      <TravelingVan
        t={mockT}
        isTraveling={true}
        currentNode={mockNode1}
        travelTarget={mockNode2}
        vanUrl={mockVanUrl}
        travelCompletedRef={travelCompletedRef}
        onTravelComplete={onTravelComplete}
      />
    )

    // Trigger the animation complete callback mapped to click in our mock
    fireEvent.click(screen.getByTestId('motion-wrapper'))

    expect(onTravelComplete).toHaveBeenCalledTimes(1)
    expect(onTravelComplete).toHaveBeenCalledWith(mockNode2)
  })

  test('does not call onTravelComplete when ref is true', () => {
    const travelCompletedRef = { current: true }
    const onTravelComplete = vi.fn()

    render(
      <TravelingVan
        t={mockT}
        isTraveling={true}
        currentNode={mockNode1}
        travelTarget={mockNode2}
        vanUrl={mockVanUrl}
        travelCompletedRef={travelCompletedRef}
        onTravelComplete={onTravelComplete}
      />
    )

    // Trigger the animation complete callback mapped to click in our mock
    fireEvent.click(screen.getByTestId('motion-wrapper'))

    expect(onTravelComplete).not.toHaveBeenCalled()
  })
})
