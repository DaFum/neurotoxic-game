import test from 'node:test'
import assert from 'node:assert/strict'

// Mock localStorage globally for the test file
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

test('Unlock Manager Security', async t => {
  // Dynamic import to ensure global.localStorage is ready
  const { addUnlock } = await import('../../src/utils/unlockManager.js')

  t.beforeEach(() => {
    mockStorage.clear()
  })

  // Helper to read current storage state directly
  const readStorage = () => {
    const raw = mockStorage.getItem('neurotoxic_unlocks')
    if (!raw) return []
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  await t.test('addUnlock sanitizes before adding', async () => {
    mockStorage.setItem('neurotoxic_unlocks', JSON.stringify(['valid', 123]))
    const result = addUnlock('new_item')
    assert.equal(result, true)

    const stored = readStorage()
    assert.deepEqual(stored, ['valid', 'new_item'])
  })

  await t.test('addUnlock prevents duplicates', async () => {
    addUnlock('item1')
    const result = addUnlock('item1')
    assert.equal(result, false) // Should return false as it wasn't added
    assert.deepEqual(readStorage(), ['item1'])
  })

  await t.test('addUnlock adds multiple unique items', async () => {
    addUnlock('item1')
    addUnlock('item2')
    assert.deepEqual(readStorage(), ['item1', 'item2'])
  })

  await t.test('addUnlock rejects non-string inputs', async () => {
    const result = addUnlock(123)
    assert.equal(result, false)
    assert.deepEqual(readStorage(), [])
  })
})
