import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

import { render, act } from '@testing-library/react'


// Setup mock before importing the component
const getRandomChatterMock = vi.fn(() => ({ text: 'Test chatter', speaker: 'Test Speaker' }))

vi.mock('../src/data/chatter.js', () => ({
    getRandomChatter: getRandomChatterMock,
    CHATTER_DB: [],
    ALLOWED_DEFAULT_SCENES: ['GIG']
  }))
test('ChatterOverlay passes scene state to getRandomChatter', async () => {
  //  removed (handled by vitest env)


  // Use fake timers if available, otherwise we might need a different approach
  // Assuming Node 22+ with timer mocking support
  if (vi) {
      vi.useFakeTimers({ apis: ['setTimeout', 'Date'] })
  } else {
      test.skip('vi not available, skipping timer-dependent test steps')
      return
  }

  // Dynamic import to apply mock
  const { ChatterOverlay } = await import('../src/components/ChatterOverlay.jsx')

  const gameState = {
    currentScene: 'GIG',
    band: { members: [] },
    player: { currentNodeId: 'none' },
    gameMap: { nodes: {} }
  }
  await act(async () => {
    render(
      <ChatterOverlay gameState={gameState} />
    )
  })

  // Fast-forward time to trigger chatter generation
  // The delay is min 8000ms.
  await act(async () => {
      vi.advanceTimersByTime(30000)
  })

  // Verify getRandomChatter was called
  expect(getRandomChatterMock.mock.calls.length > 0).toBeTruthy()

  // check the first call's first argument
  const callArgs = getRandomChatterMock.mock.calls[0][0]

  expect(callArgs.currentScene).toBe('GIG')

})
