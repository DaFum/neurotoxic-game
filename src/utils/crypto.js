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

/**
 * Generates an HMAC-SHA256 signature for the given payload using a secret.
 * @param {string} payload - The message to sign.
 * @param {string} secret - The shared secret key.
 * @returns {Promise<string>} The hex-encoded signature.
 */
export const generateSignature = async (payload, secret) => {
  if (!secret || !payload) return ''

  const cryptoObj = globalThis.crypto
  if (!cryptoObj?.subtle) {
    throw new Error('Web Crypto API (subtle) is not supported.')
  }

  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(payload)

  const key = await cryptoObj.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await cryptoObj.subtle.sign('HMAC', key, messageData)

  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verifies if the given signature matches the payload/secret.
 * Uses timing-safe-ish comparison for the hex strings.
 * @param {string} payload - The message to verify.
 * @param {string} signature - The signature to check against.
 * @param {string} secret - The shared secret key.
 * @returns {Promise<boolean>} True if valid.
 */
export const verifySignature = async (payload, signature, secret) => {
  if (!payload || !signature || !secret) return false

  const expected = await generateSignature(payload, secret)
  if (expected.length !== signature.length) return false

  // Constant-time-ish comparison
  let result = 0
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return result === 0
}
