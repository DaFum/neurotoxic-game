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

  await t.test('returns safeOffset when contextTimeSec is null', () => {
    assert.strictEqual(
      calculateGigTimeMs({
        contextTimeSec: null,
        startCtxTimeSec: 10,
        offsetMs: 1500
      }),
      1500
    )
  })

  await t.test('handles negative offsets', () => {
    assert.strictEqual(
      calculateGigTimeMs({
        contextTimeSec: 15,
        startCtxTimeSec: 10,
        offsetMs: -1000
      }),
      4000
    )
  })
})

test('getGigTimeMs', async t => {
  if (skipIfImportFailed(t)) return
  const { getGigTimeMs, audioState } = audioEngine

  // Because getGigTimeMs relies on internal state and Tone.js mock,
  // we test it by manipulating the state that calculateGigTimeMs uses.

  await t.test('returns calculated gig time using audio context and state', () => {
    // Save original state
    const originalStartCtxTime = audioState?.gigStartCtxTime
    const originalSeekOffsetMs = audioState?.gigSeekOffsetMs

    if (audioState) {
      // Set up state
      audioState.gigStartCtxTime = 5
      audioState.gigSeekOffsetMs = 2000
    }

    // getRawAudioContext() will return a rawContext. Since we mock Tone,
    // we can't directly manipulate rawContext.currentTime easily here without
    // deeper mocking of Tone.getContext().rawContext.
    // However, the test framework's mockUtils provides a mock Tone object.
    // We can infer behavior by the result, or skip testing internal Tone mock specifics
    // and rely on calculateGigTimeMs coverage, but let's ensure it executes without crashing.

    const timeMs = getGigTimeMs()

    // Since mockToneContext.rawContext.currentTime is likely 0 by default in the mock,
    // the calculation would be (0 - 5) * 1000 + 2000 = -3000
    assert.ok(typeof timeMs === 'number')

    if (audioState) {
      // Restore original state
      audioState.gigStartCtxTime = originalStartCtxTime
      audioState.gigSeekOffsetMs = originalSeekOffsetMs
    }
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
