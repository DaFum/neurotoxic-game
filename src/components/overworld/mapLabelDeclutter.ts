import { rectsIntersect, type Rect } from '../chatterPlacement'

/** One map node's visible label boxes plus how much it matters. */
export interface MapLabelEntry {
  id: string
  /** Lower wins: 0 focused/confirming, 1 reachable destination, 2 current, 3 other. */
  priority: number
  candidates: readonly {
    anchor: 'below' | 'above'
    gap: number
    rects: readonly Rect[]
  }[]
}

/** Keeps labels below their node, tries above, then hides blocked labels. */
export const pickMapLabelPlacements = (
  entries: readonly MapLabelEntry[],
  {
    bounds,
    obstacles = []
  }: {
    bounds?: Rect
    obstacles?: readonly { ownerId: string; rect: Rect }[]
  } = {}
): Map<string, { anchor: 'below' | 'above'; gap: number } | null> => {
  const ordered = entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => a.entry.priority - b.entry.priority || a.index - b.index)
  const placements = new Map<
    string,
    { anchor: 'below' | 'above'; gap: number } | null
  >()
  const kept: Rect[] = []
  for (const { entry } of ordered) {
    placements.set(entry.id, null)
    for (const { anchor, gap, rects } of entry.candidates) {
      if (!rects?.length) continue
      const blocked = rects.some(
        rect =>
          (bounds &&
            (rect.left < bounds.left ||
              rect.right > bounds.right ||
              rect.top < bounds.top ||
              rect.bottom > bounds.bottom)) ||
          kept.some(other => rectsIntersect(rect, other)) ||
          obstacles.some(
            obstacle =>
              obstacle.ownerId !== entry.id &&
              rectsIntersect(rect, obstacle.rect)
          )
      )
      if (blocked) continue
      placements.set(entry.id, { anchor, gap })
      kept.push(...rects)
      break
    }
  }
  return placements
}
