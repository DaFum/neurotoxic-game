import { test, expect, vi, afterEach, describe } from 'vitest'
import { render, act } from '@testing-library/react'
import { GAME_PHASES } from '../../src/context/gameConstants'

vi.mock('../../src/data/chatter', () => ({
  getRandomChatter: () => null
}))

vi.mock('../../src/hooks/useChatterLogic', () => ({
  useChatterLogic: () => ({ messages: [], removeMessage: vi.fn() })
}))

const mockState = {
  currentScene: GAME_PHASES.GIG,
  band: { members: [] },
  player: { currentNodeId: 'none' },
  gameMap: { nodes: {} },
  social: {},
  lastGigStats: null,
  gigModifiers: {}
}

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: vi.fn(selector => selector(mockState))
}))

const realGetRect = Element.prototype.getBoundingClientRect

/**
 * jsdom does no layout, so every rect is zero and the placement effect bails
 * out early. Stub rects for just the overlay and the obstacle under test.
 */
const stubRects = ({ overlay, obstacle }) => {
  Element.prototype.getBoundingClientRect = function () {
    if (this.getAttribute('role') === 'status') return overlay
    if (this.hidden || this.hasAttribute('hidden')) {
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }
    }
    if (
      this.hasAttribute('data-chatter-avoid') ||
      (typeof this.matches === 'function' &&
        this.matches('input:not([type="hidden"]),select,textarea'))
    ) {
      return typeof obstacle === 'function' ? obstacle(this) : obstacle
    }
    return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }
  }
}

afterEach(() => {
  mockState.currentScene = GAME_PHASES.GIG
  Element.prototype.getBoundingClientRect = realGetRect
  document
    .querySelectorAll('[data-chatter-avoid],input,select,textarea')
    .forEach(el => {
      el.remove()
    })
})

test('chatter box moves off a `data-chatter-avoid` element it would cover', async () => {
  // Regression guard: the box used to park on the menu wordmark, the PreGig
  // venue name and the gig HUD readouts, because only interactive elements
  // counted as obstacles.
  const marked = document.createElement('div')
  marked.setAttribute('data-chatter-avoid', '')
  document.body.appendChild(marked)

  // Default (non-overworld) anchor at 1024x768 for a 400x80 box is
  // { left: 312, top: 624 }; the obstacle is placed to cover exactly that.
  stubRects({
    overlay: {
      left: 312,
      top: 624,
      right: 712,
      bottom: 704,
      width: 400,
      height: 80
    },
    // Covers the whole lower half, blocking every bottom-edge anchor.
    obstacle: {
      left: 0,
      top: window.innerHeight / 2,
      right: window.innerWidth,
      bottom: window.innerHeight,
      width: window.innerWidth,
      height: window.innerHeight / 2
    }
  })

  const { ChatterOverlay } =
    await import('../../src/components/ChatterOverlay.tsx')
  const { getByRole } = render(<ChatterOverlay />)
  const container = getByRole('status')

  // Repositioned away from the blocked default anchor.
  expect(container.style.top).not.toBe('')
  expect(Number.parseInt(container.style.top, 10)).toBeLessThan(
    window.innerHeight / 2
  )
  expect(container.style.transform).toBe('none')
}, 15000)

test('chatter box keeps its CSS default when nothing is in the way', async () => {
  stubRects({
    overlay: {
      left: 312,
      top: 624,
      right: 712,
      bottom: 704,
      width: 400,
      height: 80
    },
    obstacle: { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }
  })

  const { ChatterOverlay } =
    await import('../../src/components/ChatterOverlay.tsx')
  const { getByRole } = render(<ChatterOverlay />)

  expect(getByRole('status').style.top).toBe('')
}, 15000)

