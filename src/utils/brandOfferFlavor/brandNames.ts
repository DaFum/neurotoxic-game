import { secureRandom } from '../crypto'
import type { RandomFn } from '../../types/callbacks'
import { pick } from './helpers'


type BrandNameParts = {
  prefixes: string[]
  suffixes: string[]
  types?: string[]
  noSpace?: boolean
}

const BRAND_NAME_PARTS: Record<string, BrandNameParts> = {
  EVIL: {
    prefixes: [
      'Toxic',
      'Neon',
      'Quantum',
      'Hyper',
      'Radioactive',
      'Cyber',
      'Acid',
      'Vile'
    ],
    suffixes: [
      'Rush',
      'Blast',
      'Surge',
      'Core',
      'Sludge',
      'Venom',
      'Waste',
      'X'
    ],
    types: ['Energy', 'Systems', 'Labs', 'Corp', 'Chemicals']
  },
  CORPORATE: {
    prefixes: [
      'Global',
      'United',
      'Apex',
      'Summit',
      'Prime',
      'Omni',
      'Macro',
      'Elite'
    ],
    suffixes: [
      'Dynamics',
      'Solutions',
      'Holdings',
      'Ventures',
      'Capital',
      'Industries',
      'Group'
    ]
  },
  INDIE: {
    prefixes: [
      'Void',
      'Abyss',
      'Shadow',
      'Underground',
      'Basement',
      'Garage',
      'Lo-Fi',
      'Raw'
    ],
    suffixes: [
      'Records',
      'Audio',
      'Tapes',
      'Sound',
      'Collective',
      'Zine',
      'Press'
    ]
  },
  SUSTAINABLE: {
    prefixes: [
      'Green',
      'Eco',
      'Pure',
      'Nature',
      'Gaia',
      'Solar',
      'Bio',
      'Earth'
    ],
    suffixes: ['Path', 'Roots', 'Harvest', 'Bloom', 'Cycle', 'Life', 'Leaf'],
    types: ['Snacks', 'Wear', 'Gear', 'Organics', 'Co-op'],
    noSpace: true
  },
  GOOD: {
    prefixes: ['Noble', 'Brave', 'Valiant', 'Bright', 'Radiant'],
    suffixes: ['Hearts', 'Souls', 'Shield', 'Light', 'Path'],
    types: ['Apparel', 'Charity', 'Fund', 'Trust', 'Foundation']
  },
  NEUTRAL: {
    prefixes: ['Standard', 'General', 'Prime', 'Apex', 'Solid'],
    suffixes: ['Goods', 'Works', 'Tech', 'Systems', 'Solutions']
  }
}

/**
 * Safe own-property lookup against the alignment map. Guards against
 * prototype keys such as `__proto__` / `toString` resolving to inherited
 * function values which would crash `pick(parts.prefixes)`.
 */
const getBrandParts = (alignment: string): BrandNameParts | null => {
  if (!Object.hasOwn(BRAND_NAME_PARTS, alignment)) return null
  const parts = BRAND_NAME_PARTS[alignment]
  return parts ?? null
}

/**
 * Generates a dynamic brand-style name (alignment-flavored). Used by both
 * rival band naming and brand-offer campaign codenames. Falls back to
 * `baseName` for unknown / hostile alignment strings.
 */
export const generateBrandName = (
  baseName: string,
  alignment: string,
  rng: RandomFn = secureRandom
): string => {
  const parts = getBrandParts(alignment)
  if (!parts) return baseName

  const prefix = pick(parts.prefixes, rng) ?? ''
  const suffix = pick(parts.suffixes, rng) ?? ''
  const base = parts.noSpace ? `${prefix}${suffix}` : `${prefix} ${suffix}`

  if (parts.types) {
    const typeWord = pick(parts.types, rng) ?? ''
    return typeWord ? `${base} ${typeWord}` : base
  }

  return base
}

/**
 * Codename only — used as the *campaign* label on an offer, NEVER replacing
 * the canonical `deal.name`.
 */
export const generateCampaignCodename = (
  alignment: string,
  rng: RandomFn
): string => generateBrandName('Campaign', alignment, rng)

// ─── Pitch Reps ──────────────────────────────────────────────────────────
