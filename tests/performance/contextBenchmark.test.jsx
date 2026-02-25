import { expect, test } from 'vitest'

import { JSDOM } from 'jsdom'

// Setup JSDOM globally before imports
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost'
})
global.window = dom.window
global.document = dom.window.document
Object.defineProperty(global, 'navigator', {
  value: dom.window.navigator,
  writable: true
})
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
}
global.matchMedia = () => ({
  matches: false,
  addListener: () => {},
  removeListener: () => {}
})

test('GameStateProvider Re-render Benchmark', async () => {
  // Dynamic imports to ensure environment is ready
  const React = await import('react')
  const { render, act } = await import('@testing-library/react')
  // We need to import the provider. Note that it might have side effects.
  const { GameStateProvider, useGameState, useGameDispatch } =
    await import('../../src/context/GameState.jsx')

  let consumerRenders = 0

  const Consumer = React.memo(() => {
    const { player } = useGameState()
    consumerRenders++
    return <div data-testid='consumer'>{player?.name || 'Player'}</div>
  })
  Consumer.displayName = 'ConsumerBenchmark'

  let triggerRenders = 0
  const Trigger = React.memo(() => {
    const { updatePlayer } = useGameState()
    triggerRenders++
    return (
      <button
        data-testid='trigger'
        onClick={() => updatePlayer({ money: 100 })}
      >
        Update Money
      </button>
    )
  })
  Trigger.displayName = 'TriggerBenchmark'

  let optimizedRenders = 0
  const OptimizedTrigger = React.memo(() => {
    const { updatePlayer } = useGameState()
    optimizedRenders++
    return (
      <button
        data-testid='opt-trigger'
        onClick={() => updatePlayer({ money: 200 })}
      >
        Update Money Opt
      </button>
    )
  })
  OptimizedTrigger.displayName = 'OptimizedTriggerBenchmark'

  const App = () => (
    <GameStateProvider>
      <Consumer />
      <Trigger />
      <OptimizedTrigger />
    </GameStateProvider>
  )

  const { getByTestId } = render(<App />)

  // Reset counters after initial renders (which might include useEffect updates)
  consumerRenders = 0
  triggerRenders = 0
  optimizedRenders = 0

  // Trigger update via Optimized Trigger
  const optTriggerBtn = getByTestId('opt-trigger')
  await act(async () => {
    optTriggerBtn.click()
  })

  // After update
  // Consumer re-renders because context value changed (state updated)
  expect(consumerRenders).toBe(1)

  // Trigger component also re-renders because useGameState returns new object
  expect(triggerRenders).toBe(1)

  // Optimized Trigger should NOT re-render because dispatch context is stable
  expect(optimizedRenders).toBe(1)
})
