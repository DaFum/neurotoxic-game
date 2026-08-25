import { test, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { GAME_PHASES } from '../../src/context/gameConstants'

vi.mock('../../src/data/chatter', () => ({
  getRandomChatter: () => null,
  CHATTER_DB: [],
  ALLOWED_DEFAULT_SCENES: ['GIG']
}))

vi.mock('../../src/hooks/useChatterLogic', () => ({
  useChatterLogic: () => ({ messages: [], removeMessage: vi.fn() })
}))

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: vi.fn(selector =>
    selector({
      currentScene: GAME_PHASES.GIG,
      band: { members: [] },
      player: { currentNodeId: 'none' },
      gameMap: { nodes: {} },
      social: {},
      lastGigStats: null,
      gigModifiers: {}
    })
  )
}))

const realGetRect = Element.prototype.getBoundingClientRect

/**
 * jsdom does no layout, so every rect is zero and the placement effect bails
 * out early. Stub rects for just the overlay and the obstacle under test.
 */
const stubRects = ({ overlay, obstacle }) => {
  Element.prototype.getBoundingClientRect = function () {
    if (this.getAttribute('role') === 'status') return overlay
    if (this.hasAttribute('data-chatter-avoid')) return obstacle
    return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }
  }
}

afterEach(() => {
  Element.prototype.getBoundingClientRect = realGetRect
  document.querySelectorAll('[data-chatter-avoid]').forEach(el => el.remove())
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
