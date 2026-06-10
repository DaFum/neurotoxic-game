import i18n from '../../i18n'
import { formatCurrency } from '../../utils/numberUtils'
import type { GameState } from '../../types'
import type { ClinicActionPayload, BloodBankDonatePayload } from '../../types'
import type { BandMember } from '../../types'
import { CLINIC_CONFIG, calculateClinicCost } from '../gameConstants'
import { logger } from '../../utils/logger'
import {
  clampPlayerMoney,
  clampPlayerFame,
  clampMemberMood,
  clampMemberStamina,
  calculateFameLevel,
  clampBandHarmony,
  clampControversyLevel,
  finiteNumberOr
} from '../../utils/gameState'
import { getTraitById, normalizeTraitMap } from '../../utils/traitUtils'
import { getSafeUUID } from '../../utils/crypto'
import { sanitizeSuccessToast } from './toastSanitizers'

/**
 * Common logic for clinic actions.
 *
 * @param state - Game state before the clinic action.
 * @param payload - Clinic action payload after action-creator normalization.
 * - `payload.successToast` - Optional toast appended to state.toasts on success.
 * - `payload.getSuccessToast` - Optional factory for success toast appended to state.toasts.
 * @param memberUpdater - A function to apply updates to the target member.
 * @returns State with clinic costs, member updates, and success toast applied,
 * or the original state when validation fails.
 */
const executeClinicAction = (
  state: GameState,
  payload: ClinicActionPayload,
  memberUpdater: (member: BandMember) => Record<string, unknown>
): GameState => {
  const { memberId, type, successToast, getSuccessToast } = payload
  const currentVisits = state.player?.clinicVisits ?? 0
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

  let targetIndex = -1
  const len = state.band.members.length
  for (let i = 0; i < len; i++) {
    const member = state.band.members[i]
    if (member && member.id === memberId) {
      targetIndex = i
      break
    }
  }

  if (targetIndex === -1) {
    logger.warn('ClinicReducer', 'Target member not found in band')
    return state
  }

  const targetMember = state.band.members[targetIndex]
  const memberUpdateResult = memberUpdater(targetMember)
  const updatedMember =
    (memberUpdateResult.updatedMember as BandMember) ||
    (memberUpdateResult as unknown as BandMember)

  const updatedMembers: BandMember[] = [...state.band.members]
  updatedMembers[targetIndex] = updatedMember

  const nextFame = clampPlayerFame(playerFame - fameCost)
  const nextState: GameState = {
    ...state,
    player: {
      ...state.player,
      money: clampPlayerMoney(playerMoney - cost),
      fame: nextFame,
      fameLevel: calculateFameLevel(nextFame),
      clinicVisits: state.player.clinicVisits + 1
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
 *
 * @remarks
 * Persisted member numerics are normalized with `finiteNumberOr` before
 * arithmetic, then clamped by the canonical mood/stamina helpers.
 *
 * @param state - Game state before healing.
 * @param payload - Clinic heal request.
 * - `payload.memberId` - The ID of the band member to heal.
 * - `payload.type` - Must be `'heal'`; used to compute cost from `CLINIC_CONFIG`.
 * - `payload.staminaGain` - The stamina gain.
 * - `payload.moodGain` - The mood gain.
 * @returns State with clamped stamina/mood restoration and clinic cost applied,
 * or the original state when validation fails.
 */
export const handleClinicHeal = (
  state: GameState,
  payload: ClinicActionPayload
): GameState => {
  const staminaGain = finiteNumberOr(payload.staminaGain, 0)
  const moodGain = finiteNumberOr(payload.moodGain, 0)

  return executeClinicAction(state, payload, member => {
    const prevStamina = finiteNumberOr(member.stamina, 0)
    const prevMood = finiteNumberOr(member.mood, 0)

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
 *
 * @param state - Game state before donation.
 * @param payload - Blood-bank donation request.
 * - `payload.moneyGain` - The amount of money to gain.
 * - `payload.harmonyCost` - The harmony to lose.
 * - `payload.staminaCost` - The stamina to lose per member.
 * - `payload.controversyGain` - The controversy to gain.
 * - `payload.successToast` - Optional toast on success.
 * @returns State with money/social gains and stamina/harmony costs applied, or
 * the original state when validation fails.
 */
export const handleBloodBankDonate = (
  state: GameState,
  payload: BloodBankDonatePayload
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
  const moneyGain = Math.max(0, Number(safePayload.moneyGain) || 0)
  const harmonyCost = Math.max(0, Number(safePayload.harmonyCost) || 0)
  const staminaCost = Math.max(0, Number(safePayload.staminaCost) || 0)
  const controversyGain = Math.max(0, Number(safePayload.controversyGain) || 0)
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
  const updatedMembers = state.band.members.map((member: BandMember) => {
    const prevStamina = finiteNumberOr(member.stamina, 0)
    const nextStamina = clampMemberStamina(
      prevStamina - staminaCost,
      member.staminaMax
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
        deltaMoney: formatCurrency(deltaMoney, i18n.language, 'always'),
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
 *
 * @param state - Game state before enhancement.
 * @param payload - Clinic enhancement request.
 * - `payload.memberId` - The ID of the band member.
 * - `payload.type` - Must be `'enhance'`; used to compute cost from `CLINIC_CONFIG`.
 * - `payload.trait` - The trait to add or upgrade.
 * @returns State with the trait grafted and clinic cost applied, or the
 * original state when validation fails.
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
