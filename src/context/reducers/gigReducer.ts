import type { GameState, PostGigSummary, Venue } from '../../types'
import type { GigModifiers } from '../../types/gig'
import type { RhythmSetlistEntry } from '../../types/rhythmGame'
import { logger } from '../../utils/logger'
import { getSafeUUID } from '../../utils/crypto'
import { checkTraitUnlocks } from '../../utils/unlockCheck'
import { applyTraitUnlocks } from '../../utils/traitUtils'
import { DEFAULT_GIG_MODIFIERS } from '../initialState'
import { GAME_PHASES } from '../gameConstants'
import { isForbiddenKey, finiteNumberOr } from '../../utils/gameState'
import { handleAddVenueBlacklist } from './socialReducer'
import { QuestLifecycle } from '../../domain/questLifecycle'
import { QUEST_PROVE_YOURSELF } from '../../data/questsConstants'
import { hasActiveQuest } from '../../utils/questUtils'
import { QuestEvents } from '../../utils/questProgress'
import {
  createGigCompletedQuestEvent,
  createGoodGigQuestEvent,
  createHarmonyChangedQuestEvent,
  createSmallVenueGoodQuestEvent
} from '../../quests/producers/gigQuestEvents'
import {
  createRegionReputationChangedQuestEvent,
  createVenueReputationChangedQuestEvent,
  createVenueGigCompletedQuestEvent,
  createVenueGoodGigQuestEvent
} from '../../quests/producers/venueQuestEvents'
import { normalizeSetlistForSave } from '../../utils/gameState'

const MIN_REPUTATION = -100
const MAX_REPUTATION = 100

/**
 * Stores the currently selected venue or clears it.
 *
 * @param state - Current game state before the selection update.
 * @param payload - Venue to make current, or null to clear the current gig.
 * @returns Updated state with `currentGig` replaced.
 */
export const handleSetGig = (
  state: GameState,
  payload: Venue | null
): GameState => {
  logger.info('GameState', 'Set Current Gig', payload?.name)
  return { ...state, currentGig: payload }
}

/**
 * Enters the pre-gig scene for a venue and resets gig modifiers to defaults.
 *
 * @param state - Current game state before the gig starts.
 * @param payload - Venue that becomes the current gig.
 * @returns Updated state ready for pre-gig setup.
 */
export const handleStartGig = (state: GameState, payload: Venue): GameState => {
  logger.info('GameState', 'Starting Gig Sequence', payload.name)
  return {
    ...state,
    currentGig: payload,
    currentScene: GAME_PHASES.PRE_GIG,
    gigModifiers: { ...DEFAULT_GIG_MODIFIERS }
  }
}

/**
 * Persists the current rhythm setlist in save-safe form.
 *
 * @param state - Current game state before setlist replacement.
 * @param payload - Setlist entries selected for the gig.
 * @returns Updated state with a normalized setlist.
 */
export const handleSetSetlist = (
  state: GameState,
  payload: RhythmSetlistEntry[]
): GameState => {
  return { ...state, setlist: normalizeSetlistForSave(payload) }
}

/**
 * Merges partial or functional gig modifier updates.
 *
 * @param state - Game state before modifier replacement.
 * @param payload - Modifier patch or updater evaluated against the current
 * modifier state.
 * @returns State with gig modifiers shallow-merged.
 */
export const handleSetGigModifiers = (
  state: GameState,
  payload:
    | Partial<GigModifiers>
    | ((prev: GigModifiers) => Partial<GigModifiers>)
): GameState => {
  const updates =
    (typeof payload === 'function' ? payload(state.gigModifiers) : payload) ??
    {}
  return { ...state, gigModifiers: { ...state.gigModifiers, ...updates } }
}

