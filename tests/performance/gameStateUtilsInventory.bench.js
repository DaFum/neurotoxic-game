import { performance } from 'node:perf_hooks'

// Mock the environment
globalThis.Math = Math
globalThis.Object = Object

import { calculateAppliedDelta, applyEventDelta, isForbiddenKey } from '../../src/utils/gameStateUtils.js'

const generateDelta = (size) => {
  const inventory = {}
  for (let i = 0; i < size; i++) {
    inventory[`item_${i}`] = Math.floor(Math.random() * 10)
  }
  return { band: { inventory } }
}

const state = {
  band: {
    inventory: {},
    members: []
  }
}

const delta = generateDelta(100)

const runBench = (name, fn, iterations = 1000) => {
  const start = performance.now()
  for (let i = 0; i < iterations; i++) {
    fn(state, delta)
  }
  const end = performance.now()
  console.log(`${name}: ${end - start} ms`)
}

// warm up
for (let i = 0; i < 10000; i++) {
  calculateAppliedDelta(state, delta)
  applyEventDelta(state, delta)
}

runBench('calculateAppliedDelta', calculateAppliedDelta, 100000)
runBench('applyEventDelta', applyEventDelta, 100000)
