// Brand Offer Flavor Layer
//
// The static catalog in `src/data/brandDeals.ts` is the canonical source of
// truth for brand identity (id, name, description, alignment). This module
// layers procedural variety on top of an *offer instance* without ever
// mutating canonical fields: campaign codename, pitch rep, tagline, hook,
// variant tag, and small numeric variance on the offer terms.
import { secureRandom } from './crypto'
import type { RandomFn } from '../types/callbacks'
import type {
  BrandAlignment,
  BrandDeal,
  BrandDealOffer,
  BrandOffer,
  BrandOfferFlavor,
  BrandOfferRep,
  BrandOfferUrgency,
  BrandOfferVariantId,
  SocialEngineGameState
} from '../types/social'

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

const pick = <T>(arr: readonly T[], rng: RandomFn): T | undefined => {
  if (arr.length === 0) return undefined
  const idx = Math.max(
    0,
    Math.min(arr.length - 1, Math.floor(rng() * arr.length))
  )
  return arr[idx]
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

const buildRep = (alignment: string, rng: RandomFn): BrandOfferRep => {
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
    nameKey: `economy:brandFlavor.reps.${alignment}.${idx}.name`,
    nameDefault: entry.name,
    titleKey: `economy:brandFlavor.reps.${alignment}.${idx}.title`,
    titleDefault: entry.title
  }
}

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

const pickTagline = (
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
    key: `economy:brandFlavor.taglines.${alignment}.${idx}`,
    default: pool[idx] ?? ''
  }
}

// ─── Contextual Hooks ────────────────────────────────────────────────────

type HookId =
  | 'standard'
  | 'controversy_high'
  | 'trend_match'
  | 'famous'
  | 'desperate'
  | 'newcomer'

const HOOK_DEFAULTS: Record<HookId, string> = {
  standard: 'They reached out cold. The pitch deck looks polished.',
  controversy_high:
    'They want to monetize your scandal before the news cycle moves on.',
  trend_match:
    'The algorithm flagged you. They want in before everyone else does.',
  famous: 'Your name opens doors now. They came knocking.',
  desperate: 'They’re running out of options — and they need you tonight.',
  newcomer: 'A scout caught a clip. Small offer, but it’s a foot in the door.'
}

const pickContextualHook = (
  gameState: SocialEngineGameState,
  isStretched: boolean,
  totalFollowers: number,
  rng: RandomFn
): { key: string; default: string; urgency: BrandOfferUrgency } => {
  const social = gameState.social ?? {}
  const controversy =
    typeof social.controversyLevel === 'number' ? social.controversyLevel : 0
  const fame =
    typeof gameState.player?.fame === 'number' ? gameState.player.fame : 0

  let chosen: HookId
  let urgency: BrandOfferUrgency

  if (isStretched) {
    chosen = totalFollowers < 1500 ? 'newcomer' : 'desperate'
    urgency = 'high'
  } else if (controversy >= 50) {
    chosen = 'controversy_high'
    urgency = 'high'
  } else if (fame > 1000 || totalFollowers > 10000) {
    chosen = 'famous'
    urgency = 'low'
  } else if (social.trend && social.trend !== 'NEUTRAL') {
    chosen = 'trend_match'
    urgency = 'medium'
  } else {
    chosen = 'standard'
    urgency = rng() < 0.25 ? 'high' : 'medium'
  }

  return {
    key: `economy:brandFlavor.hooks.${chosen}`,
    default: HOOK_DEFAULTS[chosen],
    urgency
  }
}

// ─── Variants & Numeric Variance ─────────────────────────────────────────

type VariantMod = {
  upfrontMul: number
  perGigMul: number
  durationDelta: number
  forceDuration?: number
}

const VARIANT_MODS: Record<BrandOfferVariantId, VariantMod> = {
  standard: { upfrontMul: 1.0, perGigMul: 1.0, durationDelta: 0 },
  summer_edition: { upfrontMul: 1.0, perGigMul: 1.1, durationDelta: 0 },
  anniversary_push: { upfrontMul: 1.25, perGigMul: 1.0, durationDelta: -1 },
  stealth_drop: { upfrontMul: 0.85, perGigMul: 1.0, durationDelta: 0 },
  viral_comeback: { upfrontMul: 1.0, perGigMul: 1.5, durationDelta: 0 },
  desperate: { upfrontMul: 0.8, perGigMul: 1.0, durationDelta: 0 },
  probe: { upfrontMul: 0.5, perGigMul: 1.0, durationDelta: 0, forceDuration: 1 }
}

