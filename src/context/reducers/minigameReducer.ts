import type { GameState } from '../../types'
import { logger } from '../../utils/logger'
import {
  clampVanCondition,
  clampPlayerMoney,
  clampBandHarmony,
  clampVanFuel,
  clampMemberStamina,
  clampUnitRandom,
  finiteNumberOr,
  isForbiddenKey,
  isFiniteNumber
} from '../../utils/gameState'
import {
  calculateTravelExpenses,
  calculateTravelMinigameResult,
  calculateRoadieMinigameResult,
  calculateKabelsalatMinigameResult,
  calculateAmpCalibrationResult
} from '../../utils/economyEngine'
import { getActiveAssetModifiers } from '../../utils/assetSelectors'
import { checkTraitUnlocks } from '../../utils/unlockCheck'
import { applyTraitUnlocks } from '../../utils/traitUtils'
import { computeDropChance } from '../../utils/contrabandUtils'
import { normalizeVenueId, getRegionKeyForLocation } from '../../utils/mapUtils'
import { addContrabandHelper } from './bandReducer'
import { pickRandomContraband } from '../../utils/contrabandUtils'
import {
  applySharedBandEffect,
  EQUIPMENT_APPLY_ON_ADD_EFFECTS
} from '../../utils/contrabandEffects'
import {
  MINIGAME_TYPES,
  DEFAULT_MINIGAME_STATE,
  DEFAULT_EQUIPMENT_COUNT
} from '../gameConstants'
import { MINIGAME_REGISTRY } from '../../utils/minigameRegistry'
import { QuestEvents } from '../../utils/questProgress'
import {
  createMinigameCompletedQuestEvent,
  createMinigameFailedQuestEvent,
  createMinigamePerfectQuestEvent
} from '../../quests/producers/minigameQuestEvents'
import {
  createItemCollectedQuestEvent,
  createItemDeliveredQuestEvent
} from '../../quests/producers/itemQuestEvents'
import { createTravelCompletedQuestEvent } from '../../quests/producers/travelQuestEvents'

/**
 * Starts the tourbus travel minigame for a selected destination node.
 *
 * @param state - Current game state before travel starts.
 * @param payload - Destination node id for the active travel minigame.
 * @returns Updated state with the travel minigame scene and target destination active.
 */
export const handleStartTravelMinigame = (
  state: GameState,
  payload: { targetNodeId: string }
): GameState => {
  const { targetNodeId } = payload
  logger.info('GameState', `Starting Travel Minigame to ${targetNodeId}`)
  return {
    ...state,
    currentScene: MINIGAME_REGISTRY.travel.scene,
    minigame: {
      ...DEFAULT_MINIGAME_STATE,
      active: true,
      type: MINIGAME_TYPES.TOURBUS,
      targetDestination: targetNodeId
    }
  }
}

/**
 * Applies travel minigame results while preserving scene continuation for the arrival flow.
 *
 * Returns unchanged state when no matching minigame is active (replay guard).
 *
 * @param state - Current game state with an active travel minigame.
 * @param payload - Reported damage, collected items, and optional deterministic random value.
 * @returns Updated state with travel costs, rewards, damage, unlocks, and quest progress applied.
 */
