import { act } from '@testing-library/react'
import { afterEach, describe, expect, test, vi, beforeEach } from 'vitest'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

afterEach(cleanup)

describe('MapNodeView', () => {
  let MapNodeView

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

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('../../src/components/MapNodeView.tsx')
    MapNodeView = module.MapNodeView
  })

  test('renders visual states appropriately (position, current, travel, pending, unreachable, ticketPrice)', async () => {
    const { container, rerender } = render(
      <MapNodeView
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
        ticketPrice={25}
      />
    )

    // Position check
    const wrapper = container.firstChild
    expect(wrapper).toHaveStyle('left: 50%')
    expect(wrapper).toHaveStyle('top: 50%')
    expect(screen.getAllByText('Test Venue')[0]).toBeInTheDocument()
    expect(screen.getByText(/25/)).toBeInTheDocument() // Ticket price usage

    // Current node with van
    rerender(
      <MapNodeView
        node={mockNode}
        isCurrent={true}
        isTraveling={false}
        visibility='visible'
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={25}
      />
    )
    const vanImage = screen.getByAltText('ui:map.vanAlt')
    expect(vanImage).toBeTruthy()

    expect(screen.getByText('ui:map.current_location')).toBeInTheDocument()

    // Traveling (no van)
    rerender(
      <MapNodeView
        node={mockNode}
        isCurrent={true}
        isTraveling={true}
        visibility='visible'
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={25}
      />
    )
    expect(screen.queryByAltText('ui:map.vanAlt')).toBeFalsy()

    // Pending confirm
    rerender(
      <MapNodeView
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
        ticketPrice={25}
      />
    )
    expect(screen.getByText('ui:map.confirm_q')).toBeInTheDocument()
    expect(screen.getByText('ui:map.confirm_q').className).toContain(
      'animate-pulse'
    )

    // Not reachable
    rerender(
      <MapNodeView
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
        ticketPrice={25}
      />
    )
    const newWrapper = container.firstChild
    expect(newWrapper.className).toContain('opacity-30')
    expect(newWrapper.className).toContain('grayscale')
  })

  test('renders different node types correctly', async () => {
    const { rerender, getByText, queryByText } = render(
      <MapNodeView
        node={{ ...mockNode, type: 'GIG' }}
        isCurrent={false}
        isTraveling={false}
        visibility='hidden'
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )

    // Hidden node
    expect(getByText('?')).toBeInTheDocument()

    // Hidden but type START
    rerender(
      <MapNodeView
        node={{ ...mockNode, type: 'START' }}
        isCurrent={false}
        isTraveling={false}
        visibility='hidden'
        isReachable={true}
        isPendingConfirm={false}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        ticketPrice={10}
      />
    )
    expect(queryByText('?')).toBeNull()

    // Festival type
    rerender(
      <MapNodeView
        node={{ ...mockNode, type: 'FESTIVAL' }}
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
    expect(screen.getByText(/ui:map\.festival/)).toBeInTheDocument()

    // Rest Stop type
    rerender(
      <MapNodeView
        node={{ ...mockNode, type: 'REST_STOP' }}
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
    expect(screen.getByText(/ui:map\.rest_stop/)).toBeInTheDocument()

    // Mystery type
    rerender(
      <MapNodeView
        node={{ ...mockNode, type: 'SPECIAL' }}
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
    expect(screen.getByText(/ui:map\.mystery/)).toBeInTheDocument()

    // Finale type
    rerender(
      <MapNodeView
        node={{ ...mockNode, type: 'FINALE' }}
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
    expect(screen.getByText(/ui:map\.finale/)).toBeInTheDocument()
  })

  test('handles user interactions appropriately', async () => {
    const user = userEvent.setup()

    render(
      <MapNodeView
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

    // Hover
    await act(async () => {
      await user.hover(button)
    })
    expect(mockSetHoveredNode).toHaveBeenCalledWith(mockNode)

    // Unhover
    await act(async () => {
      await user.unhover(button)
    })
    expect(mockSetHoveredNode).toHaveBeenCalledWith(null)

    // Click
    await act(async () => {
      await user.click(button)
    })
    expect(mockHandleTravel).toHaveBeenCalledWith(mockNode)
    mockHandleTravel.mockClear()

    // Keyboard Enter
    await act(async () => {
      button.focus()
      await user.keyboard('{Enter}')
    })
    expect(mockHandleTravel).toHaveBeenCalledWith(mockNode)
    mockHandleTravel.mockClear()

    // Keyboard Space
    await act(async () => {
      button.focus()
      await user.keyboard(' ')
    })
    expect(mockHandleTravel).toHaveBeenCalledWith(mockNode)
  })

  test('clears touch hover state on pointer release', () => {
    render(
      <MapNodeView
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
    fireEvent.pointerDown(button, { pointerType: 'touch' })
    expect(mockSetHoveredNode).toHaveBeenCalledWith(mockNode)

    fireEvent.pointerUp(button, { pointerType: 'touch' })
    expect(mockSetHoveredNode).toHaveBeenLastCalledWith(null)
  })

  test('clears touch hover state when pointer leaves the node', () => {
    render(
      <MapNodeView
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
    fireEvent.pointerDown(button, { pointerType: 'touch' })
    expect(mockSetHoveredNode).toHaveBeenCalledWith(mockNode)

    fireEvent.pointerLeave(button, { pointerType: 'touch' })
    expect(mockSetHoveredNode).toHaveBeenLastCalledWith(null)
  })
})