describe('form controls and scene suppression', () => {
  const OVERLAY_RECT = {
    left: 312,
    top: 624,
    right: 712,
    bottom: 704,
    width: 400,
    height: 80
  }
  const BLOCKING_RECT = {
    left: 0,
    top: window.innerHeight / 2,
    right: window.innerWidth,
    bottom: window.innerHeight,
    width: window.innerWidth,
    height: window.innerHeight / 2
  }
  const FULL_BLOCK_RECT = {
    left: 0,
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
    width: window.innerWidth,
    height: window.innerHeight
  }

  test('range-input is recognized as an obstacle and moves the chatter box', async () => {
    const range = document.createElement('input')
    range.type = 'range'
    document.body.appendChild(range)

    stubRects({ overlay: OVERLAY_RECT, obstacle: BLOCKING_RECT })
    const { ChatterOverlay } =
      await import('../../src/components/ChatterOverlay.tsx')
    const { getByRole } = render(<ChatterOverlay />)
    const container = getByRole('status')

    expect(container.style.top).not.toBe('')
    expect(Number.parseInt(container.style.top, 10)).toBeLessThan(
      window.innerHeight / 2
    )
  }, 15000)

  test('select element is recognized as an obstacle and moves the chatter box', async () => {
    const select = document.createElement('select')
    document.body.appendChild(select)

    stubRects({ overlay: OVERLAY_RECT, obstacle: BLOCKING_RECT })
    const { ChatterOverlay } =
      await import('../../src/components/ChatterOverlay.tsx')
    const { getByRole } = render(<ChatterOverlay />)
    const container = getByRole('status')

    expect(container.style.top).not.toBe('')
    expect(Number.parseInt(container.style.top, 10)).toBeLessThan(
      window.innerHeight / 2
    )
  }, 15000)

  test('hidden input is excluded from obstacles and chatter keeps default position', async () => {
    const hiddenInput = document.createElement('input')
    hiddenInput.type = 'hidden'
    document.body.appendChild(hiddenInput)

    stubRects({ overlay: OVERLAY_RECT, obstacle: BLOCKING_RECT })
    const { ChatterOverlay } =
      await import('../../src/components/ChatterOverlay.tsx')
    const { getByRole } = render(<ChatterOverlay />)
    const container = getByRole('status')

    expect(container.style.top).toBe('')
  }, 15000)

  test('desktop TourPrep suppresses chatter when all candidate anchors are blocked', async () => {
    mockState.currentScene = GAME_PHASES.TOUR_PREP
    const marked = document.createElement('div')
    marked.setAttribute('data-chatter-avoid', '')
    document.body.appendChild(marked)

    stubRects({ overlay: OVERLAY_RECT, obstacle: FULL_BLOCK_RECT })
    const { ChatterOverlay } =
      await import('../../src/components/ChatterOverlay.tsx')
    const { getByRole } = render(<ChatterOverlay />)
    const container = getByRole('status', { hidden: true })

    expect(container.style.visibility).toBe('hidden')
  }, 15000)

  test('desktop non-expedition scene keeps default position when all candidate anchors are blocked', async () => {
    mockState.currentScene = GAME_PHASES.GIG
    const marked = document.createElement('div')
    marked.setAttribute('data-chatter-avoid', '')
    document.body.appendChild(marked)

    stubRects({ overlay: OVERLAY_RECT, obstacle: FULL_BLOCK_RECT })
    const { ChatterOverlay } =
      await import('../../src/components/ChatterOverlay.tsx')
    const { getByRole } = render(<ChatterOverlay />)
    const container = getByRole('status')

    expect(container.style.visibility).not.toBe('hidden')
    expect(container.style.top).toBe('')
  }, 15000)

  test('desktop Overworld suppresses chatter when all candidate anchors are blocked', async () => {
    mockState.currentScene = GAME_PHASES.OVERWORLD
    const marked = document.createElement('div')
    marked.setAttribute('data-chatter-avoid', '')
    document.body.appendChild(marked)

    stubRects({ overlay: OVERLAY_RECT, obstacle: FULL_BLOCK_RECT })
    const { ChatterOverlay } =
      await import('../../src/components/ChatterOverlay.tsx')
    const { getByRole } = render(<ChatterOverlay />)
    const container = getByRole('status', { hidden: true })

    expect(container.style.visibility).toBe('hidden')
  }, 15000)
})

