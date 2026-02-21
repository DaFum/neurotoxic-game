import { performance } from 'node:perf_hooks'

// Mocks
class MockGraphics {
  constructor() {
    this.x = 0
    this.y = 0
    this.scale = { set: () => {} }
    this.visible = true
    this.alpha = 1
  }
  clear() {
    // Simulate some work
    this._cleared = true
  }
  rect(x, y, w, h) {
    this._rect = { x, y, w, h }
  }
  fill(options) {
    this._fill = options
  }
}

class MockSprite {
  constructor(texture) {
    this.texture = texture
    this.x = 0
    this.y = 0
    this.width = 0
    this.height = 0
    this.anchor = { set: () => {} }
    this.tint = 0xFFFFFF
    this.visible = true
    this.alpha = 1
    this.scale = { set: () => {} }
  }
}

// Constants
const NOTE_FALLBACK_WIDTH = 90
const NOTE_FALLBACK_HEIGHT = 20
const NOTE_INITIAL_Y = -50
const NOTE_SPRITE_SIZE = 80
const NOTE_CENTER_OFFSET = 50

// Baseline implementation
function initializeNoteSpriteBaseline(sprite, lane, _laneIndex) {
  sprite.visible = true
  sprite.alpha = 1

  if (sprite instanceof MockSprite) {
    sprite.x = lane.renderX + NOTE_CENTER_OFFSET
    sprite.y = NOTE_INITIAL_Y
    sprite.width = NOTE_SPRITE_SIZE
    sprite.height = NOTE_SPRITE_SIZE
    sprite.tint = lane.color
  } else if (sprite instanceof MockGraphics) {
    sprite.clear()
    sprite.rect(0, 0, NOTE_FALLBACK_WIDTH, NOTE_FALLBACK_HEIGHT)
    sprite.fill({ color: lane.color })
    sprite.x = lane.renderX + 5
    sprite.y = NOTE_INITIAL_Y
    sprite.scale.set(1)
  }
}

// Optimized implementation
function initializeNoteSpriteOptimized(sprite, lane, _laneIndex) {
  sprite.visible = true
  sprite.alpha = 1

  // In optimized version, we assume everything is a Sprite (using fallback texture)
  // We remove the instanceof check for Graphics and the Graphics logic

  sprite.x = lane.renderX + NOTE_CENTER_OFFSET
  sprite.y = NOTE_INITIAL_Y
  sprite.width = NOTE_SPRITE_SIZE
  sprite.height = NOTE_SPRITE_SIZE
  sprite.tint = lane.color

  // Note: In reality, fallback sprites might need different positioning/sizing
  // If fallback texture is used, we might adjust width/height differently
  // But strictly speaking, if we use a white rect texture, we can just scale it
  // to NOTE_FALLBACK_WIDTH/HEIGHT if needed, or if we use standard sprite size.
  // The original code:
  // Graphics: width=90, height=20, x=renderX+5
  // Sprite: width=80, height=80, x=renderX+50

  // To be fair, let's assume the fallback texture sprite needs specific sizing/pos
  if (sprite.isFallback) {
      sprite.width = NOTE_FALLBACK_WIDTH
      sprite.height = NOTE_FALLBACK_HEIGHT
      sprite.x = lane.renderX + 5
  } else {
      sprite.width = NOTE_SPRITE_SIZE
      sprite.height = NOTE_SPRITE_SIZE
      sprite.x = lane.renderX + NOTE_CENTER_OFFSET
  }
}


const iterations = 1000000
const lane = { renderX: 100, color: 0xFF0000 }

console.log('Benchmarking Note Fallback Initialization...')

// Baseline Test: Using Graphics
const startBase = performance.now()
for (let i = 0; i < iterations; i++) {
  const sprite = new MockGraphics()
  initializeNoteSpriteBaseline(sprite, lane, 0)
}
const endBase = performance.now()
const timeBase = endBase - startBase
console.log(`Baseline (Graphics creation + redraw): ${timeBase.toFixed(2)}ms`)


// Optimized Test: Using Sprite with Texture
const startOpt = performance.now()
const mockTexture = { id: 'fallback' }
for (let i = 0; i < iterations; i++) {
  const sprite = new MockSprite(mockTexture)
  sprite.isFallback = true // Simulate flag or check
  initializeNoteSpriteOptimized(sprite, lane, 0)
}
const endOpt = performance.now()
const timeOpt = endOpt - startOpt
console.log(`Optimized (Sprite creation + property set): ${timeOpt.toFixed(2)}ms`)

console.log(
  `Improvement: ${(timeBase - timeOpt).toFixed(2)}ms (${(((timeBase - timeOpt) / timeBase) * 100).toFixed(1)}%)`
)

// Also benchmark the update loop overhead
console.log('\nBenchmarking Update Loop Iteration (1000 notes)...')

const notes = []
const spritesBase = []
const spritesOpt = []

for(let i=0; i<1000; i++) {
    notes.push({ laneIndex: 0 })
    spritesBase.push(new MockGraphics()) // Assume fallback scenario

    const s = new MockSprite(mockTexture)
    s.isFallback = true
    spritesOpt.push(s)
}

const loopIterations = 10000

const startLoopBase = performance.now()
for(let frame=0; frame<loopIterations; frame++) {
    for(let i=0; i<1000; i++) {
        const sprite = spritesBase[i]
        const _note = notes[i]

        // Original logic inside update loop
        if (sprite instanceof MockSprite) {
            sprite.x = lane.renderX + NOTE_CENTER_OFFSET
        } else {
            sprite.x = lane.renderX + 5
        }
    }
}
const endLoopBase = performance.now()
const timeLoopBase = endLoopBase - startLoopBase
console.log(`Baseline Loop (instanceof checks): ${timeLoopBase.toFixed(2)}ms`)

const startLoopOpt = performance.now()
for(let frame=0; frame<loopIterations; frame++) {
    for(let i=0; i<1000; i++) {
        const sprite = spritesOpt[i]
        // Optimized logic: All are sprites
        // But we might still need to check if it's a fallback to position correctly?
        // If we unify the texture, maybe we can unify positioning too?
        // Original: Sprite x = renderX + 50, Graphics x = renderX + 5
        // If we make fallback sprite mimic graphics, we check isFallback

        if (sprite.isFallback) {
             sprite.x = lane.renderX + 5
        } else {
             sprite.x = lane.renderX + NOTE_CENTER_OFFSET
        }
    }
}
const endLoopOpt = performance.now()
const timeLoopOpt = endLoopOpt - startLoopOpt
console.log(`Optimized Loop (property check): ${timeLoopOpt.toFixed(2)}ms`)
