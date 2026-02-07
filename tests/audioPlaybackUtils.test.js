import assert from 'node:assert'
import { test } from 'node:test'
import {
  normalizeMidiPlaybackOptions,
  calculateRemainingDurationSeconds
} from '../src/utils/audioPlaybackUtils.js'

test('normalizeMidiPlaybackOptions', async t => {
  await t.test('uses defaults when options are undefined', () => {
    assert.deepStrictEqual(normalizeMidiPlaybackOptions(), {
      useCleanPlayback: true,
      onEnded: null,
      stopAfterSeconds: null
    })
  })

  await t.test('respects explicit clean playback flag', () => {
    assert.deepStrictEqual(normalizeMidiPlaybackOptions({}), {
      useCleanPlayback: true,
      onEnded: null,
      stopAfterSeconds: null
    })
    assert.deepStrictEqual(
      normalizeMidiPlaybackOptions({ useCleanPlayback: false }),
      {
        useCleanPlayback: false,
        onEnded: null,
        stopAfterSeconds: null
      }
    )
  })

  await t.test('accepts a valid onEnded callback', () => {
    const onEnded = () => {}
    assert.deepStrictEqual(normalizeMidiPlaybackOptions({ onEnded }), {
      useCleanPlayback: true,
      onEnded,
      stopAfterSeconds: null
    })
  })

  await t.test('normalizes stopAfterSeconds', () => {
    assert.deepStrictEqual(
      normalizeMidiPlaybackOptions({ stopAfterSeconds: 30 }),
      {
        useCleanPlayback: true,
        onEnded: null,
        stopAfterSeconds: 30
      }
    )
    assert.deepStrictEqual(
      normalizeMidiPlaybackOptions({ stopAfterSeconds: -5 }),
      {
        useCleanPlayback: true,
        onEnded: null,
        stopAfterSeconds: 0
      }
    )
    assert.deepStrictEqual(
      normalizeMidiPlaybackOptions({ stopAfterSeconds: Number.NaN }),
      {
        useCleanPlayback: true,
        onEnded: null,
        stopAfterSeconds: null
      }
    )
  })

  await t.test('calculates remaining duration with excerpt offset', () => {
    assert.strictEqual(calculateRemainingDurationSeconds(30, 0), 30)
    assert.strictEqual(calculateRemainingDurationSeconds(30, 10), 20)
    assert.strictEqual(calculateRemainingDurationSeconds(30, 50), 0)
    assert.strictEqual(calculateRemainingDurationSeconds(-5, 2), 0)
    assert.strictEqual(calculateRemainingDurationSeconds(30, -2), 30)
  })
})
