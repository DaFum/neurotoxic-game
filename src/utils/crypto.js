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

  // Fallback UUID-like string
  const roll = getSafeRandom()
  return `${Date.now().toString(36)}-${roll.toString(36).substring(2)}`
}

/**
 * Resets the batch and error flag for testing purposes.
 */
export const resetSecureRandomBatchForTesting = () => {
  batchArray = null
  batchIndex = BATCH_SIZE
  secureRandomErrorReported = false
}
