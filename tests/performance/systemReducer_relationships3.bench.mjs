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

const optimizedFunction3 = m => {
  if (
    !m.relationships ||
    typeof m.relationships !== 'object' ||
    Array.isArray(m.relationships)
  ) {
    return {}
  }

  return Object.keys(m.relationships).reduce((acc, key) => {
    const value = m.relationships[key]
    const normalizedKey = key.toLowerCase()

    if (
      !selfRelationshipKeys.has(key) &&
      !selfRelationshipKeys.has(normalizedKey)
    ) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        acc[key] = clampRelationship(value)
      }
    }
    return acc
  }, {})
}

const optimizedFunction4 = m => {
  if (
    !m.relationships ||
    typeof m.relationships !== 'object' ||
    Array.isArray(m.relationships)
  ) {
    return {}
  }

  const result = {}
  for (const key of Object.keys(m.relationships)) {
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
runBenchmark(optimizedFunction3, 100000)
runBenchmark(optimizedFunction4, 100000)

const iterations = 5000000
const originalTime = runBenchmark(originalFunction, iterations)
const optimizedTime3 = runBenchmark(optimizedFunction3, iterations)
const optimizedTime4 = runBenchmark(optimizedFunction4, iterations)

console.log(
  `Original Time (${iterations} iterations): ${originalTime.toFixed(2)}ms`
)
console.log(
  `Optimized Time Object.keys + reduce (${iterations} iterations): ${optimizedTime3.toFixed(2)}ms`
)
console.log(
  `Optimized Time Object.keys + for...of (${iterations} iterations): ${optimizedTime4.toFixed(2)}ms`
)
const diff = originalTime - optimizedTime4
const percentage = (diff / originalTime) * 100
console.log(
  `Improvement Object.keys + for...of: ${diff.toFixed(2)}ms (${percentage.toFixed(2)}% faster)`
)
