// TODO: Review this file
import type { GameState } from '../../types/game'
import type {
  ClinicActionPayload,
  BloodBankDonatePayload
} from '../../types/game'
import type { BandMember } from '../../types/game'
import { CLINIC_CONFIG, calculateClinicCost } from '../gameConstants'
import { logger } from '../../utils/logger'
import {
  clampPlayerMoney,
  clampPlayerFame,
  clampMemberMood,
  clampMemberStamina,
  calculateFameLevel,
  clampBandHarmony,
  clampControversyLevel
} from '../../utils/gameStateUtils'
import { getTraitById, normalizeTraitMap } from '../../utils/traitUtils'
import { getSafeUUID } from '../../utils/crypto'
import { sanitizeSuccessToast } from './toastSanitizers'

/**
 * Common logic for clinic actions.
 * @param {Object} state - The current game state.
 * @param {Object} payload - The action payload.
 * @param {Object} [payload.successToast] - Optional toast appended to state.toasts on success.
 * @param {Function} [payload.getSuccessToast] - Optional factory for success toast appended to state.toasts.
 * @param {Function} memberUpdater - A function to apply updates to the target member.
 * @returns {Object} The updated state or the original state if validation fails.
 */
const executeClinicAction = (
  state: GameState,
  payload: ClinicActionPayload,
  memberUpdater: (member: BandMember) => Record<string, unknown>
): GameState => {
  const { memberId, type, successToast, getSuccessToast } = payload
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

  let memberUpdateResult: Record<string, unknown> | null = null

  const updatedMembers: BandMember[] = state.band.members.map(member => {
    if (member.id !== memberId) return member
    memberUpdateResult = memberUpdater(member)
    return (
      (memberUpdateResult.updatedMember as BandMember) ||
      (memberUpdateResult as unknown as BandMember)
    )
  })

  const nextFame = clampPlayerFame(playerFame - fameCost)
  const nextState: GameState = {
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
  const toastArgsArray =
    memberUpdateResult &&
    (memberUpdateResult as Record<string, unknown>).toastArgs
      ? ((memberUpdateResult as Record<string, unknown>).toastArgs as unknown[])
      : undefined
  const finalSuccessToast =
    successToast ||
    (typeof getSuccessToast === 'function' && toastArgsArray
      ? (getSuccessToast as (...args: unknown[]) => unknown)(...toastArgsArray)
      : null)
  const safeToast = sanitizeSuccessToast(finalSuccessToast, {
    fallbackId: getSafeUUID()
  })
  if (safeToast) {
    nextState.toasts = [...(state.toasts || []), safeToast]
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
export const handleClinicHeal = (
  state: GameState,
  payload: ClinicActionPayload
): GameState => {
  const rawStamina = payload.staminaGain as number | undefined
  const rawMood = payload.moodGain as number | undefined
  const staminaGain = Math.max(
    0,
    Number.isFinite(rawStamina ?? 0) ? (rawStamina ?? 0) : 0
  )
  const moodGain = Math.max(
    0,
    Number.isFinite(rawMood ?? 0) ? (rawMood ?? 0) : 0
  )

  return executeClinicAction(state, payload, member => {
    const prevStamina = member.stamina || 0
    const prevMood = member.mood || 0

    const nextStamina = clampMemberStamina(
      prevStamina + staminaGain,
      member.staminaMax
    )
    const nextMood = clampMemberMood(prevMood + moodGain)

    const appliedStamina = nextStamina - prevStamina
    const appliedMood = nextMood - prevMood

    return {
      updatedMember: {
        ...member,
        stamina: nextStamina,
        mood: nextMood
      },
      toastArgs: [appliedStamina, appliedMood]
    }
  })
}

/**
 * Handles the blood bank donation logic, trading stamina and harmony for money.
 * @param {Object} state - The current game state.
 * @param {Object} payload - The payload containing the requested changes.
 * @param {number} payload.moneyGain - The amount of money to gain.
 * @param {number} payload.harmonyCost - The harmony to lose.
 * @param {number} payload.staminaCost - The stamina to lose per member.
 * @param {number} payload.controversyGain - The controversy to gain.
 * @param {Object} [payload.successToast] - Optional toast on success.
 * @returns {Object} The updated game state.
 */
export const handleBloodBankDonate = (
  state: GameState,
  payload?: BloodBankDonatePayload
): GameState => {
  if (!state.player || !state.band || !state.social) {
    logger.warn(
      'ClinicReducer',
      'Missing player, band, or social state for blood bank'
    )
    return state
  }

  const safePayload = payload || {
    moneyGain: 0,
    harmonyCost: 0,
    staminaCost: 0,
    controversyGain: 0
  }
  const rawMoneyGain = Number(safePayload.moneyGain)
  const moneyGain = Number.isFinite(rawMoneyGain)
    ? Math.max(0, rawMoneyGain)
    : 0
  const rawHarmonyCost = Number(safePayload.harmonyCost)
  const harmonyCost = Number.isFinite(rawHarmonyCost)
    ? Math.max(0, rawHarmonyCost)
    : 0
  const rawStaminaCost = Number(safePayload.staminaCost)
  const staminaCost = Number.isFinite(rawStaminaCost)
    ? Math.max(0, rawStaminaCost)
    : 0
  const rawControversyGain = Number(safePayload.controversyGain)
  const controversyGain = Number.isFinite(rawControversyGain)
    ? Math.max(0, rawControversyGain)
    : 0
  const successToast = safePayload.successToast

  // Validate members array
  if (!Array.isArray(state.band.members) || state.band.members.length === 0) {
    logger.warn('ClinicReducer', 'band.members is missing or empty')
    return state
  }

  const currentMoney = Number.isFinite(state.player.money)
    ? state.player.money
    : 0
  const nextMoney = clampPlayerMoney(currentMoney + moneyGain)

  const currentHarmony = Number.isFinite(state.band.harmony)
    ? state.band.harmony
    : 50
  const nextHarmony = clampBandHarmony(currentHarmony - harmonyCost)

  const currentControversy = Number.isFinite(state.social.controversyLevel)
    ? state.social.controversyLevel
    : 0
  const nextControversy = clampControversyLevel(
    currentControversy + controversyGain
  )

  // Apply stamina drain to all members and calculate actual loss
  let totalStaminaLost = 0
  const updatedMembers = state.band.members.map(member => {
    const prevStamina = member.stamina || 0
    const nextStamina = clampMemberStamina(
      prevStamina - staminaCost,
      (member as Record<string, unknown>).staminaMax as number | undefined
    )
    totalStaminaLost += prevStamina - nextStamina
    return {
      ...member,
      stamina: nextStamina
    }
  })

  const nextState = {
    ...state,
    player: {
      ...state.player,
      money: nextMoney
    },
    band: {
      ...state.band,
      harmony: nextHarmony,
      members: updatedMembers
    },
    social: {
      ...state.social,
      controversyLevel: nextControversy
    }
  }

  if (successToast) {
    const deltaMoney = nextMoney - currentMoney
    const deltaHarmony = currentHarmony - nextHarmony // Expressed as a positive cost
    const deltaControversy = nextControversy - currentControversy

    const safeToast = sanitizeSuccessToast(successToast, {
      fallbackId: getSafeUUID(),
      optionsPatch: {
        deltaMoney,
        deltaHarmony,
        deltaControversy,
        deltaStamina: totalStaminaLost
      }
    })
    if (safeToast) {
      nextState.toasts = [...(state.toasts || []), safeToast]
    }
  }

  return nextState
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
export const handleClinicEnhance = (
  state: GameState,
  payload: ClinicActionPayload
): GameState => {
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
      const m = state.band.members[i]
      if (m && m.id === memberId) {
        targetMember = m
        break
      }
    }
    if (
      targetMember &&
      targetMember.traits &&
      Object.hasOwn(
        targetMember.traits as Record<string, unknown>,
        resolvedTrait.id
      )
    ) {
      logger.debug(
        'ClinicReducer',
        `Member ${memberId} already has trait ${resolvedTrait.id}, skipping`
      )
      return state
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
