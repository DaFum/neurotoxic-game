// TODO: Review this file
import type { GameState, Venue } from '../../types/game'
import type { RhythmSetlistEntry } from '../../types/rhythmGame'
import { logger } from '../../utils/logger'
import { getSafeUUID } from '../../utils/crypto'
import { checkTraitUnlocks } from '../../utils/unlockCheck'
import { applyTraitUnlocks } from '../../utils/traitUtils'
import { DEFAULT_GIG_MODIFIERS } from '../initialState'
import { GAME_PHASES } from '../gameConstants'
import { isForbiddenKey } from '../../utils/gameStateUtils'
import { handleAddVenueBlacklist } from './socialReducer'
import {
  handleAddQuest,
  handleAdvanceQuest,
  handleCompleteQuest
} from './questReducer'
import {
  QUEST_PROVE_YOURSELF,
  QUEST_EGO_MANAGEMENT,
  QUEST_APOLOGY_TOUR
} from '../../data/questsConstants'
import { hasActiveQuest } from '../../utils/questUtils'
import { normalizeSetlistForSave } from '../../utils/gameStateUtils'

const MIN_REPUTATION = -100
const MAX_REPUTATION = 100

export const handleSetGig = (
  state: GameState,
  payload: Venue | null
): GameState => {
  logger.info('GameState', 'Set Current Gig', payload?.name)
  return { ...state, currentGig: payload }
}

export const handleStartGig = (
  state: GameState,
  payload: Venue | null
): GameState => {
  logger.info('GameState', 'Starting Gig Sequence', payload?.name)
  return {
    ...state,
    currentGig: payload,
    currentScene: GAME_PHASES.PRE_GIG,
    gigModifiers: { ...DEFAULT_GIG_MODIFIERS }
  }
}

export const handleSetSetlist = (
  state: GameState,
  payload: RhythmSetlistEntry[]
): GameState => {
  return { ...state, setlist: normalizeSetlistForSave(payload) }
}

/**
 * Handles gig modifier updates
 * @param {Object} state - Current state
 * @param {Object|Function} payload - Modifiers update
 * @returns {Object} Updated state
 */
export const handleSetGigModifiers = (
  state: GameState,
  payload:
    | Record<string, boolean>
    | ((mods: Record<string, boolean>) => Record<string, boolean>)
): GameState => {
  const updates =
    (typeof payload === 'function' ? payload(state.gigModifiers) : payload) ||
    {}
  return { ...state, gigModifiers: { ...state.gigModifiers, ...updates } }
}

const handleRecordBadShow = (state: GameState): GameState => {
  let nextState = { ...state }
  const currentBadShows = (nextState.player.stats?.consecutiveBadShows || 0) + 1

  nextState.player = {
    ...nextState.player,
    stats: { ...nextState.player.stats, consecutiveBadShows: currentBadShows }
  }

  if (
    currentBadShows >= 3 &&
    !hasActiveQuest(nextState.activeQuests, QUEST_PROVE_YOURSELF)
  ) {
    nextState = handleAddQuest(nextState, {
      id: QUEST_PROVE_YOURSELF,
      label: 'ui:quests.proveYourself.title',
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
        id: getSafeUUID(),
        message: 'ui:toast.three_disasters',
        type: 'error'
      }
    ]
  }

  return nextState
}

const handleRecordGoodShow = (state: GameState): GameState => {
  const nextState = { ...state }

  nextState.player = {
    ...nextState.player,
    stats: { ...nextState.player.stats, consecutiveBadShows: 0 }
  }

  return nextState
}

export const handleSetLastGigStats = (
  state: GameState,
  payload: Record<string, unknown>
): GameState => {
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

  const score = (
    typeof payload?.score === 'number' ? payload.score : 0
  ) as number
  const location = state.player?.location || 'Unknown'
  const capacity =
    typeof state.currentGig?.venue?.capacity === 'number'
      ? state.currentGig.venue.capacity
      : 0

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
        const gigVenueId = (state.currentGig?.id as string) || 'unknown_venue'
        nextState = handleAddVenueBlacklist(nextState, {
          venueId: gigVenueId,
          toastId: `${gigVenueId}-blacklisted`
        })
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
      hasActiveQuest(nextState.activeQuests, QUEST_APOLOGY_TOUR) &&
      capacity <= 300
    ) {
      nextState = handleAdvanceQuest(nextState, {
        questId: QUEST_APOLOGY_TOUR,
        amount: 1
      })
    }
    if (
      hasActiveQuest(nextState.activeQuests, QUEST_PROVE_YOURSELF) &&
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
  const hasEgoQuest = hasActiveQuest(
    nextState.activeQuests,
    QUEST_EGO_MANAGEMENT
  )
  if (hasEgoQuest && nextState.band.harmony >= 50) {
    nextState = handleCompleteQuest(nextState, {
      questId: QUEST_EGO_MANAGEMENT
    })
  }

  return nextState
}
