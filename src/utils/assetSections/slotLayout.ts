/**
 * Formats an already-scaled slot coordinate or size as a compact CSS percentage.
 *
 * @param value - Percent value, typically in the 0..100 range, not a 0..1 ratio.
 */
export const formatSlotZonePercent = (value: number): string =>
  `${Number(value.toFixed(4))}%`
