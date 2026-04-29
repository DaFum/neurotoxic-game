import { CHARACTERS } from '../data/characters'
import { logger } from '../utils/logger'
import { getSafeUUID } from '../utils/crypto'
import type {
  GameState,
  BandMember,
  BandState,
  ToastPayload
} from '../types/game'

type TraitDef = {
  id: string
  name?: string
  desc?: string
  effect?: string
  unlockHint?: string
  [key: string]: unknown
}

/**
 * Checks if a specific member has a trait.
 * @param {object} member - The band member object.
 * @param {string} traitId - The ID of the trait to check.
 * @returns {boolean} True if the member has the trait.
 */
export const hasTrait = (member: unknown, traitId: string): boolean => {
  if (
    !member ||
    typeof member !== 'object' ||
    !Object.hasOwn(member, 'traits') ||
    !(member as Record<string, unknown>).traits ||
    typeof (member as Record<string, unknown>).traits !== 'object' ||
    Array.isArray((member as Record<string, unknown>).traits)
  ) {
    return false
  }
  return Object.hasOwn(
    (member as Record<string, unknown>).traits as Record<string, unknown>,
    traitId
  )
}

/**
 * Checks if any member in the band has a specific trait.
 * @param {object} bandState - The band state object (containing members array).
 * @param {string} traitId - The ID of the trait to check.
 * @returns {boolean} True if any member has the trait.
 */
export const bandHasTrait = (bandState: unknown, traitId: string): boolean => {
  if (
    !bandState ||
    typeof bandState !== 'object' ||
    !Object.hasOwn(bandState, 'members') ||
    !Array.isArray((bandState as Record<string, unknown>).members)
  ) {
    return false
  }
  const members = (bandState as Record<string, unknown>).members as unknown[]
  for (let i = 0; i < members.length; i++) {
    if (hasTrait(members[i], traitId)) {
      return true
    }
  }
  return false
}

/**
 * Pre-calculated lookup for character trait definitions.
 * Maps: charKey -> { traitId -> traitDef }
 * Provides O(1) lookup for trait definitions instead of O(N) searching.
 */
const TRAIT_DEFS_BY_CHAR: Record<
  string,
  Record<string, TraitDef>
> = Object.create(null)
/**
 * Flat lookup for all trait definitions by traitId.
 * Maps: traitId -> traitDef
 */
const TRAIT_DEFS_BY_ID: Map<string, TraitDef> = new Map()

for (const charKey of Object.keys(CHARACTERS) as Array<
  keyof typeof CHARACTERS
>) {
  const char = CHARACTERS[charKey]
  const traits = (char.traits ?? []) as TraitDef[]
  TRAIT_DEFS_BY_CHAR[charKey as string] = Object.create(null)
  const bucket = TRAIT_DEFS_BY_CHAR[charKey as string] as Record<
    string,
    TraitDef
  >
  for (const trait of traits) {
    const t = trait as TraitDef
    bucket[t.id] = t
    if (TRAIT_DEFS_BY_ID.has(t.id)) {
      logger.warn(
        'traitUtils',
        `Duplicate trait ID found during initialization: ${t.id}`
      )
    }
    TRAIT_DEFS_BY_ID.set(t.id, t)
  }
}

/**
 * Helper to fetch a generic trait (e.g., from CLINIC definitions)
 * @param {string} traitId
 * @returns {object|null}
 */
export const getTraitById = (traitId: string): TraitDef | null => {
  if (!traitId) return null
  return TRAIT_DEFS_BY_ID.get(traitId) ?? null
}

/**
 * Normalizes a trait map into a null-prototype object.
 * Applies current/hardening logic for legacy shapes.
 * @param {object|Array} traits - The raw traits to normalize.
 * @returns {object} A null-prototype object with normalized trait data.
 */
