/** Axis-aligned screen rectangle. */
export type Rect = { left: number; top: number; right: number; bottom: number }
/** Top-left anchor a chatter box can be moved to. */
export type Anchor = { left: number; top: number }

/** Where the chatter box goes: its CSS default, a fallback anchor, or nowhere. */
export type ChatterPlacement =
  | { kind: 'default' }
  | { kind: 'anchor'; anchor: Anchor }
  | { kind: 'suppress' }

/**
 * Tests whether two rectangles overlap (touching edges do not count).
 *
 * @param a - First rectangle.
 * @param b - Second rectangle.
 * @returns `true` when the interiors intersect.
 */
export const rectsIntersect = (a: Rect, b: Rect): boolean =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top

const hitsAny = (rect: Rect, obstacles: readonly Rect[]): boolean => {
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i]
    if (o && rectsIntersect(rect, o)) return true
  }
  return false
}

/**
 * Decides where an optional chatter box may sit.
 *
 * @param defaultRect - The box at its CSS default position.
 * @param anchors - Fallback anchors, preferred first.
 * @param obstacles - Rectangles the box must never cover.
 * @param options - `suppressWhenBlocked` hides the box when no spot is clear.
 * @returns The default when it is clear, else the first clear anchor. When
 * nothing is clear: `suppress` if allowed (chatter is optional, so on a phone it
 * is hidden instead of covering time-critical UI), otherwise the default, which
 * is what larger screens always did.
 */
export const decideChatterPlacement = (
  defaultRect: Rect,
  anchors: readonly Anchor[],
  obstacles: readonly Rect[],
  options: { suppressWhenBlocked: boolean }
): ChatterPlacement => {
  if (!hitsAny(defaultRect, obstacles)) return { kind: 'default' }
  const w = defaultRect.right - defaultRect.left
  const h = defaultRect.bottom - defaultRect.top
  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i]
    if (!anchor) continue
    const candidate = {
      left: anchor.left,
      top: anchor.top,
      right: anchor.left + w,
      bottom: anchor.top + h
    }
    if (!hitsAny(candidate, obstacles)) return { kind: 'anchor', anchor }
  }
  return options.suppressWhenBlocked
    ? { kind: 'suppress' }
    : { kind: 'default' }
}
