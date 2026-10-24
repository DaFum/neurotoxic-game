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

const GAP_PX = 8

/**
 * Proposes anchors that sit directly above or below each obstacle. A wide
 * obstacle (a full-width header) can block every fixed anchor while a clear band
 * remains between it and the next obstacle; the fixed anchors cannot see it.
 *
 * @param obstacles - Rectangles the box must never cover.
 * @param layout - `lefts` are the horizontal positions to try, `size` the box,
 * `viewport` the screen, `margin` the minimum distance to its edges, and
 * `preferredTop` the vertical position the box would like to keep.
 * @returns Anchors inside the margins, closest to `preferredTop` first. Pass
 * them after the fixed anchors so the usual positions still win.
 */
export const gapAnchors = (
  obstacles: readonly Rect[],
  layout: {
    lefts: readonly number[]
    size: { w: number; h: number }
    viewport: { vw: number; vh: number }
    margin: number
    preferredTop: number
  }
): Anchor[] => {
  const { lefts, size, viewport, margin, preferredTop } = layout
  const minTop = margin
  const maxTop = viewport.vh - size.h - margin
  const tops = new Set<number>()
  for (const o of obstacles) {
    for (const top of [o.bottom + GAP_PX, o.top - size.h - GAP_PX]) {
      const rounded = Math.round(top)
      if (rounded >= minTop && rounded <= maxTop) tops.add(rounded)
    }
  }
  const sorted = [...tops].sort(
    (a, b) => Math.abs(a - preferredTop) - Math.abs(b - preferredTop)
  )
  const anchors: Anchor[] = []
  for (const top of sorted) {
    for (const left of lefts) anchors.push({ left, top })
  }
  return anchors
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
