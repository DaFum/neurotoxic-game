// TODO: Review this file
import { logger } from '../../utils/logger.js'
import {
  clampBandHarmony,
  clampMemberMood,
  clampMemberStamina,
  applyInventoryItemDelta
} from '../../utils/gameStateUtils.js'
import { applyTraitUnlocks } from '../../utils/traitUtils.js'
import { CONTRABAND_BY_ID } from '../../data/contraband.js'

/**
 * Handles band update actions
 * Clamps band.harmony to valid range 1-100
 * @param {Object} state - Current state
 * @param {Object} payload - Band updates
 * @returns {Object} Updated state
 */
export const handleUpdateBand = (state, payload) => {
  logger.debug('GameState', 'Update Band', payload)
  const updates = typeof payload === 'function' ? payload(state.band) : payload

  let nextHarmony = state.band.harmony
  if ('harmony' in updates) {
    // Explicit bounds check mandated by [STATE_SAFETY] critical rules
    nextHarmony = Math.max(1, Math.min(100, clampBandHarmony(updates.harmony)))
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
export const handleUnlockTrait = (state, payload) => {
  const { memberId, traitId } = payload
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
export const handleConsumeItem = (state, payload) => {
  const itemType = payload
  const nextBand = { ...state.band }
  // Deep clone inventory
  nextBand.inventory = { ...state.band.inventory }

  if (nextBand.inventory[itemType] === true) {
    nextBand.inventory[itemType] = false
  } else if (typeof nextBand.inventory[itemType] === 'number') {
    nextBand.inventory[itemType] = applyInventoryItemDelta(
      nextBand.inventory[itemType],
      -1
    )
  }

  return { ...state, band: nextBand }
}

/**
 * Pure helper function to handle adding contraband.
 * Extracted to avoid tight coupling between reducers.
 */
export const addContrabandHelper = (state, payload) => {
  const { contrabandId, instanceId } = payload
  const item = CONTRABAND_BY_ID.get(contrabandId)
  if (!item) return state

  const newBand = { ...state.band }
  const currentStash = newBand.stash || {}

  // Handle stackable logic and uniqueness
  const existingItem = currentStash[item.id]
  if (existingItem) {
    if (!item.stackable) {
      return state // Don't add duplicate non-stackable items
    } else {
      const currentStacks = existingItem.stacks || 1
      const max = item.maxStacks || Infinity
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
    remainingDuration: item.duration || null,
    applied: !!item.applyOnAdd,
    stacks: item.stackable ? 1 : undefined
  }

  newBand.stash = Object.assign(Object.create(null), currentStash, {
    [item.id]: newInstance
  })

  if (item.applyOnAdd && item.type === 'equipment') {
    if (item.effectType === 'luck') {
      newBand.luck = (newBand.luck || 0) + item.value
    } else if (item.effectType === 'stamina_max') {
      newBand.members = newBand.members.map(m => ({
        ...m,
        staminaMax: (m.staminaMax || 100) + item.value
      }))
    } else if (item.effectType === 'guitar_difficulty') {
      newBand.performance = {
        ...newBand.performance,
        guitarDifficulty: Math.max(
          0.1,
          (newBand.performance?.guitarDifficulty || 1) + item.value
        )
      }
    } else if (item.effectType === 'crit') {
      newBand.crit = (newBand.crit || 0) + item.value
    } else if (item.effectType === 'crowd_control') {
      newBand.crowdControl = (newBand.crowdControl || 0) + item.value
    } else if (item.effectType === 'affinity') {
      newBand.affinity = (newBand.affinity || 0) + item.value
    } else if (item.effectType === 'style') {
      newBand.style = (newBand.style || 0) + item.value
    } else if (item.effectType === 'tour_success') {
      newBand.tourSuccess = (newBand.tourSuccess || 0) + item.value
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
export const handleAddContraband = (state, payload) => {
  return addContrabandHelper(state, payload)
}

/**
 * Pure helper function to apply the effect of a contraband item.
 * @param {Object} band - Current band state
 * @param {Object} item - Contraband item to apply
 * @param {string} memberId - Target member ID for targeted effects
 * @returns {Object|null} Updated band object, or null if application fails (e.g. invalid target)
 */
export const applyContrabandEffect = (band, item, memberId) => {
  const newBand = { ...band }

  if (item.effectType === 'stamina' || item.effectType === 'mood') {
    if (!memberId || !newBand.members.some(m => m.id === memberId)) {
      return null
    }
    newBand.members = newBand.members.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          [item.effectType]:
            item.effectType === 'stamina'
              ? clampMemberStamina(
                  (m[item.effectType] || 0) + item.value,
                  m.staminaMax
                )
              : clampMemberMood((m[item.effectType] || 0) + item.value)
        }
      }
      return m
    })
    return newBand
  } else if (item.effectType === 'harmony') {
    newBand.harmony = clampBandHarmony((newBand.harmony || 0) + item.value)
  } else if (item.effectType === 'luck') {
    newBand.luck = (newBand.luck || 0) + item.value
  } else if (item.effectType === 'guitar_difficulty') {
    newBand.performance = {
      ...newBand.performance,
      guitarDifficulty: Math.max(
        0.1,
        (newBand.performance?.guitarDifficulty ?? 1) + item.value
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
      newBand.members = newBand.members.map(m => ({
        ...m,
        staminaMax: (m.staminaMax || 100) + item.value
      }))
    } else if (item.effectType === 'style') {
      newBand.style = (newBand.style || 0) + item.value
    } else if (item.effectType === 'tour_success') {
      newBand.tourSuccess = (newBand.tourSuccess || 0) + item.value
    } else if (item.effectType === 'gig_modifier') {
      newBand.gigModifier = (newBand.gigModifier || 0) + item.value
    } else if (item.effectType === 'tempo') {
      newBand.tempo = (newBand.tempo || 0) + item.value
    } else if (item.effectType === 'practice_gain') {
      newBand.practiceGain = (newBand.practiceGain || 0) + item.value
    } else if (item.effectType === 'crit') {
      newBand.crit = (newBand.crit || 0) + item.value
    } else if (item.effectType === 'affinity') {
      newBand.affinity = (newBand.affinity || 0) + item.value
    } else if (item.effectType === 'crowd_control') {
      newBand.crowdControl = (newBand.crowdControl || 0) + item.value
    }
  }

  if (item.duration) {
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
export const handleUseContraband = (state, payload) => {
  const { instanceId, contrabandId, memberId } = payload
  const stash = state.band.stash || {}

  if (typeof contrabandId !== 'string' || contrabandId.length === 0)
    return state

  if (
    !Object.hasOwn(stash, contrabandId) ||
    contrabandId === '__proto__' ||
    contrabandId === 'prototype' ||
    contrabandId === 'constructor'
  ) {
    return state
  }

  const item = stash[contrabandId]
  if (!item) return state
  if (item.instanceId !== undefined && item.instanceId !== instanceId)
    return state

  if (item.applied === true) return state
  const itemKey = contrabandId

  const newBand = applyContrabandEffect(state.band, item, memberId)
  if (!newBand) return state

  let newStash = Object.assign(Object.create(null), stash)

  if (item.type === 'consumable') {
    if (item.stacks > 1) {
      newStash[itemKey] = { ...item, stacks: item.stacks - 1 }
    } else {
      delete newStash[itemKey]
    }
  } else {
    newStash[itemKey] = { ...newStash[itemKey], applied: true }
  }

  newBand.stash = newStash
  return { ...state, band: newBand }
}
