/**
 * Shuffles an array in place with Fisher-Yates.
 *
 * @param items - Array to shuffle.
 * @param rng - Random number generator returning values in the `[0, 1)` range.
 * @param onMissingEntry - Optional sparse-entry handler. If it throws, the
 * shuffle stops with that error; otherwise the affected swap is skipped.
 * @returns The same array instance after shuffling.
 */
export const shuffleInPlace = <T>(
  items: T[],
  rng: () => number,
  onMissingEntry?: (i: number, j: number) => void
): T[] => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    if (!(i in items) || !(j in items)) {
      onMissingEntry?.(i, j)
      continue
    }
    const current = items[i] as T
    const swap = items[j] as T
    items[i] = swap
    items[j] = current
  }
  return items
}
