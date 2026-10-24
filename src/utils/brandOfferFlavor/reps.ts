import type { RandomFn } from '../../types/callbacks'
import { pickIndex } from '../selectionUtils'
import type { BrandOfferRep } from '../../types/social'

/**
 * Defines the structure for a brand representative's flavor profile.
 */
type RepEntry = { name: string; title: string }

/**
 * A dictionary mapping brand alignment categories to predefined lists of representative names and titles.
 */
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

/**
 * Retrieves the pool of brand representatives corresponding to a specific brand alignment.
 *
 * @param alignment - The alignment identifier to query (e.g., 'EVIL', 'CORPORATE').
 * @returns An array of representative entries for the specified alignment, or the neutral fallback pool if none match.
 */
const getRepPool = (alignment: string): RepEntry[] => {
  if (!Object.hasOwn(REPS_BY_ALIGNMENT, alignment)) {
    return REPS_BY_ALIGNMENT.NEUTRAL ?? []
  }
  return REPS_BY_ALIGNMENT[alignment] ?? []
}

/**
 * Constructs a fully localized brand offer representative profile, using uniform random selection based on brand alignment.
 *
 * @remarks
 * This function handles resolving dynamic translation keys for the representative's name and title, relying on localized economy data. If the specified alignment has no entries, it gracefully defaults to the `NEUTRAL` pool and guarantees a fallback title.
 *
 * @param alignment - The brand's alignment identifier.
 * @param rng - The random number generator callback used to pick a representative.
 * @returns A brand offer representative object containing localized keys and default fallbacks for name and title.
 */
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
  const idx = pickIndex(pool, rng)
  const entry = pool[idx] ?? fallback
  return {
    nameKey: `economy:brandFlavor.reps.${Object.hasOwn(REPS_BY_ALIGNMENT, alignment) ? alignment : 'NEUTRAL'}.${idx}.name`,
    nameDefault: entry.name,
    titleKey: `economy:brandFlavor.reps.${Object.hasOwn(REPS_BY_ALIGNMENT, alignment) ? alignment : 'NEUTRAL'}.${idx}.title`,
    titleDefault: entry.title
  }
}
