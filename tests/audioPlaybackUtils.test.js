import assert from 'node:assert'
import { test } from 'node:test'
import {
  normalizeMidiPlaybackOptions,
  calculateRemainingDurationSeconds,
  buildAssetUrlMap,
  buildMidiUrlMap,
  encodePublicAssetPath,
  resolveAssetUrl,
  resolveMidiAssetUrl
} from '../src/utils/audioPlaybackUtils.js'

test('normalizeMidiPlaybackOptions', async t => {
  await t.test('uses defaults when options are undefined', () => {
    assert.deepStrictEqual(normalizeMidiPlaybackOptions(), {
      useCleanPlayback: true,
      onEnded: null,
      stopAfterSeconds: null,
      startTimeSec: null
    })
  })

  await t.test('respects explicit clean playback flag', () => {
    assert.deepStrictEqual(normalizeMidiPlaybackOptions({}), {
      useCleanPlayback: true,
      onEnded: null,
      stopAfterSeconds: null,
      startTimeSec: null
    })
    assert.deepStrictEqual(
      normalizeMidiPlaybackOptions({ useCleanPlayback: false }),
      {
        useCleanPlayback: false,
        onEnded: null,
        stopAfterSeconds: null,
        startTimeSec: null
      }
    )
  })

  await t.test('accepts a valid onEnded callback', () => {
    const onEnded = () => {}
    assert.deepStrictEqual(normalizeMidiPlaybackOptions({ onEnded }), {
      useCleanPlayback: true,
      onEnded,
      stopAfterSeconds: null,
      startTimeSec: null
    })
  })

  await t.test('normalizes stopAfterSeconds', () => {
    assert.deepStrictEqual(
      normalizeMidiPlaybackOptions({ stopAfterSeconds: 30 }),
      {
        useCleanPlayback: true,
        onEnded: null,
        stopAfterSeconds: 30,
        startTimeSec: null
      }
    )
    assert.deepStrictEqual(
      normalizeMidiPlaybackOptions({ stopAfterSeconds: -5 }),
      {
        useCleanPlayback: true,
        onEnded: null,
        stopAfterSeconds: 0,
        startTimeSec: null
      }
    )
    assert.deepStrictEqual(
      normalizeMidiPlaybackOptions({ stopAfterSeconds: Number.NaN }),
      {
        useCleanPlayback: true,
        onEnded: null,
        stopAfterSeconds: null,
        startTimeSec: null
      }
    )
  })

  await t.test('accepts a startTimeSec override', () => {
    assert.deepStrictEqual(
      normalizeMidiPlaybackOptions({ startTimeSec: 12.5 }),
      {
        useCleanPlayback: true,
        onEnded: null,
        stopAfterSeconds: null,
        startTimeSec: 12.5
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
    assert.deepStrictEqual(
      resolveMidiAssetUrl('midi/track 01.mid', midiUrlMap),
      {
        url: '/assets/midi/track%2001.mid',
        source: 'public'
      }
    )
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

  await t.test('supports relative base path defaults', () => {
    const midiUrlMap = {}
    assert.deepStrictEqual(
      resolveMidiAssetUrl('midi/track.mid', midiUrlMap, './assets'),
      {
        url: './assets/midi/track.mid',
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

test('resolveAssetUrl', async t => {
  await t.test('resolves bundled URLs for non-MIDI assets', () => {
    const assetMap = { 'track.ogg': '/assets/track.ogg' }
    assert.deepStrictEqual(resolveAssetUrl('track.ogg', assetMap), {
      url: '/assets/track.ogg',
      source: 'bundled'
    })
  })

  await t.test('resolves via basename for nested paths', () => {
    const assetMap = { 'track.ogg': '/assets/track.ogg' }
    assert.deepStrictEqual(resolveAssetUrl('audio/track.ogg', assetMap), {
      url: '/assets/track.ogg',
      source: 'bundled'
    })
  })

  await t.test('falls back to public path for missing assets', () => {
    assert.deepStrictEqual(resolveAssetUrl('audio/track.ogg', {}), {
      url: '/assets/audio/track.ogg',
      source: 'public'
    })
  })
})

test('buildAssetUrlMap', async t => {
  await t.test('stores relative paths and basenames', () => {
    const assetMap = buildAssetUrlMap({
      '../assets/set1/track.ogg': '/assets/set1/track.ogg'
    })
    assert.strictEqual(assetMap['set1/track.ogg'], '/assets/set1/track.ogg')
    assert.strictEqual(assetMap['track.ogg'], '/assets/set1/track.ogg')
  })

  await t.test('warns on basename conflicts and keeps first entry', () => {
    const warnings = []
    const assetMap = buildAssetUrlMap(
      {
        '../assets/set1/track.ogg': '/assets/set1/track.ogg',
        '../assets/set2/track.ogg': '/assets/set2/track.ogg'
      },
      message => warnings.push(message),
      'Audio'
    )

    assert.strictEqual(assetMap['set1/track.ogg'], '/assets/set1/track.ogg')
    assert.strictEqual(assetMap['set2/track.ogg'], '/assets/set2/track.ogg')
    assert.strictEqual(assetMap['track.ogg'], '/assets/set1/track.ogg')
    assert.strictEqual(warnings.length, 1)
    assert.match(warnings[0], /audio basename conflict/i)
  })
})

test('buildAssetUrlMap OGG key filtering', async t => {
  await t.test(
    'full paths and basenames are both stored for OGG assets',
    () => {
      const assetMap = buildAssetUrlMap({
        '../assets/01 Kranker Schrank.ogg': '/assets/01%20Kranker%20Schrank.ogg'
      })
      // Both the relative path and the basename should be in the map
      assert.strictEqual(
        assetMap['01 Kranker Schrank.ogg'],
        '/assets/01%20Kranker%20Schrank.ogg'
      )
    }
  )

  await t.test(
    'full paths with subdirectories are distinguishable from basenames',
    () => {
      const assetMap = buildAssetUrlMap({
        '../assets/audio/song.ogg': '/assets/audio/song.ogg',
        '../assets/sfx/song.ogg': '/assets/sfx/song.ogg'
      })
      // Both full paths stored independently
      assert.strictEqual(assetMap['audio/song.ogg'], '/assets/audio/song.ogg')
      assert.strictEqual(assetMap['sfx/song.ogg'], '/assets/sfx/song.ogg')
      // Basename keeps first entry
      assert.strictEqual(assetMap['song.ogg'], '/assets/audio/song.ogg')
    }
  )

  await t.test(
    'path-containing keys can be filtered from basename-only keys',
    () => {
      const assetMap = buildAssetUrlMap({
        '../assets/audio/a.ogg': '/assets/audio/a.ogg',
        '../assets/audio/b.ogg': '/assets/audio/b.ogg'
      })
      const allOggKeys = Object.keys(assetMap).filter(k => k.endsWith('.ogg'))
      const fullPathKeys = allOggKeys.filter(k => k.includes('/'))
      const basenameOnlyKeys = allOggKeys.filter(k => !k.includes('/'))
      // Should have 2 full paths and 2 basenames
      assert.strictEqual(fullPathKeys.length, 2)
      assert.strictEqual(basenameOnlyKeys.length, 2)
      // Full path keys are the canonical set for logging
      assert.ok(fullPathKeys.includes('audio/a.ogg'))
      assert.ok(fullPathKeys.includes('audio/b.ogg'))
    }
  )

  await t.test('root-level assets have no slash in key', () => {
    // When OGGs are in the assets root, keys have no slash
    const assetMap = buildAssetUrlMap({
      '../assets/track.ogg': '/assets/track.ogg'
    })
    const allOggKeys = Object.keys(assetMap).filter(k => k.endsWith('.ogg'))
    const fullPathKeys = allOggKeys.filter(k => k.includes('/'))
    // No full-path keys since file is at root
    assert.strictEqual(fullPathKeys.length, 0)
    // Should still get the basename key
    assert.strictEqual(allOggKeys.length, 1)
    assert.strictEqual(allOggKeys[0], 'track.ogg')
  })
})

test('buildMidiUrlMap', async t => {
  await t.test('stores relative paths and basenames', () => {
    const midiUrlMap = buildMidiUrlMap({
      '../assets/set1/track.mid': '/assets/set1/track.mid'
    })
    assert.strictEqual(midiUrlMap['set1/track.mid'], '/assets/set1/track.mid')
    assert.strictEqual(midiUrlMap['track.mid'], '/assets/set1/track.mid')
  })

  await t.test('warns on basename conflicts and keeps first entry', () => {
    const warnings = []
    const midiUrlMap = buildMidiUrlMap(
      {
        '../assets/set1/track.mid': '/assets/set1/track.mid',
        '../assets/set2/track.mid': '/assets/set2/track.mid'
      },
      message => warnings.push(message)
    )

    assert.strictEqual(midiUrlMap['set1/track.mid'], '/assets/set1/track.mid')
    assert.strictEqual(midiUrlMap['set2/track.mid'], '/assets/set2/track.mid')
    assert.strictEqual(midiUrlMap['track.mid'], '/assets/set1/track.mid')
    assert.strictEqual(warnings.length, 1)
    assert.match(warnings[0], /basename conflict/i)
  })
})
