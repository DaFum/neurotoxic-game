// TODO: Review this file
import { CLINIC_CONFIG, calculateClinicCost } from '../gameConstants.js'
import { logger } from '../../utils/logger'
import {
  clampPlayerMoney,
  clampPlayerFame,
  clampMemberMood,
  clampMemberStamina,
  calculateFameLevel
} from '../../utils/gameStateUtils.js'
import { getTraitById, normalizeTraitMap } from '../../utils/traitUtils.js'

/**
 * Common logic for clinic actions.
 * @param {Object} state - The current game state.
 * @param {Object} payload - The action payload.
 * @param {Object} [payload.successToast] - Optional toast appended to state.toasts on success.
 * @param {Function} memberUpdater - A function to apply updates to the target member.
 * @returns {Object} The updated state or the original state if validation fails.
 */
const executeClinicAction = (state, payload, memberUpdater) => {
  const { memberId, type, successToast } = payload
  const currentVisits = state.player?.clinicVisits || 0
  // Calculate costs directly from state
  const cost =
    type === 'heal'
      ? calculateClinicCost(CLINIC_CONFIG.HEAL_BASE_COST_MONEY, currentVisits)
      : 0
  const fameCost =
    type === 'enhance'
      ? calculateClinicCost(CLINIC_CONFIG.ENHANCE_BASE_COST_FAME, currentVisits)
      : 0

  if (!state.player || !state.band) {
    logger.warn('ClinicReducer', 'Missing player or band state')
    return state
  }

  // Ensure player stats are valid before comparison
  const playerMoney = Number.isFinite(state.player.money)
    ? Math.max(0, state.player.money)
    : 0
  const playerFame = Number.isFinite(state.player.fame)
    ? Math.max(0, state.player.fame)
    : 0

  if (playerMoney < cost || playerFame < fameCost) {
    logger.warn('ClinicReducer', 'Not enough money or fame')
    return state
  }

  // Validate members array
  if (!Array.isArray(state.band.members)) {
    logger.warn('ClinicReducer', 'band.members is missing or not an array')
    return state
  }

  const memberExists = state.band.members.some(m => m.id === memberId)
  if (!memberExists) {
    logger.warn('ClinicReducer', 'Target member not found in band')
    return state
  }

  const updatedMembers = state.band.members.map(member => {
    if (member.id !== memberId) return member
    return memberUpdater(member)
  })

  const nextFame = clampPlayerFame(playerFame - fameCost)
  const nextState = {
    ...state,
    player: {
      ...state.player,
      money: clampPlayerMoney(playerMoney - cost),
      fame: nextFame,
      fameLevel: calculateFameLevel(nextFame),
      clinicVisits: (state.player.clinicVisits || 0) + 1
    },
    band: {
      ...state.band,
      members: updatedMembers
    }
  }

  // Append success toast atomically so it only appears when the action succeeds
  if (successToast) {
    nextState.toasts = [...(state.toasts || []), successToast]
  }

  return nextState
}

/**
 * Handles the healing logic in the Void Clinic.
 * @param {Object} state - The current game state.
 * @param {Object} payload - The payload containing the requested changes.
 * @param {string} payload.memberId - The ID of the band member to heal.
 * @param {string} payload.type - Must be 'heal' or 'enhance'. Used to compute cost from CLINIC_CONFIG.
 * @param {number} payload.staminaGain - The stamina gain.
 * @param {number} payload.moodGain - The mood gain.
 * @returns {Object} The updated game state.
 */
export const handleClinicHeal = (state, payload) => {
  const rawStamina = payload.staminaGain
  const rawMood = payload.moodGain
  const staminaGain = Number.isFinite(rawStamina) ? rawStamina : 0
  const moodGain = Number.isFinite(rawMood) ? rawMood : 0

  return executeClinicAction(state, payload, member => ({
    ...member,
    stamina: clampMemberStamina(
      (member.stamina || 0) + staminaGain,
      member.staminaMax
    ),
    mood: clampMemberMood((member.mood || 0) + moodGain)
  }))
}

/**
 * Handles trait enhancement or other cybernetic grafts in the clinic.
 * @param {Object} state - The current game state.
 * @param {Object} payload - The payload containing the requested changes.
 * @param {string} payload.memberId - The ID of the band member.
 * @param {string} payload.type - Must be 'heal' or 'enhance'. Used to compute cost from CLINIC_CONFIG.
 * @param {string} payload.trait - The trait to add or upgrade.
 * @returns {Object} The updated game state.
 */
export const handleClinicEnhance = (state, payload) => {
  const { trait, memberId } = payload

  if (!trait) {
    logger.warn('ClinicReducer', 'Missing trait')
    return state
  }

  const resolvedTrait = getTraitById(trait)
  if (!resolvedTrait) {
    logger.warn(
      'ClinicReducer',
      `Could not resolve trait definition for: ${trait}`
    )
    return state
  }

  // Early return if member already has trait to prevent charging cost
  if (state.band && Array.isArray(state.band.members)) {
    let targetMember = null
    for (let i = 0; i < state.band.members.length; i++) {
      if (state.band.members[i].id === memberId) {
        targetMember = state.band.members[i]
        break
      }
    }
    if (targetMember && targetMember.traits) {
      if (targetMember.traits[resolvedTrait.id]) {
        logger.debug(
          'ClinicReducer',
          `Member ${memberId} already has trait ${resolvedTrait.id}, skipping`
        )
        return state
      }
    }
  }

  return executeClinicAction(state, payload, member => {
    const updatedTraits = normalizeTraitMap(member.traits)
    updatedTraits[resolvedTrait.id] = resolvedTrait

    return {
      ...member,
      traits: updatedTraits
    }
  })
}
