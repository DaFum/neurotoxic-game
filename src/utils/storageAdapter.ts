/**
 * Injectable key/value storage service.
 *
 * @remarks
 * Every persistence call site goes through this interface so the backend can
 * be swapped — an in-memory store in tests, a no-op in private browsing, an
 * append-only store later — without touching callers. Implementations must
 * never throw: a refused write is a degraded mode, not a crash class.
 */
export interface IStorageAdapter {
  /** Reads a raw string, or `null` when the key is unknown or unreadable. */
  get(key: string): string | null
  /** Writes a raw string. Returns `false` when the write was refused. */
  set(key: string, value: string): boolean
  /** Removes a key. */
  remove(key: string): void
  /** Removes every key this adapter owns. */
  clear(): void
  /**
   * Lists every key this adapter currently holds.
   *
   * @remarks
   * Needed by callers that discover keys by prefix rather than by name — the
   * unlock markers are stored one key per unlock. Returns `[]` when the backing
   * store cannot enumerate.
   */
  keys(): string[]
}

/**
 * Resolves the host `localStorage`, tolerating server and worker environments.
 *
 * @remarks
 * Resolved lazily per call rather than once at module scope: an eager read
 * throws in private browsing before any error handling is in place, and it
 * would freeze the adapter to whatever global existed at import time.
 */
const resolveLocalStorage = (): Storage | null => {
  if (typeof window !== 'undefined') return window.localStorage
  if (typeof globalThis !== 'undefined') return globalThis.localStorage
  return null
}

/**
 * Notified when a storage operation is refused.
 *
 * @remarks
 * The adapter deliberately does not import the error handler: that module
 * reaches back here through the logger, and the resulting cycle produced two
 * distinct adapter instances under module mocking. Reporting is injected by
 * whichever layer already owns error handling.
 */
export type StorageFailureReporter = (
  operation: 'read' | 'write' | 'removal' | 'clear',
  key: string,
  error: unknown
) => void

const noopReporter: StorageFailureReporter = () => {}

/**
 * Production adapter backed by the host `localStorage`.
 */
export class LocalStorageAdapter implements IStorageAdapter {
  readonly #report: StorageFailureReporter

  /**
   * @param onFailure - Called when an operation is refused. Omit for
   * best-effort preferences where an unavailable store is a normal
   * environment rather than a defect worth reporting.
   */
  constructor(onFailure: StorageFailureReporter = noopReporter) {
    this.#report = onFailure
  }

  /** {@inheritDoc IStorageAdapter} */
  get(key: string): string | null {
    try {
      return resolveLocalStorage()?.getItem(key) ?? null
    } catch (error) {
      this.#report('read', key, error)
      return null
    }
  }

  /** {@inheritDoc IStorageAdapter} */
  set(key: string, value: string): boolean {
    try {
      const storage = resolveLocalStorage()
      if (!storage) throw new Error('No storage available')
      storage.setItem(key, value)
      return true
    } catch (error) {
      this.#report('write', key, error)
      return false
    }
  }

  /** {@inheritDoc IStorageAdapter} */
  remove(key: string): void {
    try {
      resolveLocalStorage()?.removeItem(key)
    } catch (error) {
      this.#report('removal', key, error)
    }
  }

  /** {@inheritDoc IStorageAdapter} */
  clear(): void {
    try {
      resolveLocalStorage()?.clear()
    } catch (error) {
      this.#report('clear', '*', error)
    }
  }

  /** {@inheritDoc IStorageAdapter} */
  keys(): string[] {
    try {
      const storage = resolveLocalStorage()
      if (
        !storage ||
        typeof storage.key !== 'function' ||
        !Number.isFinite(storage.length)
      ) {
        return []
      }
      const found: string[] = []
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (typeof key === 'string') found.push(key)
      }
      return found
    } catch (error) {
      this.#report('read', '*', error)
      return []
    }
  }
}

/**
 * Session-scoped adapter backed by a plain `Map`.
 *
 * @remarks
 * Doubles as the degraded-mode fallback for {@link LocalStorageAdapter} and as
 * the injection target for tests that must run without a DOM.
 */
export class InMemoryAdapter implements IStorageAdapter {
  readonly #store = new Map<string, string>()

  /** {@inheritDoc IStorageAdapter} */
  get(key: string): string | null {
    return this.#store.get(key) ?? null
  }

  /** {@inheritDoc IStorageAdapter} */
  set(key: string, value: string): boolean {
    this.#store.set(key, value)
    return true
  }

  /** {@inheritDoc IStorageAdapter} */
  remove(key: string): void {
    this.#store.delete(key)
  }

  /** {@inheritDoc IStorageAdapter} */
  clear(): void {
    this.#store.clear()
  }

  /** {@inheritDoc IStorageAdapter} */
  keys(): string[] {
    return [...this.#store.keys()]
  }

  /**
   * Whether a key currently has a buffered value.
   *
   * @param key - Storage key.
   * @returns `true` when this adapter holds a value for the key.
   */
  has(key: string): boolean {
    return this.#store.has(key)
  }
}

/**
 * Adapter that discards every write and reads nothing.
 *
 * @remarks
 * The explicit "storage is unavailable and that is fine" surface — private
 * browsing, storage disabled by policy, CI runs that must not persist.
 */
export class NoopAdapter implements IStorageAdapter {
  /** {@inheritDoc IStorageAdapter} */
  get(): string | null {
    return null
  }

  /** {@inheritDoc IStorageAdapter} */
  set(): boolean {
    return false
  }

  /** {@inheritDoc IStorageAdapter} */
  remove(): void {}

  /** {@inheritDoc IStorageAdapter} */
  clear(): void {}

  /** {@inheritDoc IStorageAdapter} */
  keys(): string[] {
    return []
  }
}
