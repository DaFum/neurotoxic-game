import { CHARACTERS } from '../data/characters'
import { logger } from '../utils/logger'
import { finiteNumberOr } from './finiteNumber'
import { clampBandStress, clampMemberStamina } from './gameState/clamps'
import type { GameState, BandMember, BandState, ToastPayload } from '../types'
import { buildDeterministicToastId } from '../context/reducers/toastSanitizers'

type TraitDef = {
  id: string
  name?: string
  desc?: string
  effect?: string
  unlockHint?: string
  exclusiveWith?: string[]
  [key: string]: unknown
}

/**
 * Checks if a specific member has a trait.
 * @param member - The band member object.
 * @param traitId - The ID of the trait to check.
 * @returns True if the member has the trait.
 */
export const hasTrait = (member: unknown, traitId: string): boolean => {
  if (
    !member ||
    typeof member !== 'object' ||
    !Object.hasOwn(member, 'traits') ||
    !(member as Record<string, unknown>).traits ||
    typeof (member as Record<string, unknown>).traits !== 'object'
  ) {
    return false
  }

  const traits = (member as Record<string, unknown>).traits
  if (Array.isArray(traits)) {
    for (let i = 0; i < traits.length; i++) {
      const t = traits[i]
      if (
        t &&
        typeof t === 'object' &&
        (t as Record<string, unknown>).id === traitId
      ) {
        return true
      }
    }
    return false
  }

  return Object.hasOwn(traits as Record<string, unknown>, traitId)
}

/**
 * Checks if any member in the band has a specific trait.
 * @param bandState - The band state object (containing members array).
 * @param traitId - The ID of the trait to check.
 * @returns True if any member has the trait.
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
 * Maps: charKey to `traitId to traitDef`
 * Provides O(1) lookup for trait definitions instead of O(N) searching.
 */
const TRAIT_DEFS_BY_CHAR: Record<
  string,
  Record<string, TraitDef>
> = Object.create(null)
/**
 * Flat lookup for all trait definitions by traitId.
 * Maps: traitId to traitDef
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
 * @param traitId - Id of the trait to resolve from the generic/clinic definitions.
 */
export const getTraitById = (traitId: string): TraitDef | null => {
  if (!traitId) return null
  return TRAIT_DEFS_BY_ID.get(traitId) ?? null
}

/** Id of the Void Clinic graft trait. */
export const NEURO_OVERCLOCK_TRAIT_ID = 'neuro_overclock'

/**
 * Reads the Neuro-Overclock tuning from its canonical trait definition (never
 * from a member's saved copy, which can be stale).
 *
 * @returns `rhythmMultiplier` (hit-window multiplier, `1` = no change),
 * `stressPerGig` (band stress added per carrier per real gig) and
 * `staminaPerGig` (signed stamina change per carrier per real gig).
 */
export const getNeuroOverclockEffects = (): {
  rhythmMultiplier: number
  stressPerGig: number
  staminaPerGig: number
} => {
  const raw = getTraitById(NEURO_OVERCLOCK_TRAIT_ID)?.effects
  const effects =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    rhythmMultiplier: finiteNumberOr(effects.rhythmMultiplier, 1),
    stressPerGig: finiteNumberOr(effects.stressPerGig, 0),
    staminaPerGig: finiteNumberOr(effects.staminaPerGig, 0)
  }
}

/**
 * Applies a Neuro-Overclock stamina cost (graft or per-gig). The trait never
 * knocks its carrier out, so a cost stops at 1 stamina; a member already below
 * that floor is left where they are rather than raised to it.
 *
 * @param stamina - The member's current stamina.
 * @param delta - Signed stamina change (negative for a cost).
 * @param staminaMax - The member's stamina cap.
 * @returns The clamped stamina after the cost.
 */
export const applyNeuroOverclockStaminaCost = (
  stamina: number,
  delta: number,
  staminaMax: number
): number =>
  clampMemberStamina(
    Math.max(Math.min(stamina, 1), stamina + delta),
    staminaMax
  )

/**
 * Applies the Neuro-Overclock per-gig cost: each carrier adds `stressPerGig`
 * to band stress and changes its own stamina by `staminaPerGig`, stopping at
 * the same floor as the graft (`applyNeuroOverclockStaminaCost`).
 *
 * @param band - Band after a real (non-practice) gig.
 * @returns A new band with the cost applied, or the identical `band` when no
 * member carries the trait.
 */
export const applyNeuroOverclockGigCost = (band: BandState): BandState => {
  if (!Array.isArray(band.members)) return band
  const { stressPerGig, staminaPerGig } = getNeuroOverclockEffects()
  let carriers = 0
  const members = band.members.map(member => {
    if (!hasTrait(member, NEURO_OVERCLOCK_TRAIT_ID)) return member
    carriers += 1
    return {
      ...member,
      stamina: applyNeuroOverclockStaminaCost(
        finiteNumberOr(member.stamina, 0),
        staminaPerGig,
        finiteNumberOr(member.staminaMax, 100)
      )
    }
  })
  if (carriers === 0) return band
  return {
    ...band,
    members,
    stress: clampBandStress(
      finiteNumberOr(band.stress, 0) + stressPerGig * carriers
    )
  }
}

