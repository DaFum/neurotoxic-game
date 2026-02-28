import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

afterEach(cleanup)

describe('MapNode', () => {
  const mockNode = {
    id: 'node1',
    type: 'GIG',
    x: 50,
    y: 50,
    venue: {
      name: 'Test Venue',
      capacity: 500,
      pay: 300,
      price: 10,
      diff: 3
    }
  }

  const mockHandleTravel = vi.fn()
  const mockSetHoveredNode = vi.fn()
  const iconUrl = '/icon.png'
  const vanUrl = '/van.png'

  test('renders node at correct position', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')

    const { container } = render(
      <MapNode
        node={mockNode}
        isCurrent={false}
        isTraveling={false}
        visibility='visible'
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    const nodeDiv = container.querySelector('[style*="left: 50%"]')
    expect(nodeDiv).toBeTruthy()
  })

  test('shows van icon when isCurrent is true', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')

    render(
      <MapNode
        node={mockNode}
        isCurrent={true}
        isTraveling={false}
        visibility='visible'
        isReachable={false}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    const vanImage = screen.getByAltText('ui:map.vanAlt')
    expect(vanImage).toBeTruthy()
    expect(vanImage.src).toContain('van.png')
  })

  test('does not show van when isTraveling is true', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')

    render(
      <MapNode
        node={mockNode}
        isCurrent={true}
        isTraveling={true}
        visibility='visible'
        isReachable={false}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    const vanImage = screen.queryByAltText('Van')
    expect(vanImage).toBeFalsy()
  })

  test('calls handleTravel when clicked and isReachable', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')
    const user = userEvent.setup()

    render(
      <MapNode
        node={mockNode}
        isCurrent={false}
        isTraveling={false}
        visibility='visible'
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    const button = screen.getByRole('button')
    await user.click(button)

    expect(mockHandleTravel).toHaveBeenCalledWith(mockNode)
  })

  test('shows CONFIRM label when isPendingConfirm is true', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')

    render(
      <MapNode
        node={mockNode}
        isCurrent={false}
        isTraveling={false}
        visibility='visible'
        isReachable={true}
        isPendingConfirm={true}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    expect(screen.getByText('ui:map.confirm_q')).toBeTruthy()
  })

  test('shows venue information in tooltip', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')

    const { container } = render(
      <MapNode
        node={mockNode}
        isCurrent={false}
        isTraveling={false}
        visibility='visible'
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    expect(container.textContent).toContain('Test Venue')
    expect(container.textContent).toContain('ui:map.cap: 500')
    expect(container.textContent).toContain('ui:map.pay: ~300')
  })

  test('renders hidden node with question mark for hidden visibility', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')

    const hiddenNode = { ...mockNode, type: 'GIG' }

    const { container } = render(
      <MapNode
        node={hiddenNode}
        isCurrent={false}
        isTraveling={false}
        visibility='hidden'
        isReachable={false}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    expect(container.textContent).toContain('?')
  })

  test('renders START node even when visibility is hidden', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')

    const startNode = { ...mockNode, type: 'START' }

    const { container } = render(
      <MapNode
        node={startNode}
        isCurrent={false}
        isTraveling={false}
        visibility='hidden'
        isReachable={false}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    const svgElement = container.querySelector('svg')
    expect(svgElement).toBeInTheDocument()
  })

  test('applies opacity and grayscale when not reachable', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')

    const { container } = render(
      <MapNode
        node={mockNode}
        isCurrent={false}
        isTraveling={false}
        visibility='visible'
        isReachable={false}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    const nodeContainer = container.firstChild
    expect(nodeContainer?.className).toContain('opacity-30')
    expect(nodeContainer?.className).toContain('grayscale')
  })

  test('calls setHoveredNode on mouse enter', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')
    const user = userEvent.setup()

    render(
      <MapNode
        node={mockNode}
        isCurrent={false}
        isTraveling={false}
        visibility='visible'
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    const button = screen.getByRole('button')
    await user.hover(button)

    expect(mockSetHoveredNode).toHaveBeenCalledWith(mockNode)
  })

  test('calls setHoveredNode with null on mouse leave', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')
    const user = userEvent.setup()

    render(
      <MapNode
        node={mockNode}
        isCurrent={false}
        isTraveling={false}
        visibility='visible'
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    const button = screen.getByRole('button')
    await user.hover(button)
    await user.unhover(button)

    expect(mockSetHoveredNode).toHaveBeenLastCalledWith(null)
  })

  test('displays FESTIVAL label for festival node type', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')

    const festivalNode = { ...mockNode, type: 'FESTIVAL' }

    const { container } = render(
      <MapNode
        node={festivalNode}
        isCurrent={false}
        isTraveling={false}
        visibility='visible'
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    expect(container.textContent).toContain('ui:map.festival')
  })

  test('displays REST STOP info for rest stop node type', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')

    const restNode = { ...mockNode, type: 'REST_STOP' }

    const { container } = render(
      <MapNode
        node={restNode}
        isCurrent={false}
        isTraveling={false}
        visibility='visible'
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    expect(container.textContent).toContain('ui:map.nodeType.rest')
    expect(container.textContent).toContain('ui:map.rest_stop_desc')
  })

  test('displays MYSTERY info for special node type', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')

    const specialNode = { ...mockNode, type: 'SPECIAL' }

    const { container } = render(
      <MapNode
        node={specialNode}
        isCurrent={false}
        isTraveling={false}
        visibility='visible'
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    expect(container.textContent).toContain('ui:map.nodeType.fallback')
  })

  test('displays FINALE info for finale node type', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')

    const finaleNode = { ...mockNode, type: 'FINALE' }

    const { container } = render(
      <MapNode
        node={finaleNode}
        isCurrent={false}
        isTraveling={false}
        visibility='visible'
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    expect(container.textContent).toContain('ui:map.nodeType.fallback')
  })

  test('shows current location label when isCurrent is true', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')

    const { container } = render(
      <MapNode
        node={mockNode}
        isCurrent={true}
        isTraveling={false}
        visibility='visible'
        isReachable={false}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    expect(container.textContent).toContain('ui:map.current_location')
  })

  test('handles keyboard navigation with Enter key', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')
    const user = userEvent.setup()

    render(
      <MapNode
        node={mockNode}
        isCurrent={false}
        isTraveling={false}
        visibility='visible'
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    const button = screen.getByRole('button')
    button.focus()
    await user.keyboard('{Enter}')

    expect(mockHandleTravel).toHaveBeenCalledWith(mockNode)
  })

  test('handles keyboard navigation with Space key', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')
    const user = userEvent.setup()

    render(
      <MapNode
        node={mockNode}
        isCurrent={false}
        isTraveling={false}
        visibility='visible'
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    const button = screen.getByRole('button')
    button.focus()
    await user.keyboard(' ')

    expect(mockHandleTravel).toHaveBeenCalledWith(mockNode)
  })

  test('applies pulse animation when isPendingConfirm is true', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')

    const { getByText } = render(
      <MapNode
        node={mockNode}
        isCurrent={false}
        isTraveling={false}
        visibility='visible'
        isReachable={true}
        isPendingConfirm={true}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    const confirmLabel = getByText('ui:map.confirm_q')
    expect(confirmLabel.className).toContain('animate-pulse')
  })

  test('uses provided ticketPrice in tooltip', async () => {
    const { MapNode } = await import('../src/components/MapNode.jsx')

    const { container } = render(
      <MapNode
        node={mockNode}
        isCurrent={false}
        isTraveling={false}
        visibility='visible'
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={15}
      />
    )

    expect(container.textContent).toContain('15')
  })
})
