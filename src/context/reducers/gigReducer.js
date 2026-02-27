import { logger } from '../../utils/logger.js'
import { checkTraitUnlocks } from '../../utils/unlockCheck.js'
import { applyTraitUnlocks } from '../../utils/traitUtils.js'
import { DEFAULT_GIG_MODIFIERS } from '../initialState.js'
import { handleAddVenueBlacklist } from './socialReducer.js'
import {
  handleAddQuest,
  handleAdvanceQuest,
  handleCompleteQuest
} from './questReducer.js'

export const handleSetGig = (state, payload) => {
  logger.info('GameState', 'Set Current Gig', payload?.name)
  return { ...state, currentGig: payload }
}

export const handleStartGig = (state, payload) => {
  logger.info('GameState', 'Starting Gig Sequence', payload?.name)
  return {
    ...state,
    currentGig: payload,
    currentScene: 'PREGIG',
    gigModifiers: { ...DEFAULT_GIG_MODIFIERS }
  }
}

export const handleSetSetlist = (state, payload) => {
  return { ...state, setlist: payload }
}

/**
 * Handles gig modifier updates
 * @param {Object} state - Current state
 * @param {Object|Function} payload - Modifiers update
 * @returns {Object} Updated state
 */
export const handleSetGigModifiers = (state, payload) => {
  const updates =
    (typeof payload === 'function' ? payload(state.gigModifiers) : payload) ||
    {}
  return { ...state, gigModifiers: { ...state.gigModifiers, ...updates } }
}

export const handleRecordBadShow = state => {
  let nextState = { ...state }
  const currentBadShows = (nextState.player.stats?.consecutiveBadShows || 0) + 1

  nextState.player = {
    ...nextState.player,
    stats: { ...nextState.player.stats, consecutiveBadShows: currentBadShows }
  }

  if (
    currentBadShows >= 3 &&
    !nextState.activeQuests?.some(q => q.id === 'quest_prove_yourself')
  ) {
    nextState = handleAddQuest(nextState, {
      id: 'quest_prove_yourself',
      label: 'PROVE YOURSELF',
      deadline: nextState.player.day + 20,
      progress: 0,
      required: 4,
      rewardFlag: 'prove_yourself_complete',
      failurePenalty: {
        social: { controversyLevel: 10 },
        band: { harmony: -20 }
      }
    })
    nextState.player = {
      ...nextState.player,
      stats: { ...nextState.player.stats, proveYourselfMode: true }
    }
    nextState.activeStoryFlags = [
      ...(nextState.activeStoryFlags || []),
      'prove_yourself_active'
    ]
    nextState.toasts = [
      ...(nextState.toasts || []),
      {
        id: Date.now().toString(),
        message: '3 DISASTERS IN A ROW — Prove yourself in small venues first.',
        type: 'error'
      }
    ]
  }

  return nextState
}

export const handleRecordGoodShow = state => {
  let nextState = { ...state }

  nextState.player = {
    ...nextState.player,
    stats: { ...nextState.player.stats, consecutiveBadShows: 0 }
  }

  return nextState
}

export const handleSetLastGigStats = (state, payload) => {
  // Prevent trait unlocks during practice mode
  if (state.currentGig?.isPractice) {
    return {
      ...state,
      lastGigStats: payload
    }
  }
  const performanceUnlocks = checkTraitUnlocks(state, {
    type: 'GIG_COMPLETE',
    gigStats: payload
  })
  const traitResult = applyTraitUnlocks(state, performanceUnlocks)

  let nextState = {
    ...state,
    lastGigStats: payload,
    band: traitResult.band,
    toasts: traitResult.toasts,
    reputationByRegion: { ...state.reputationByRegion }
  }

  const score = payload?.score ?? 0
  const location = state.player?.location || 'Unknown'
  const capacity = state.currentGig?.venue?.capacity || 0

  if (score < 30) {
    nextState.reputationByRegion[location] =
      (nextState.reputationByRegion[location] || 0) - 10
    logger.warn(
      'GameState',
      `Regional reputation loss in ${location} due to poor gig performance (-10)`
    )
    nextState = handleRecordBadShow(nextState)
    if ((nextState.reputationByRegion[location] || 0) <= -30) {
      nextState = handleAddVenueBlacklist(
        nextState,
        state.currentGig?.venue?.name || 'Local Venue'
      )
    }
  } else if (score >= 60) {
    // Increase reputation on good gigs up to 100 max
    const currentRep = nextState.reputationByRegion[location] || 0
    if (currentRep < 100) {
      const bonus = score >= 90 ? 10 : 5
      nextState.reputationByRegion[location] = Math.min(100, currentRep + bonus)
      logger.info(
        'GameState',
        `Regional reputation gain in ${location} (+${bonus})`
      )
    }

    nextState = handleRecordGoodShow(nextState)
    if (
      nextState.activeQuests?.some(q => q.id === 'quest_apology_tour') &&
      capacity <= 300
    ) {
      nextState = handleAdvanceQuest(nextState, {
        questId: 'quest_apology_tour',
        amount: 1
      })
    }
    if (
      nextState.activeQuests?.some(q => q.id === 'quest_prove_yourself') &&
      capacity <= 150
    ) {
      nextState = handleAdvanceQuest(nextState, {
        questId: 'quest_prove_yourself',
        amount: 1
      })
    }
  }

  // Comeback album: queue if controversy recovered and apology tour complete
  if (
    nextState.activeStoryFlags?.includes('apology_tour_complete') &&
    !nextState.activeStoryFlags?.includes('comeback_triggered') &&
    (nextState.social?.controversyLevel || 0) < 30
  ) {
    nextState.pendingEvents = [
      ...(nextState.pendingEvents || []),
      'consequences_comeback_album'
    ]
  }

  // Ego management quest auto-complete
  const egoQuest = nextState.activeQuests?.find(
    q => q.id === 'quest_ego_management'
  )
  if (egoQuest && nextState.band.harmony >= 50) {
    nextState = handleCompleteQuest(nextState, {
      questId: 'quest_ego_management'
    })
  }

  return nextState
}
