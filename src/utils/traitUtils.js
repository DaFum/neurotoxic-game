import { CHARACTERS } from '../data/characters.js'

/**
 * Pre-calculated lookup for character trait definitions.
 * Maps: charKey -> { traitId -> traitDef }
 * Provides O(1) lookup for trait definitions instead of O(N) searching.
 */
const TRAIT_DEFS_BY_CHAR = Object.keys(CHARACTERS).reduce((acc, charKey) => {
  const traits = CHARACTERS[charKey].traits || []
  acc[charKey] = traits.reduce((traitAcc, trait) => {
    traitAcc[trait.id] = trait
    return traitAcc
  }, {})
  return acc
}, {})

/**
 * Monotonic counter for generating unique trait toast IDs.
 * Mirrors the pattern used by createAddToastAction in actionCreators.js.
 * @type {number}
 */
let traitToastIdCounter = 0

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
    members: members.map(m => ({ ...m, traits: [...m.traits] }))
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
    if (member.traits.some(t => t.id === u.traitId)) return

    // Find trait definition using the member's name to resolve static character data
    // This allows u.memberId to be an arbitrary ID (uuid) as long as the member object has a valid name.
    const charKey =
      typeof member.name === 'string' && member.name
        ? member.name.toUpperCase()
        : null
    const traitDef = charKey ? TRAIT_DEFS_BY_CHAR[charKey]?.[u.traitId] : null

    if (!traitDef) return

    // Apply trait
    member.traits.push(traitDef)

    // Add toast with deterministic monotonic ID
    nextToasts.push({
      id: `trait-${Date.now()}-${++traitToastIdCounter}`,
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
