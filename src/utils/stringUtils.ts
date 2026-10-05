/**
 * Calculates a signed 32-bit integer hash from a string.
 * Uses a common simple hash algorithm: `hash = (hash * 31) + charCode`.
 * This provides a stable hash for a given string, useful for texture picking or seeding.
 *
 * @param str - The string to hash
 * @returns A signed 32-bit integer hash. Callers that need an unsigned value
 * use `hash31(str) >>> 0`, which is bit-identical to accumulating with `>>> 0`.
 */
export const hash31 = (str: string): number => {
  let hash = 0
  for (let i = 0, len = str.length; i < len; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0
  }
  return hash
}

/** Standard 32-bit FNV-1a offset basis. */
const FNV1A_32_OFFSET_BASIS = 0x811c9dc5

/**
 * 32-bit FNV-1a hash of a string's UTF-16 code units.
 *
 * @param str - The string to hash.
 * @param basis - Offset basis. Defaults to the standard FNV basis; pass a seed
 * to get a seeded variant.
 * @returns An unsigned 32-bit hash.
 */
export const fnv1a32 = (
  str: string,
  basis: number = FNV1A_32_OFFSET_BASIS
): number => {
  let hash = basis >>> 0
  for (let i = 0, len = str.length; i < len; i++) {
    hash = Math.imul(hash ^ str.charCodeAt(i), 0x01000193) >>> 0
  }
  return hash
}
