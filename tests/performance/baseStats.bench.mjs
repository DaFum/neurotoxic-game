import { performance } from 'node:perf_hooks'

const isPlainObject = value => {
  if (typeof value !== 'object' || value === null) return false
  const proto = Object.getPrototypeOf(value)
  return proto === null || proto === Object.prototype
}

const m = {
  baseStats: {
    stat1: 10,
    stat2: 20,
    stat3: 'invalid',
    stat4: 40,
    stat5: null,
    stat6: 60
  }
}

const originalBaseStats = m => {
  return isPlainObject(m.baseStats)
    ? Object.fromEntries(
        Object.entries(m.baseStats).filter(
          ([, value]) => typeof value === 'number' && Number.isFinite(value)
        )
      )
    : {}
}

const optimizedBaseStats = m => {
  if (!isPlainObject(m.baseStats)) return {}
  const result = {}
  for (const key in m.baseStats) {
    if (Object.hasOwn(m.baseStats, key)) {
      const value = m.baseStats[key]
      if (typeof value === 'number' && Number.isFinite(value)) {
        result[key] = value
      }
    }
  }
  return result
}

function runBenchmark(fn, iterations) {
  const start = performance.now()
  for (let i = 0; i < iterations; i++) {
    fn(m)
  }
  const end = performance.now()
  return end - start
}

// Warmup
runBenchmark(originalBaseStats, 100000)
runBenchmark(optimizedBaseStats, 100000)

const iterations = 5000000
const originalTime = runBenchmark(originalBaseStats, iterations)
const optimizedTime = runBenchmark(optimizedBaseStats, iterations)

console.log(
  `Original Time (${iterations} iterations): ${originalTime.toFixed(2)}ms`
)
console.log(
  `Optimized Time (${iterations} iterations): ${optimizedTime.toFixed(2)}ms`
)
const diff = originalTime - optimizedTime
const percentage = (diff / originalTime) * 100
console.log(
  `Improvement: ${diff.toFixed(2)}ms (${percentage.toFixed(2)}% faster)`
)
