import { logger } from '../../utils/logger.js'
import {
  clampBandHarmony,
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
    nextHarmony = clampBandHarmony(updates.harmony)
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
        newBand.stash = {
          ...currentStash,
          [item.id]: {
            ...existingItem,
            stacks: currentStacks + 1
          }
        }
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

  newBand.stash = {
    ...currentStash,
    [item.id]: newInstance
  }

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
 * Handles using a contraband item.
 * @param {Object} state - Current state
 * @param {Object} payload - { instanceId, contrabandId, memberId }
 * @returns {Object} Updated state
 */
export const handleUseContraband = (state, payload) => {
  const { instanceId, contrabandId, memberId } = payload
  const stash = state.band.stash || {}

  const item = stash[contrabandId]
  if (!item || item.instanceId !== instanceId) return state

  if (item.applied === true) return state
  const itemKey = contrabandId

  let newBand = { ...state.band }
  let newStash = { ...stash }

  // Apply effect
  if (item.effectType === 'stamina' || item.effectType === 'mood') {
    if (!memberId || !newBand.members.some(m => m.id === memberId)) {
      return state
    }
    newBand.members = newBand.members.map(m => {
      if (m.id === memberId) {
        const maxVal = item.effectType === 'stamina' ? m.staminaMax || 100 : 100
        return {
          ...m,
          [item.effectType]: Math.min(
            maxVal,
            Math.max(0, (m[item.effectType] || 0) + item.value)
          )
        }
      }
      return m
    })
  } else if (item.effectType === 'harmony') {
    newBand.harmony = clampBandHarmony((newBand.harmony || 0) + item.value)
    if (item.duration) {
      newBand.activeContrabandEffects = [
        ...(newBand.activeContrabandEffects || []),
        {
          instanceId: item.instanceId,
          effectType: item.effectType,
          value: item.value,
          remainingDuration: item.duration
        }
      ]
    }
  } else if (item.effectType === 'luck') {
    newBand.luck = (newBand.luck || 0) + item.value
    if (item.duration) {
      newBand.activeContrabandEffects = [
        ...(newBand.activeContrabandEffects || []),
        {
          instanceId: item.instanceId,
          effectType: item.effectType,
          value: item.value,
          remainingDuration: item.duration
        }
      ]
    }
  } else if (item.effectType === 'guitar_difficulty') {
    newBand.performance = {
      ...newBand.performance,
      guitarDifficulty: Math.max(
        0.1,
        (newBand.performance?.guitarDifficulty ?? 1) + item.value
      )
    }
    if (item.duration) {
      newBand.activeContrabandEffects = [
        ...(newBand.activeContrabandEffects || []),
        {
          instanceId: item.instanceId,
          effectType: item.effectType,
          value: item.value,
          remainingDuration: item.duration
        }
      ]
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

    if (item.duration) {
      newBand.activeContrabandEffects = [
        ...(newBand.activeContrabandEffects || []),
        {
          instanceId: item.instanceId,
          effectType: item.effectType,
          value: item.value,
          remainingDuration: item.duration
        }
      ]
    }
  }

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
