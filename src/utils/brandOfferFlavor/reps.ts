import type { RandomFn } from '../../types/callbacks'
import type { BrandOfferRep } from '../../types/social'

type RepEntry = { name: string; title: string }

const REPS_BY_ALIGNMENT: Record<string, RepEntry[]> = {
  EVIL: [
    { name: 'Vex Halberd', title: 'Brand Strategist' },
    { name: 'Mira Krell', title: 'Director of Edge' },
    { name: 'Krash Volkov', title: 'VP of Vibes' }
  ],
  CORPORATE: [
    { name: 'Hans Müller', title: 'VP Partnerships' },
    { name: 'Eleanor Vance', title: 'Senior Brand Director' },
    { name: 'Marcus Reed', title: 'Head of Synergy' }
  ],
  INDIE: [
    { name: 'kai', title: 'runs the zine' },
    { name: 'jess r.', title: 'A&R, kinda' },
    { name: 'Oli', title: 'tape label owner' }
  ],
  SUSTAINABLE: [
    { name: 'Sage Lindgren', title: 'Impact Lead' },
    { name: 'Robin Fern', title: 'Community Steward' },
    { name: 'Yuki Tanaka', title: 'Sustainability Officer' }
  ],
  GOOD: [
    { name: 'Sister Anya', title: 'Outreach Coordinator' },
    { name: 'Dr. Idris Bello', title: 'Foundation Director' },
    { name: 'Aurora Voss', title: 'Programs Officer' }
  ],
  NEUTRAL: [
    { name: 'Pat Quinn', title: 'Account Manager' },
    { name: 'Sam Otieno', title: 'Partnership Lead' },
    { name: 'Lin Zhao', title: 'Regional Director' }
  ]
}

const getRepPool = (alignment: string): RepEntry[] => {
  if (!Object.hasOwn(REPS_BY_ALIGNMENT, alignment)) {
    return REPS_BY_ALIGNMENT.NEUTRAL ?? []
  }
  return REPS_BY_ALIGNMENT[alignment] ?? []
}

export const buildRep = (alignment: string, rng: RandomFn): BrandOfferRep => {
  const pool = getRepPool(alignment)
  const fallback: RepEntry = { name: 'Anon Rep', title: 'Brand Contact' }
  if (pool.length === 0) {
    return {
      nameKey: `economy:brandFlavor.reps.NEUTRAL.0.name`,
      nameDefault: fallback.name,
      titleKey: `economy:brandFlavor.reps.NEUTRAL.0.title`,
      titleDefault: fallback.title
    }
  }
  const idx = Math.max(
    0,
    Math.min(pool.length - 1, Math.floor(rng() * pool.length))
  )
  const entry = pool[idx] ?? fallback
  return {
    nameKey: `economy:brandFlavor.reps.${Object.hasOwn(REPS_BY_ALIGNMENT, alignment) ? alignment : 'NEUTRAL'}.${idx}.name`,
    nameDefault: entry.name,
    titleKey: `economy:brandFlavor.reps.${Object.hasOwn(REPS_BY_ALIGNMENT, alignment) ? alignment : 'NEUTRAL'}.${idx}.title`,
    titleDefault: entry.title
  }
}
