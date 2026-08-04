/**
 * Normalizes an unknown setlist payload to an array of objects with an 'id' property.
 *
 * @param setlist - The setlist payload to normalize.
 * @returns Normalized setlist, without entries whose id is not a non-empty string.
 *
 * @remarks
 * An empty id resolves to no song but still counts toward `setlist.length`, which
 * the Band HQ practice flow reads — so it would let practice start on an
 * effectively empty setlist. Catalog membership is checked at the load boundary
 * by `sanitizeSetlist`, which owns validating untrusted persisted ids.
 */
export const normalizeSetlistForSave = (
  setlist: unknown
): Array<{ id: string }> => {
  if (!Array.isArray(setlist)) return []

  const result: { id: string }[] = []
  for (const song of setlist) {
    if (typeof song === 'string') {
      if (song) result.push({ id: song })
    } else if (
      song &&
      typeof song === 'object' &&
      typeof (song as { id?: unknown }).id === 'string'
    ) {
      const id = (song as { id: string }).id
      if (id) result.push({ id })
    }
  }
  return result
}
