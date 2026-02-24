/**
 * Cryptographically secure random number generator between 0 and 1.
 * Replacement for Math.random().
 */
export const secureRandom = () => {
  const crypto = globalThis.crypto || window?.crypto

  if (crypto?.getRandomValues) {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    // 0xFFFFFFFF + 1 is 2^32 (4294967296)
    // This provides a float in the range [0, 1)
    return array[0] / 4294967296
  }

  // Fallback to Math.random if crypto is not available (safety)
  return Math.random()
}
