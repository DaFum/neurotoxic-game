import { test } from 'node:test'
import assert from 'node:assert'
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

test('GameStateProvider Re-render Benchmark', async _t => {
  // Dynamic imports to ensure environment is ready
  const React = await import('react')
  const { render, act } = await import('@testing-library/react')
  // We need to import the provider. Note that it might have side effects.
  const { GameStateProvider, useGameState, useGameDispatch } = await import(
    '../../src/context/GameState.jsx'
  )

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
    const { updatePlayer } = useGameDispatch()
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
  assert.strictEqual(
    consumerRenders,
    1,
    'Consumer should re-render after state update'
  )

  // Trigger component also re-renders because useGameState returns new object
  assert.strictEqual(
    triggerRenders,
    1,
    'Unoptimized Trigger should re-render after state update'
  )

  // Optimized Trigger should NOT re-render because dispatch context is stable
  assert.strictEqual(
    optimizedRenders,
    0,
    'Optimized Trigger should NOT re-render'
  )
})
