import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { render, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

// Mock HecklerOverlay to avoid animation loops and isolate the test
mock.module('../src/components/HecklerOverlay.jsx', {
  namedExports: {
    HecklerOverlay: () => <div data-testid='heckler-overlay-mock' />
  }
})

test('GigHUD: renders toxic border flash element when isToxicMode is true', async t => {
  setupJSDOM()
  t.after(cleanup)
  t.after(teardownJSDOM)

  // Dynamic import is needed when using mock.module
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

  const { container } = render(
    <GigHUD stats={stats} gameStateRef={gameStateRef} />
  )

  // Look for the specific element with the class inside the container
  const flashElement = container.querySelector('.toxic-border-flash')

  assert.ok(
    flashElement,
    'Should find an element with toxic-border-flash class'
  )
  // Ensure it's not the root element itself (it should be a child now)
  assert.notEqual(
    flashElement,
    container.firstChild,
    'The flash element should be a child, not the root container'
  )
})

test('GigHUD: does not render toxic border flash element when isToxicMode is false', async t => {
  setupJSDOM()
  t.after(cleanup)
  t.after(teardownJSDOM)

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

  const { container } = render(
    <GigHUD stats={stats} gameStateRef={gameStateRef} />
  )

  const flashElement = container.querySelector('.toxic-border-flash')

  assert.strictEqual(
    flashElement,
    null,
    'Should NOT find an element with toxic-border-flash class'
  )
})
