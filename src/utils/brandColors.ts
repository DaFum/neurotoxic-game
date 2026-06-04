/**
 * Canonical hex fallback values for the Neurotoxic brand color tokens.
 * Single source of truth — used when `getComputedStyle` is unavailable
 * (SSR/tests) or the CSS variable cannot be resolved. Keep in sync with
 * `--color-*` definitions in `src/index.css`.
 */
export const BRAND_COLOR_HEX = Object.freeze({
  'void-black': '#0a0a0a',
  'toxic-green': '#00ff41',
  'star-white': '#ffffff',
  'ash-gray': '#888888',
  'warning-yellow': '#ffcc00',
  'electric-blue': '#3b82f6',
  'rhythm-guitar': '#ff0041',
  'rhythm-drums': '#00ff41',
  'rhythm-bass': '#0041ff',
  'blood-red': '#cc0000',
  'roadie-grass': '#1a4d1a',
  'cosmic-purple': '#6600cc',
  'void-purple': '#ff00ff',
  'roadie-venue-blue': '#0044cc'
}) satisfies Readonly<Record<string, string>>

/**
 * Matches supported CSS hex color literals used by token fallback validation.
 */
export const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i
