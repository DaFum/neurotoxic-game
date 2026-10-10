import type { RandomFn } from '../../types/callbacks'
import { pickIndex } from '../selectionUtils'

// ─── Taglines ────────────────────────────────────────────────────────────

/**
 * Defines a static registry mapping brand alignments to pools of marketing taglines.
 *
 * @remarks
 * Taglines provide thematic flavor text for generated brand offers based on the
 * underlying brand's ethical alignment.
 */
const TAGLINES_BY_ALIGNMENT: Record<string, string[]> = {
  EVIL: [
    'Get toxic. Get paid.',
    'Burn brighter.',
    'No press is bad press.',
    'Loud, lethal, lucrative.'
  ],
  CORPORATE: [
    'Synergy meets sound.',
    'Scale your sound, scale your check.',
    'Partner with the leader.',
    'Where culture meets quarterly returns.'
  ],
  INDIE: [
    'Stay raw. Stay paid.',
    'No suits. No filler.',
    'Built in the basement.',
    'For the cassette generation.'
  ],
  SUSTAINABLE: [
    'Play loud. Tread light.',
    'Roots over reach.',
    'Music that grows back.',
    'Carbon-neutral mosh pits.'
  ],
  GOOD: [
    'Sing for the ones who can’t.',
    'Amplify hope.',
    'Music with a mission.'
  ],
  NEUTRAL: [
    'Reliable terms. Reliable payout.',
    'Standard partnership. Standard win.',
    'Tested. Trusted. Touring.'
  ]
}

/**
 * Selects a random thematic tagline appropriate for the specified brand alignment.
 *
 * @remarks
 * Falls back to the `NEUTRAL` alignment pool if the requested alignment is missing or empty.
 * Returns an empty string fallback if even the neutral pool is exhausted.
 *
 * @param alignment - The ethical alignment key of the brand requesting the tagline.
 * @param rng - The deterministic random number generator function for procedural selection.
 * @returns An object containing the localization key and a default english fallback string for the selected tagline.
 */
export const pickTagline = (
  alignment: string,
  rng: RandomFn
): { key: string; default: string } => {
  const pool = Object.hasOwn(TAGLINES_BY_ALIGNMENT, alignment)
    ? (TAGLINES_BY_ALIGNMENT[alignment] ?? [])
    : (TAGLINES_BY_ALIGNMENT.NEUTRAL ?? [])
  if (pool.length === 0) {
    return { key: 'economy:brandFlavor.taglines.NEUTRAL.0', default: '' }
  }
  const idx = pickIndex(pool, rng)
  return {
    key: `economy:brandFlavor.taglines.${Object.hasOwn(TAGLINES_BY_ALIGNMENT, alignment) ? alignment : 'NEUTRAL'}.${idx}`,
    default: pool[idx] ?? ''
  }
}