export const handleCompleteTravelMinigame = (
  state: GameState,
  payload: {
    damageTaken: number
    itemsCollected: unknown[]
    rngValue?: number
  }
): GameState => {
  if (
    state.minigame?.active !== true ||
    state.minigame?.type !== MINIGAME_TYPES.TOURBUS
  ) {
    return state
  }
  const { damageTaken: rawDamage, itemsCollected: rawItems, rngValue } = payload
  const damageTaken = Number.isFinite(rawDamage) ? Math.max(0, rawDamage) : 0
  const itemsCollected = Array.isArray(rawItems) ? rawItems : []
  const safeRngValue = clampUnitRandom(rngValue)
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

  const assetModifiers = getActiveAssetModifiers(state.assets ?? [])
  const { dist, totalCost, fuelLiters } = calculateTravelExpenses(
    targetNode,
    currentNode,
    state.player,
    state.band,
    assetModifiers
  )

  if (finiteNumberOr(state.player.money, 0) < totalCost) {
    logger.warn('GameState', 'Complete Travel: Insufficient Funds')
    return state
  }

  const { conditionLoss, fuelBonus, voidHazardHits } =
    calculateTravelMinigameResult(damageTaken, itemsCollected)

  const nextMoney = clampPlayerMoney(
    finiteNumberOr(state.player.money, 0) - totalCost
  )
  const nextFuel = clampVanFuel(
    finiteNumberOr(state.player.van.fuel, 0) - fuelLiters + fuelBonus
  )
  const nextCondition = clampVanCondition(
    finiteNumberOr(state.player.van.condition, 0) - conditionLoss
  )

  let nextMembers = state.band.members

  // Asset modifier: tourbus modules can regenerate member stamina per trip.
  const travelStaminaRegen = finiteNumberOr(
    assetModifiers.travelStaminaRegen,
    0
  )
  if (travelStaminaRegen > 0 && nextMembers.length > 0) {
    nextMembers = nextMembers.map(
      (member: GameState['band']['members'][number]) => ({
        ...member,
        stamina: clampMemberStamina(
          finiteNumberOr(member.stamina, 0) + travelStaminaRegen,
          finiteNumberOr(member.staminaMax, 100)
        )
      })
    )
  }

  if (voidHazardHits && voidHazardHits > 0 && nextMembers.length > 0) {
    const baseRng = safeRngValue ?? 0
    const memberIndex = Math.floor(baseRng * nextMembers.length)
    const hitMember = nextMembers[memberIndex]
    if (hitMember) {
      const staminaPenalty = voidHazardHits * 10
      nextMembers = [...nextMembers]
      nextMembers[memberIndex] = {
        ...hitMember,
        stamina: clampMemberStamina(
          finiteNumberOr(hitMember.stamina, 0) - staminaPenalty,
          finiteNumberOr(hitMember.staminaMax, 100)
        )
      }
    }
  }

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
      totalDistance: finiteNumberOr(state.player.stats?.totalDistance, 0) + dist
    }
  }

  // Check Travel Unlocks
  const travelUnlocks = checkTraitUnlocks(
    { ...state, player: nextPlayer },
    { type: 'TRAVEL_COMPLETE' }
  )

  const traitResult = applyTraitUnlocks(
    { band: { ...state.band, members: nextMembers }, toasts: state.toasts },
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
  const luck = finiteNumberOr(newState.band?.luck, 0)
  const chance = computeDropChance(undefined, luck)

  if (safeRngValue !== undefined && safeRngValue < chance) {
    // Generate inner random value deterministically based on rngValue
    // A simple hash function to derive a second deterministic number [0,1)
    let seedInt = Math.floor(safeRngValue * 4294967296) // 2**32
    seedInt = (seedInt * 1664525 + 1013904223) >>> 0 // LCG
    const innerRng = seedInt / 4294967296
    const mockRng = () => innerRng
    const contrabandId = pickRandomContraband(mockRng)
    const instanceId = `drop-${safeRngValue}`

    if (contrabandId) {
      // Call addContrabandHelper directly to leverage its logic
      const preStashLength = newState.band.stash
        ? Object.keys(newState.band.stash).length
        : 0
      const preStashItem =
        newState.band.stash && Object.hasOwn(newState.band.stash, contrabandId)
          ? (newState.band.stash[contrabandId] as
              | Record<string, unknown>
              | undefined)
          : undefined
      const preStacks = preStashItem
        ? ((preStashItem.stacks as number | null | undefined) ?? 0)
        : 0

      newState = addContrabandHelper(newState, { contrabandId, instanceId })

      // Determine if item was actually added (length increased, or stacks increased)
      const postItem =
        newState.band.stash && Object.hasOwn(newState.band.stash, contrabandId)
          ? (newState.band.stash[contrabandId] as Record<string, unknown>)
          : undefined
      const postStacks = postItem
        ? ((postItem.stacks as number | null | undefined) ?? 0)
        : 0
      const postStashLength = Object.keys(newState.band?.stash || {}).length

      const wasAdded =
        postStashLength > preStashLength || postStacks > preStacks

      if (wasAdded) {
        // Append the new toast to the existing toasts array.
        newState.toasts = [
          ...newState.toasts,
          {
            id: `toast-${instanceId}`,
            messageKey: 'ui:contraband.dropped',
            type: 'success'
          }
        ]
        newState = QuestEvents.emit(
          newState,
          createItemCollectedQuestEvent({ itemId: contrabandId })
        )
      }
    }
  }

  newState = QuestEvents.emit(
    newState,
    createMinigameCompletedQuestEvent({
      minigameId: MINIGAME_TYPES.TOURBUS,
      success: conditionLoss === 0,
      score: Math.max(0, 100 - conditionLoss)
    })
  )
  if (conditionLoss === 0) {
    newState = QuestEvents.emit(
      newState,
      createMinigamePerfectQuestEvent({ minigameId: MINIGAME_TYPES.TOURBUS })
    )
  }
  if (conditionLoss > 0) {
    newState = QuestEvents.emit(
      newState,
      createMinigameFailedQuestEvent({
        minigameId: MINIGAME_TYPES.TOURBUS,
        damage: conditionLoss
      })
    )
  }

  // The tourbus minigame is the production travel path, so travel-progress
  // quests must be fed here; the legacy onTravelComplete hook path emits the
  // same event but never runs while onStartTravelMinigame is wired.
  newState = QuestEvents.emit(
    newState,
    createTravelCompletedQuestEvent({
      region: getRegionKeyForLocation(nextLocation) ?? nextLocation
    })
  )

  return newState
}

