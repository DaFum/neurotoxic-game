/**
 * Single-pass "top 3 by score" selection shared by social post and brand-offer
 * generation. Avoids the allocation overhead of `sort()` on hot paths by
 * tracking the three highest-scoring items in one linear scan.
 *
 * @param items - Candidate items; null/undefined entries are skipped.
 * @param scoreOf - Maps a non-null item to its numeric score (higher wins).
 * @returns The top three items in descending score order, padded with `null`
 *   when fewer than three scored items exist. Ties resolve to the
 *   earlier-encountered item (strict `>` comparison).
 */
export const selectTop3ByScore = <T>(
  items: readonly (T | null | undefined)[],
  scoreOf: (item: T) => number
): [T | null, T | null, T | null] => {
  let top1: T | null = null
  let top2: T | null = null
  let top3: T | null = null
  let score1 = -Infinity
  let score2 = -Infinity
  let score3 = -Infinity

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item) continue

    const score = scoreOf(item)
    if (score > score1) {
      top3 = top2
      score3 = score2
      top2 = top1
      score2 = score1
      top1 = item
      score1 = score
    } else if (score > score2) {
      top3 = top2
      score3 = score2
      top2 = item
      score2 = score
    } else if (score > score3) {
      top3 = item
      score3 = score
    }
  }

  return [top1, top2, top3]
}
