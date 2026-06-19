/**
 * Formats an already-scaled slot coordinate or size as a compact CSS percentage.
 *
 * @param value - Percent value, typically in the 0..100 range, not a 0..1 ratio.
 * @returns CSS percentage text with trailing zeros removed.
 */
export const formatSlotZonePercent = (value: number): string =>
  `${Number(value.toFixed(4))}%`

/**
 * Calculates and formats the CSS positioning properties for a slot zone.
 *
 * @param zone - The zone rectangle containing normalised coordinates (x, y) and dimensions (w, h).
 * @returns An object containing `left`, `top`, `width`, and `height` properties formatted as CSS percentages.
 */
export const getSlotZonePositionStyle = (zone?: {
  x: number
  y: number
  w: number
  h: number
}) => {
  const { x = 0, y = 0, w = 0, h = 0 } = zone || {}
  return {
    left: formatSlotZonePercent((x - w / 2) * 100),
    top: formatSlotZonePercent((y - h / 2) * 100),
    width: formatSlotZonePercent(w * 100),
    height: formatSlotZonePercent(h * 100)
  }
}