/**
 * Starts the roadie minigame for the current gig.
 *
 * @param state - Current game state before the roadie minigame starts.
 * @param payload - Gig id associated with the roadie minigame.
 * @returns Updated state with the roadie scene and equipment counter initialized.
 */
export const handleStartRoadieMinigame = (
  state: GameState,
  payload: { gigId: string }
): GameState => {
  const { gigId } = payload
  logger.info('GameState', `Starting Roadie Minigame for Gig ${gigId}`)
  return {
    ...state,
    currentScene: MINIGAME_REGISTRY.roadie.scene,
    minigame: {
      ...DEFAULT_MINIGAME_STATE,
      active: true,
      type: MINIGAME_TYPES.ROADIE,
      gigId: gigId,
      equipmentRemaining: DEFAULT_EQUIPMENT_COUNT
    }
  }
}

/**
 * Starts the amp calibration minigame for the current gig.
 *
 * @param state - Current game state before calibration starts.
 * @param payload - Gig id associated with amp calibration.
 * @returns Updated state with the amp calibration scene and minigame metadata initialized.
 */
export const handleStartAmpCalibration = (
  state: GameState,
  payload: { gigId: string }
): GameState => {
  const { gigId } = payload
  logger.info('GameState', `Starting Amp Calibration Minigame for Gig ${gigId}`)
  return {
    ...state,
    currentScene: MINIGAME_REGISTRY.ampCalibration.scene,
    minigame: {
      ...DEFAULT_MINIGAME_STATE,
      active: true,
      type: MINIGAME_TYPES.AMP_CALIBRATION,
      gigId: gigId
    }
  }
}

/**
 * Applies the shared post-minigame side effects (band harmony loss, money
 * reward, damaged_gear modifier on failure, minigame.active=false) to the
 * supplied state. Used by both the Amp Calibration and Kabelsalat
 * completion handlers, which differ only in how `stress` and `reward` are
 * computed upstream.
 */
const applyPostMinigameResult = (
  state: GameState,
  stress: number,
  reward: number,
  failureLogTag: string
): GameState => {
  const nextHarmony = clampBandHarmony(
    finiteNumberOr(state.band.harmony, 1) - finiteNumberOr(stress, 0)
  )
  const nextMoney = clampPlayerMoney(
    finiteNumberOr(state.player.money, 0) + finiteNumberOr(reward, 0)
  )

  const nextModifiers = { ...state.gigModifiers }
  if (stress > 0) {
    logger.warn('GameState', `${failureLogTag}: damaged_gear active`)
    nextModifiers.damaged_gear = true
  }

  return {
    ...state,
    band: { ...state.band, harmony: nextHarmony },
    player: { ...state.player, money: nextMoney },
    gigModifiers: nextModifiers,
    minigame: { ...state.minigame, active: false }
  }
}

/**
 * Applies amp calibration results while leaving the current scene under overlay continuation control.
 *
 * Returns unchanged state when no matching minigame is active (replay guard).
 *
 * @param state - Current game state with amp calibration results pending.
 * @param payload - Score and void-interference counters reported by the minigame.
 * @returns Updated state with harmony, money, modifiers, and quest progress applied.
 */
export const handleCompleteAmpCalibration = (
  state: GameState,
  payload: {
    score: number
    voidResonance: number
    purgesUsed: number
    hijacksOverridden: number
  }
): GameState => {
  if (
    state.minigame?.active !== true ||
    state.minigame?.type !== MINIGAME_TYPES.AMP_CALIBRATION
  ) {
    return state
  }
  const { score, voidResonance, purgesUsed, hijacksOverridden } = payload
  const safeScore = Math.max(0, Math.min(finiteNumberOr(score, 0), 100))
  logger.info('GameState', 'Amp Calibration Minigame Complete', payload)

  // Apply Results
  const { stress, reward } = calculateAmpCalibrationResult(
    safeScore,
    state.band,
    finiteNumberOr(voidResonance, 0),
    finiteNumberOr(purgesUsed, 0),
    finiteNumberOr(hijacksOverridden, 0)
  )

  let nextState = applyPostMinigameResult(
    state,
    stress,
    reward,
    'Amp Calibration failed'
  )
  nextState = QuestEvents.emit(
    nextState,
    createMinigameCompletedQuestEvent({
      minigameId: MINIGAME_TYPES.AMP_CALIBRATION,
      success: stress === 0,
      score: safeScore
    })
  )
  if (stress === 0) {
    nextState = QuestEvents.emit(
      nextState,
      createMinigamePerfectQuestEvent({
        minigameId: MINIGAME_TYPES.AMP_CALIBRATION
      })
    )
  }
  return stress > 0
    ? QuestEvents.emit(
        nextState,
        createMinigameFailedQuestEvent({
          minigameId: MINIGAME_TYPES.AMP_CALIBRATION,
          damage: stress
        })
      )
    : nextState
}

