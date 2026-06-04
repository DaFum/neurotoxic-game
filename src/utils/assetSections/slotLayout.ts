/**
 * Formats a normalized slot coordinate or size as a compact percentage string.
 */
export const formatSlotZonePercent = (value: number): string =>
  `${Number(value.toFixed(4))}%`