const handleRecordBadShow = (state: GameState): GameState => {
  let nextState = { ...state }
  const currentBadShows = (nextState.player.stats?.consecutiveBadShows ?? 0) + 1

  nextState.player = {
    ...nextState.player,
    stats: { ...nextState.player.stats, consecutiveBadShows: currentBadShows }
  }

  if (
    currentBadShows >= 3 &&
    !hasActiveQuest(nextState.activeQuests, QUEST_PROVE_YOURSELF)
  ) {
    // Config (label/deadline/required/failurePenalty/startFlags) lives in
    // QUEST_REGISTRY. addQuest merges those defaults and applies startFlags,
    // so the inline override surface here is just the id.
    nextState = QuestLifecycle.addQuest(nextState, {
      id: QUEST_PROVE_YOURSELF
    })
    nextState.player = {
      ...nextState.player,
      stats: { ...nextState.player.stats, proveYourselfMode: true }
    }
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

/**
 * Stores post-gig performance stats and applies reputation, unlock, and quest side effects.
 *
 * @param state - Current game state before post-gig stats are recorded.
 * @param payload - Post-gig summary to store, or null to clear the summary.
 * @returns Updated state with sanitized stats and any resulting progression changes.
 */
export const handleSetLastGigStats = (
  state: GameState,
  payload: PostGigSummary | null
): GameState => {
  if (payload === null) {
    return {
      ...state,
      lastGigStats: null
    }
  }

  const safePayload = {
    ...payload,
    // Only re-clamp numeric fields that are present so the stored stats never
    // gain explicit `undefined` keys.
    ...(payload.score !== undefined && {
      score: finiteNumberOr(payload.score, 0)
    }),
    ...(payload.misses !== undefined && {
      misses: finiteNumberOr(payload.misses, 0)
    }),
    ...(payload.accuracy !== undefined && {
      accuracy: finiteNumberOr(payload.accuracy, 0)
    }),
    ...(payload.combo !== undefined && {
      combo: finiteNumberOr(payload.combo, 0)
    }),
    ...(payload.health !== undefined && {
      health: finiteNumberOr(payload.health, 0)
    }),
    ...(payload.overload !== undefined && {
      overload: finiteNumberOr(payload.overload, 0)
    }),
    ...(payload.maxCombo !== undefined && {
      maxCombo: finiteNumberOr(payload.maxCombo, 0)
    })
  }
  // Prevent trait unlocks during practice mode
  if (state.currentGig?.isPractice) {
    return {
      ...state,
      lastGigStats: safePayload
    }
  }
  const performanceUnlocks = checkTraitUnlocks(state, {
    type: 'GIG_COMPLETE',
    gigStats: safePayload
  })
  const traitResult = applyTraitUnlocks(state, performanceUnlocks)

  let nextState: GameState = {
    ...state,
    lastGigStats: safePayload,
    band: traitResult.band,
    toasts: traitResult.toasts,
    reputationByRegion: { ...state.reputationByRegion },
    reputationByVenue: { ...state.reputationByVenue }
  }

  const score = finiteNumberOr(safePayload.score, 0)
  const location = state.player?.location || 'Unknown'
  const venueId = state.currentGig?.id ?? ''
  const capacity =
    typeof state.currentGig?.capacity === 'number' &&
    Number.isFinite(state.currentGig.capacity)
      ? state.currentGig.capacity
      : null

  nextState = QuestEvents.emit(
    nextState,
    createGigCompletedQuestEvent({
      score,
      capacity: capacity ?? 0,
      venueId: state.currentGig?.id ?? '',
      region: location
    })
  )
  nextState = QuestEvents.emit(
    nextState,
    createVenueGigCompletedQuestEvent({
      score,
      venueId: state.currentGig?.id ?? '',
      region: location
    })
  )

  if (score < 30) {
    if (!isForbiddenKey(location)) {
      nextState.reputationByRegion[location] = Math.max(
        MIN_REPUTATION,
        (nextState.reputationByRegion[location] || 0) - 10
      )
      nextState = QuestEvents.emit(
        nextState,
        createRegionReputationChangedQuestEvent({
          region: location,
          amount: -10,
          reason: 'bad_gig'
        })
      )
      logger.warn(
        'GameState',
        `Regional reputation loss in ${location} due to poor gig performance (-10)`
      )
      if ((nextState.reputationByRegion[location] || 0) <= -30) {
        const gigVenueId = state.currentGig?.id || 'unknown_venue'
        nextState = handleAddVenueBlacklist(nextState, {
          venueId: gigVenueId,
          toastId: payload.toastId ?? `${gigVenueId}-blacklisted`
        })
      }
    }
    if (venueId && !isForbiddenKey(venueId)) {
      nextState.reputationByVenue[venueId] = Math.max(
        MIN_REPUTATION,
        (nextState.reputationByVenue[venueId] || 0) - 10
      )
      nextState = QuestEvents.emit(
        nextState,
        createVenueReputationChangedQuestEvent({
          venueId,
          amount: -10,
          reason: 'bad_gig'
        })
      )
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
        nextState = QuestEvents.emit(
          nextState,
          createRegionReputationChangedQuestEvent({
            region: location,
            amount: bonus,
            reason: 'good_gig'
          })
        )
        logger.info(
          'GameState',
          `Regional reputation gain in ${location} (+${bonus})`
        )
      }
    }
    if (venueId && !isForbiddenKey(venueId)) {
      const currentVenueRep = nextState.reputationByVenue[venueId] || 0
      if (currentVenueRep < MAX_REPUTATION) {
        const venueBonus = score >= 90 ? 10 : 5
        nextState.reputationByVenue[venueId] = Math.max(
          MIN_REPUTATION,
          Math.min(MAX_REPUTATION, currentVenueRep + venueBonus)
        )
        nextState = QuestEvents.emit(
          nextState,
          createVenueReputationChangedQuestEvent({
            venueId,
            amount: venueBonus,
            reason: 'good_gig'
          })
        )
      }
    }

    nextState = handleRecordGoodShow(nextState)
    nextState = QuestEvents.emit(
      nextState,
      createGoodGigQuestEvent({
        score,
        capacity: capacity ?? 0,
        venueId: state.currentGig?.id ?? '',
        region: location
      })
    )
    nextState = QuestEvents.emit(
      nextState,
      createVenueGoodGigQuestEvent({
        score,
        capacity: capacity ?? undefined,
        venueId: state.currentGig?.id ?? '',
        region: location
      })
    )
    if (capacity !== null && capacity <= 300) {
      nextState = QuestEvents.emit(
        nextState,
        createSmallVenueGoodQuestEvent({
          score,
          capacity,
          venueId: state.currentGig?.id ?? '',
          region: location
        })
      )
    }
  }

  // Comeback album: queue if controversy recovered and apology tour complete
  if (
    nextState.activeStoryFlags?.includes('apology_tour_complete') &&
    !nextState.activeStoryFlags?.includes('comeback_triggered') &&
    (nextState.social?.controversyLevel || 0) < 30 &&
    !nextState.pendingEvents?.includes('consequences_comeback_album')
  ) {
    nextState.pendingEvents = [
      ...(nextState.pendingEvents || []),
      'consequences_comeback_album'
    ]
  }

  // Harmony-threshold quests (ego management, harmony project, …) advance
  // toward / complete at their required harmony level. Driven generically via
  // the harmony_recovered progress source rather than a hardcoded quest id.
  nextState = QuestEvents.emit(
    nextState,
    createHarmonyChangedQuestEvent({
      amount: 0,
      newHarmony: nextState.band.harmony
    })
  )

  return nextState
}
