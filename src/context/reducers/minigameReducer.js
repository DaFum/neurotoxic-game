import { logger } from '../../utils/logger.js'
import { clampPlayerMoney, clampBandHarmony } from '../../utils/gameStateUtils.js'
import {
  calculateTravelExpenses,
  calculateTravelMinigameResult,
  calculateRoadieMinigameResult
} from '../../utils/economyEngine.js'
import { checkTraitUnlocks } from '../../utils/unlockCheck.js'
import { applyTraitUnlocks } from '../../utils/traitUtils.js'
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
  const { damageTaken, itemsCollected } = payload
  logger.info('GameState', 'Travel Minigame Complete', payload)

  // Apply Travel Results
  const targetId = state.minigame.targetDestination
  const targetNode = state.gameMap?.nodes?.[targetId]
  const currentNode = state.gameMap?.nodes?.[state.player.currentNodeId]

  if (!targetNode) {
    logger.error('GameState', 'Complete Travel: Invalid Target', targetId)
    return {
      ...state,
      minigame: { ...DEFAULT_MINIGAME_STATE },
      currentScene: GAME_PHASES.OVERWORLD
    }
  }

  const { dist, totalCost, fuelLiters } = calculateTravelExpenses(
    targetNode,
    currentNode,
    state.player,
    state.band
  )
  const { conditionLoss } = calculateTravelMinigameResult(
    damageTaken,
    itemsCollected
  )

  const nextPlayer = {
    ...state.player,
    money: clampPlayerMoney(state.player.money - totalCost),
    location: targetNode.venue?.name || 'Unknown',
    currentNodeId: targetNode.id,
    totalTravels: state.player.totalTravels + 1,
    van: {
      ...state.player.van,
      fuel: Math.max(0, Math.min(100, state.player.van.fuel - fuelLiters)),
      condition: Math.max(0, state.player.van.condition - conditionLoss)
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

  return {
    ...state,
    player: nextPlayer,
    band: traitResult.band,
    toasts: traitResult.toasts,
    minigame: { ...DEFAULT_MINIGAME_STATE }
  }
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

export const handleCompleteRoadieMinigame = (state, payload) => {
  const { equipmentDamage } = payload
  logger.info('GameState', 'Roadie Minigame Complete', payload)

  // Apply Results
  const { stress, repairCost } = calculateRoadieMinigameResult(
    equipmentDamage,
    state.band
  )

  const nextBand = {
    ...state.band,
    harmony: clampBandHarmony(state.band.harmony - stress)
  }

  const nextPlayer = {
    ...state.player,
    money: clampPlayerMoney(state.player.money - repairCost)
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