export const normalizeTraitMap = (
  traits: unknown
): Record<string, TraitDef> => {
  if (Array.isArray(traits)) {
    const traitsMap: Record<string, TraitDef> = Object.create(null)
    for (const t of traits) {
      if (t && typeof t === 'object' && Object.hasOwn(t, 'id')) {
        const td = t as TraitDef
        if (td.id) traitsMap[td.id] = td
      }
    }
    return traitsMap
  }
  if (traits && typeof traits === 'object') {
    const traitsMap: Record<string, TraitDef> = Object.create(null)
    for (const key in traits as Record<string, unknown>) {
      if (!Object.hasOwn(traits as Record<string, unknown>, key)) continue
      const t = (traits as Record<string, unknown>)[key]
      if (t && typeof t === 'object' && Object.hasOwn(t, 'id')) {
        const td = t as TraitDef
        if (td.id) traitsMap[td.id] = td
      }
    }
    return traitsMap
  }
  return Object.create(null)
}

/**
 * Applies unlocked traits to the band state immutably and generates toasts.
 * Handles multiple unlocks per member and avoids duplicates.
 *
 * @param {object} currentState - The current full game state (must contain band and toasts).
 * @param {Array} unlocks - Array of { memberId, traitId } objects.
 * @returns {object} An object containing the updated { band, toasts } to be merged into state.
 */
export const applyTraitUnlocks = (
  currentState: { band?: BandState; toasts?: ToastPayload[] } | GameState,
  unlocks: Array<{ memberId?: string; traitId?: string }>
): { band: BandState; toasts: ToastPayload[] } => {
  if (!unlocks || unlocks.length === 0) {
    return {
      band: currentState.band ?? ({} as BandState),
      toasts: (currentState.toasts ?? []) as ToastPayload[]
    }
  }

  // Create shallow copy of band and members for immutable update
  const members: BandMember[] = currentState.band?.members ?? []
  type MemberWithTraits = BandMember & { traits: Record<string, TraitDef> }
  const nextMembers: MemberWithTraits[] = members.map(m => ({
    ...m,
    traits: normalizeTraitMap(m.traits)
  }))
  const nextBand: BandState & { members: MemberWithTraits[] } = {
    ...(currentState.band ?? ({} as BandState)),
    members: nextMembers
  }
  const nextToasts: ToastPayload[] = [...(currentState.toasts ?? [])]

  // Create a map for O(1) member lookup by ID and lowercase name
  const memberLookup = new Map<string, number>()
  nextBand.members.forEach((m, idx) => {
    if (m.id && !memberLookup.has(m.id)) {
      memberLookup.set(m.id, idx)
    }
    if (m.name && typeof m.name === 'string') {
      const lowerName = m.name.toLowerCase()
      if (!memberLookup.has(lowerName)) {
        memberLookup.set(lowerName, idx)
      }
    }
  })

  for (const u of unlocks) {
    if (!u || typeof u.memberId !== 'string' || typeof u.traitId !== 'string')
      continue

    // Find member by ID or case-insensitive name
    let memberIndex = memberLookup.get(u.memberId)
    if (memberIndex === undefined) {
      memberIndex = memberLookup.get(u.memberId.toLowerCase())
    }

    if (memberIndex === undefined) continue

    const member = nextBand.members[memberIndex]
    if (!member) continue

    // Check if trait is already unlocked
    if (Object.hasOwn(member.traits, u.traitId)) continue

    // Find trait definition using the member's name to resolve static character data
    const charKey =
      typeof member.name === 'string' && member.name
        ? (member.name.toUpperCase() as keyof typeof CHARACTERS)
        : null
    const traitDef = charKey
      ? (TRAIT_DEFS_BY_CHAR[charKey as string] ?? {})[u.traitId]
      : undefined

    if (!traitDef) continue

    // Apply trait
    member.traits[u.traitId] = traitDef

    // Add toast with a unique ID
    nextToasts.push({
      id: `trait-${getSafeUUID()}`,
      messageKey: 'ui:shop.messages.traitUnlocked',
      options: { traitName: traitDef.name, memberId: u.memberId },
      message: `Unlocked Trait: ${traitDef.name} (${u.memberId})`,
      type: 'success'
    })
  }

  return {
    band: nextBand,
    toasts: nextToasts
  }
}
