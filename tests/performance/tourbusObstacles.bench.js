import { performance } from 'node:perf_hooks'
import { stepTourbusObstacles } from '../../src/hooks/minigames/tourbusLogicUtils.ts'

const iterations = 500000

const createTestGame = () => ({
  busLane: 1,
  obstacles: [
    { id: 1, lane: 0, y: 10, type: 'OBSTACLE', collided: false },
    { id: 2, lane: 1, y: 20, type: 'FUEL', collided: false },
    { id: 3, lane: 2, y: 30, type: 'VOID_HAZARD', collided: false }
  ],
  damage: 0,
  itemsCollected: []
})

// Baseline: Allocating a new array per call
function runBaseline() {
  const game = createTestGame()
  for (let i = 0; i < iterations; i++) {
    stepTourbusObstacles(game, 0.0001, [])
  }
}

// Optimized: Reusing pre-allocated buffer across calls
function runOptimized() {
  const game = createTestGame()
  const buffer = []
  for (let i = 0; i < iterations; i++) {
    stepTourbusObstacles(game, 0.0001, [], buffer)
  }
}

console.log(`Benchmarking Tourbus obstacle stepping (${iterations} iterations)...`)

// Warmup
runBaseline()
runOptimized()

const startBase = performance.now()
runBaseline()
const endBase = performance.now()
const timeBase = endBase - startBase

console.log(`Baseline (Per-call array allocation): ${timeBase.toFixed(2)}ms`)

const startOpt = performance.now()
runOptimized()
const endOpt = performance.now()
const timeOpt = endOpt - startOpt

console.log(`Optimized (Reusable buffer): ${timeOpt.toFixed(2)}ms`)
console.log(
  `Improvement: ${(timeBase - timeOpt).toFixed(2)}ms (${(((timeBase - timeOpt) / timeBase) * 100).toFixed(1)}%)`
)
