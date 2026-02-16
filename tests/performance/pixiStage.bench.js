import { performance } from 'node:perf_hooks'

// Mock data structures
const NOTE_JITTER_RANGE = 10
const NOTE_CENTER_OFFSET = 50

function calculateNoteY({ elapsed, noteTime, targetY, speed }) {
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
    isSprite: true
  }
  notes.push(note)
  sprites.push(sprite)
  noteSprites.set(note, sprite)
}

// Baseline: Current implementation with Math.random() in the loop
function runBaseline() {
  let elapsed = 0
  for (let frame = 0; frame < numFrames; frame++) {
    elapsed += 16
    for (const [note, sprite] of noteSprites) {
      // Logic from PixiStageController
      const jitterOffset = state.modifiers.noteJitter
        ? (Math.random() - 0.5) * NOTE_JITTER_RANGE
        : 0

      sprite.y = calculateNoteY({
        elapsed,
        noteTime: note.time,
        targetY: 500,
        speed: state.speed
      })

      // Assuming sprite instanceof PIXI.Sprite is true
      sprite.x =
        state.lanes[note.laneIndex].renderX + NOTE_CENTER_OFFSET + jitterOffset
    }
  }
}

// Optimized: Pre-calculated jitter stored on sprite (or note)
// We'll simulate that we've already attached a jitter property to the sprite or note
for (const [note, sprite] of noteSprites) {
  sprite.jitter = (Math.random() - 0.5) * NOTE_JITTER_RANGE
}

function runOptimized() {
  let elapsed = 0
  for (let frame = 0; frame < numFrames; frame++) {
    elapsed += 16
    for (const [note, sprite] of noteSprites) {
      // Optimized logic: use stored jitter
      const jitterOffset = state.modifiers.noteJitter
        ? sprite.jitter // Use pre-calculated
        : 0

      sprite.y = calculateNoteY({
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

console.log(`Benchmarking with ${numNotes} notes over ${numFrames} frames...`)

// Warmup
runBaseline()
runOptimized()

const startBase = performance.now()
runBaseline()
const endBase = performance.now()
const timeBase = endBase - startBase

console.log(`Baseline (Math.random per frame): ${timeBase.toFixed(2)}ms`)

const startOpt = performance.now()
runOptimized()
const endOpt = performance.now()
const timeOpt = endOpt - startOpt

console.log(`Optimized (Pre-calculated): ${timeOpt.toFixed(2)}ms`)
console.log(
  `Improvement: ${(timeBase - timeOpt).toFixed(2)}ms (${(((timeBase - timeOpt) / timeBase) * 100).toFixed(1)}%)`
)
