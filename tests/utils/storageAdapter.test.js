import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  InMemoryAdapter,
  LocalStorageAdapter,
  NoopAdapter
} from '../../src/utils/storageAdapter'
import { defaultStorageAdapter } from '../../src/utils/storage'

const buildStubStorage = () => {
  const map = new Map()
  return {
    getItem: key => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
    clear: () => map.clear()
  }
}

describe('InMemoryAdapter', () => {
  it('round-trips values without touching the host', () => {
    const adapter = new InMemoryAdapter()

    expect(adapter.get('missing')).toBeNull()
    expect(adapter.set('a', '1')).toBe(true)
    expect(adapter.get('a')).toBe('1')
    expect(adapter.has('a')).toBe(true)

    adapter.remove('a')
    expect(adapter.get('a')).toBeNull()
    expect(adapter.has('a')).toBe(false)

    adapter.set('b', '2')
    adapter.clear()
    expect(adapter.get('b')).toBeNull()
  })
})

describe('NoopAdapter', () => {
  it('discards writes and reads nothing', () => {
    const adapter = new NoopAdapter()

    expect(adapter.set('a', '1')).toBe(false)
    expect(adapter.get('a')).toBeNull()
    expect(() => {
      adapter.remove('a')
      adapter.clear()
    }).not.toThrow()
  })
})

describe('LocalStorageAdapter', () => {
  let originalDescriptor

  beforeEach(() => {
    originalDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'localStorage'
    )
  })

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', originalDescriptor)
    } else {
      delete globalThis.localStorage
    }
    vi.restoreAllMocks()
  })

  const stubStorage = value => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value
    })
  }

  it('delegates to the host storage', () => {
    stubStorage(buildStubStorage())
    const adapter = new LocalStorageAdapter()

    expect(adapter.set('k', 'v')).toBe(true)
    expect(adapter.get('k')).toBe('v')

    adapter.remove('k')
    expect(adapter.get('k')).toBeNull()
  })

  it('degrades instead of throwing when private browsing refuses writes', () => {
    stubStorage({
      getItem: () => {
        throw new DOMException('SecurityError')
      },
      setItem: () => {
        throw new DOMException('QuotaExceededError')
      },
      removeItem: () => {
        throw new DOMException('SecurityError')
      },
      clear: () => {
        throw new DOMException('SecurityError')
      }
    })
    const adapter = new LocalStorageAdapter()

    expect(adapter.set('k', 'v')).toBe(false)
    expect(adapter.get('k')).toBeNull()
    expect(() => {
      adapter.remove('k')
      adapter.clear()
    }).not.toThrow()
  })

  it('reports a missing host store as a refused write, not a crash', () => {
    delete globalThis.localStorage
    const adapter = new LocalStorageAdapter()

    expect(adapter.set('k', 'v')).toBe(false)
    expect(adapter.get('k')).toBeNull()
  })

  it('resolves the host store lazily, per call', () => {
    delete globalThis.localStorage
    const adapter = new LocalStorageAdapter()
    expect(adapter.get('k')).toBeNull()

    // A store that appears after construction must still be used: an adapter
    // that captured `localStorage` at module scope could not be swapped.
    stubStorage(buildStubStorage())
    expect(adapter.set('k', 'v')).toBe(true)
    expect(adapter.get('k')).toBe('v')
  })
})

describe('defaultStorageAdapter', () => {
  it('implements the full adapter surface', () => {
    for (const method of ['get', 'set', 'remove', 'clear']) {
      expect(typeof defaultStorageAdapter[method]).toBe('function')
    }
  })
})

describe('degraded-mode fallback isolation', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps a refused write scoped to the adapter that produced it', async () => {
    const { writeStorageItem, readStorageItem } =
      await import('../../src/utils/storage')

    // A NoopAdapter refuses every write, so the value lands in that adapter's
    // degraded buffer.
    const refusing = new NoopAdapter()
    expect(writeStorageItem('save', 'A', refusing)).toBe(false)

    // An independent adapter must serve its own value, not the buffered one.
    const independent = new InMemoryAdapter()
    independent.set('save', 'B')
    expect(readStorageItem('save', independent)).toBe('B')

    // …while the refusing adapter still serves what it buffered.
    expect(readStorageItem('save', refusing)).toBe('A')
  })
})

describe('direct browser-storage access audit', () => {
  /**
   * A module-scope `localStorage` call anywhere defeats the abstraction: the
   * adapter can no longer be swapped in tests. New direct-access sites must
   * either route through the adapter or be added here with a reason.
   */
  const ALLOWED = new Map([
    [
      'src/utils/storageAdapter.ts',
      'the adapter itself — the one place that touches localStorage'
    ],
    [
      'src/utils/unlockManager.ts',
      'enumerates unlock marker keys, which the four-method adapter surface does not cover'
    ],
    [
      'src/hooks/preGig/usePreGigHandlers.ts',
      'sessionStorage, out of scope for the localStorage adapter'
    ]
  ])

  const listSourceFiles = dir => {
    const entries = []
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) entries.push(...listSourceFiles(full))
      else if (/\.(ts|tsx)$/.test(full)) entries.push(full)
    }
    return entries
  }

  it('has no unapproved direct localStorage or sessionStorage call sites', () => {
    const offenders = []
    for (const file of listSourceFiles('src')) {
      if (ALLOWED.has(file)) continue
      const source = readFileSync(file, 'utf8')
      for (const line of source.split('\n')) {
        const trimmed = line.trim()
        // Ignore prose: comment lines and doc blocks mention the API by name.
        if (/^(\/\/|\/\*|\*)/.test(trimmed)) continue
        if (/\b(local|session)Storage\s*[.[]/.test(trimmed)) {
          offenders.push(`${file}: ${trimmed}`)
        }
      }
    }

    expect(offenders).toEqual([])
  })
})
