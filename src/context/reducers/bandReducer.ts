import { logger } from '../../utils/logger'
import {
  clampBandHarmony,
  clampMemberMood,
  clampMemberStamina,
  applyInventoryItemDelta,
  isForbiddenKey
} from '../../utils/gameStateUtils'
import { applyTraitUnlocks } from '../../utils/traitUtils'
import { ActionTypes } from '../actionTypes'
import { CONTRABAND_BY_ID } from '../../data/contraband'
import type {
  BandMember,
  BandState,
  GameAction,
  GameState,
  UpdateBandPayload
} from '../../types/game'

/**
 * Handles band update actions
 * Clamps band.harmony to valid range 1-100
 * @param {Object} state - Current state
 * @param {Object} payload - Band updates
 * @returns {Object} Updated state
 */
export const handleUpdateBand = (
  state: GameState,
  payload: UpdateBandPayload
): GameState => {
  if (!payload) return state
  logger.debug('GameState', 'Update Band', payload)
  const updates = typeof payload === 'function' ? payload(state.band) : payload

  if (
    !updates ||
    typeof updates !== 'object' ||
    Array.isArray(updates) ||
    Object.keys(updates).some(isForbiddenKey)
  ) {
    return state
  }

  let nextHarmony = state.band.harmony
  if ('harmony' in updates) {
    // Explicit bounds check mandated by [STATE_SAFETY] critical rules
    nextHarmony = clampBandHarmony(
      (updates.harmony as number | undefined) ?? nextHarmony
    )
  }

  const mergedBand = {
    ...state.band,
    ...updates,
    harmony: nextHarmony
  }

  return { ...state, band: mergedBand }
}

/**
 * Handles explicit trait unlocking via action.
 * @param {Object} state - Current state
 * @param {Object} payload - { memberId, traitId }
 * @returns {Object} Updated state
 */
export const handleUnlockTrait = (
  state: GameState,
  payload: { memberId: string; traitId: string }
): GameState => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return state
  }

  const { memberId, traitId } = payload
  if (
    !memberId ||
    !traitId ||
    isForbiddenKey(memberId) ||
    isForbiddenKey(traitId)
  )
    return state

  const traitResult = applyTraitUnlocks(state, [{ memberId, traitId }])

  return {
    ...state,
    band: traitResult.band,
    toasts: traitResult.toasts
  }
}

/**
 * Handles item consumption
 * @param {Object} state - Current state
 * @param {string} payload - Item type to consume
 * @returns {Object} Updated state
 */
export const handleConsumeItem = (
  state: GameState,
  payload: string
): GameState => {
  const itemType = payload
  if (
    !itemType ||
    typeof itemType !== 'string' ||
    isForbiddenKey(itemType) ||
    itemType.length === 0
  ) {
    return state
  }

  const nextBand = { ...state.band }
  // Deep clone inventory
  nextBand.inventory = { ...state.band.inventory }

  if (nextBand.inventory[itemType] === true) {
    nextBand.inventory[itemType] = false
  } else if (typeof nextBand.inventory[itemType] === 'number') {
    nextBand.inventory[itemType] = applyInventoryItemDelta(
      nextBand.inventory[itemType] as number,
      -1
    )
  }

  return { ...state, band: nextBand }
}

/**
 * Pure helper function to handle adding contraband.
 * Extracted to avoid tight coupling between reducers.
 */
