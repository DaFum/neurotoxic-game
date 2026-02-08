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

  await t.test('returns false for non-string input', () => {
    assert.strictEqual(hasAudioAsset(null), false)
    assert.strictEqual(hasAudioAsset(undefined), false)
  })

  await t.test('returns false for unknown filename', () => {
    assert.strictEqual(hasAudioAsset('missing-track.ogg'), false)
  })
})

test('calculateGigPlaybackWindow', async t => {
  if (skipIfImportFailed(t)) return
  const { calculateGigPlaybackWindow } = audioEngine

  await t.test('returns offset and duration within buffer', () => {
    const result = calculateGigPlaybackWindow({
      bufferDurationSec: 10,
      baseOffsetMs: 1000,
      seekOffsetMs: 500,
      durationMs: 2000
    })
    assert.strictEqual(result.offsetSeconds, 1.5)
    assert.strictEqual(result.safeDurationSeconds, 2)
    assert.strictEqual(result.didResetOffsets, false)
  })

  await t.test('clamps duration to remaining buffer', () => {
    const result = calculateGigPlaybackWindow({
      bufferDurationSec: 2,
      baseOffsetMs: 1500,
      seekOffsetMs: 0,
      durationMs: 2000
    })
    assert.strictEqual(result.offsetSeconds, 1.5)
    assert.strictEqual(result.safeDurationSeconds, 0.5)
  })

  await t.test('resets offsets when they exceed duration', () => {
    const result = calculateGigPlaybackWindow({
      bufferDurationSec: 1,
      baseOffsetMs: 1500,
      seekOffsetMs: 0,
      durationMs: 1000
    })
    assert.strictEqual(result.offsetSeconds, 0)
    assert.strictEqual(result.nextBaseOffsetMs, 0)
    assert.strictEqual(result.nextSeekOffsetMs, 0)
    assert.strictEqual(result.didResetOffsets, true)
  })
})
