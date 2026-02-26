import assert from 'node:assert'
import { test, mock } from 'node:test'

// Mock the dependencies
const mockBuildAssetUrlMap = mock.fn((glob, warn, label) => {
  if (label === 'Audio') {
    return {
      'valid.ogg': 'assets/valid.ogg',
      'path/to/nested.ogg': 'assets/path/to/nested.ogg',
      'nested.ogg': 'assets/path/to/nested.ogg', // basename entry
      'conflict.ogg': 'assets/conflict1.ogg' // basename for conflict
    }
  }
  return {}
})

const mockResolveAssetUrl = mock.fn()
const PATH_PREFIX_REGEX = /^\.?\//

mock.module('../src/utils/audio/playbackUtils.js', {
  namedExports: {
    buildAssetUrlMap: mockBuildAssetUrlMap,
    resolveAssetUrl: mockResolveAssetUrl,
    PATH_PREFIX_REGEX
  }
})

// Import the module under test
// Note: We need to import this AFTER mocking
const { hasAudioAsset } = await import('../src/utils/audio/assets.js')

test('hasAudioAsset', async t => {
  await t.test('returns true for existing asset with full path', () => {
    assert.strictEqual(hasAudioAsset('valid.ogg'), true)
  })

  await t.test('returns true for existing asset with basename', () => {
    // If we pass just the basename "valid.ogg", it matches the key "valid.ogg"
    assert.strictEqual(hasAudioAsset('valid.ogg'), true)
  })

  await t.test('returns true for existing nested asset with full path', () => {
    assert.strictEqual(hasAudioAsset('path/to/nested.ogg'), true)
  })

  await t.test(
    'returns true for existing nested asset by basename (if in map)',
    () => {
      // basenames are stored in the map by buildAssetUrlMap logic if unique
      // our mock explicitly puts 'nested.ogg' in the map
      assert.strictEqual(hasAudioAsset('nested.ogg'), true)
    }
  )

  await t.test('returns true when input has ./ prefix', () => {
    assert.strictEqual(hasAudioAsset('./valid.ogg'), true)
  })

  await t.test('returns true when input has / prefix', () => {
    assert.strictEqual(hasAudioAsset('/valid.ogg'), true)
  })

  await t.test(
    'returns true for loose matching by basename even if path is wrong',
    () => {
      // 'conflict.ogg' is in the map.
      // 'wrong/path/conflict.ogg' is NOT in the map.
      // logic: oggUrlMap['wrong/path/conflict.ogg'] (false) || oggUrlMap['conflict.ogg'] (true)
      assert.strictEqual(hasAudioAsset('wrong/path/conflict.ogg'), true)
    }
  )

  await t.test('returns false for non-existent asset', () => {
    assert.strictEqual(hasAudioAsset('invalid.ogg'), false)
  })

  await t.test('returns false for non-string input', () => {
    assert.strictEqual(hasAudioAsset(null), false)
    assert.strictEqual(hasAudioAsset(undefined), false)
    assert.strictEqual(hasAudioAsset(123), false)
    assert.strictEqual(hasAudioAsset({}), false)
  })

  await t.test('returns false for partial match that is not in map', () => {
    assert.strictEqual(hasAudioAsset('val'), false)
  })
})