/**
 * Starts the Kabelsalat minigame for the current gig.
 *
 * @param state - Current game state before Kabelsalat starts.
 * @param payload - Gig id associated with the Kabelsalat minigame.
 * @returns Updated state with the Kabelsalat scene and minigame metadata initialized.
 */
export const handleStartKabelsalatMinigame = (
  state: GameState,
  payload: { gigId: string }
): GameState => {
  const { gigId } = payload
  logger.info('GameState', `Starting Kabelsalat Minigame for Gig ${gigId}`)
  return {
    ...state,
    currentScene: MINIGAME_REGISTRY.kabelsalat.scene,
    minigame: {
      ...DEFAULT_MINIGAME_STATE,
      active: true,
      type: MINIGAME_TYPES.KABELSALAT,
      gigId: gigId
    }
  }
}

/**
 * Applies Kabelsalat results while leaving the current scene under overlay continuation control.
 *
 * Returns unchanged state when no matching minigame is active (replay guard).
 *
 * @param state - Current game state with Kabelsalat results pending.
 * @param payload - Raw Kabelsalat result payload consumed by the economy calculation.
 * @returns Updated state with harmony, money, modifiers, and quest progress applied.
 */
export const handleCompleteKabelsalatMinigame = (
  state: GameState,
  payload: { results: unknown }
): GameState => {
  if (
    state.minigame?.active !== true ||
    state.minigame?.type !== MINIGAME_TYPES.KABELSALAT
  ) {
    return state
  }
  const { results } = payload
  logger.info('GameState', 'Kabelsalat Minigame Complete', payload)

  // Apply Results
  const { stress, reward } = calculateKabelsalatMinigameResult(
    results,
    state.band
  )

  let nextState = applyPostMinigameResult(
    state,
    stress,
    reward,
    'Kabelsalat failed'
  )
  nextState = QuestEvents.emit(
    nextState,
    createMinigameCompletedQuestEvent({
      minigameId: MINIGAME_TYPES.KABELSALAT,
      success: stress === 0
    })
  )
  if (stress === 0) {
    nextState = QuestEvents.emit(
      nextState,
      createMinigamePerfectQuestEvent({
        minigameId: MINIGAME_TYPES.KABELSALAT
      })
    )
  }
  return stress > 0
    ? QuestEvents.emit(
        nextState,
        createMinigameFailedQuestEvent({
          minigameId: MINIGAME_TYPES.KABELSALAT,
          damage: stress
        })
      )
    : nextState
}

/**
 * Applies roadie minigame results while leaving the current scene under overlay continuation control.
 *
 * Returns unchanged state when no matching minigame is active (replay guard).
 *
 * @param state - Current game state with roadie results pending.
 * @param payload - Equipment damage, optional delivered contraband count, and the real stash item id that was escorted.
 * @returns Updated state with repair costs, contraband bonus, modifiers, and quest progress applied.
 */