export const addContrabandHelper = (
  state: GameState,
  payload: { contrabandId: string; instanceId?: string }
): GameState => {
  const { contrabandId, instanceId } = payload
  if (isForbiddenKey(contrabandId)) return state
  const item = CONTRABAND_BY_ID.get(contrabandId)
  if (!item) return state

  const newBand = { ...state.band }
  const currentStash = newBand.stash || {}

  // Handle stackable logic and uniqueness
  const existingItem = currentStash[item.id] as
    | Record<string, unknown>
    | undefined
  if (existingItem) {
    if (!item.stackable) {
      return state // Don't add duplicate non-stackable items
    } else {
      const currentStacks = (existingItem.stacks as number | undefined) ?? 1
      const max = (item.maxStacks as number) || Infinity
      if (currentStacks < max) {
        newBand.stash = Object.assign(Object.create(null), currentStash, {
          [item.id]: {
            ...existingItem,
            stacks: currentStacks + 1
          }
        })
        return { ...state, band: newBand }
      } else {
        return state // Reached max stacks
      }
    }
  }

  const newInstance = {
    ...item,
    instanceId,
    remainingDuration: (item.duration as number | undefined) ?? null,
    applied: !!item.applyOnAdd,
    stacks: item.stackable ? 1 : undefined
  }

  newBand.stash = Object.assign(Object.create(null), currentStash, {
    [item.id]: newInstance
  })

  if (item.applyOnAdd && item.type === 'equipment') {
    if (item.effectType === 'luck') {
      newBand.luck = (newBand.luck || 0) + (item.value as number)
    } else if (item.effectType === 'stamina_max') {
      newBand.members = newBand.members.map((m: BandMember) => ({
        ...m,
        staminaMax:
          ((m.staminaMax as number | undefined) ?? 100) + (item.value as number)
      }))
    } else if (item.effectType === 'guitar_difficulty') {
      newBand.performance = {
        ...newBand.performance,
        guitarDifficulty: Math.max(
          0.1,
          (newBand.performance?.guitarDifficulty ?? 1) + (item.value as number)
        )
      }
    } else if (item.effectType === 'crit') {
      newBand.crit = ((newBand.crit as number) || 0) + (item.value as number)
    } else if (item.effectType === 'crowd_control') {
      newBand.crowdControl =
        ((newBand.crowdControl as number) || 0) + (item.value as number)
    } else if (item.effectType === 'affinity') {
      newBand.affinity =
        ((newBand.affinity as number) || 0) + (item.value as number)
    } else if (item.effectType === 'style') {
      newBand.style = ((newBand.style as number) || 0) + (item.value as number)
    } else if (item.effectType === 'tour_success') {
      newBand.tourSuccess =
        ((newBand.tourSuccess as number) || 0) + (item.value as number)
    }
  }

  return {
    ...state,
    band: newBand
  }
}

/**
 * Handles adding contraband to the stash.
 * @param {Object} state - Current state
 * @param {Object} payload - { contrabandId, instanceId }
 * @returns {Object} Updated state
 */
export const handleAddContraband = (
  state: GameState,
  payload: { contrabandId: string; instanceId?: string }
): GameState => {
  return addContrabandHelper(state, payload)
}

/**
 * Pure helper function to apply the effect of a contraband item.
 * @param {Object} band - Current band state
 * @param {Object} item - Contraband item to apply
 * @param {string} memberId - Target member ID for targeted effects
 * @returns {Object|null} Updated band object, or null if application fails (e.g. invalid target)
 */
