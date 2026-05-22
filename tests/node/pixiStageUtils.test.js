import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildRhythmLayout,
  calculateNoteY,
  getPixiColorFromToken
} from '../../src/components/stage/stageRenderUtils'

test('calculateNoteY returns target position at hit time', () => {
  const result = calculateNoteY(5000, 5000, 420, 500)

  assert.equal(result, 420)
})

test('buildRhythmLayout derives lane and hit line positions', () => {
  const layout = buildRhythmLayout({ screenWidth: 1200, screenHeight: 600 })

  assert.equal(layout.startX, 420)
  assert.equal(layout.laneHeight, 240)
  assert.equal(layout.hitLineY, 180)
  assert.equal(layout.rhythmOffsetY, 360)
})

test('stageRenderUtils keeps rhythm layout constants internal', async () => {
  const moduleExports =
    await import('../../src/components/stage/stageRenderUtils')

  assert.equal(Object.hasOwn(moduleExports, 'RHYTHM_LAYOUT'), false)
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
        tokenName === '--color-toxic-green' ? ' #00ff41 ' : ''
    })
  }

  assert.equal(getPixiColorFromToken('--toxic-green'), 0x00ff41)

  globalThis.window = originalWindow
  globalThis.document = originalDocument
})
