// @ts-nocheck
// TODO: Review this file
import { CHARACTERS } from '../data/characters'
import { logger } from '../utils/logger'
import { getSafeUUID } from '../utils/crypto'

/**
 * Pre-calculated lookup for character trait definitions.
 * Maps: charKey -> { traitId -> traitDef }
 * Provides O(1) lookup for trait definitions instead of O(N) searching.
 */
const TRAIT_DEFS_BY_CHAR = Object.create(null)
/**
 * Flat lookup for all trait definitions by traitId.
 * Maps: traitId -> traitDef
 */
const TRAIT_DEFS_BY_ID = new Map()

for (const charKey in CHARACTERS) {
  if (Object.hasOwn(CHARACTERS, charKey)) {
    const traits = CHARACTERS[charKey].traits || []
    TRAIT_DEFS_BY_CHAR[charKey] = Object.create(null)
    for (const trait of traits) {
      TRAIT_DEFS_BY_CHAR[charKey][trait.id] = trait
      if (TRAIT_DEFS_BY_ID.has(trait.id)) {
        logger.warn(
          'traitUtils',
          `Duplicate trait ID found during initialization: ${trait.id}`
        )
      }
      TRAIT_DEFS_BY_ID.set(trait.id, trait)
    }
  }
}

/**
 * Helper to fetch a generic trait (e.g., from CLINIC definitions)
 * @param {string} traitId
 * @returns {object|null}
 */
export const getTraitById = traitId => {
  return TRAIT_DEFS_BY_ID.get(traitId) || null
}

/**
 * Normalizes a trait map into a null-prototype object.
 * Applies current/hardening logic for legacy shapes.
 * @param {object|Array} traits - The raw traits to normalize.
 * @returns {object} A null-prototype object with normalized trait data.
 */
export const normalizeTraitMap = traits => {
  if (Array.isArray(traits)) {
    const traitsMap = Object.create(null)
    for (const t of traits) {
      if (t && t.id) {
        traitsMap[t.id] = t
      }
    }
    return traitsMap
  }
  if (traits && typeof traits === 'object') {
    const traitsMap = Object.create(null)
    for (const key in traits) {
      if (!Object.hasOwn(traits, key)) continue
      const t = traits[key]
      if (t && t.id) {
        traitsMap[t.id] = t
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
export const applyTraitUnlocks = (currentState, unlocks) => {
  if (!unlocks || unlocks.length === 0) {
    return {
      band: currentState.band,
      toasts: currentState.toasts ?? []
    }
  }

  // Create shallow copy of band and members for immutable update
  const members = currentState.band?.members ?? []
  const nextBand = {
    ...currentState.band,
    members: members.map(m => ({
      ...m,
      traits: normalizeTraitMap(m.traits)
    }))
  }
  const nextToasts = [...(currentState.toasts ?? [])]

  // Create a map for O(1) member lookup by ID and lowercase name
  const memberLookup = new Map()
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

  unlocks.forEach(u => {
    // Find member by ID or case-insensitive name
    let memberIndex = memberLookup.get(u.memberId)
    if (memberIndex === undefined && typeof u.memberId === 'string') {
      memberIndex = memberLookup.get(u.memberId.toLowerCase())
    }

    if (memberIndex === undefined) return

    const member = nextBand.members[memberIndex]

    // Check if trait is already unlocked
    if (Object.hasOwn(member.traits, u.traitId)) return

    // Find trait definition using the member's name to resolve static character data
    // This allows u.memberId to be an arbitrary ID (uuid) as long as the member object has a valid name.
    const charKey =
      typeof member.name === 'string' && member.name
        ? member.name.toUpperCase()
        : null
    const traitDef = charKey ? TRAIT_DEFS_BY_CHAR[charKey]?.[u.traitId] : null

    if (!traitDef) return

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
  })

  return {
    band: nextBand,
    toasts: nextToasts
  }
}
