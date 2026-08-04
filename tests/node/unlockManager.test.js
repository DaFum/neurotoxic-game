import test from 'node:test'
import assert from 'node:assert/strict'

// Mock localStorage globally
const mockStorage = {
  store: {},
  get length() {
    return Object.keys(this.store).length
  },
  key(index) {
    return Object.keys(this.store)[index] ?? null
  },
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
  const { getUnlocks, addUnlock, __testInternals } =
    await import('../../src/utils/unlockManager')
  const { resetStorageFallback } = await import('../../src/utils/storage')
  const clearCache = __testInternals.clearCache

  t.beforeEach(() => {
    mockStorage.clear()
    // Markers buffered by a refused write outlive localStorage.clear().
    resetStorageFallback()
    clearCache()
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
    mockStorage.setItem(
      'neurotoxic_unlocks',
      JSON.stringify({ not: 'an array' })
    )
    const unlocks = getUnlocks()
    assert.deepEqual(unlocks, [])
  })

  await t.test('getUnlocks sanitizes mixed-type arrays', () => {
    mockStorage.setItem(
      'neurotoxic_unlocks',
      JSON.stringify(['valid', 123, null, 'also_valid', {}])
    )
    const unlocks = getUnlocks()
    assert.deepEqual(unlocks, ['valid', 'also_valid'])
  })

  await t.test(
    'getUnlocks returns empty array if JSON.parse returns null',
    () => {
      mockStorage.setItem('neurotoxic_unlocks', 'null')
      const unlocks = getUnlocks()
      assert.deepEqual(unlocks, [])
    }
  )

  await t.test(
    'getUnlocks returns empty array if JSON.parse returns a primitive',
    () => {
      mockStorage.setItem('neurotoxic_unlocks', '123')
      const unlocksNum = getUnlocks()
      assert.deepEqual(unlocksNum, [])

      mockStorage.setItem('neurotoxic_unlocks', '"string"')
      const unlocksStr = getUnlocks()
      assert.deepEqual(unlocksStr, [])
    }
  )

  await t.test('getUnlocks returns empty array if localStorage throws', () => {
    const originalGetItem = mockStorage.getItem
    mockStorage.getItem = () => {
      throw new Error('Access Denied')
    }

    try {
      const unlocks = getUnlocks()
      assert.deepEqual(unlocks, [])
    } finally {
      mockStorage.getItem = originalGetItem
    }
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

  await t.test(
    'per-unlock markers survive a stale aggregate overwrite from another tab',
    () => {
      assert.equal(addUnlock('first_unlock'), true)
      mockStorage.setItem(
        'neurotoxic_unlocks',
        JSON.stringify(['second_unlock'])
      )

      clearCache()

      assert.deepEqual(getUnlocks(), ['second_unlock', 'first_unlock'])
    }
  )

  await t.test(
    'addUnlock retains the unlock when storage refuses writes',
    () => {
      const originalSetItem = mockStorage.setItem
      mockStorage.setItem = () => {
        throw new Error('Storage Full')
      }

      try {
        // The write guard keeps the marker in its session fallback, so the unlock
        // is retained for this session even though nothing was persisted.
        assert.equal(addUnlock('fail_item'), true)
        assert.deepEqual(getUnlocks(), ['fail_item'])
        assert.equal(
          Object.hasOwn(mockStorage.store, 'neurotoxic_unlock:fail_item'),
          false
        )

        // Rediscoverable from the buffered marker after the cache is dropped.
        clearCache()
        assert.deepEqual(getUnlocks(), ['fail_item'])
      } finally {
        mockStorage.setItem = originalSetItem
      }
    }
  )

  await t.test(
    'addUnlock preserves legacy unlocks when the storage read fails',
    () => {
      mockStorage.setItem(
        'neurotoxic_unlocks',
        JSON.stringify(['legacy_unlock'])
      )
      const originalGetItem = mockStorage.getItem
      mockStorage.getItem = () => {
        throw new Error('Access Denied')
      }

      try {
        assert.equal(addUnlock('new_unlock'), false)
        assert.equal(
          mockStorage.store.neurotoxic_unlocks,
          JSON.stringify(['legacy_unlock'])
        )
        assert.equal(
          Object.hasOwn(mockStorage.store, 'neurotoxic_unlock:new_unlock'),
          false
        )
      } finally {
        mockStorage.getItem = originalGetItem
      }

      clearCache()
      assert.deepEqual(getUnlocks(), ['legacy_unlock'])
    }
  )
})
