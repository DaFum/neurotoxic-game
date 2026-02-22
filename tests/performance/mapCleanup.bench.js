import { performance } from 'node:perf_hooks'

const MAP_SIZE = 10000
const iterations = 1000

const map = new Map()

function resetMap() {
    map.clear()
    for (let i = 0; i < MAP_SIZE; i++) {
        map.set(i, { some: 'sprite' })
    }
}

function destroy(key) {
  map.delete(key)
}

console.log(`Benchmarking Map cleanup: Array.from(map.keys()) vs direct iteration...`)
console.log(`Map size: ${MAP_SIZE}, Iterations: ${iterations}\n`)

// Baseline: Array.from(map.keys())
let totalTimeBase = 0
for (let i = 0; i < iterations; i++) {
    resetMap()
    let start = performance.now()
    const keysToRemove = Array.from(map.keys())
    for (const key of keysToRemove) {
        destroy(key)
    }
    totalTimeBase += (performance.now() - start)
}
console.log(`Baseline (Array.from): ${totalTimeBase.toFixed(2)}ms`)

// Opt 1: for (const key of map.keys())
let totalTimeOpt1 = 0
for (let i = 0; i < iterations; i++) {
    resetMap()
    let start = performance.now()
    for (const key of map.keys()) {
        destroy(key)
    }
    totalTimeOpt1 += (performance.now() - start)
}
console.log(`Optimized (for-of keys()): ${totalTimeOpt1.toFixed(2)}ms`)

console.log(`\nImprovement: ${(totalTimeBase - totalTimeOpt1).toFixed(2)}ms (${(((totalTimeBase - totalTimeOpt1) / totalTimeBase) * 100).toFixed(1)}%)`)
