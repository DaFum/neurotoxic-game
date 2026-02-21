import { performance } from 'node:perf_hooks'

const iterations = 10000000

// Mock object
const app = {
  screen: {
    width: 1920,
    height: 1080
  }
}

// Baseline: String allocation
function runBaseline() {
  let lastLayoutKey = null
  let changed = false
  for (let i = 0; i < iterations; i++) {
    // Simulate changing screen size occasionally
    if (i % 1000 === 0) {
      app.screen.width = 1920 + (i % 100)
    }

    const layoutKey = `${app.screen.width}x${app.screen.height}`
    if (layoutKey === lastLayoutKey) {
      changed = false
    } else {
      lastLayoutKey = layoutKey
      changed = true
    }
  }
  return changed
}

// Optimized: Number comparison
function runOptimized() {
  let lastWidth = -1
  let lastHeight = -1
  let changed = false

  // Reset screen size for fair comparison
  app.screen.width = 1920

  for (let i = 0; i < iterations; i++) {
    // Simulate changing screen size occasionally (same pattern)
    if (i % 1000 === 0) {
      app.screen.width = 1920 + (i % 100)
    }

    if (app.screen.width === lastWidth && app.screen.height === lastHeight) {
      changed = false
    } else {
      lastWidth = app.screen.width
      lastHeight = app.screen.height
      changed = true
    }
  }
  return changed
}

console.log(`Benchmarking with ${iterations} iterations...`)

// Warmup
runBaseline()
runOptimized()

const startBase = performance.now()
runBaseline()
const endBase = performance.now()
const timeBase = endBase - startBase

console.log(`Baseline (String allocation): ${timeBase.toFixed(2)}ms`)

const startOpt = performance.now()
runOptimized()
const endOpt = performance.now()
const timeOpt = endOpt - startOpt

console.log(`Optimized (Number comparison): ${timeOpt.toFixed(2)}ms`)
console.log(
  `Improvement: ${(timeBase - timeOpt).toFixed(2)}ms (${(((timeBase - timeOpt) / timeBase) * 100).toFixed(1)}%)`
)
