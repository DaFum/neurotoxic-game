import { rectsIntersect, type Rect } from '../chatterPlacement'

/** One map node's visible label boxes plus how much it matters. */
export interface MapLabelEntry {
  id: string
  /** Lower wins: 0 focused/confirming, 1 reachable destination, 2 current, 3 other. */
  priority: number
  rects: readonly Rect[]
}

/**
 * Chooses which map-node labels to hide so no two visible labels overlap.
 *
 * @param entries - Labels with their measured boxes and priority.
 * @returns Ids of the labels to hide. Entries are considered in priority order
 * (ties keep input order); an entry is hidden when any of its boxes overlaps a
 * box that was already kept.
 */
export const pickHiddenMapLabels = (
  entries: readonly MapLabelEntry[]
): Set<string> => {
  const ordered = entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => a.entry.priority - b.entry.priority || a.index - b.index)
  const hidden = new Set<string>()
  const kept: Rect[] = []
  for (const { entry } of ordered) {
    const collides = entry.rects.some(rect =>
      kept.some(other => rectsIntersect(rect, other))
    )
    if (collides) {
      hidden.add(entry.id)
    } else {
      kept.push(...entry.rects)
    }
  }
  return hidden
}