export const handleCompleteRoadieMinigame = (
  state: GameState,
  payload: {
    equipmentDamage: number
    contrabandDelivered?: number
    deliveredStashItemId?: string
  }
): GameState => {
  if (
    state.minigame?.active !== true ||
    state.minigame?.type !== MINIGAME_TYPES.ROADIE
  ) {
    return state
  }
  const { equipmentDamage, contrabandDelivered, deliveredStashItemId } = payload
  const safeEquipmentDamage = Math.max(0, finiteNumberOr(equipmentDamage, 0))
  logger.info('GameState', 'Roadie Minigame Complete', payload)

  // Contraband bonus only applies when a real stash item was loaded and delivered.
  // Consume one stack of that item BEFORE applying the bonus so the same item
  // cannot be farmed across multiple completions.
  const safeItemId =
    typeof deliveredStashItemId === 'string' &&
    deliveredStashItemId.length > 0 &&
    !isForbiddenKey(deliveredStashItemId)
      ? deliveredStashItemId
      : null

  const stash = state?.band?.stash
  const stashEntry =
    safeItemId !== null && stash != null && Object.hasOwn(stash, safeItemId)
      ? (stash[safeItemId] as Record<string, unknown> | undefined)
      : undefined
  // A missing `stacks` field counts as one stack; an explicit non-positive
  // `stacks` means the item is effectively empty and grants no bonus.
  const stashStacks = isFiniteNumber(stashEntry?.stacks)
    ? Math.max(0, stashEntry?.stacks as number)
    : stashEntry
      ? 1
      : 0
  const stashItemPresent = stashStacks > 0

  // Effective contraband count: only credit a positive, real delivery, clamped
  // non-negative so a malformed payload cannot grant a reverse bonus.
  const effectiveContrabandDelivered = stashItemPresent
    ? Math.max(0, Math.min(finiteNumberOr(contrabandDelivered, 0), 1))
    : 0

  // Apply Results
  const { stress, repairCost, contrabandBonus } = calculateRoadieMinigameResult(
    safeEquipmentDamage,
    state.band,
    effectiveContrabandDelivered
  )

  if (finiteNumberOr(state.player.money, 0) < finiteNumberOr(repairCost, 0)) {
    logger.warn('GameState', 'Complete Roadie: Insufficient Funds for repair')
    return state
  }

  const nextHarmony = clampBandHarmony(
    finiteNumberOr(state.band.harmony, 1) - finiteNumberOr(stress, 0)
  )
  const nextMoney = clampPlayerMoney(
    finiteNumberOr(state.player.money, 0) -
      finiteNumberOr(repairCost, 0) +
      finiteNumberOr(contrabandBonus, 0)
  )

  // Consume the stash item (decrement stacks or remove) only when a delivery was
  // actually credited; otherwise a zero-count payload would burn inventory for no bonus.
  let nextBand = { ...state?.band, harmony: nextHarmony }
  if (
    effectiveContrabandDelivered > 0 &&
    safeItemId !== null &&
    stash != null
  ) {
    const newStash = Object.assign(Object.create(null), stash)
    if (stashStacks > 1 && isFiniteNumber(stashEntry?.stacks)) {
      newStash[safeItemId] = { ...stashEntry, stacks: stashStacks - 1 }
    } else {
      if (
        stashEntry &&
        typeof stashEntry === 'object' &&
        stashEntry.type === 'equipment' &&
        stashEntry.applyOnAdd === true &&
        stashEntry.applied === true
      ) {
        applySharedBandEffect(
          nextBand,
          stashEntry.effectType,
          -finiteNumberOr(stashEntry.value, 0),
          EQUIPMENT_APPLY_ON_ADD_EFFECTS
        )
      }
      delete newStash[safeItemId]
    }
    nextBand = { ...nextBand, stash: newStash }
  }

  const nextPlayer = {
    ...state.player,
    money: nextMoney
  }

  // Pass damage to gig modifiers or stats?
  const nextModifiers = { ...state.gigModifiers }
  if (safeEquipmentDamage > 50) {
    // Apply a penalty for heavily damaged gear
    logger.warn(
      'GameState',
      'Heavy equipment damage applied: damaged_gear active'
    )
    nextModifiers.damaged_gear = true
  }

  let nextState: GameState = {
    ...state,
    band: nextBand,
    player: nextPlayer,
    gigModifiers: nextModifiers,
    minigame: { ...state.minigame, active: false }
  }

  nextState = QuestEvents.emit(
    nextState,
    createMinigameCompletedQuestEvent({
      minigameId: MINIGAME_TYPES.ROADIE,
      success: safeEquipmentDamage <= 50,
      score: Math.max(0, 100 - safeEquipmentDamage)
    })
  )
  if (effectiveContrabandDelivered > 0) {
    nextState = QuestEvents.emit(
      nextState,
      createItemDeliveredQuestEvent({
        itemId: safeItemId ?? 'contraband',
        amount: effectiveContrabandDelivered
      })
    )
  }
  if (safeEquipmentDamage === 0) {
    nextState = QuestEvents.emit(
      nextState,
      createMinigamePerfectQuestEvent({ minigameId: MINIGAME_TYPES.ROADIE })
    )
  }
  return safeEquipmentDamage > 50
    ? QuestEvents.emit(
        nextState,
        createMinigameFailedQuestEvent({
          minigameId: MINIGAME_TYPES.ROADIE,
          damage: safeEquipmentDamage
        })
      )
    : nextState
}
