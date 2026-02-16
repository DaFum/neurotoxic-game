import {
  calculateTimeFromTicks,
  preprocessTempoMap
} from '../../src/utils/rhythmUtils.js'
import { performance } from 'node:perf_hooks'

// Simulate a large tempo map (e.g., 500 changes)
const tempoMap = []
for (let i = 0; i < 500; i++) {
  tempoMap.push({ tick: i * 480, usPerBeat: 500000 + (i % 10) * 10000 })
}

const tpb = 480

// Simulate many notes (e.g., 10000 notes)
const notes = []
for (let i = 0; i < 10000; i++) {
  notes.push(i * 120) // every quarter beat roughly
}

console.log(`Tempo Map Size: ${tempoMap.length}`)
console.log(`Number of Notes: ${notes.length}`)

// Preprocess
const startPre = performance.now()
const processedMap = preprocessTempoMap(tempoMap, tpb)
const endPre = performance.now()
console.log(`Preprocessing time: ${(endPre - startPre).toFixed(4)}ms`)

// Warmup with processed map
for (let i = 0; i < 100; i++) {
  calculateTimeFromTicks(notes[i], tpb, processedMap, 'ms')
}

const start = performance.now()
for (const noteTick of notes) {
  calculateTimeFromTicks(noteTick, tpb, processedMap, 'ms')
}
const end = performance.now()

console.log(`Time taken (Optimized): ${(end - start).toFixed(4)}ms`)
console.log(
  `Average time per call (Optimized): ${((end - start) / notes.length).toFixed(6)}ms`
)

// Also run legacy path for comparison (using original map)
// Note: calculateTimeFromTicks falls back to legacy if _accumulatedMicros is missing
const startLegacy = performance.now()
for (const noteTick of notes) {
  calculateTimeFromTicks(noteTick, tpb, tempoMap, 'ms')
}
const endLegacy = performance.now()
console.log(`Time taken (Legacy): ${(endLegacy - startLegacy).toFixed(4)}ms`)
