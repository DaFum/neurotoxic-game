/**
 * Allowed Social Media Trends
 * @constant {readonly ['NEUTRAL', 'DRAMA', 'TECH', 'MUSIC', 'WHOLESOME']}
 */
export const ALLOWED_TRENDS = [
  'NEUTRAL',
  'DRAMA',
  'TECH',
  'MUSIC',
  'WHOLESOME'
] as const

/** Set representation of ALLOWED_TRENDS for O(1) membership checks. */
export const ALLOWED_TRENDS_SET = new Set(ALLOWED_TRENDS)
