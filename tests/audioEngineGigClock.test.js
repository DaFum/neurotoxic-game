import assert from 'node:assert'
import { test } from 'node:test'
import { importAudioEngine } from './audioTestUtils.js'

const { audioEngine, skipIfImportFailed } = await importAudioEngine()

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
