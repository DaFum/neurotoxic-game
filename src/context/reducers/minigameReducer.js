import { logger } from '../../utils/logger.js'
import {
  clampPlayerMoney,
  clampBandHarmony,
  clampVanFuel
} from '../../utils/gameStateUtils.js'
import {
  calculateTravelExpenses,
  calculateTravelMinigameResult,
  calculateRoadieMinigameResult,
  calculateKabelsalatMinigameResult
} from '../../utils/economyEngine.js'
import { checkTraitUnlocks } from '../../utils/unlockCheck.js'
import { applyTraitUnlocks } from '../../utils/traitUtils.js'
import { computeDropChance } from '../../utils/contrabandUtils.js'
import { addContrabandHelper } from './bandReducer.js'
import {
  GAME_PHASES,
  MINIGAME_TYPES,
  DEFAULT_MINIGAME_STATE,
  DEFAULT_EQUIPMENT_COUNT
} from '../gameConstants.js'

export const handleStartTravelMinigame = (state, payload) => {
  const { targetNodeId } = payload
  logger.info('GameState', `Starting Travel Minigame to ${targetNodeId}`)
  return {
    ...state,
    currentScene: GAME_PHASES.TRAVEL_MINIGAME,
    minigame: {
      ...DEFAULT_MINIGAME_STATE,
      active: true,
      type: MINIGAME_TYPES.TOURBUS,
      targetDestination: targetNodeId
    }
  }
}

export const handleCompleteTravelMinigame = (state, payload) => {
  const { damageTaken, itemsCollected, rngValue, contrabandId, instanceId } =
    payload
  logger.info('GameState', 'Travel Minigame Complete', payload)

  // Apply Travel Results
  const targetId = state.minigame.targetDestination
  const targetNode = state.gameMap?.nodes?.[targetId]
  const currentNode = state.gameMap?.nodes?.[state.player.currentNodeId]

  if (!targetNode) {
    logger.error('GameState', 'Complete Travel: Invalid Target', targetId)
    return {
      ...state,
      minigame: { ...DEFAULT_MINIGAME_STATE }
    }
  }

  const { dist, totalCost, fuelLiters } = calculateTravelExpenses(
    targetNode,
    currentNode,
    state.player,
    state.band
  )
  const { conditionLoss, fuelBonus } = calculateTravelMinigameResult(
    damageTaken,
    itemsCollected
  )

  const nextMoney = clampPlayerMoney(state.player.money - totalCost)
  const nextFuel = clampVanFuel(state.player.van.fuel - fuelLiters + fuelBonus)
  const nextCondition = Math.max(0, state.player.van.condition - conditionLoss)

  const nextPlayer = {
    ...state.player,
    money: nextMoney,
    location: targetNode.venue?.name || 'Unknown',
    currentNodeId: targetNode.id,
    totalTravels: state.player.totalTravels + 1,
    van: {
      ...state.player.van,
      fuel: nextFuel,
      condition: nextCondition
    },
    stats: {
      ...state.player.stats,
      totalDistance: (state.player.stats?.totalDistance || 0) + dist
    }
  }

  // Check Travel Unlocks
  const travelUnlocks = checkTraitUnlocks(
    { ...state, player: nextPlayer },
    { type: 'TRAVEL_COMPLETE' }
  )

  const traitResult = applyTraitUnlocks(
    { band: state.band, toasts: state.toasts },
    travelUnlocks
  )

  let newState = {
    ...state,
    player: nextPlayer,
    band: traitResult.band,
    toasts: traitResult.toasts,
    minigame: { ...DEFAULT_MINIGAME_STATE }
  }

  // --- Contraband drop logic ---
  const luck = newState.band?.luck || 0
  const chance = computeDropChance(undefined, luck)

  if (
    rngValue !== undefined &&
    rngValue < chance &&
    contrabandId &&
    instanceId
  ) {
    // Call addContrabandHelper directly to leverage its logic
    const preStashLength = newState.band.stash
      ? Object.keys(newState.band.stash).length
      : 0
    const preStacks = newState.band.stash
      ? newState.band.stash[contrabandId]?.stacks || 0
      : 0

    newState = addContrabandHelper(newState, { contrabandId, instanceId })

    // Determine if item was actually added (length increased, or stacks increased)
    const postItem = newState.band?.stash?.[contrabandId]
    const postStacks = postItem ? postItem.stacks || 0 : 0
    const postStashLength = Object.keys(newState.band?.stash || {}).length

    const wasAdded = postStashLength > preStashLength || postStacks > preStacks

    if (wasAdded) {
      // We reuse the existing toasts array and append our new toast
      // For deterministic action tests we could rely on a better ID generation strategy
      // but keeping it simple as it was for now. Toasts are often tricky.
      newState.toasts = [
        ...newState.toasts,
        {
          id: `toast-${instanceId}`,
          message: `ui:contraband.dropped`, // Use an i18n key or simple text
          type: 'info' // Could be 'success'
        }
      ]
    }
  }

  return newState
}