const VARIANT_LABELS: Record<BrandOfferVariantId, string> = {
  standard: 'Standard Deal',
  summer_edition: 'Summer Edition',
  anniversary_push: 'Anniversary Push',
  stealth_drop: 'Stealth Drop',
  viral_comeback: 'Viral Comeback',
  desperate: 'Last-Minute Pitch',
  probe: 'Probe Sponsoring'
}

const VARIANTS_BY_ALIGNMENT: Record<string, BrandOfferVariantId[]> = {
  EVIL: ['summer_edition', 'viral_comeback', 'standard'],
  CORPORATE: ['anniversary_push', 'standard'],
  INDIE: ['stealth_drop', 'viral_comeback', 'standard'],
  SUSTAINABLE: ['summer_edition', 'standard'],
  GOOD: ['anniversary_push', 'standard'],
  NEUTRAL: ['standard']
}

const pickVariantId = (
  alignment: string,
  isStretched: boolean,
  tier: 0 | 1 | 2,
  rng: RandomFn
): BrandOfferVariantId => {
  if (tier === 2) return 'probe'
  if (isStretched) return 'desperate'
  const fallback: BrandOfferVariantId[] = ['standard']
  const pool = Object.hasOwn(VARIANTS_BY_ALIGNMENT, alignment)
    ? (VARIANTS_BY_ALIGNMENT[alignment] ?? fallback)
    : fallback
  // Bias towards 'standard' (~50%) so flavored variants stay special.
  if (rng() < 0.5) return 'standard'
  const idx = Math.max(
    0,
    Math.min(pool.length - 1, Math.floor(rng() * pool.length))
  )
  return pool[idx] ?? 'standard'
}

const roundTo = (value: number, step: number): number =>
  Math.round(value / step) * step

const applyOfferVariance = (
  offer: BrandDealOffer,
  rng: RandomFn,
  mods: VariantMod
): BrandDealOffer => {
  const upfrontJitter = 0.85 + rng() * 0.3 // 0.85..1.15
  const newUpfront = Math.max(
    50,
    roundTo(offer.upfront * upfrontJitter * mods.upfrontMul, 50)
  )

  const hasPerGig =
    typeof offer.perGig === 'number' && Number.isFinite(offer.perGig)
  const newPerGig = hasPerGig
    ? Math.max(
        5,
        roundTo(
          (offer.perGig as number) * (0.9 + rng() * 0.2) * mods.perGigMul,
          5
        )
      )
    : undefined

  const durationJitter = Math.floor(rng() * 4) - 1 // -1..+2
  const newDuration =
    mods.forceDuration !== undefined
      ? mods.forceDuration
      : Math.max(1, offer.duration + durationJitter + mods.durationDelta)

  const result: BrandDealOffer = {
    ...offer,
    upfront: newUpfront,
    duration: newDuration
  }
  if (newPerGig !== undefined) {
    result.perGig = newPerGig
  }
  return result
}

// ─── Public API ──────────────────────────────────────────────────────────

export interface BuildBrandOfferContext {
  tier: 0 | 1 | 2
  isStretched: boolean
  gameState: SocialEngineGameState
  rng: RandomFn
  totalFollowers: number
}

export const buildBrandOffer = (
  deal: BrandDeal,
  ctx: BuildBrandOfferContext
): BrandOffer => {
  const alignment = String(deal.alignment) as BrandAlignment

  const variant = pickVariantId(alignment, ctx.isStretched, ctx.tier, ctx.rng)
  const mods = VARIANT_MODS[variant]
  const variedOffer = applyOfferVariance(deal.offer, ctx.rng, mods)

  const campaignCodename = generateCampaignCodename(alignment, ctx.rng)
  const rep = buildRep(alignment, ctx.rng)
  const tagline = pickTagline(alignment, ctx.rng)
  const hook = pickContextualHook(
    ctx.gameState,
    ctx.isStretched,
    ctx.totalFollowers,
    ctx.rng
  )

  const flavor: BrandOfferFlavor = {
    campaignCodename,
    rep,
    taglineKey: tagline.key,
    taglineDefault: tagline.default,
    hookKey: hook.key,
    hookDefault: hook.default,
    variant,
    variantLabelKey: `economy:brandFlavor.variant.${variant}`,
    variantLabelDefault: VARIANT_LABELS[variant],
    urgency: hook.urgency,
    isStretched: ctx.isStretched
  }

  return {
    ...deal,
    offer: variedOffer,
    flavor
  }
}
