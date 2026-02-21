import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveSongPlaybackWindow } from '../src/utils/audio/songUtils.js'

test('resolveSongPlaybackWindow prefers excerpt end-start duration when available', () => {
  const window = resolveSongPlaybackWindow({
    excerptStartMs: 94000,
    excerptEndMs: 128750,
    excerptDurationMs: 30000,
    durationMs: 30000
  })

  assert.deepStrictEqual(window, {
    excerptStartMs: 94000,
    excerptEndMs: 128750,
    excerptDurationMs: 34750
  })
})

test('resolveSongPlaybackWindow falls back to explicit duration when excerpt end is missing', () => {
  const window = resolveSongPlaybackWindow({
    excerptStartMs: 1200,
    excerptDurationMs: 42000
  })

  assert.deepStrictEqual(window, {
    excerptStartMs: 1200,
    excerptEndMs: null,
    excerptDurationMs: 42000
  })
})

test('resolveSongPlaybackWindow falls back to durationMs then default', () => {
  assert.deepStrictEqual(
    resolveSongPlaybackWindow({ excerptStartMs: 500, durationMs: 12345 }),
    {
      excerptStartMs: 500,
      excerptEndMs: null,
      excerptDurationMs: 12345
    }
  )

  assert.deepStrictEqual(resolveSongPlaybackWindow({}, { defaultDurationMs: 7777 }), {
    excerptStartMs: 0,
    excerptEndMs: null,
    excerptDurationMs: 7777
  })
})


test('resolveSongPlaybackWindow defaults to an unbounded duration when no metadata is provided', () => {
  assert.deepStrictEqual(resolveSongPlaybackWindow({}), {
    excerptStartMs: 0,
    excerptEndMs: null,
    excerptDurationMs: 0
  })
})
