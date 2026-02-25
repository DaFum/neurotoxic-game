import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

import { render, cleanup } from '@testing-library/react'


// Mock HecklerOverlay to avoid animation loops and isolate the test
vi.mock('../src/components/HecklerOverlay.jsx', () => ({
    HecklerOverlay: () => <div data-testid="heckler-overlay-mock" />
  }))
test('GigHUD: renders toxic border flash element when isToxicMode is true', async () => {
  //  removed (handled by vitest env)
  afterEach(cleanup)


  // Dynamic import is needed when using vi.mock
  const { GigHUD } = await import('../src/components/GigHUD.jsx')

  const stats = {
    score: 1000,
    combo: 10,
    health: 50,
    overload: 0,
    isGameOver: false,
    accuracy: 95,
    isToxicMode: true
  }
  const gameStateRef = { current: { projectiles: [] } }

  const { container } = render(<GigHUD stats={stats} gameStateRef={gameStateRef} />)

  // Look for the specific element with the class inside the container
  const flashElement = container.querySelector('.toxic-border-flash')

  expect(flashElement).toBeTruthy()
  // Ensure it's not the root element itself (it should be a child now)
  assert.notEqual(flashElement, container.firstChild, 'The flash element should be a child, not the root container')
})

test('GigHUD: does not render toxic border flash element when isToxicMode is false', async () => {
  //  removed (handled by vitest env)
  afterEach(cleanup)


  const { GigHUD } = await import('../src/components/GigHUD.jsx')

  const stats = {
    score: 1000,
    combo: 10,
    health: 50,
    overload: 0,
    isGameOver: false,
    accuracy: 95,
    isToxicMode: false
  }
  const gameStateRef = { current: { projectiles: [] } }

  const { container } = render(<GigHUD stats={stats} gameStateRef={gameStateRef} />)

  const flashElement = container.querySelector('.toxic-border-flash')

  expect(flashElement).toBe(null)
})
