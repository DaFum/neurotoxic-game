import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { render, act } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

// Setup mock before importing the component
const getRandomChatterMock = mock.fn(() => ({
  text: 'Test chatter',
  speaker: 'Test Speaker'
}))

mock.module('../src/data/chatter.js', {
  namedExports: {
    getRandomChatter: getRandomChatterMock,
    CHATTER_DB: [],
    ALLOWED_DEFAULT_SCENES: ['GIG']
  }
})

test('ChatterOverlay passes scene state to getRandomChatter', async t => {
  setupJSDOM()
  t.after(teardownJSDOM)

  // Use fake timers if available, otherwise we might need a different approach
  // Assuming Node 22+ with timer mocking support
  if (t.mock.timers) {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] })
  } else {
    t.skip('t.mock.timers not available, skipping timer-dependent test steps')
    return
  }

  // Dynamic import to apply mock
  const { ChatterOverlay } =
    await import('../src/components/ChatterOverlay.jsx')

  const gameState = {
    currentScene: 'GIG',
    band: { members: [] },
    player: { currentNodeId: 'none' },
    gameMap: { nodes: {} }
  }
  await act(async () => {
    render(<ChatterOverlay gameState={gameState} />)
  })

  // Fast-forward time to trigger chatter generation
  // The delay is min 8000ms.
  await act(async () => {
    t.mock.timers.tick(30000)
  })

  // Verify getRandomChatter was called
  assert.ok(
    getRandomChatterMock.mock.calls.length > 0,
    'getRandomChatter should have been called'
  )

  // check the first call's first argument
  const callArgs = getRandomChatterMock.mock.calls[0].arguments[0]

  assert.equal(callArgs.currentScene, 'GIG')
})
