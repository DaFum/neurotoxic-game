// TODO: Review this file
import { logger } from '../../utils/logger.js'
import { checkTraitUnlocks } from '../../utils/unlockCheck.js'
import { applyTraitUnlocks } from '../../utils/traitUtils.js'
import { DEFAULT_GIG_MODIFIERS } from '../initialState.js'
import { GAME_PHASES } from '../gameConstants.js'
import { isForbiddenKey } from '../../utils/gameStateUtils.js'
import { handleAddVenueBlacklist } from './socialReducer.js'
import {
  handleAddQuest,
  handleAdvanceQuest,
  handleCompleteQuest
} from './questReducer.js'
import {
  QUEST_PROVE_YOURSELF,
  QUEST_EGO_MANAGEMENT,
  QUEST_APOLOGY_TOUR
} from '../../data/questsConstants.js'

const MIN_REPUTATION = -100
const MAX_REPUTATION = 100

export const handleSetGig = (state, payload) => {
  logger.info('GameState', 'Set Current Gig', payload?.name)
  return { ...state, currentGig: payload }
}

export const handleStartGig = (state, payload) => {
  logger.info('GameState', 'Starting Gig Sequence', payload?.name)
  return {
    ...state,
    currentGig: payload,
    currentScene: GAME_PHASES.PRE_GIG,
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

const handleRecordBadShow = state => {
  let nextState = { ...state }
  const currentBadShows = (nextState.player.stats?.consecutiveBadShows || 0) + 1

  nextState.player = {
    ...nextState.player,
    stats: { ...nextState.player.stats, consecutiveBadShows: currentBadShows }
  }

  if (
    currentBadShows >= 3 &&
    !nextState.activeQuests?.some(q => q.id === QUEST_PROVE_YOURSELF)
  ) {
    nextState = handleAddQuest(nextState, {
      id: QUEST_PROVE_YOURSELF,
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
        id: crypto.randomUUID(),
        message: 'ui:toast.three_disasters',
        type: 'error'
      }
    ]
  }

  return nextState
}

const handleRecordGoodShow = state => {
  const nextState = { ...state }

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
    if (!isForbiddenKey(location)) {
      nextState.reputationByRegion[location] = Math.max(
        MIN_REPUTATION,
        (nextState.reputationByRegion[location] || 0) - 10
      )
      logger.warn(
        'GameState',
        `Regional reputation loss in ${location} due to poor gig performance (-10)`
      )
      if ((nextState.reputationByRegion[location] || 0) <= -30) {
        nextState = handleAddVenueBlacklist(
          nextState,
          state.currentGig?.venue?.id || 'unknown_venue'
        )
      }
    }
    nextState = handleRecordBadShow(nextState)
  } else if (score >= 60) {
    // Increase reputation on good gigs up to 100 max
    if (!isForbiddenKey(location)) {
      const currentRep = nextState.reputationByRegion[location] || 0
      if (currentRep < MAX_REPUTATION) {
        const bonus = score >= 90 ? 10 : 5
        nextState.reputationByRegion[location] = Math.max(
          MIN_REPUTATION,
          Math.min(MAX_REPUTATION, currentRep + bonus)
        )
        logger.info(
          'GameState',
          `Regional reputation gain in ${location} (+${bonus})`
        )
      }
    }

    nextState = handleRecordGoodShow(nextState)
    if (
      nextState.activeQuests?.some(q => q.id === QUEST_APOLOGY_TOUR) &&
      capacity <= 300
    ) {
      nextState = handleAdvanceQuest(nextState, {
        questId: QUEST_APOLOGY_TOUR,
        amount: 1
      })
    }
    if (
      nextState.activeQuests?.some(q => q.id === QUEST_PROVE_YOURSELF) &&
      capacity <= 150
    ) {
      nextState = handleAdvanceQuest(nextState, {
        questId: QUEST_PROVE_YOURSELF,
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
  const hasEgoQuest = nextState.activeQuests?.some(
    q => q.id === QUEST_EGO_MANAGEMENT
  )
  if (hasEgoQuest && nextState.band.harmony >= 50) {
    nextState = handleCompleteQuest(nextState, {
      questId: QUEST_EGO_MANAGEMENT
    })
  }

  return nextState
}