describe('observer lifecycle', () => {
  const OVERLAY_RECT = {
    left: 312,
    top: 624,
    right: 712,
    bottom: 704,
    width: 400,
    height: 80
  }
  const ZERO_RECT = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0
  }
  const BLOCKING_RECT = {
    left: 0,
    top: window.innerHeight / 2,
    right: window.innerWidth,
    bottom: window.innerHeight,
    width: window.innerWidth,
    height: window.innerHeight / 2
  }

  /**
   * Stubs rects through a spy so measurements can be counted. The obstacle
   * rect is read through a getter, so tests can flip it without remounting.
   */
  const spyRects = obstacleRef => {
    const spy = vi.fn(function () {
      if (this.getAttribute('role') === 'status') return OVERLAY_RECT
      if (this.hidden || this.hasAttribute('hidden')) return ZERO_RECT
      if (
        this.hasAttribute('data-chatter-avoid') ||
        (typeof this.matches === 'function' &&
          this.matches('input:not([type="hidden"]),select,textarea'))
      ) {
        return typeof obstacleRef.current === 'function'
          ? obstacleRef.current(this)
          : obstacleRef.current
      }
      return ZERO_RECT
    })
    Element.prototype.getBoundingClientRect = spy
    // Overlay reads are the measurement count: one per reposition().
    const measurements = () =>
      spy.mock.contexts.filter(el => el.getAttribute('role') === 'status')
        .length
    return { measurements }
  }

  const addObstacle = (parent = document.body) => {
    const el = document.createElement('div')
    el.setAttribute('data-chatter-avoid', '')
    parent.appendChild(el)
    return el
  }

  const mountOverlay = async () => {
    const { ChatterOverlay } =
      await import('../../src/components/ChatterOverlay.tsx')
    return render(<ChatterOverlay />)
  }

  // Flushes the MutationObserver microtask without advancing timers.
  const flushMutations = () => act(async () => {})

  afterEach(() => {
    vi.useRealTimers()
  })

  test('an obstacle mounted after first render re-places the box after 200 ms', async () => {
    vi.useFakeTimers()
    const obstacle = { current: BLOCKING_RECT }
    const { measurements } = spyRects(obstacle)
    // Mounted inside the rendered container, not on <body>: the observer must
    // see nested scene obstacles (`subtree: true`).
    const { container: root, getByRole } = await mountOverlay()
    const container = getByRole('status')
    expect(container.style.top).toBe('')

    addObstacle(root)
    await flushMutations()
    await act(async () => {
      vi.advanceTimersByTime(199)
    })
    expect(container.style.top).toBe('')

    const before = measurements()
    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(measurements()).toBe(before + 1)
    expect(Number.parseInt(container.style.top, 10)).toBeLessThan(
      window.innerHeight / 2
    )
  }, 15000)

  test('removing the obstacle lets the box recover its CSS default', async () => {
    vi.useFakeTimers()
    const marked = addObstacle()
    const { measurements } = spyRects({ current: BLOCKING_RECT })
    const { getByRole } = await mountOverlay()
    const container = getByRole('status')
    expect(container.style.top).not.toBe('')

    marked.remove()
    await flushMutations()
    const before = measurements()
    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    expect(measurements()).toBe(before + 1)
    expect(container.style.top).toBe('')
  }, 15000)

  test('repeated mutations inside the debounce window cause one measurement', async () => {
    vi.useFakeTimers()
    const { measurements } = spyRects({ current: ZERO_RECT })
    await mountOverlay()
    const before = measurements()

    for (let i = 0; i < 5; i++) {
      addObstacle()
      await flushMutations()
      await act(async () => {
        vi.advanceTimersByTime(100)
      })
    }
    // Last mutation was 100 ms ago; the trailing timer has not fired yet.
    expect(measurements()).toBe(before)

    await act(async () => {
      vi.advanceTimersByTime(100)
    })
    expect(measurements()).toBe(before + 1)

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(measurements()).toBe(before + 1)
  }, 15000)

  test('a sustained mutation stream is measured at the max wait (#3289)', async () => {
    vi.useFakeTimers()
    const { measurements } = spyRects({ current: ZERO_RECT })
    await mountOverlay()
    const before = measurements()

    // A mutation every 100 ms never lets the 200 ms trailing timer fire. The
    // first one arms the 1000 ms max wait.
    for (let i = 0; i < 9; i++) {
      addObstacle()
      await flushMutations()
      await act(async () => {
        vi.advanceTimersByTime(100)
      })
    }
    expect(measurements()).toBe(before)

    addObstacle()
    await flushMutations()
    await act(async () => {
      vi.advanceTimersByTime(100)
    })
    expect(measurements()).toBe(before + 1)

    // The stream goes on: the next burst arms a fresh max wait.
    for (let i = 0; i < 9; i++) {
      addObstacle()
      await flushMutations()
      await act(async () => {
        vi.advanceTimersByTime(100)
      })
    }
    expect(measurements()).toBe(before + 1)

    // Once it stops, one trailing measurement follows and nothing after it.
    await act(async () => {
      vi.advanceTimersByTime(100)
    })
    expect(measurements()).toBe(before + 2)
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(measurements()).toBe(before + 2)
  }, 15000)

  test('a window resize measures on the next animation frame', async () => {
    vi.useFakeTimers({
      toFake: [
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'setTimeout',
        'clearTimeout'
      ]
    })
    const { measurements } = spyRects({ current: ZERO_RECT })
    await mountOverlay()
    const before = measurements()

    act(() => {
      window.dispatchEvent(new Event('resize'))
      window.dispatchEvent(new Event('resize'))
    })
    expect(measurements()).toBe(before)

    await act(async () => {
      vi.advanceTimersToNextFrame()
    })
    // Two resizes in one frame are throttled to a single measurement.
    expect(measurements()).toBe(before + 1)
  }, 15000)

  test('nested non-bubbling scroll with mutable geometry triggers one measurement per frame', async () => {
    vi.useFakeTimers({
      toFake: [
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'setTimeout',
        'clearTimeout'
      ]
    })
    const scrollContainer = document.createElement('div')
    scrollContainer.className = 'overflow-y-auto'
    document.body.appendChild(scrollContainer)

    addObstacle(scrollContainer)
    const obstacleGeometry = { current: ZERO_RECT }
    const { measurements } = spyRects(obstacleGeometry)

    const { getByRole } = await mountOverlay()
    const container = getByRole('status')
    expect(container.style.top).toBe('')

    // Mutate geometry to block default position
    obstacleGeometry.current = BLOCKING_RECT

    const before = measurements()
    act(() => {
      // Non-bubbling scroll event from nested container
      scrollContainer.dispatchEvent(new Event('scroll', { bubbles: false }))
      scrollContainer.dispatchEvent(new Event('scroll', { bubbles: false }))
    })
    // Before frame runs, no extra measurements
    expect(measurements()).toBe(before)

    await act(async () => {
      vi.advanceTimersToNextFrame()
    })
    // Throttled to at most one measurement per frame
    expect(measurements()).toBe(before + 1)
    expect(container.style.top).not.toBe('')
    expect(Number.parseInt(container.style.top, 10)).toBeLessThan(
      window.innerHeight / 2
    )

    scrollContainer.remove()
  }, 15000)

  test('debounced hidden attribute change triggers re-measurement after 200 ms', async () => {
    vi.useFakeTimers()
    const marked = addObstacle()
    marked.hidden = true
    const { measurements } = spyRects({ current: BLOCKING_RECT })
    const { getByRole } = await mountOverlay()
    const container = getByRole('status')
    expect(container.style.top).toBe('')

    // Reveal obstacle by unhiding
    marked.hidden = false
    await flushMutations()
    await act(async () => {
      vi.advanceTimersByTime(199)
    })
    expect(container.style.top).toBe('')

    const before = measurements()
    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(measurements()).toBe(before + 1)
    expect(container.style.top).not.toBe('')
  }, 15000)

  test('decluttered labels with data-declutter-hidden are excluded and remeasured when toggled', async () => {
    vi.useFakeTimers()
    const marked = addObstacle()
    marked.setAttribute('data-declutter-hidden', 'true')
    const { measurements } = spyRects({ current: BLOCKING_RECT })
    const { getByRole } = await mountOverlay()
    const container = getByRole('status')
    expect(container.style.top).toBe('')

    // Reveal label by removing declutter flag
    marked.removeAttribute('data-declutter-hidden')
    await flushMutations()
    await act(async () => {
      vi.advanceTimersByTime(199)
    })
    expect(container.style.top).toBe('')

    const before = measurements()
    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(measurements()).toBe(before + 1)
    expect(container.style.top).not.toBe('')
  }, 15000)

  test('unmount disconnects the observer and cancels listeners, timers and frames', async () => {
    vi.useFakeTimers({
      toFake: [
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'setTimeout',
        'clearTimeout'
      ]
    })
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')
    const removeWindowListener = vi.spyOn(window, 'removeEventListener')
    const removeDocListener = vi.spyOn(document, 'removeEventListener')
    const { measurements } = spyRects({ current: ZERO_RECT })
    const { unmount } = await mountOverlay()

    // Leave both a debounce timer and an animation frame pending.
    addObstacle()
    await flushMutations()
    act(() => {
      window.dispatchEvent(new Event('resize'))
      document.dispatchEvent(new Event('scroll', { bubbles: false }))
    })
    const before = measurements()

    unmount()
    expect(disconnect).toHaveBeenCalled()
    expect(removeWindowListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    )
    expect(removeDocListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { capture: true }
    )

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(measurements()).toBe(before)

    // Neither the removed listener nor the disconnected observer reacts now.
    act(() => {
      window.dispatchEvent(new Event('resize'))
      document.dispatchEvent(new Event('scroll', { bubbles: false }))
    })
    addObstacle()
    await flushMutations()
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(measurements()).toBe(before)
    disconnect.mockRestore()
    removeWindowListener.mockRestore()
    removeDocListener.mockRestore()
  }, 15000)
})
