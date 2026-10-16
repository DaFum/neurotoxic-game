import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  resolveNoteCappedPlaybackMs,
  resolveSongPlaybackWindow
} from '../../src/utils/audio/songUtils'
import { NOTE_TAIL_MS } from '../../src/utils/audio/rhythmGameTypes'

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

  assert.deepStrictEqual(
    resolveSongPlaybackWindow({}, { defaultDurationMs: 7777 }),
    {
      excerptStartMs: 0,
      excerptEndMs: null,
      excerptDurationMs: 7777
    }
  )
})

test('resolveSongPlaybackWindow defaults to an unbounded duration when no metadata is provided', () => {
  assert.deepStrictEqual(resolveSongPlaybackWindow({}), {
    excerptStartMs: 0,
    excerptEndMs: null,
    excerptDurationMs: 0
  })
})

test('resolveNoteCappedPlaybackMs caps playback at the last note plus the note tail', () => {
  const notes = [{ time: 500 }, { time: 12000 }]
  assert.equal(resolveNoteCappedPlaybackMs(notes, 30000), 12000 + NOTE_TAIL_MS)
})

test('resolveNoteCappedPlaybackMs falls back to the excerpt duration without timed notes', () => {
  assert.equal(resolveNoteCappedPlaybackMs([], 30000), 30000)
  assert.equal(resolveNoteCappedPlaybackMs([{ time: 0 }], 30000), 30000)
})

test('resolveNoteCappedPlaybackMs returns null when neither notes nor excerpt bound playback', () => {
  assert.equal(resolveNoteCappedPlaybackMs([], 0), null)
})
