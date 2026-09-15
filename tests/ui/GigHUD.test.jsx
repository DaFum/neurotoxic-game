import { afterEach, expect, test, vi } from 'vitest'

import { render, cleanup, fireEvent } from '@testing-library/react'

// Mock HecklerOverlay to avoid animation loops and isolate the test
vi.mock('../../src/components/HecklerOverlay.tsx', () => ({
  HecklerOverlay: () => <div data-testid='heckler-overlay-mock' />
}))

import { GigHUD } from '../../src/components/GigHUD.tsx'
import { GigControlsCluster } from '../../src/components/hud/GigControlsCluster.tsx'

afterEach(cleanup)

test('GigHUD: renders toxic border flash element when isToxicMode is true', async () => {
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

  const { container } = render(
    <GigHUD stats={stats} gameStateRef={gameStateRef} />
  )

  // Look for the specific element with the class inside the container
  const flashElement = container.querySelector('.toxic-border-flash')

  expect(flashElement).toBeTruthy()
  // Ensure it's not the root element itself (it should be a child now)
  expect(flashElement).not.toBe(container.firstChild)
})

test('GigHUD: does not render toxic border flash element when isToxicMode is false', async () => {
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

  const { container } = render(
    <GigHUD stats={stats} gameStateRef={gameStateRef} />
  )

  const flashElement = container.querySelector('.toxic-border-flash')

  expect(flashElement).toBe(null)
})

test('GigControlsCluster: shortcuts button aria-controls is linked only when panel is open', async () => {
  const { getByLabelText } = render(<GigControlsCluster />)

  // Expand the controls menu
  const menuButton = getByLabelText('Toggle game controls')
  fireEvent.click(menuButton)

  const shortcutsButton = getByLabelText('Toggle keyboard shortcuts help')

  // Initially, showHelp is false, aria-controls should be null/absent
  expect(shortcutsButton.getAttribute('aria-controls')).toBeNull()
  expect(shortcutsButton.getAttribute('aria-expanded')).toBe('false')

  // Toggle shortcuts help open
  fireEvent.click(shortcutsButton)

  // Now showHelp is true, aria-controls should point to 'shortcuts-panel'
  expect(shortcutsButton.getAttribute('aria-controls')).toBe('shortcuts-panel')
  expect(shortcutsButton.getAttribute('aria-expanded')).toBe('true')
})
