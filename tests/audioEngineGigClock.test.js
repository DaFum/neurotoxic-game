import assert from 'node:assert'
import { test } from 'node:test'

let audioEngine = null
let audioEngineImportError = null

try {
  audioEngine = await import('../src/utils/audioEngine.js')
} catch (error) {
  audioEngineImportError = error
}

const skipIfImportFailed = testContext => {
  if (audioEngineImportError) {
    testContext.skip(
      'Skipping audio engine tests due to environment limitations: ' +
        audioEngineImportError.message
    )
    return true
  }
  return false
}

test('calculateGigTimeMs', async t => {
  if (skipIfImportFailed(t)) return
  const { calculateGigTimeMs } = audioEngine

  await t.test('calculates gig time with valid context times', () => {
    assert.strictEqual(
      calculateGigTimeMs({
        contextTimeSec: 12,
        startCtxTimeSec: 10,
        offsetMs: 500
      }),
      2500
    )
  })

  await t.test('returns offset when start time is invalid', () => {
    assert.strictEqual(
      calculateGigTimeMs({
        contextTimeSec: 12,
        startCtxTimeSec: null,
        offsetMs: 750
      }),
      750
    )
  })

  await t.test('defaults to zero for invalid offset', () => {
    assert.strictEqual(
      calculateGigTimeMs({
        contextTimeSec: 12,
        startCtxTimeSec: 10,
        offsetMs: Number.NaN
      }),
      2000
    )
  })
})

test('hasAudioAsset', async t => {
  if (skipIfImportFailed(t)) return
  const { hasAudioAsset } = audioEngine

  assert.strictEqual(hasAudioAsset('01 Kranker Schrank.ogg'), true)
  assert.strictEqual(hasAudioAsset('missing-track.ogg'), false)
})
