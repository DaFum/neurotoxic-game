import { CHARACTERS } from '../data/characters.js'

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

  unlocks.forEach(u => {
    // Find member by ID or case-insensitive name
    const memberIndex = nextBand.members.findIndex(
      m =>
        (m.id && m.id === u.memberId) ||
        (m.name &&
          typeof m.name === 'string' &&
          typeof u.memberId === 'string' &&
          m.name.toLowerCase() === u.memberId.toLowerCase())
    )
    if (memberIndex === -1) return

    const member = nextBand.members[memberIndex]

    // Check if trait is already unlocked
    if (member.traits.some(t => t.id === u.traitId)) return

    // Find trait definition using the member's name to resolve static character data
    // This allows u.memberId to be an arbitrary ID (uuid) as long as the member object has a valid name.
    const charKey = member.name ? member.name.toUpperCase() : null
    const traitDef = charKey
      ? CHARACTERS[charKey]?.traits?.find(t => t.id === u.traitId)
      : null

    if (!traitDef) return

    // Apply trait
    member.traits.push(traitDef)

    // Add toast with deterministic monotonic ID
    nextToasts.push({
      id: `trait-${Date.now()}-${++traitToastIdCounter}`,
      message: `Unlocked Trait: ${traitDef.name} (${u.memberId})`,
      type: 'success'
    })
  })

  return {
    band: nextBand,
    toasts: nextToasts
  }
}
