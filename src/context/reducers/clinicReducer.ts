import i18n from '../../i18n'
import { formatCurrency } from '../../utils/numberUtils'
import type { GameState } from '../../types'
import type { ClinicActionPayload, BloodBankDonatePayload } from '../../types'
import type { BandMember } from '../../types'
import {
  CLINIC_CONFIG,
  calculateClinicCost,
  CLINIC_GRAFT_COST
} from '../gameConstants'
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
import {
  getTraitById,
  normalizeTraitMap,
  hasTrait,
  removeExclusiveTraits
} from '../../utils/traitUtils'
import {
  sanitizeSuccessToast,
  buildDeterministicToastId
} from './toastSanitizers'
import { validateBloodBankDonation } from '../../utils/bloodBankUtils'

export type MemberUpdaterResult =
  | { updatedMember: BandMember; toastArgs?: unknown[] }
  | BandMember

/**
 * Finds a band member by ID within a member array.
 * @param members - The array of members to search.
 * @param memberId - The ID to look for.
 * @returns Object with index and member reference, or \{ targetIndex: -1, targetMember: null \}
 */
export const findBandMember = (
  members: unknown[],
  memberId: string
): { targetIndex: number; targetMember: BandMember | null } => {
  if (!Array.isArray(members)) {
    return { targetIndex: -1, targetMember: null }
  }
  for (let i = 0; i < members.length; i++) {
    const member = members[i] as BandMember
    if (member && member.id === memberId) {
      return { targetIndex: i, targetMember: member }
    }
  }
  return { targetIndex: -1, targetMember: null }
}

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
  memberUpdater: (member: BandMember) => MemberUpdaterResult
): GameState => {
  const { memberId, type, successToast, getSuccessToast } = payload
  const currentVisits = finiteNumberOr(state.player?.clinicVisits, 0)
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

  const { targetIndex, targetMember } = findBandMember(
    state.band.members,
    memberId
  )

  if (targetIndex === -1 || !targetMember) {
    logger.warn('ClinicReducer', 'Target member not found in band')
    return state
  }

  const memberUpdateResult = memberUpdater(targetMember)
  const updatedMember =
    'updatedMember' in memberUpdateResult
      ? memberUpdateResult.updatedMember
      : memberUpdateResult

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
      clinicVisits: currentVisits + 1
    },
    band: {
      ...state.band,
      members: updatedMembers
    }
  }

  // Append success toast atomically so it only appears when the action succeeds
  const toastArgsArray =
    memberUpdateResult && 'toastArgs' in memberUpdateResult
      ? memberUpdateResult.toastArgs
      : undefined
  const finalSuccessToast =
    successToast ||
    (typeof getSuccessToast === 'function' && toastArgsArray
      ? (getSuccessToast as (...args: unknown[]) => unknown)(...toastArgsArray)
      : null)
  // Action creators stamp toast UUIDs; this fallback only covers reducer-built
  // or malformed toasts and must stay deterministic (reducer purity).
  const safeToast = sanitizeSuccessToast(finalSuccessToast, {
    fallbackId: buildDeterministicToastId('clinic-toast', state.toasts)
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
  const moneyGain = Math.max(0, finiteNumberOr(safePayload.moneyGain, 0))
  const harmonyCost = Math.max(0, finiteNumberOr(safePayload.harmonyCost, 0))
  const staminaCost = Math.max(0, finiteNumberOr(safePayload.staminaCost, 0))
  const controversyGain = Math.max(
    0,
    finiteNumberOr(safePayload.controversyGain, 0)
  )
  const successToast = safePayload.successToast

  // Validate members array
  if (!Array.isArray(state.band.members) || state.band.members.length === 0) {
    logger.warn('ClinicReducer', 'band.members is missing or empty')
    return state
  }

  let membersChanged = false
  const sourceMembers = state?.band?.members || []
  // ⚡ BOLT OPTIMIZATION: Replaced .map() with procedural loop.
  // Why: Avoids closure allocation and intermediate arrays in hot paths.
  const normalizedMembers: BandMember[] = new Array(sourceMembers.length)
  for (let i = 0; i < sourceMembers.length; i++) {
    const sourceMember = sourceMembers[i]
    if (!sourceMember) continue
    const member = sourceMember as BandMember
    const stamina = finiteNumberOr(member?.stamina, 0)
    const staminaMax = finiteNumberOr(member?.staminaMax, 100)

    if (stamina !== member?.stamina || staminaMax !== member?.staminaMax) {
      membersChanged = true
      normalizedMembers[i] = { ...member, stamina, staminaMax }
    } else {
      normalizedMembers[i] = member
    }
  }

  const normalizedState = membersChanged
    ? { ...state, band: { ...state?.band, members: normalizedMembers } }
    : state

  if (
    !validateBloodBankDonation(normalizedState.band, {
      harmonyCost,
      staminaCost
    })
  ) {
    logger.warn('ClinicReducer', 'Rejected unaffordable blood-bank donation')
    return state
  }

  const currentMoney = finiteNumberOr(normalizedState.player?.money, 0)
  const nextMoney = clampPlayerMoney(currentMoney + moneyGain)

  const currentHarmony = finiteNumberOr(normalizedState.band?.harmony, 50)
  const nextHarmony = clampBandHarmony(currentHarmony - harmonyCost)

  const currentControversy = finiteNumberOr(
    normalizedState.social?.controversyLevel,
    0
  )
  const nextControversy = clampControversyLevel(
    currentControversy + controversyGain
  )

  // Apply stamina drain to all members and calculate actual loss
  let totalStaminaLost = 0
  // ⚡ BOLT OPTIMIZATION: Replaced .map() with procedural loop.
  // Why: Avoids closure allocation and intermediate arrays in hot paths.
  const updatedMembers: BandMember[] = new Array(
    normalizedState.band.members.length
  )
  for (let i = 0; i < normalizedState.band.members.length; i++) {
    const sourceMember = normalizedState.band.members[i]
    if (!sourceMember) continue
    const member = sourceMember as BandMember
    const prevStamina = finiteNumberOr(member?.stamina, 0)
    const nextStamina = clampMemberStamina(
      prevStamina - staminaCost,
      finiteNumberOr(member?.staminaMax, 100)
    )
    totalStaminaLost += prevStamina - nextStamina
    updatedMembers[i] = {
      ...member,
      stamina: nextStamina
    }
  }

  const nextState = {
    ...normalizedState,
    player: {
      ...normalizedState.player,
      money: nextMoney
    },
    band: {
      ...normalizedState.band,
      harmony: nextHarmony,
      members: updatedMembers
    },
    social: {
      ...normalizedState.social,
      controversyLevel: nextControversy
    }
  }

  if (successToast) {
    const deltaMoney = nextMoney - currentMoney
    const deltaHarmony = currentHarmony - nextHarmony // Expressed as a positive cost
    const deltaControversy = nextControversy - currentControversy

    const safeToast = sanitizeSuccessToast(successToast, {
      fallbackId: buildDeterministicToastId(
        'blood-bank-toast',
        normalizedState.toasts
      ),
      optionsPatch: {
        deltaMoney: formatCurrency(deltaMoney, i18n.language, 'always'),
        deltaHarmony,
        deltaControversy,
        deltaStamina: totalStaminaLost
      }
    })
    if (safeToast) {
      nextState.toasts = [...(normalizedState.toasts || []), safeToast]
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
/**
 * Handles grafting the Neuro-Overclock trait onto a band member.
 * Costs money and permanently mutates the member's traits.
 * Enforces state safety boundaries.
 */
export const handleGraftNeuroOverclock = (
  state: GameState,
  payload: { memberId: string }
): GameState => {
  if (!state.player || !state.band) {
    logger.warn(
      'ClinicReducer',
      'handleGraftNeuroOverclock: Missing player or band state'
    )
    return state
  }

  if (
    !Number.isFinite(state.player.money) ||
    state.player.money < CLINIC_GRAFT_COST
  ) {
    return state // Can't afford
  }

  const { memberId } = payload
  const memberIndex = state.band.members.findIndex(
    (m: import('../../types/band').BandMember) => m.id === memberId
  )

  if (memberIndex === -1) {
    logger.warn(
      'ClinicReducer',
      `handleGraftNeuroOverclock: Member ${memberId} not found`
    )
    return state
  }

  const member = state.band.members[memberIndex]
  if (member.traits && member.traits['neuro_overclock']) {
    return state // Already grafted
  }

  return {
    ...state,
    player: {
      ...state.player,
      money: clampPlayerMoney(finiteNumberOr(state.player?.money, 0) - CLINIC_GRAFT_COST)
    },
    band: {
      ...state.band,
      members: state.band.members.map(
        (
          m: import('../../types/band').BandMember & {
            health?: number
            stress?: number
            traits?: string[]
          },
          i: number
        ) => {
          if (i !== memberIndex) return m
          return {
            ...m,
            health: Math.max(1, finiteNumberOr(m.health, 100) - 20),
            stress: Math.min(100, finiteNumberOr(m.stress, 0) + 30),
            traits: {
              ...(m.traits || {}),
              neuro_overclock: getTraitById('neuro_overclock') || {
                id: 'neuro_overclock',
                name: 'traits:neuro_overclock.name',
                description: 'traits:neuro_overclock.description',
                effects: {
                  rhythmMultiplier: 1.5,
                  stressPerGig: 5,
                  healthPerGig: -10
                }
              }
            }
          }
        }
      )
    },
    toasts: [
      ...(state.toasts || []),
      {
        id: buildDeterministicToastId('clinic-graft-toast', state.toasts),
        messageKey: 'ui:clinic.graft_success',
        type: 'success'
      }
    ]
  }
}

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
  if (state.band) {
    const { targetMember } = findBandMember(state.band.members, memberId)
    if (targetMember && hasTrait(targetMember, resolvedTrait.id)) {
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

    // Remove mutually exclusive traits
    removeExclusiveTraits(updatedTraits, resolvedTrait)

    return {
      updatedMember: {
        ...member,
        traits: updatedTraits
      }
    }
  })
}