export const handleStartRoadieMinigame = (state, payload) => {
  const { gigId } = payload
  logger.info('GameState', `Starting Roadie Minigame for Gig ${gigId}`)
  return {
    ...state,
    currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
    minigame: {
      ...DEFAULT_MINIGAME_STATE,
      active: true,
      type: MINIGAME_TYPES.ROADIE,
      gigId: gigId,
      equipmentRemaining: DEFAULT_EQUIPMENT_COUNT
    }
  }
}

export const handleStartKabelsalatMinigame = (state, payload) => {
  const { gigId } = payload
  logger.info('GameState', `Starting Kabelsalat Minigame for Gig ${gigId}`)
  return {
    ...state,
    currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
    minigame: {
      ...DEFAULT_MINIGAME_STATE,
      active: true,
      type: MINIGAME_TYPES.KABELSALAT,
      gigId: gigId
    }
  }
}

export const handleCompleteKabelsalatMinigame = (state, payload) => {
  const { results } = payload
  logger.info('GameState', 'Kabelsalat Minigame Complete', payload)

  // Apply Results
  const { stress, reward } = calculateKabelsalatMinigameResult(
    results,
    state.band
  )

  const nextHarmony = clampBandHarmony(state.band.harmony - stress)
  const nextMoney = clampPlayerMoney(state.player.money + reward)

  const nextBand = {
    ...state.band,
    harmony: nextHarmony
  }

  const nextPlayer = {
    ...state.player,
    money: nextMoney
  }

  const nextModifiers = { ...state.gigModifiers }
  if (stress > 0) {
    logger.warn('GameState', 'Kabelsalat failed: damaged_gear active')
    nextModifiers.damaged_gear = true
  }

  return {
    ...state,
    band: nextBand,
    player: nextPlayer,
    gigModifiers: nextModifiers,
    minigame: { ...DEFAULT_MINIGAME_STATE }
  }
}

export const handleCompleteRoadieMinigame = (state, payload) => {
  const { equipmentDamage } = payload
  logger.info('GameState', 'Roadie Minigame Complete', payload)

  // Apply Results
  const { stress, repairCost } = calculateRoadieMinigameResult(
    equipmentDamage,
    state.band
  )

  const nextHarmony = clampBandHarmony(state.band.harmony - stress)
  const nextMoney = clampPlayerMoney(state.player.money - repairCost)

  const nextBand = {
    ...state.band,
    harmony: nextHarmony
  }

  const nextPlayer = {
    ...state.player,
    money: nextMoney
  }

  // Pass damage to gig modifiers or stats?
  const nextModifiers = { ...state.gigModifiers }
  if (equipmentDamage > 50) {
    // Apply a penalty for heavily damaged gear
    logger.warn(
      'GameState',
      'Heavy equipment damage applied: damaged_gear active'
    )
    nextModifiers.damaged_gear = true
  }

  return {
    ...state,
    band: nextBand,
    player: nextPlayer,
    gigModifiers: nextModifiers,
    minigame: { ...DEFAULT_MINIGAME_STATE }
    // Scene transition handled by UI overlay
  }
}
