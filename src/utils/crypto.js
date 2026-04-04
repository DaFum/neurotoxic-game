// TODO: Review this file
/**
 * Cryptographically secure random number generator between 0 and 1.
 * Replacement for Math.random().
 */
import { handleError } from './errorHandler.js'

const BATCH_SIZE = 1024
let batchArray = null
let batchIndex = BATCH_SIZE
let secureRandomErrorReported = false

const lut = []
for (let i = 0; i < 256; i++) {
  lut[i] = (i < 16 ? '0' : '') + i.toString(16)
}

/**
 * Returns a cryptographically secure random number between 0 and 1.
 * Throws an error if the Crypto API is not available.
 * @returns {number}
 */
export const secureRandom = () => {
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
    crypto.getRandomValues(batchArray)
    batchIndex = 0
  }

  // 0xFFFFFFFF + 1 is 2^32 (4294967296)
  // This provides a float in the range [0, 1)
  return batchArray[batchIndex++] / 4294967296
}

/**
 * A safe wrapper for generating random numbers that prefers secureRandom
 * but falls back to Math.random() if the Crypto API is unavailable.
 * Log the fallback once to the error handler.
 * @returns {number}
 */
export const getSafeRandom = () => {
  try {
    return secureRandom()
  } catch (error) {
    if (!secureRandomErrorReported) {
      secureRandomErrorReported = true
      handleError(error, {
        silent: true,
        severity: 'medium',
        fallbackMessage: 'Crypto API unavailable, falling back to Math.random()'
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
export const getSafeUUID = () => {
  const crypto = globalThis.crypto || window?.crypto
  try {
    const uuid = crypto?.randomUUID?.()
    if (uuid) return uuid
  } catch {
    // Fall through to fallback
  }

  // Fallback RFC4122 v4 UUID
  const d0 = (getSafeRandom() * 0xffffffff) | 0
  const d1 = (getSafeRandom() * 0xffffffff) | 0
  const d2 = (getSafeRandom() * 0xffffffff) | 0
  const d3 = (getSafeRandom() * 0xffffffff) | 0
  const uuid =
    lut[d0 & 0xff] +
    lut[(d0 >> 8) & 0xff] +
    lut[(d0 >> 16) & 0xff] +
    lut[(d0 >> 24) & 0xff] +
    '-' +
    lut[d1 & 0xff] +
    lut[(d1 >> 8) & 0xff] +
    '-' +
    lut[((d1 >> 16) & 0x0f) | 0x40] +
    lut[(d1 >> 24) & 0xff] +
    '-' +
    lut[(d2 & 0x3f) | 0x80] +
    lut[(d2 >> 8) & 0xff] +
    '-' +
    lut[(d2 >> 16) & 0xff] +
    lut[(d2 >> 24) & 0xff] +
    lut[d3 & 0xff] +
    lut[(d3 >> 8) & 0xff] +
    lut[(d3 >> 16) & 0xff] +
    lut[(d3 >> 24) & 0xff]

  return uuid
}

/**
 * Resets the batch and error flag for testing purposes.
 */
export const resetSecureRandomBatchForTesting = () => {
  batchArray = null
  batchIndex = BATCH_SIZE
  secureRandomErrorReported = false
}
