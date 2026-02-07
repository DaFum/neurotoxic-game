import assert from 'node:assert'
import { test } from 'node:test'
import {
  normalizeMidiPlaybackOptions,
  calculateRemainingDurationSeconds,
  encodePublicAssetPath,
  resolveMidiAssetUrl
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

test('encodePublicAssetPath', async t => {
  await t.test('encodes spaces and preserves slashes', () => {
    assert.strictEqual(
      encodePublicAssetPath('midi/01 Kranker Schrank.mid'),
      'midi/01%20Kranker%20Schrank.mid'
    )
  })

  await t.test('handles leading slashes', () => {
    assert.strictEqual(
      encodePublicAssetPath('/midi/track.mid'),
      'midi/track.mid'
    )
  })

  await t.test('returns empty string for invalid input', () => {
    assert.strictEqual(encodePublicAssetPath(), '')
    assert.strictEqual(encodePublicAssetPath(123), '')
  })

  await t.test('encodes special characters safely', () => {
    assert.strictEqual(
      encodePublicAssetPath('midi/acid+test#.mid'),
      'midi/acid%2Btest%23.mid'
    )
  })
})

test('resolveMidiAssetUrl', async t => {
  await t.test('prefers bundled URLs', () => {
    const midiUrlMap = { 'track.mid': '/assets/track.mid' }
    assert.deepStrictEqual(resolveMidiAssetUrl('track.mid', midiUrlMap), {
      url: '/assets/track.mid',
      source: 'bundled'
    })
  })

  await t.test('resolves bundled URLs via basename', () => {
    const midiUrlMap = { 'track.mid': '/assets/track.mid' }
    assert.deepStrictEqual(resolveMidiAssetUrl('midi/track.mid', midiUrlMap), {
      url: '/assets/track.mid',
      source: 'bundled'
    })
  })

  await t.test('falls back to public path when missing', () => {
    const midiUrlMap = {}
    assert.deepStrictEqual(resolveMidiAssetUrl('midi/track 01.mid', midiUrlMap), {
      url: '/assets/midi/track%2001.mid',
      source: 'public'
    })
  })

  await t.test('normalizes relative filenames and encodes spaces', () => {
    const midiUrlMap = {}
    assert.deepStrictEqual(resolveMidiAssetUrl('./track 02.mid', midiUrlMap), {
      url: '/assets/track%2002.mid',
      source: 'public'
    })
  })

  await t.test('supports custom public base path', () => {
    const midiUrlMap = {}
    assert.deepStrictEqual(
      resolveMidiAssetUrl('midi/track.mid', midiUrlMap, '/public/assets/'),
      {
        url: '/public/assets/midi/track.mid',
        source: 'public'
      }
    )
  })

  await t.test('returns nulls for empty filename', () => {
    const midiUrlMap = {}
    assert.deepStrictEqual(resolveMidiAssetUrl('', midiUrlMap), {
      url: null,
      source: null
    })
  })
})
