/**
 * UUID generation with no imports, so the logger can stamp entry IDs without
 * loading `crypto.ts` and, through it, the error handler.
 */

// Minimal subset of the Web Crypto interface used by `getSafeUUID`.
type CryptoGetRandom = {
  getRandomValues: (arr: Uint8Array | Uint32Array) => Uint8Array | Uint32Array
}

const lut: string[] = Array.from({ length: 256 }, (_, i) =>
  i.toString(16).padStart(2, '0')
)

/**
 * A safe wrapper for generating UUIDs that prefers crypto.randomUUID()
 * but falls back to a generated string if unavailable.
 * @returns A UUID string.
 */
export const getSafeUUID = (): string => {
  const crypto =
    globalThis.crypto ||
    (typeof window !== 'undefined' ? window.crypto : undefined)
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
    // Use Math.random() directly only as a last resort. `getSafeRandom` would
    // report through the error handler, whose logger calls back into this
    // function for the entry ID; this module must stay import-free.
    for (let i = 0; i < 16; i++) {
      buffer[i] = Math.floor(Math.random() * 256)
    }
  }

  // Set version to 4
  buffer[6] = ((buffer[6] ?? 0) & 0x0f) | 0x40
  // Set variant to RFC4122
  buffer[8] = ((buffer[8] ?? 0) & 0x3f) | 0x80

  return (
    (lut[buffer[0] ?? 0] ?? '') +
    (lut[buffer[1] ?? 0] ?? '') +
    (lut[buffer[2] ?? 0] ?? '') +
    (lut[buffer[3] ?? 0] ?? '') +
    '-' +
    (lut[buffer[4] ?? 0] ?? '') +
    (lut[buffer[5] ?? 0] ?? '') +
    '-' +
    (lut[buffer[6] ?? 0] ?? '') +
    (lut[buffer[7] ?? 0] ?? '') +
    '-' +
    (lut[buffer[8] ?? 0] ?? '') +
    (lut[buffer[9] ?? 0] ?? '') +
    '-' +
    (lut[buffer[10] ?? 0] ?? '') +
    (lut[buffer[11] ?? 0] ?? '') +
    (lut[buffer[12] ?? 0] ?? '') +
    (lut[buffer[13] ?? 0] ?? '') +
    (lut[buffer[14] ?? 0] ?? '') +
    (lut[buffer[15] ?? 0] ?? '')
  )
}