/**
 * Normalizes a trait map into a null-prototype object.
 * Applies current/hardening logic for legacy shapes.
 * @param traits - The raw traits to normalize.
 * @returns A null-prototype object with normalized trait data.
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
 * Normalizes a loaded trait map and swaps every stored trait that has a
 * canonical definition for that definition.
 *
 * @remarks
 * Saves can hold stale or legacy-shaped copies, e.g. the pre-registration
 * `neuro_overclock` graft fallback with raw `name`/`description` keys and no
 * `desc`/`unlockHint`, which Band HQ filters out as malformed. Traits without a
 * canonical definition are kept as stored so `hasTrait` still sees them.
 * @param traits - The raw traits read from a save.
 * @returns A null-prototype trait map with canonical definitions.
 */
export const rehydrateTraitMap = (
  traits: unknown
): Record<string, TraitDef> => {
  const traitsMap = normalizeTraitMap(traits)
  for (const id of Object.keys(traitsMap)) {
    const canonical = getTraitById(id)
    if (canonical) traitsMap[id] = canonical
  }
  return traitsMap
}

/**
 * Removes mutually exclusive traits from a traits map based on a newly added trait definition.
 *
 * @param traitsMap - The object containing the current traits.
 * @param traitDef - The trait definition of the newly added trait.
 */
export const removeExclusiveTraits = (
  traitsMap: Record<string, TraitDef>,
  traitDef: TraitDef
): void => {
  if (Array.isArray(traitDef.exclusiveWith)) {
    for (let i = 0; i < traitDef.exclusiveWith.length; i++) {
      const exclusiveTraitId = traitDef.exclusiveWith[i]
      if (
        typeof exclusiveTraitId === 'string' &&
        Object.hasOwn(traitsMap, exclusiveTraitId)
      ) {
        delete traitsMap[exclusiveTraitId]
      }
    }
  }
}

/**
 * Applies unlocked traits to the band state immutably and generates toasts.
 * Handles multiple unlocks per member and avoids duplicates.
 *
 * @param currentState - The current full game state (must contain band and toasts).
 * @param unlocks - Array of `memberId, traitId` objects.
 * @returns An object containing the updated `band, toasts` to be merged into state.
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

  const members: BandMember[] = currentState.band?.members ?? []

  // Create a map for O(1) member lookup by ID and lowercase name
  const memberLookup = new Map<string, number>()
  members.forEach((m, idx) => {
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

  let hasChanges = false
  const validUnlocks: Array<{
    memberId: string
    traitId: string
    memberIndex: number
    traitDef: TraitDef
  }> = []

  // Track traits we've decided to unlock in this batch to prevent duplicates
  const pendingUnlocks = new Set<string>()

  for (const u of unlocks) {
    if (!u || typeof u.memberId !== 'string' || typeof u.traitId !== 'string')
      continue

    // Find member by ID or case-insensitive name
    let memberIndex = memberLookup.get(u.memberId)
    if (memberIndex === undefined) {
      memberIndex = memberLookup.get(u.memberId.toLowerCase())
    }

    if (memberIndex === undefined) continue

    const member = members[memberIndex]
    if (!member) continue

    const pendingKey = `${memberIndex}-${u.traitId}`
    if (pendingUnlocks.has(pendingKey)) continue

    // Check if trait is already unlocked
    if (hasTrait(member, u.traitId)) continue

    // Find trait definition using the member's name to resolve static character data
    const charKey =
      typeof member.name === 'string' && member.name
        ? (member.name.toUpperCase() as keyof typeof CHARACTERS)
        : null
    let traitDef = charKey
      ? (TRAIT_DEFS_BY_CHAR[charKey as string] ?? {})[u.traitId]
      : undefined
    if (!traitDef) traitDef = TRAIT_DEFS_BY_ID.get(u.traitId)

    if (!traitDef) continue

    pendingUnlocks.add(pendingKey)
    validUnlocks.push({
      memberId: u.memberId,
      traitId: u.traitId,
      memberIndex,
      traitDef
    })
    hasChanges = true
  }

  if (!hasChanges) {
    // Return early to save allocation, maintaining original fallback semantics for band
    return {
      band: currentState.band ?? ({} as BandState),
      toasts: (currentState.toasts ?? []) as ToastPayload[]
    }
  }

  // Create shallow copy of band and members for immutable update
  type MemberWithTraits = BandMember & { traits: Record<string, TraitDef> }
  const len = members.length
  const nextMembers: MemberWithTraits[] = new Array(len)
  for (let i = 0; i < len; i++) {
    const m = members[i]
    if (m) {
      nextMembers[i] = {
        ...m,
        traits: normalizeTraitMap(m.traits)
      }
    }
  }
  const nextBand: BandState & { members: MemberWithTraits[] } = {
    ...(currentState.band ?? ({} as BandState)),
    members: nextMembers
  }
  const nextToasts: ToastPayload[] = [...(currentState.toasts ?? [])]

  for (const { memberId, traitId, memberIndex, traitDef } of validUnlocks) {
    const member = nextBand.members[memberIndex]
    if (!member) continue

    // Apply trait
    member.traits[traitId] = traitDef

    // Remove mutually exclusive traits
    removeExclusiveTraits(member.traits, traitDef)

    // Add toast with a unique ID
    nextToasts.push({
      id: buildDeterministicToastId('trait', nextToasts),
      messageKey: 'ui:shop.messages.traitUnlocked',
      options: { traitName: traitDef.name, memberId },
      message: `Unlocked Trait: ${traitDef.name} (${memberId})`,
      type: 'success'
    })
  }

  return {
    band: nextBand,
    toasts: nextToasts
  }
}
