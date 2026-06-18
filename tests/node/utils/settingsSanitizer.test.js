import { describe, it } from 'node:test'
import assert from 'node:assert'
import { sanitizeSettingsPayload } from '../../../src/utils/settingsSanitizer.ts'

describe('sanitizeSettingsPayload', () => {
  it('returns empty object for null, undefined, and non-object inputs', () => {
    assert.deepEqual(sanitizeSettingsPayload(null), {})
    assert.deepEqual(sanitizeSettingsPayload(undefined), {})
    assert.deepEqual(sanitizeSettingsPayload('not-an-object'), {})
    assert.deepEqual(sanitizeSettingsPayload(123), {})
  })

  it('keeps valid boolean crtEnabled and drops invalid types', () => {
    assert.deepEqual(sanitizeSettingsPayload({ crtEnabled: true }), {
      crtEnabled: true
    })
    assert.deepEqual(sanitizeSettingsPayload({ crtEnabled: false }), {
      crtEnabled: false
    })
    assert.deepEqual(sanitizeSettingsPayload({ crtEnabled: 'true' }), {})
    assert.deepEqual(sanitizeSettingsPayload({ crtEnabled: 1 }), {})
    assert.deepEqual(sanitizeSettingsPayload({ crtEnabled: null }), {})
  })

  it('keeps valid boolean tutorialSeen and drops invalid types', () => {
    assert.deepEqual(sanitizeSettingsPayload({ tutorialSeen: true }), {
      tutorialSeen: true
    })
    assert.deepEqual(sanitizeSettingsPayload({ tutorialSeen: false }), {
      tutorialSeen: false
    })
    assert.deepEqual(sanitizeSettingsPayload({ tutorialSeen: 'true' }), {})
    assert.deepEqual(sanitizeSettingsPayload({ tutorialSeen: 1 }), {})
    assert.deepEqual(sanitizeSettingsPayload({ tutorialSeen: null }), {})
  })

  it('keeps valid logLevel and drops invalid types or out of bounds values', () => {
    // Valid log levels are 0-4
    assert.deepEqual(sanitizeSettingsPayload({ logLevel: 0 }), { logLevel: 0 })
    assert.deepEqual(sanitizeSettingsPayload({ logLevel: 2 }), { logLevel: 2 })
    assert.deepEqual(sanitizeSettingsPayload({ logLevel: 4 }), { logLevel: 4 })

    // Invalid types
    assert.deepEqual(sanitizeSettingsPayload({ logLevel: '1' }), {})
    assert.deepEqual(sanitizeSettingsPayload({ logLevel: null }), {})

    // Out of bounds
    assert.deepEqual(sanitizeSettingsPayload({ logLevel: -1 }), {})
    assert.deepEqual(sanitizeSettingsPayload({ logLevel: 5 }), {})
    assert.deepEqual(sanitizeSettingsPayload({ logLevel: 999 }), {})
    assert.deepEqual(sanitizeSettingsPayload({ logLevel: NaN }), {})
    assert.deepEqual(sanitizeSettingsPayload({ logLevel: Infinity }), {})
  })

  it('rounds float logLevel values using Math.floor', () => {
    assert.deepEqual(sanitizeSettingsPayload({ logLevel: 1.9 }), {
      logLevel: 1
    })
    assert.deepEqual(sanitizeSettingsPayload({ logLevel: 2.1 }), {
      logLevel: 2
    })
    // 4.9 is floored to 4, which is valid
    assert.deepEqual(sanitizeSettingsPayload({ logLevel: 4.9 }), {
      logLevel: 4
    })
    // 5.1 is floored to 5, which is out of bounds
    assert.deepEqual(sanitizeSettingsPayload({ logLevel: 5.1 }), {})
  })

  it('drops unknown keys', () => {
    assert.deepEqual(
      sanitizeSettingsPayload({
        crtEnabled: true,
        unknownKey: 'value',
        anotherUnknown: 123
      }),
      { crtEnabled: true }
    )
  })

  it('handles empty objects correctly', () => {
    assert.deepEqual(sanitizeSettingsPayload({}), {})
  })
})
