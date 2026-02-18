import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { render, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

// Mock HecklerOverlay to avoid animation loops and isolate the test
mock.module('../src/components/HecklerOverlay.jsx', {
  namedExports: {
    HecklerOverlay: () => <div data-testid="heckler-overlay-mock" />
  }
})

test('GigHUD: renders toxic border flash when isToxicMode is true', async (t) => {
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

  const { container } = render(<GigHUD stats={stats} gameStateRef={gameStateRef} />)
  const rootDiv = container.firstChild

  assert.ok(rootDiv.classList.contains('toxic-border-flash'), 'Should have toxic-border-flash class')
})

test('GigHUD: does not render toxic border flash when isToxicMode is false', async (t) => {
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

  const { container } = render(<GigHUD stats={stats} gameStateRef={gameStateRef} />)
  const rootDiv = container.firstChild

  assert.ok(!rootDiv.classList.contains('toxic-border-flash'), 'Should NOT have toxic-border-flash class')
})