export const applyContrabandEffect = (
  band: BandState,
  item: Record<string, unknown>,
  memberId: string | undefined
): BandState | null => {
  const newBand = { ...band }

  if (item.effectType === 'stamina' || item.effectType === 'mood') {
    if (
      !memberId ||
      !newBand.members.some((m: BandMember) => m.id === memberId)
    ) {
      return null
    }
    newBand.members = newBand.members.map((m: BandMember) => {
      if (m.id === memberId) {
        const key = item.effectType as 'stamina' | 'mood'
        return {
          ...m,
          [key]:
            key === 'stamina'
              ? clampMemberStamina(
                  ((m[key] as number) || 0) + (item.value as number),
                  m.staminaMax as number
                )
              : clampMemberMood(
                  ((m[key] as number) || 0) + (item.value as number)
                )
        }
      }
      return m
    })
    return newBand
  } else if (item.effectType === 'harmony') {
    newBand.harmony = clampBandHarmony(
      (newBand.harmony || 0) + (item.value as number)
    )
  } else if (item.effectType === 'luck') {
    newBand.luck = (newBand.luck || 0) + (item.value as number)
  } else if (item.effectType === 'guitar_difficulty') {
    newBand.performance = {
      ...newBand.performance,
      guitarDifficulty: Math.max(
        0.1,
        (newBand.performance?.guitarDifficulty ?? 1) + (item.value as number)
      )
    }
  } else if (
    item.effectType === 'tour_success' ||
    item.effectType === 'gig_modifier' ||
    item.effectType === 'tempo' ||
    item.effectType === 'practice_gain' ||
    item.effectType === 'stamina_max' ||
    item.effectType === 'crit' ||
    item.effectType === 'affinity' ||
    item.effectType === 'style' ||
    item.effectType === 'crowd_control'
  ) {
    if (item.effectType === 'stamina_max') {
      newBand.members = newBand.members.map((m: BandMember) => ({
        ...m,
        staminaMax:
          ((m.staminaMax as number | undefined) ?? 100) + (item.value as number)
      }))
    } else if (item.effectType === 'style') {
      newBand.style = ((newBand.style as number) || 0) + (item.value as number)
    } else if (item.effectType === 'tour_success') {
      newBand.tourSuccess =
        ((newBand.tourSuccess as number) || 0) + (item.value as number)
    } else if (item.effectType === 'gig_modifier') {
      newBand.gigModifier =
        ((newBand.gigModifier as number) || 0) + (item.value as number)
    } else if (item.effectType === 'tempo') {
      newBand.tempo = ((newBand.tempo as number) || 0) + (item.value as number)
    } else if (item.effectType === 'practice_gain') {
      newBand.practiceGain =
        ((newBand.practiceGain as number) || 0) + (item.value as number)
    } else if (item.effectType === 'crit') {
      newBand.crit = ((newBand.crit as number) || 0) + (item.value as number)
    } else if (item.effectType === 'affinity') {
      newBand.affinity =
        ((newBand.affinity as number) || 0) + (item.value as number)
    } else if (item.effectType === 'crowd_control') {
      newBand.crowdControl =
        ((newBand.crowdControl as number) || 0) + (item.value as number)
    }
  }

  if (item.duration != null) {
    newBand.activeContrabandEffects = [
      ...(newBand.activeContrabandEffects || []),
      {
        instanceId: item.instanceId,
        effectType: item.effectType,
        value: item.value,
        remainingDuration: item.duration,
        ...(memberId ? { memberId } : {})
      }
    ]
  }

  return newBand
}

/**
 * Handles using a contraband item.
 * @param {Object} state - Current state
 * @param {Object} payload - { instanceId, contrabandId, memberId }
 * @returns {Object} Updated state
 */
export const handleUseContraband = (
  state: GameState,
  payload: { instanceId: string; contrabandId: string; memberId?: string }
): GameState => {
  const { instanceId, contrabandId, memberId } = payload
  const stash = state.band.stash || {}

  if (typeof contrabandId !== 'string' || contrabandId.length === 0)
    return state

  if (!Object.hasOwn(stash, contrabandId) || isForbiddenKey(contrabandId)) {
    return state
  }

  const item = stash[contrabandId] as Record<string, unknown>
  if (!item) return state
  if (item.instanceId !== undefined && item.instanceId !== instanceId)
    return state

  if (item.applied === true) return state
  const itemKey = contrabandId

  const newBand = applyContrabandEffect(state.band, item, memberId)
  if (!newBand) return state

  const newStash = Object.assign(Object.create(null), stash)

  if (item.type === 'consumable') {
    if ((item.stacks as number) > 1) {
      newStash[itemKey] = { ...item, stacks: (item.stacks as number) - 1 }
    } else {
      delete newStash[itemKey]
    }
  } else {
    newStash[itemKey] = { ...newStash[itemKey], applied: true }
  }

  newBand.stash = newStash
  return { ...state, band: newBand }
}

/**
 * Reducer for band actions.
 * Extracts the subset of actions specific to the band context.
 * @param {Object} state - Current state
 * @param {Object} action - Action with type and payload
 * @returns {Object} New state
 */
export const bandReducer = (
  state: GameState,
  action: GameAction
): GameState => {
  if (!('payload' in action)) return state

  switch (action.type) {
    case ActionTypes.UPDATE_BAND:
      return handleUpdateBand(state, action.payload as UpdateBandPayload)
    case ActionTypes.UNLOCK_TRAIT:
      return handleUnlockTrait(
        state,
        action.payload as { memberId: string; traitId: string }
      )
    case ActionTypes.CONSUME_ITEM:
      return handleConsumeItem(state, action.payload as string)
    case ActionTypes.ADD_CONTRABAND:
      return handleAddContraband(
        state,
        action.payload as { contrabandId: string; instanceId?: string }
      )
    case ActionTypes.USE_CONTRABAND:
      return handleUseContraband(
        state,
        action.payload as {
          instanceId: string
          contrabandId: string
          memberId?: string
        }
      )
    default:
      return state
  }
}
