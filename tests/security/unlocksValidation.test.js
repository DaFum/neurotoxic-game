import { test, beforeEach, describe } from 'vitest'
import assert from 'node:assert/strict'

const mockStorage = {
  store: {},
  getItem(key) {
    return this.store[key] || null
  },
  setItem(key, value) {
    this.store[key] = String(value)
  },
  removeItem(key) {
    delete this.store[key]
  },
  clear() {
    this.store = {}
  }
}

global.localStorage = mockStorage

describe('Unlock Manager Security', async () => {
  const { addUnlock } = await import('../../src/utils/unlockManager')

  beforeEach(() => {
    mockStorage.clear()
  })

  const readStorage = () => {
    const raw = mockStorage.getItem('neurotoxic_unlocks')
    if (!raw) return []
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  test('addUnlock sanitizes previously polluted storage payloads', () => {
    mockStorage.setItem(
      'neurotoxic_unlocks',
      JSON.stringify(['valid_unlock', { __proto__: { polluted: true } }, 42])
    )

    const added = addUnlock('fresh_unlock')
    assert.equal(added, true)
    assert.deepEqual(readStorage(), ['valid_unlock', 'fresh_unlock'])
  })

  test('addUnlock tolerates malformed JSON payload without mutating prototype', () => {
    mockStorage.setItem(
      'neurotoxic_unlocks',
      '{"__proto__":{"polluted":"yes"},"broken":'
    )

    const added = addUnlock('safe_unlock')
    assert.equal(added, true)
    assert.deepEqual(readStorage(), ['safe_unlock'])
    assert.equal({}.polluted, undefined)
  })

  test('addUnlock rejects hostile non-string inputs', () => {
    const objectResult = addUnlock({ id: 'evil' })
    const arrayResult = addUnlock(['evil'])

    assert.equal(objectResult, false)
    assert.equal(arrayResult, false)
    assert.deepEqual(readStorage(), [])
  })
})
