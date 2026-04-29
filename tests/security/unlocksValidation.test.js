import { test, beforeEach, afterAll, describe } from 'vitest'
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

const originalLocalStorage = global.localStorage
global.localStorage = mockStorage

describe('Unlock Manager Security', async () => {
  const { addUnlock } = await import('../../src/utils/unlockManager')

  beforeEach(() => {
    mockStorage.clear()
  })

  afterAll(() => {
    global.localStorage = originalLocalStorage
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
    const pollutedPayload =
      '["valid_unlock", {"__proto__": {"polluted": true}}, 42]'
    mockStorage.setItem('neurotoxic_unlocks', pollutedPayload)

    const added = addUnlock('fresh_unlock')
    assert.equal(added, true)
    const persisted = readStorage()
    assert.deepEqual(persisted, ['valid_unlock', 'fresh_unlock'])
    for (const item of persisted) {
      if (typeof item !== 'object' || !item) continue
      assert.equal(Object.hasOwn(item, '__proto__'), false)
      assert.equal(Object.hasOwn(item, 'constructor'), false)
      assert.equal(Object.hasOwn(item, 'prototype'), false)
    }
  })

  test('addUnlock sanitizes constructor/prototype nested payload keys', () => {
    const hostilePayload =
      '["valid_unlock", {"constructor":{"prototype":{"polluted":true}}}]'
    mockStorage.setItem('neurotoxic_unlocks', hostilePayload)

    const added = addUnlock('fresh_unlock')
    assert.equal(added, true)
    const persisted = readStorage()
    assert.deepEqual(persisted, ['valid_unlock', 'fresh_unlock'])
    for (const item of persisted) {
      if (typeof item !== 'object' || !item) continue
      assert.equal(Object.hasOwn(item, '__proto__'), false)
      assert.equal(Object.hasOwn(item, 'constructor'), false)
      assert.equal(Object.hasOwn(item, 'prototype'), false)
    }
    assert.equal({}.polluted, undefined)
  })

  test('addUnlock tolerates malformed JSON payload without mutating prototype', () => {
    mockStorage.setItem(
      'neurotoxic_unlocks',
      '{"__proto__":{"polluted":"yes"},"broken":'
    )

    const added = addUnlock('safe_unlock')
    assert.equal(added, true)
    const persisted = readStorage()
    assert.deepEqual(persisted, ['safe_unlock'])
    for (const item of persisted) {
      if (typeof item !== 'object' || !item) continue
      assert.equal(Object.hasOwn(item, '__proto__'), false)
      assert.equal(Object.hasOwn(item, 'constructor'), false)
      assert.equal(Object.hasOwn(item, 'prototype'), false)
    }
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
