import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const {
  getSafeStorageItem,
  isStorageDegraded,
  readStorageItem,
  removeStorageItem,
  resetStorageFallback,
  setSafeStorageItem,
  writeStorageItem
} = await import('../../src/utils/storage')

/**
 * Simulates private browsing: reads work, writes raise a DOMException.
 */
const denyWrites = () =>
  vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
    throw new DOMException('QuotaExceededError')
  })

describe('storage write guard', () => {
  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetStorageFallback()
    localStorage.clear()
  })

  it('persists normally when storage accepts writes', () => {
    expect(writeStorageItem('key', 'value')).toBe(true)
    expect(localStorage.getItem('key')).toBe('value')
    expect(isStorageDegraded()).toBe(false)
  })

  it('falls back to the in-memory store when writes throw', () => {
    const setItem = denyWrites()

    expect(writeStorageItem('key', 'value')).toBe(false)
    expect(isStorageDegraded()).toBe(true)
    expect(setItem).toHaveBeenCalled()
  })

  it('serves memory-backed values back to readers', () => {
    denyWrites()

    writeStorageItem('key', 'value')
    expect(readStorageItem('key')).toBe('value')

    setSafeStorageItem('json', { money: 100 })
    expect(getSafeStorageItem('json', null)).toEqual({ money: 100 })
  })

  it('does not crash the caller on a rejected write', () => {
    denyWrites()

    expect(() => setSafeStorageItem('json', { money: 100 })).not.toThrow()
  })

  it('clears memory-backed values on removal', () => {
    denyWrites()

    writeStorageItem('key', 'value')
    removeStorageItem('key')
    expect(readStorageItem('key')).toBeNull()
  })

  it('prefers the memory entry over the stale persisted value', () => {
    localStorage.setItem('key', 'stale')
    denyWrites()

    writeStorageItem('key', 'newest')
    expect(localStorage.getItem('key')).toBe('stale')
    expect(readStorageItem('key')).toBe('newest')
  })

  it('stops shadowing once a persistent write succeeds again', () => {
    const setItem = denyWrites()
    writeStorageItem('key', 'memory')
    setItem.mockRestore()

    writeStorageItem('key', 'persisted')
    expect(readStorageItem('key')).toBe('persisted')
    expect(localStorage.getItem('key')).toBe('persisted')
  })

  it('reports degraded storage only after a failure', () => {
    expect(isStorageDegraded()).toBe(false)
    denyWrites()
    writeStorageItem('key', 'value')
    expect(isStorageDegraded()).toBe(true)
  })
})
