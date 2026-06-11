import type { RandomFn } from '../../types/callbacks'

// ─── Taglines ────────────────────────────────────────────────────────────

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
  const idx = Math.max(
    0,
    Math.min(pool.length - 1, Math.floor(rng() * pool.length))
  )
  return {
    key: `economy:brandFlavor.taglines.${Object.hasOwn(TAGLINES_BY_ALIGNMENT, alignment) ? alignment : 'NEUTRAL'}.${idx}`,
    default: pool[idx] ?? ''
  }
}
