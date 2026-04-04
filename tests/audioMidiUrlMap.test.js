import assert from 'node:assert'
import { test, mock } from 'node:test'
import { buildAssetUrlMap } from '../src/utils/audio/playbackUtils.js'

// --- Mocks ---

const mockLogger = {
  warn: mock.fn()
}
mock.module('../src/utils/logger.js', { namedExports: { logger: mockLogger } })

const mockBuildAssetUrlMap = mock.fn((glob, warn, label) => {
  // We can simulate what buildAssetUrlMap returns
  if (label === 'MIDI') {
    return {
      'test.mid': 'assets/test.mid',
      'nested/track.mid': 'assets/nested/track.mid',
      'track.mid': 'assets/nested/track.mid'
    }
  }
  return {}
})

mock.module('../src/utils/audio/playbackUtils.js', {
  namedExports: {
    buildAssetUrlMap: mockBuildAssetUrlMap,
    resolveAssetUrl: mock.fn(),
    PATH_PREFIX_REGEX: /^\.?\//,
    getBaseAssetPath: () => ({ baseUrl: './', publicBasePath: './assets' })
  }
})

// Mock other dependencies to avoid side effects
mock.module('../src/utils/audio/context.js', {
  namedExports: { getRawAudioContext: () => ({}) }
})
mock.module('../src/utils/audio/state.js', {
  namedExports: { audioState: { audioBufferCache: new Map() } }
})
mock.module('../src/utils/audio/constants.js', {
  namedExports: {
    AUDIO_BUFFER_LOAD_TIMEOUT_MS: 1000,
    AUDIO_BUFFER_DECODE_TIMEOUT_MS: 1000,
    MAX_AUDIO_BUFFER_CACHE_SIZE: 10,
    MAX_AUDIO_BUFFER_BYTE_SIZE: 1024
  }
})

// Import the module under test AFTER mocking
const { midiUrlMap } = await import('../src/utils/audio/assets.js')

test('midiUrlMap in assets.js', async t => {
  await t.test('midiUrlMap is exported and populated', () => {
    assert.ok(midiUrlMap, 'midiUrlMap should be exported')
    assert.strictEqual(
      typeof midiUrlMap,
      'object',
      'midiUrlMap should be an object'
    )
  })

  await t.test(
    'midiUrlMap construction called buildAssetUrlMap with correct arguments',
    () => {
      // Check if buildAssetUrlMap was called with 'MIDI' label
      const midiCall = mockBuildAssetUrlMap.mock.calls.find(
        call => call.arguments[2] === 'MIDI'
      )
      assert.ok(midiCall, 'buildAssetUrlMap should be called for MIDI')

      // The first argument is the glob, which should be an object (empty in tests due to loader)
      assert.strictEqual(typeof midiCall.arguments[0], 'object')

      // The second argument is the warning callback
      assert.strictEqual(typeof midiCall.arguments[1], 'function')
    }
  )

  await t.test('midiUrlMap contains expected keys from mock', () => {
    assert.strictEqual(midiUrlMap['test.mid'], 'assets/test.mid')
    assert.strictEqual(
      midiUrlMap['nested/track.mid'],
      'assets/nested/track.mid'
    )
    assert.strictEqual(midiUrlMap['track.mid'], 'assets/nested/track.mid')
  })

  await t.test('warning callback logs to logger', () => {
    const midiCall = mockBuildAssetUrlMap.mock.calls.find(
      call => call.arguments[2] === 'MIDI'
    )
    const warnCallback = midiCall.arguments[1]

    // Reset calls to ignore warnings triggered during module load (e.g. "No OGG assets bundled")
    mockLogger.warn.mock.resetCalls()
    warnCallback('test warning')

    assert.strictEqual(mockLogger.warn.mock.calls.length, 1)
    assert.strictEqual(
      mockLogger.warn.mock.calls[0].arguments[0],
      'AudioEngine'
    )
    assert.strictEqual(
      mockLogger.warn.mock.calls[0].arguments[1],
      'test warning'
    )
  })

  await t.test(
    'midiUrlMap conflict handling (integration with buildAssetUrlMap)',
    () => {
      const warnings = []
      const warn = msg => warnings.push(msg)

      const fakeGlob = {
        '../assets/set1/track.mid': 'url1',
        '../assets/set2/track.mid': 'url2'
      }

      const resultMap = buildAssetUrlMap(fakeGlob, warn, 'MIDI')

      assert.strictEqual(resultMap['set1/track.mid'], 'url1')
      assert.strictEqual(resultMap['set2/track.mid'], 'url2')
      assert.strictEqual(
        resultMap['track.mid'],
        'url1',
        'Should keep first entry for basename'
      )
      assert.strictEqual(warnings.length, 1)
      assert.match(warnings[0], /MIDI basename conflict/i)
    }
  )
})
