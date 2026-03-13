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
 * Handles adding contraband to the stash.
 * @param {Object} state - Current state
 * @param {Object} payload - { contrabandId, instanceId }
 * @returns {Object} Updated state
 */
export const handleAddContraband = (state, payload) => {
  const { contrabandId, instanceId } = payload
  const item = CONTRABAND_BY_ID.get(contrabandId)
  if (!item) return state

  const newInstance = {
    ...item,
    instanceId
  }

  return {
    ...state,
    band: {
      ...state.band,
      stash: [...(state.band.stash || []), newInstance]
    }
  }
}

/**
 * Handles using a contraband item.
 * @param {Object} state - Current state
 * @param {Object} payload - { instanceId, memberId }
 * @returns {Object} Updated state
 */
export const handleUseContraband = (state, payload) => {
  const { instanceId, memberId } = payload
  const stash = state.band.stash || []
  const itemIndex = stash.findIndex(i => i.instanceId === instanceId)

  if (itemIndex === -1) return state

  const item = stash[itemIndex]
  if (item.type !== 'consumable') return state // prevent passive effect stacking
  let newBand = { ...state.band }
  let newStash = [...stash]

  // Apply effect
  if (item.effectType === 'stamina' || item.effectType === 'mood') {
    if (memberId) {
      newBand.members = newBand.members.map(m => {
        if (m.id === memberId) {
          return {
            ...m,
            [item.effectType]: Math.min(100, Math.max(0, m[item.effectType] + item.value))
          }
        }
        return m
      })
    }
  } else if (item.effectType === 'harmony') {
    newBand.harmony = clampBandHarmony(newBand.harmony + item.value)
  } else if (item.effectType === 'luck') {
    newBand.luck = (newBand.luck || 0) + item.value
  } else if (item.effectType === 'guitar_difficulty') {
    newBand.performance = {
      ...newBand.performance,
      guitarDifficulty: Math.max(0.1, newBand.performance.guitarDifficulty + item.value)
    }
  }

  // Remove the consumable item from stash
  newStash.splice(itemIndex, 1)

  newBand.stash = newStash
  return { ...state, band: newBand }
}
