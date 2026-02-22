import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { render, fireEvent, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils.js'

// Mock HecklerOverlay to avoid animation loops and isolate the test
mock.module('../../src/components/HecklerOverlay.jsx', {
  namedExports: {
    HecklerOverlay: () => <div data-testid='heckler-overlay-mock' />
  }
})

test('GigHUD: renders lane inputs and handles interactions', async t => {
  setupJSDOM()
  t.after(cleanup)
  t.after(teardownJSDOM)

  const { GigHUD } = await import('../../src/components/GigHUD.jsx')

  const stats = {
    score: 0,
    combo: 0,
    health: 100,
    overload: 0,
    isGameOver: false,
    accuracy: 100,
    isToxicMode: false
  }
  const gameStateRef = { current: { projectiles: [] } }

  const onLaneInput = t.mock.fn()

  const { getByRole, getAllByRole, rerender } = render(
    <GigHUD
      stats={stats}
      gameStateRef={gameStateRef}
      onLaneInput={onLaneInput}
    />
  )

  // Verify 3 lane inputs are rendered
  const laneInputs = getAllByRole('button', { name: /lane/i })
  assert.equal(laneInputs.length, 3, 'Should render 3 lane input zones')

  // Verify labels
  assert.equal(laneInputs[0].getAttribute('aria-label'), 'Guitar lane')
  assert.equal(laneInputs[1].getAttribute('aria-label'), 'Drums lane')
  assert.equal(laneInputs[2].getAttribute('aria-label'), 'Bass lane')

  // Test MouseDown on first lane (Guitar)
  fireEvent.mouseDown(laneInputs[0])
  assert.equal(onLaneInput.mock.callCount(), 1)
  assert.deepEqual(onLaneInput.mock.calls[0].arguments, [0, true])

  // Test MouseUp on first lane
  fireEvent.mouseUp(laneInputs[0])
  assert.equal(onLaneInput.mock.callCount(), 2)
  assert.deepEqual(onLaneInput.mock.calls[1].arguments, [0, false])

  // Test TouchStart on second lane (Drums)
  fireEvent.touchStart(laneInputs[1])
  assert.equal(onLaneInput.mock.callCount(), 3)
  assert.deepEqual(onLaneInput.mock.calls[2].arguments, [1, true])

  // Test TouchEnd on second lane
  fireEvent.touchEnd(laneInputs[1])
  assert.equal(onLaneInput.mock.callCount(), 4)
  assert.deepEqual(onLaneInput.mock.calls[3].arguments, [1, false])

  // Re-render with new stats (simulate game loop update)
  const newStats = { ...stats, score: 100 }
  rerender(
    <GigHUD
      stats={newStats}
      gameStateRef={gameStateRef}
      onLaneInput={onLaneInput}
    />
  )

  // Verify interactions still work after re-render
  fireEvent.mouseDown(laneInputs[2]) // Bass lane
  assert.equal(onLaneInput.mock.callCount(), 5)
  assert.deepEqual(onLaneInput.mock.calls[4].arguments, [2, true])
})
