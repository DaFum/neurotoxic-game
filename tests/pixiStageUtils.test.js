import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildRhythmLayout,
  calculateNoteY,
  RHYTHM_LAYOUT,
  getPixiColorFromToken
} from '../src/components/stage/utils.js'

test('calculateNoteY returns target position at hit time', () => {
  const result = calculateNoteY({
    elapsed: 5000,
    noteTime: 5000,
    targetY: 420,
    speed: 500
  })

  assert.equal(result, 420)
})

test('buildRhythmLayout derives lane and hit line positions', () => {
  const layout = buildRhythmLayout({ screenWidth: 1200, screenHeight: 600 })

  assert.equal(layout.startX, 420)
  assert.equal(layout.laneHeight, 600 * RHYTHM_LAYOUT.laneHeightRatio)
  assert.equal(layout.hitLineY, layout.laneHeight - RHYTHM_LAYOUT.hitLineOffset)
  assert.equal(layout.rhythmOffsetY, 600 * RHYTHM_LAYOUT.rhythmOffsetRatio)
})


test('getPixiColorFromToken falls back when CSS variables are unavailable', () => {
  const originalWindow = globalThis.window
  const originalDocument = globalThis.document

  globalThis.window = undefined
  globalThis.document = undefined

  assert.equal(getPixiColorFromToken('--toxic-green'), 0x00ff41)

  globalThis.window = originalWindow
  globalThis.document = originalDocument
})

test('getPixiColorFromToken resolves css variable color values', () => {
  const originalWindow = globalThis.window
  const originalDocument = globalThis.document

  globalThis.document = { documentElement: {} }
  globalThis.window = {
    getComputedStyle: () => ({
      getPropertyValue: tokenName =>
        tokenName === '--toxic-green' ? ' #00ff41 ' : ''
    })
  }

  assert.equal(getPixiColorFromToken('--toxic-green'), 0x00ff41)

  globalThis.window = originalWindow
  globalThis.document = originalDocument
})
