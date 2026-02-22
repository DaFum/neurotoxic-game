import { performance } from 'node:perf_hooks'
import { getPixiColorFromToken } from '../../src/components/stage/utils.js'

// Setup mock global environment
globalThis.document = {
  documentElement: {}
}
globalThis.window = {
  getComputedStyle: () => ({
    getPropertyValue: token => {
      // In a real browser, this would trigger reflow/re-layout.
      // In Node, we just return the value.
      if (token === '--toxic-green') return '#00ff41'
      if (token === '--void-black') return '#0a0a0a'
      if (token === '--star-white') return '#ffffff'
      return ''
    }
  })
}

const ITERATIONS = 100000
const tokens = ['--toxic-green', '--void-black', '--star-white']

function runBenchmark() {
  const start = performance.now()
  for (let i = 0; i < ITERATIONS; i++) {
    const token = tokens[i % tokens.length]
    getPixiColorFromToken(token)
  }
  const end = performance.now()
  return end - start
}

console.log(`Running benchmark with ${ITERATIONS} iterations...`)

// Warmup
runBenchmark()
runBenchmark()

const time = runBenchmark()
console.log(`Time taken: ${time.toFixed(4)}ms`)
console.log(`Average time per call: ${(time / ITERATIONS).toFixed(6)}ms`)
