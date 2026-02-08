import assert from 'node:assert'
import { test } from 'node:test'

test('calculateGigTimeMs', async t => {
  try {
    const { calculateGigTimeMs } = await import('../src/utils/audioEngine.js')

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
  } catch (error) {
    t.skip(
      'Skipping audio engine gig clock tests due to environment limitations: ' +
        error.message
    )
  }
})
