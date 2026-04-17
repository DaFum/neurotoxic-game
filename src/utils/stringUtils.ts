// TODO: Review this file
/**
 * Calculates a 32-bit integer hash from a string.
 * Uses a common simple hash algorithm: `hash = (hash * 31) + charCode`.
 * This provides a stable hash for a given string, useful for texture picking or seeding.
 *
 * @param str - The string to hash
 * @returns A 32-bit integer hash
 */
export const hashString = (str: string): number => {
  let hash = 0
  for (let i = 0, len = str.length; i < len; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0
  }
  return hash
}
