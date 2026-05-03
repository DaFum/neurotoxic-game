/**
 * Cryptographically secure random number generator between 0 and 1.
 * Replacement for Math.random().
 */
import { handleError } from './errorHandler'

// Module-scoped helper type describing the minimal subset of the Web Crypto
// interface used by this module. Extracted to avoid repeating inline
// declarations and to keep casts explicit and localized.
type CryptoGetRandom = {
  getRandomValues: (arr: Uint8Array | Uint32Array) => Uint8Array | Uint32Array
}

const BATCH_SIZE = 1024
let batchArray: Uint32Array | null = null
let batchIndex = BATCH_SIZE
let secureRandomErrorReported = false

const lut: string[] = Array.from({ length: 256 }, (_, i) =>
  i.toString(16).padStart(2, '0')
)

/**
 * Returns a cryptographically secure random number between 0 and 1.
 * Throws an error if the Crypto API is not available.
 * @returns {number}
 */
export const secureRandom = (): number => {
  const crypto = globalThis.crypto || window?.crypto

  if (!crypto?.getRandomValues) {
    throw new Error(
      'Cryptographically secure random number generation is not supported in this environment.'
    )
  }

  // Lazy initialize the typed array to ensure crypto is available at runtime
  if (batchArray === null) {
    batchArray = new Uint32Array(BATCH_SIZE)
  }

  // Refill the batch when it's exhausted
  if (batchIndex >= BATCH_SIZE) {
    const c = crypto as CryptoGetRandom
    c.getRandomValues(batchArray!)
    batchIndex = 0
  }

  // 0xFFFFFFFF + 1 is 2^32 (4294967296)
  // This provides a float in the range [0, 1)
  const val = batchArray![batchIndex++]
  if (val === undefined) throw new Error('batchArray exhausted or undefined')
  return val / 4294967296
}

/**
 * A safe wrapper for generating random numbers that uses secureRandom.
 * Logs the error once to the error handler and falls back to Math.random() if the Crypto API
 * is unavailable.
 * @returns {number}
 */
export const getSafeRandom = (): number => {
  try {
    return secureRandom()
  } catch (error) {
    if (!secureRandomErrorReported) {
      secureRandomErrorReported = true
      handleError(error, {
        silent: true,
        severity: 'medium',
        fallbackMessage: 'Crypto API unavailable, falling back to Math.random.'
      })
    }
    return Math.random()
  }
}

/**
 * A safe wrapper for generating UUIDs that prefers crypto.randomUUID()
 * but falls back to a generated string if unavailable.
 * @returns {string}
 */
export const getSafeUUID = (): string => {
  const crypto = globalThis.crypto || window?.crypto
  try {
    const uuid = crypto?.randomUUID?.()
    if (uuid) return uuid
  } catch {
    // Fall through to fallback
  }

  // Fallback RFC4122 v4 UUID
  const buffer = new Uint8Array(16)
  try {
    if (typeof crypto?.getRandomValues !== 'function') {
      throw new Error('getRandomValues not supported')
    }
    const c = crypto as CryptoGetRandom
    c.getRandomValues(buffer)
  } catch {
    // Intentionally use Math.random() directly only as a last resort to avoid
    // circular dependency with getSafeRandom -> handleError -> logger ->
    // getSafeUUID -> getSafeRandom while preserving cryptographic randomness
    // when crypto.getRandomValues() is available.
    for (let i = 0; i < 16; i++) {
      buffer[i] = Math.floor(Math.random() * 256)
    }
  }

  // Set version to 4
  buffer[6] = ((buffer[6] ?? 0) & 0x0f) | 0x40
  // Set variant to RFC4122
  buffer[8] = ((buffer[8] ?? 0) & 0x3f) | 0x80

  return (
    (lut[buffer[0] ?? 0] || '') +
    (lut[buffer[1] ?? 0] || '') +
    (lut[buffer[2] ?? 0] || '') +
    (lut[buffer[3] ?? 0] || '') +
    '-' +
    (lut[buffer[4] ?? 0] || '') +
    (lut[buffer[5] ?? 0] || '') +
    '-' +
    (lut[buffer[6] ?? 0] || '') +
    (lut[buffer[7] ?? 0] || '') +
    '-' +
    (lut[buffer[8] ?? 0] || '') +
    (lut[buffer[9] ?? 0] || '') +
    '-' +
    (lut[buffer[10] ?? 0] || '') +
    (lut[buffer[11] ?? 0] || '') +
    (lut[buffer[12] ?? 0] || '') +
    (lut[buffer[13] ?? 0] || '') +
    (lut[buffer[14] ?? 0] || '') +
    (lut[buffer[15] ?? 0] || '')
  )
}

/**
 * Resets the batch and error flag for testing purposes.
 */
export const resetSecureRandomBatchForTesting = (): void => {
  batchArray = null
  batchIndex = BATCH_SIZE
  secureRandomErrorReported = false
}
