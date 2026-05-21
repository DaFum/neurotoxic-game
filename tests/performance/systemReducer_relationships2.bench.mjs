import { performance } from 'node:perf_hooks'

const clampRelationship = value => Math.max(-100, Math.min(100, value))

const selfRelationshipKeys = new Set(['self', 'me'])

const originalFunction = m => {
  return m.relationships &&
    typeof m.relationships === 'object' &&
    !Array.isArray(m.relationships)
    ? Object.fromEntries(
        Object.entries(m.relationships)
          .filter(([key, value]) => {
            const normalizedKey = key.toLowerCase()
            if (
              selfRelationshipKeys.has(key) ||
              selfRelationshipKeys.has(normalizedKey)
            ) {
              return false
            }
            return typeof value === 'number' && Number.isFinite(value)
          })
          .map(([key, value]) => [key, clampRelationship(value)])
      )
    : {}
}

const optimizedFunction = m => {
  if (
    !m.relationships ||
    typeof m.relationships !== 'object' ||
    Array.isArray(m.relationships)
  ) {
    return {}
  }

  const result = {}
  for (const key in m.relationships) {
    const value = m.relationships[key]
    const normalizedKey = key.toLowerCase()

    if (
      selfRelationshipKeys.has(key) ||
      selfRelationshipKeys.has(normalizedKey)
    ) {
      continue
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      result[key] = clampRelationship(value)
    }
  }
  return result
}

const optimizedFunction2 = m => {
  if (
    !m.relationships ||
    typeof m.relationships !== 'object' ||
    Array.isArray(m.relationships)
  ) {
    return {}
  }

  const result = {}
  const keys = Object.keys(m.relationships)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = m.relationships[key]
    const normalizedKey = key.toLowerCase()

    if (
      selfRelationshipKeys.has(key) ||
      selfRelationshipKeys.has(normalizedKey)
    ) {
      continue
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      result[key] = clampRelationship(value)
    }
  }
  return result
}

const payload = {
  relationships: {
    friend1: 50,
    friend2: 120,
    enemy1: -150,
    self: 100,
    ME: 100,
    invalid: 'string',
    friend3: 20
  }
}

function runBenchmark(fn, iterations) {
  const start = performance.now()
  for (let i = 0; i < iterations; i++) {
    fn(payload)
  }
  const end = performance.now()
  return end - start
}

// Warmup
runBenchmark(originalFunction, 100000)
runBenchmark(optimizedFunction, 100000)
runBenchmark(optimizedFunction2, 100000)

const iterations = 5000000
const originalTime = runBenchmark(originalFunction, iterations)
const optimizedTime = runBenchmark(optimizedFunction, iterations)
const optimizedTime2 = runBenchmark(optimizedFunction2, iterations)

console.log(
  `Original Time (${iterations} iterations): ${originalTime.toFixed(2)}ms`
)
console.log(
  `Optimized Time for in (${iterations} iterations): ${optimizedTime.toFixed(2)}ms`
)
console.log(
  `Optimized Time Object.keys (${iterations} iterations): ${optimizedTime2.toFixed(2)}ms`
)
const diff = originalTime - optimizedTime2
const percentage = (diff / originalTime) * 100
console.log(
  `Improvement Object.keys: ${diff.toFixed(2)}ms (${percentage.toFixed(2)}% faster)`
)
