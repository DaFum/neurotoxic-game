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

  test('formats venue pay and ticket price with formatCurrency', async () => {
    const { formatCurrency } = await import('../../src/utils/numberUtils')
    const i18n = (await import('i18next')).default
    const { container } = render(
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
    const text = container.textContent
    expect(text).toContain(`~${formatCurrency(300, i18n.language)}`)
    expect(text).toContain(formatCurrency(25, i18n.language))
  })

  describe('tooltip edge nudge (#3355)', () => {
    const MAP = { top: 100, bottom: 600 }

    const renderInMap = () => {
      const rectOf = (top, bottom) => ({
        top,
        bottom,
        left: 0,
        right: 100,
        width: 100,
        height: bottom - top,
        x: 0,
        y: top,
        toJSON: () => ({})
      })
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
        function rect() {
          if (this.classList.contains('map-wrap'))
            return rectOf(MAP.top, MAP.bottom)
          // The tooltip: 200px tall, hanging out of the map at the top or bottom.
          if (this.className.includes('bg-void-black/90')) {
            // The rect follows the inline nudge, like a real layout would.
            const translateY =
              Number.parseFloat(this.style.translate.split(/\s+/)[1] ?? '0') ||
              0
            const top = globalThis.__tooltipTop + translateY
            return rectOf(top, top + 200)
          }
          return rectOf(0, 0)
        }
      )
      vi.stubGlobal('requestAnimationFrame', cb => {
        cb(0)
        return 1
      })
      return render(
        <div className='map-wrap'>
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
          />
        </div>
      )
    }
    const tooltipOf = container =>
      container.querySelector('div[class*="bg-void-black/90"]')

    afterEach(() => {
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    })

    test('moves a tooltip that overhangs the bottom edge back inside', () => {
      globalThis.__tooltipTop = 500 // bottom 700, 100px past the map's 600
      const { container } = renderInMap()
      // Up by 100 plus the 4px margin.
      expect(tooltipOf(container).style.translate).toBe('-50% -104px')
    })

    test('moves a tooltip that overhangs the top edge back inside', () => {
      globalThis.__tooltipTop = 60 // 40px above the map's 100
      const { container } = renderInMap()
      expect(tooltipOf(container).style.translate).toBe('-50% 44px')
    })

    test('places it again when the viewport is resized while it is open', () => {
      globalThis.__tooltipTop = 500
      const { container } = renderInMap()
      expect(tooltipOf(container).style.translate).toBe('-50% -104px')

      // A rotation changed the base position: the old nudge must be dropped
      // before measuring, and a different one applied.
      globalThis.__tooltipTop = 400
      act(() => {
        window.dispatchEvent(new Event('resize'))
      })
      expect(tooltipOf(container).style.translate).toBe('-50% -4px')
    })

    test('leaves a tooltip that fits where it is', () => {
      globalThis.__tooltipTop = 200
      const { container } = renderInMap()
      expect(tooltipOf(container).style.translate).toBe('')
    })
  })

  test('names a venue-less Expedition stop by its public subtype', async () => {
    const i18n = (await import('i18next')).default
    const rivalStop = { id: 'exp_1_0', type: 'SPECIAL', x: 40, y: 20 }
    const { container } = render(
      <MapNodeView
        node={rivalStop}
        isCurrent={false}
        isTraveling={false}
        visibility='visible'
        isReachable={true}
        handleTravel={mockHandleTravel}
        setHoveredNode={mockSetHoveredNode}
        iconUrl={iconUrl}
        vanUrl={vanUrl}
        expeditionFog={{
          routeStep: 1,
          onwardRouteCount: 2,
          nodeClass: 'SPECIAL',
          specialSubtype: 'RIVAL_ENCOUNTER',
          dangerTier: 'medium',
          rewardTier: 'medium',
          isExtractionWindow: false,
          intelLevel: 0,
          estimatedPayout: null,
          exactWearCost: null
        }}
      />
    )

    const subtype = i18n.t('ui:expedition.node.subtype.RIVAL_ENCOUNTER')
    expect(container.textContent).toContain(subtype)
    expect(container.textContent).not.toContain(i18n.t('ui:map.unknown'))
  })

  test('shows the Fame booking lock only when one is passed', () => {
    const festival = { ...mockNode, type: 'FESTIVAL' }
    const props = {
      node: festival,
      isCurrent: false,
      isTraveling: false,
      visibility: 'visible',
      isReachable: true,
      isPendingConfirm: true,
      handleTravel: mockHandleTravel,
      setHoveredNode: mockSetHoveredNode,
      iconUrl,
      vanUrl
    }
    const { rerender } = render(<MapNodeView {...props} />)
    expect(screen.queryByTestId('map-node-booking-locked')).toBeNull()

    rerender(<MapNodeView {...props} bookingLockMinimumFame={250} />)
    expect(screen.getByTestId('map-node-booking-locked')).toBeInTheDocument()

    rerender(<MapNodeView {...props} bookingLockMinimumFame={null} />)
    expect(screen.queryByTestId('map-node-booking-locked')).toBeNull()
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
    expect(newWrapper.className).toContain('opacity-60')
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

  test('renders city intel tooltip with genreBias, attentionSpan, and barSpendingProfile', () => {
    const cityTraits = {
      genreBias: 'metal',
      attentionSpan: 45,
      barSpendingProfile: 'high'
    }

    render(
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
        ticketPrice={10}
        cityTraits={cityTraits}
      />
    )

    expect(screen.getByText('ui:map.intel.title')).toBeInTheDocument()
    expect(screen.getByText('ui:map.intel.genreBias')).toBeInTheDocument()
    expect(screen.getByText('ui:map.intel.attentionSpan')).toBeInTheDocument()
    expect(
      screen.getByText('ui:map.intel.barSpendingProfile')
    ).toBeInTheDocument()
    expect(screen.getByText(/45 ui:unit.minutesShort/)).toBeInTheDocument()
    expect(screen.queryByText(/45m/)).not.toBeInTheDocument()
  })

  describe('node stacking tiers', () => {
    const renderNode = overrides => {
      const { container } = render(
        <MapNodeView
          node={mockNode}
          isCurrent={false}
          isTraveling={false}
          visibility='visible'
          isReachable={false}
          handleTravel={mockHandleTravel}
          setHoveredNode={mockSetHoveredNode}
          iconUrl={iconUrl}
          vanUrl={vanUrl}
          {...overrides}
        />
      )
      return container.querySelector('.map-node').className
    }

    test('reachable node sits in the middle tier above unreachable nodes', () => {
      const className = renderNode({ isReachable: true })
      expect(className).toMatch(/(^|\s)z-\(--z-stage\)(\s|$)/)
      expect(className).not.toContain('z-(--z-stage-bg)')
      expect(className).not.toContain('z-(--z-stage-controls)')
    })

    test('unreachable node stays in the lowest tier', () => {
      const className = renderNode({ isReachable: false })
      expect(className).toMatch(/(^|\s)z-\(--z-stage-bg\)(\s|$)/)
    })

    test('current node stays in the top tier', () => {
      const className = renderNode({ isCurrent: true })
      expect(className).toContain('z-(--z-stage-controls)')
    })
  })

  describe('desktop name chip visibility', () => {
    const renderNode = (overrides, node = mockNode) => {
      render(
        <MapNodeView
          node={node}
          isCurrent={false}
          isTraveling={false}
          visibility='visible'
          isReachable={true}
          handleTravel={mockHandleTravel}
          setHoveredNode={mockSetHoveredNode}
          iconUrl={iconUrl}
          vanUrl={vanUrl}
          {...overrides}
        />
      )
      return screen.getByText(node.venue.name, { selector: '.max-w-28' })
    }

    test('hides the name from sm up when idle and a type chip is shown', () => {
      expect(renderNode({}).className).toContain('sm:hidden')
    })

    test('keeps the name visible for the current node', () => {
      expect(renderNode({ isCurrent: true }).className).not.toContain(
        'sm:hidden'
      )
    })

    test('keeps the name visible for a node awaiting travel confirmation', () => {
      expect(renderNode({ isPendingConfirm: true }).className).not.toContain(
        'sm:hidden'
      )
    })

    test('reveals the name on hover and hides it again afterwards', () => {
      const name = renderNode({})
      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button)
      expect(name.className).not.toContain('sm:hidden')
      fireEvent.mouseLeave(button)
      expect(name.className).toContain('sm:hidden')
    })

    test('reveals the name on keyboard focus and hides it on blur', () => {
      const name = renderNode({})
      const button = screen.getByRole('button')
      fireEvent.focus(button)
      expect(name.className).not.toContain('sm:hidden')
      fireEvent.blur(button)
      expect(name.className).toContain('sm:hidden')
    })

    test('never hides the only label when the type chip equals the name', () => {
      const sameNode = {
        ...mockNode,
        venue: { ...mockNode.venue, name: 'ui:map.nodeType.gig' }
      }
      const name = renderNode({}, sameNode)
      expect(name.className).not.toContain('sm:hidden')
    })
  })

  describe('phone label visibility', () => {
    const renderLabel = overrides => {
      render(
        <MapNodeView
          node={mockNode}
          isCurrent={false}
          isTraveling={false}
          visibility='visible'
          isReachable={true}
          handleTravel={mockHandleTravel}
          setHoveredNode={mockSetHoveredNode}
          iconUrl={iconUrl}
          vanUrl={vanUrl}
          {...overrides}
        />
      )
      const name = screen.getByText(mockNode.venue.name, {
        selector: '.max-w-28'
      })
      return { stack: name.parentElement, name }
    }

    test('hides the current node label: its name is the scene title', () => {
      const { stack } = renderLabel({ isCurrent: true })
      expect(stack.className).toContain('max-sm:hidden')
    })

    test('keeps the current label of a venue-less Expedition stop: the title names the previous venue', () => {
      const supplyStop = { id: 'exp_1_0', type: 'SUPPLY_STOP', x: 40, y: 20 }
      render(
        <MapNodeView
          node={supplyStop}
          isCurrent={true}
          isTraveling={false}
          visibility='visible'
          isReachable={false}
          handleTravel={mockHandleTravel}
          setHoveredNode={mockSetHoveredNode}
          iconUrl={iconUrl}
          vanUrl={vanUrl}
          expeditionFog={{
            routeStep: 1,
            onwardRouteCount: 2,
            nodeClass: 'SUPPLY',
            specialSubtype: null,
            dangerTier: 'low',
            rewardTier: 'low',
            isExtractionWindow: false,
            estimatedPayout: null
          }}
        />
      )
      const name = document.querySelector('.map-node .max-w-28')
      expect(name).not.toBeNull()
      expect(name.parentElement.className).not.toContain('max-sm:hidden')
      expect(name.parentElement.className).not.toContain('max-[359px]:hidden')
    })

    test('hides an unreachable node label on phones', () => {
      const { stack } = renderLabel({ isReachable: false })
      expect(stack.className).toContain('max-sm:hidden')
    })

    test('shows a travel target label from 360px up, tap-only below', () => {
      const { stack } = renderLabel({})
      expect(stack.className).toContain('max-[359px]:hidden')
      expect(stack.className).not.toContain('max-sm:hidden')
    })

    test('reveals any label on hover, including the current node', () => {
      const { stack } = renderLabel({ isCurrent: true })
      fireEvent.mouseEnter(screen.getByRole('button'))
      expect(stack.className).not.toContain('max-sm:hidden')
      expect(stack.className).not.toContain('max-[359px]:hidden')
    })

    test('drops the type chip on phones until the node is touched', () => {
      const { name } = renderLabel({})
      const chip = name.previousElementSibling
      expect(chip.className).toContain('max-sm:hidden')
      fireEvent.mouseEnter(screen.getByRole('button'))
      expect(chip.className).not.toContain('max-sm:hidden')
    })

    test('clamps long names to two lines on phones', () => {
      const { name } = renderLabel({})
      expect(name.className).toContain('max-sm:line-clamp-2')
    })
  })
})
