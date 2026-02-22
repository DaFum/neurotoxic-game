import test from 'node:test'
import assert from 'node:assert/strict'

// Mock localStorage globally
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

test('UnlockManager Unit Tests', async t => {
  const { getUnlocks, addUnlock } = await import('../src/utils/unlockManager.js')

  t.beforeEach(() => {
    mockStorage.clear()
  })

  await t.test('getUnlocks returns empty array when storage is empty', () => {
    const unlocks = getUnlocks()
    assert.deepEqual(unlocks, [])
  })

  await t.test('getUnlocks returns empty array on invalid JSON', () => {
    mockStorage.setItem('neurotoxic_unlocks', 'invalid-json')
    const unlocks = getUnlocks()
    assert.deepEqual(unlocks, [])
  })

  await t.test('getUnlocks returns empty array if data is not an array', () => {
    mockStorage.setItem('neurotoxic_unlocks', JSON.stringify({ not: 'an array' }))
    const unlocks = getUnlocks()
    assert.deepEqual(unlocks, [])
  })

  await t.test('getUnlocks sanitizes mixed-type arrays', () => {
    mockStorage.setItem('neurotoxic_unlocks', JSON.stringify(['valid', 123, null, 'also_valid', {}]))
    const unlocks = getUnlocks()
    assert.deepEqual(unlocks, ['valid', 'also_valid'])
  })

  await t.test('addUnlock successfully adds unique string unlock', () => {
    const result = addUnlock('new_unlock')
    assert.equal(result, true)
    assert.deepEqual(getUnlocks(), ['new_unlock'])
  })

  await t.test('addUnlock rejects non-string input', () => {
    const result = addUnlock(123)
    assert.equal(result, false)
    assert.deepEqual(getUnlocks(), [])
  })

  await t.test('addUnlock prevents duplicates', () => {
    addUnlock('item1')
    const result = addUnlock('item1')
    assert.equal(result, false)
    assert.deepEqual(getUnlocks(), ['item1'])
  })

  await t.test('addUnlock returns false if storage fails', () => {
    const originalSetItem = mockStorage.setItem
    mockStorage.setItem = () => {
      throw new Error('Storage Full')
    }

    try {
      const result = addUnlock('fail_item')
      assert.equal(result, false)
    } finally {
      mockStorage.setItem = originalSetItem
    }
  })
})
