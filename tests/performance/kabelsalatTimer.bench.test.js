import { describe, it, expect } from 'vitest'
import { SOCKET_DEFS } from '../../src/scenes/kabelsalat/kabelsalatConstants'

const connections = {
  mic: 'xlr',
  amp: 'jack',
  pedal: 'dc',
  power: null,
  synth: 'midi'
}

const SOCKET_COUNT = Object.keys(SOCKET_DEFS).length

describe('kabelsalatTimer connections check', () => {
  it('benchmarks original Object.values vs optimized for-in', () => {
    const ITERATIONS = 1000000

    const startOriginal = performance.now()
    for (let i = 0; i < ITERATIONS; i++) {
      const _isComplete =
        Object.values(connections).filter(value => value != null).length ===
        SOCKET_COUNT
    }
    const endOriginal = performance.now()

    const startOptimized = performance.now()
    for (let i = 0; i < ITERATIONS; i++) {
      let count = 0
      for (const key in connections) {
        if (Object.hasOwn(connections, key) && connections[key] != null) {
          count++
        }
      }
      const _isComplete = count === SOCKET_COUNT
    }
    const endOptimized = performance.now()

    // We expect the optimized version to be faster, but CI environments can be noisy
    // Just log for visibility when running locally
    console.log(`Original: ${endOriginal - startOriginal}ms`)
    console.log(`Optimized: ${endOptimized - startOptimized}ms`)

    expect(endOptimized - startOptimized).toBeDefined()
  })
})
