import { performance } from 'node:perf_hooks'

// Mock data structures
const NOTE_JITTER_RANGE = 10
const NOTE_CENTER_OFFSET = 50

// Old implementation (object-based)
function calculateNoteY_Old({ elapsed, noteTime, targetY, speed }) {
  // Simplified calculation
  return targetY - (noteTime - elapsed) * speed
}

// New implementation (positional arguments)
function calculateNoteY_New(elapsed, noteTime, targetY, speed) {
  // Simplified calculation
  return targetY - (noteTime - elapsed) * speed
}

// Setup
const numNotes = 1000
const numFrames = 5000
const state = {
  modifiers: { noteJitter: true },
  speed: 1.5,
  lanes: Array(4).fill({ renderX: 100 })
}

const notes = []
const sprites = []
const noteSprites = new Map()

for (let i = 0; i < numNotes; i++) {
  const note = {
    time: 1000 + i * 500,
    laneIndex: i % 4,
    visible: true,
    hit: false,
    id: i
  }
  // Mock sprite - simple object
  const sprite = {
    x: 0,
    y: 0,
    // Add a property to simulate instanceof check if needed, but here we assume all are "Sprites"
    isSprite: true,
    jitter: (Math.random() - 0.5) * NOTE_JITTER_RANGE
  }
  notes.push(note)
  sprites.push(sprite)
  noteSprites.set(note, sprite)
}

// Baseline: Old Object-based signature
function runBaseline() {
  let elapsed = 0
  for (let frame = 0; frame < numFrames; frame++) {
    elapsed += 16
    for (const [note, sprite] of noteSprites) {
      const jitterOffset = state.modifiers.noteJitter ? sprite.jitter : 0

      // OLD CALL
      sprite.y = calculateNoteY_Old({
        elapsed,
        noteTime: note.time,
        targetY: 500,
        speed: state.speed
      })

      sprite.x =
        state.lanes[note.laneIndex].renderX + NOTE_CENTER_OFFSET + jitterOffset
    }
  }
}

// Optimized: New Positional signature
function runOptimized() {
  let elapsed = 0
  for (let frame = 0; frame < numFrames; frame++) {
    elapsed += 16
    for (const [note, sprite] of noteSprites) {
      const jitterOffset = state.modifiers.noteJitter ? sprite.jitter : 0

      // NEW CALL
      sprite.y = calculateNoteY_New(elapsed, note.time, 500, state.speed)

      sprite.x =
        state.lanes[note.laneIndex].renderX + NOTE_CENTER_OFFSET + jitterOffset
    }
  }
}

console.log(`Benchmarking with ${numNotes} notes over ${numFrames} frames...`)

// Warmup
runBaseline()
runOptimized()

const startBase = performance.now()
runBaseline()
const endBase = performance.now()
const timeBase = endBase - startBase

console.log(`Baseline (Object params): ${timeBase.toFixed(2)}ms`)

const startOpt = performance.now()
runOptimized()
const endOpt = performance.now()
const timeOpt = endOpt - startOpt

console.log(`Optimized (Positional params): ${timeOpt.toFixed(2)}ms`)
console.log(
  `Improvement: ${(timeBase - timeOpt).toFixed(2)}ms (${(((timeBase - timeOpt) / timeBase) * 100).toFixed(1)}%)`
)
