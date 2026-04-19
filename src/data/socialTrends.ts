// TODO: Review this file
/**
 * Allowed Social Media Trends
 * @constant {string[]}
 */
export const ALLOWED_TRENDS = [
  'NEUTRAL',
  'DRAMA',
  'TECH',
  'MUSIC',
  'WHOLESOME'
] as const

export const ALLOWED_TRENDS_SET = new Set(ALLOWED_TRENDS)
