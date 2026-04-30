import type { GameState } from '../../types/game'
import { logger } from '../../utils/logger'
import {
  clampVanCondition,
  clampPlayerMoney,
  clampBandHarmony,
  clampVanFuel
} from '../../utils/gameStateUtils'
import {
  calculateTravelExpenses,
  calculateTravelMinigameResult,
  calculateRoadieMinigameResult,
  calculateKabelsalatMinigameResult,
  calculateAmpCalibrationResult
} from '../../utils/economyEngine'
import { checkTraitUnlocks } from '../../utils/unlockCheck'
import { applyTraitUnlocks } from '../../utils/traitUtils'
import { computeDropChance } from '../../utils/contrabandUtils'
import { normalizeVenueId } from '../../utils/mapUtils'
import { addContrabandHelper } from './bandReducer'
import {
  GAME_PHASES,
  MINIGAME_TYPES,
  DEFAULT_MINIGAME_STATE,
  DEFAULT_EQUIPMENT_COUNT
} from '../gameConstants'

export const handleStartTravelMinigame = (
  state: GameState,
  payload: { targetNodeId: string }
): GameState => {
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

export const handleCompleteTravelMinigame = (
  state: GameState,
  payload: {
    damageTaken: number
    itemsCollected: unknown[]
    rngValue?: number
    contrabandId?: string
    instanceId?: string
  }
): GameState => {
  const { damageTaken, itemsCollected, rngValue, contrabandId, instanceId } =
    payload
  logger.info('GameState', 'Travel Minigame Complete', payload)

  // Apply Travel Results
  const targetDestination = state.minigame.targetDestination
  const targetId =
    typeof targetDestination === 'string' ? targetDestination : null
  const targetNode = targetId ? state.gameMap?.nodes?.[targetId] : undefined
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
  const nextCondition = clampVanCondition(
    state.player.van.condition - conditionLoss
  )

  const venueObj =
    typeof targetNode.venue === 'object' && targetNode.venue !== null
      ? (targetNode.venue as Record<string, unknown>)
      : null
  const canonicalVenueId =
    (typeof targetNode.venue === 'string'
      ? normalizeVenueId(targetNode.venue)
      : null) ??
    (typeof targetNode.venueId === 'string'
      ? normalizeVenueId(targetNode.venueId)
      : typeof venueObj?.id === 'string'
        ? normalizeVenueId(venueObj.id)
        : null)
  const canonicalVenueLocation =
    typeof canonicalVenueId === 'string' && canonicalVenueId.length > 0
      ? `venues:${canonicalVenueId}.name`
      : null
  const nextLocation =
    canonicalVenueLocation ??
    (typeof venueObj?.name === 'string'
      ? venueObj.name
      : typeof targetNode.venue === 'string'
        ? targetNode.venue
        : 'Unknown')
  const nextPlayer = {
    ...state.player,
    money: nextMoney,
    location: nextLocation,
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

  let newState: GameState = {
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
    const preStashItem = newState.band.stash
      ? (newState.band.stash[contrabandId] as
          | Record<string, unknown>
          | undefined)
      : undefined
    const preStacks = preStashItem
      ? (preStashItem.stacks as number | undefined) || 0
      : 0

    newState = addContrabandHelper(newState, { contrabandId, instanceId })

    // Determine if item was actually added (length increased, or stacks increased)
    const postItem = newState.band?.stash?.[contrabandId] as
      | Record<string, unknown>
      | undefined
    const postStacks = postItem
      ? (postItem.stacks as number | undefined) || 0
      : 0
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

export const handleStartRoadieMinigame = (
  state: GameState,
  payload: { gigId: string }
): GameState => {
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

export const handleStartAmpCalibration = (
  state: GameState,
  payload: { gigId: string }
): GameState => {
  const { gigId } = payload
  logger.info('GameState', `Starting Amp Calibration Minigame for Gig ${gigId}`)
  return {
    ...state,
    currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
    minigame: {
      ...DEFAULT_MINIGAME_STATE,
      active: true,
      type: MINIGAME_TYPES.AMP_CALIBRATION,
      gigId: gigId
    }
  }
}

export const handleCompleteAmpCalibration = (
  state: GameState,
  payload: Record<string, unknown>
): GameState => {
  const { score } = payload
  logger.info('GameState', 'Amp Calibration Minigame Complete', payload)

  // Apply Results
  const { stress, reward } = calculateAmpCalibrationResult(score, state.band)

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
    logger.warn('GameState', 'Amp Calibration failed: damaged_gear active')
    nextModifiers.damaged_gear = true
  }

  // Keep minigame.type set so SceneRouter continues rendering AmpCalibrationScene
  // while its completion overlay is visible. Scene transition (and final reset)
  // is driven by the UI overlay's CONTINUE button via changeScene(GIG).
  return {
    ...state,
    band: nextBand,
    player: nextPlayer,
    gigModifiers: nextModifiers,
    minigame: { ...state.minigame, active: false }
  }
}

export const handleStartKabelsalatMinigame = (
  state: GameState,
  payload: { gigId: string }
): GameState => {
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

export const handleCompleteKabelsalatMinigame = (
  state: GameState,
  payload: Record<string, unknown>
): GameState => {
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

  // Keep minigame.type set so SceneRouter continues rendering KabelsalatScene
  // while its completion overlay is visible. Scene transition is driven by
  // useKabelsalatGameEnd's changeScene(GIG) call after the delay.
  return {
    ...state,
    band: nextBand,
    player: nextPlayer,
    gigModifiers: nextModifiers,
    minigame: { ...state.minigame, active: false }
  }
}

export const handleCompleteRoadieMinigame = (
  state: GameState,
  payload: { equipmentDamage: number }
): GameState => {
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

  // Keep minigame.type set so SceneRouter continues rendering RoadieRunScene
  // while its completion overlay is visible. The CONTINUE button drives
  // changeScene(GIG) via the scene's onComplete callback.
  return {
    ...state,
    band: nextBand,
    player: nextPlayer,
    gigModifiers: nextModifiers,
    minigame: { ...state.minigame, active: false }
  }
}
