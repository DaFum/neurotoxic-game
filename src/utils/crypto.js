// TODO: Review this file
/**
 * Cryptographically secure random number generator between 0 and 1.
 * Replacement for Math.random().
 */

const BATCH_SIZE = 1024
let batchArray = null
let batchIndex = BATCH_SIZE

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

export const resetSecureRandomBatchForTesting = () => {
  batchArray = null
  batchIndex = BATCH_SIZE
}
