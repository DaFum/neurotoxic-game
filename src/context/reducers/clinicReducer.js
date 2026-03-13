import { logger } from '../../utils/logger'

/**
 * Handles the healing logic in the Void Clinic.
 * @param {Object} state - The current game state.
 * @param {Object} payload - The payload containing the requested changes.
 * @param {string} payload.memberId - The ID of the band member to heal.
 * @param {number} payload.cost - The money cost.
 * @param {number} payload.fameCost - The fame cost.
 * @param {number} payload.staminaGain - The stamina gain.
 * @param {number} payload.moodGain - The mood gain.
 * @returns {Object} The updated game state.
 */
export const handleClinicHeal = (state, payload) => {
  const { memberId, cost = 0, fameCost = 0, staminaGain = 0, moodGain = 0 } = payload

  if (!state.player || !state.band) {
    logger.warn('ClinicReducer', 'Missing player or band state')
    return state
  }

  if (state.player.money < cost || state.player.fame < fameCost) {
    logger.warn('ClinicReducer', 'Not enough money or fame')
    return state
  }

  const updatedMembers = state.band.members.map(member => {
    if (member.id !== memberId) return member

    return {
      ...member,
      stamina: Math.min(100, Math.max(0, (member.stamina || 0) + staminaGain)),
      mood: Math.min(100, Math.max(0, (member.mood || 0) + moodGain))
    }
  })

  return {
    ...state,
    player: {
      ...state.player,
      money: Math.max(0, state.player.money - cost),
      fame: Math.max(0, state.player.fame - fameCost),
      clinicVisits: (state.player.clinicVisits || 0) + 1
    },
    band: {
      ...state.band,
      members: updatedMembers
    }
  }
}

/**
 * Handles trait enhancement or other cybernetic grafts in the clinic.
 * @param {Object} state - The current game state.
 * @param {Object} payload - The payload containing the requested changes.
 * @param {string} payload.memberId - The ID of the band member.
 * @param {number} payload.cost - The money cost.
 * @param {number} payload.fameCost - The fame cost.
 * @param {string} payload.trait - The trait to add or upgrade.
 * @returns {Object} The updated game state.
 */
export const handleClinicEnhance = (state, payload) => {
  const { memberId, cost = 0, fameCost = 0, trait } = payload

  if (!state.player || !state.band) {
    logger.warn('ClinicReducer', 'Missing player or band state')
    return state
  }

  if (state.player.money < cost || state.player.fame < fameCost) {
    logger.warn('ClinicReducer', 'Not enough money or fame')
    return state
  }

  if (!trait) {
    logger.warn('ClinicReducer', 'Missing trait')
    return state
  }

  const updatedMembers = state.band.members.map(member => {
    if (member.id !== memberId) return member

    const updatedTraits = Array.isArray(member.traits) ? [...member.traits] : []
    if (!updatedTraits.includes(trait)) {
      updatedTraits.push(trait)
    }

    return {
      ...member,
      traits: updatedTraits
    }
  })

  return {
    ...state,
    player: {
      ...state.player,
      money: Math.max(0, state.player.money - cost),
      fame: Math.max(0, state.player.fame - fameCost),
      clinicVisits: (state.player.clinicVisits || 0) + 1
    },
    band: {
      ...state.band,
      members: updatedMembers
    }
  }
}
