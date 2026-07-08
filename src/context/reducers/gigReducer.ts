import type { GameState, PostGigSummary, Venue } from '../../types'
import type { GigModifiers } from '../../types/gig'
import type { RhythmSetlistEntry } from '../../types/rhythmGame'
import { logger } from '../../utils/logger'
import { buildDeterministicToastId } from './toastSanitizers'
import { checkTraitUnlocks } from '../../utils/unlockCheck'
import { applyTraitUnlocks } from '../../utils/traitUtils'
import {
  DEFAULT_GIG_MODIFIERS,
  sanitizeGigModifierUpdates
} from '../initialState'
import { DEFAULT_MINIGAME_STATE, GAME_PHASES } from '../gameConstants'
import {
  isForbiddenKey,
  isLooseRecord,
  hasForbiddenKeys,
  isEmptyObject,
  finiteNumberOr,
  clampBandHarmony,
  clampBandStress,
  clampReputation,
  BALANCE_CONSTANTS
} from '../../utils/gameState'
import { handleAddVenueBlacklist } from './socialReducer'
import { QuestLifecycle, canAcceptQuest } from '../../domain/questLifecycle'
import { QUEST_PROVE_YOURSELF } from '../../data/questsConstants'
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
import {
  getRegionKeyForLocation,
  REGION_BLACKLIST_THRESHOLD
} from '../../utils/mapUtils'

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
 * @remarks
 * Also resets minigame state to defaults at this entry boundary (symmetric
 * with the gig-modifier reset). This clears any leftover minigame state from a
 * prior abandoned setup minigame so it cannot leak into this gig. `lastGigStats`
 * is intentionally NOT cleared here — it is consumed by gig milestone checks
 * (`first_gig_done`, `flawless_gig`, `big_combo`) on the next `ADVANCE_DAY`.
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
    gigModifiers: { ...DEFAULT_GIG_MODIFIERS },
    minigame: { ...DEFAULT_MINIGAME_STATE }
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
  if (!isLooseRecord(updates) || hasForbiddenKeys(updates)) {
    return state
  }
  // Final authority: re-whitelist even creator-normalized payloads so a raw
  // dispatch cannot inject non-modifier keys or non-boolean values.
  const safeUpdates = sanitizeGigModifierUpdates(updates)
  if (isEmptyObject(safeUpdates)) {
    return state
  }
  return { ...state, gigModifiers: { ...state.gigModifiers, ...safeUpdates } }
}

const handleRecordBadShow = (state: GameState): GameState => {
  let nextState = { ...state }
  const currentBadShows =
    finiteNumberOr(nextState.player.stats?.consecutiveBadShows, 0) + 1

  nextState.player = {
    ...nextState.player,
    stats: { ...nextState.player.stats, consecutiveBadShows: currentBadShows }
  }

  // canAcceptQuest mirrors addQuest's full gating (active, completed,
  // failure-retry cooldown, slots), so proveYourselfMode and the toast only
  // fire when the quest is actually (re-)added — not e.g. during the 20-day
  // retry cooldown after a failed run.
  if (
    currentBadShows >= 3 &&
    canAcceptQuest(nextState, QUEST_PROVE_YOURSELF).ok
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
        id: buildDeterministicToastId(
          'three-disasters-toast',
          nextState.toasts
        ),
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
    // Practice reward: small harmony gain, boosted by the band practiceGain
    // effect (contraband `practice_gain`).
    const practiceGain = Math.max(0, finiteNumberOr(state.band.practiceGain, 0))
    const harmonyGain = Math.round(
      BALANCE_CONSTANTS.PRACTICE_HARMONY_GAIN * (1 + practiceGain)
    )
    return {
      ...state,
      lastGigStats: safePayload,
      band: {
        ...state.band,
        harmony: clampBandHarmony(
          finiteNumberOr(state.band.harmony, 1) + harmonyGain
        )
      }
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
    band: {
      ...traitResult.band,
      // Real gigs build up band stress; days decay it (handleAdvanceDay)
      stress: clampBandStress(
        finiteNumberOr(traitResult.band.stress, 0) +
          BALANCE_CONSTANTS.STRESS_PER_GIG
      )
    },
    toasts: traitResult.toasts,
    reputationByRegion: { ...state.reputationByRegion },
    reputationByVenue: { ...state.reputationByVenue }
  }

  const score = finiteNumberOr(safePayload.score, 0)
  // Region reputation and region-scoped quest events are keyed per city.
  // player.location is the `venues:<id>.name` display key, so derive the
  // canonical city key — checkVenueAccess reads the same key for the
  // regional booking ban.
  const location = getRegionKeyForLocation(state.player?.location) || 'Unknown'
  const venueId = state.currentGig?.id || ''
  const capacity =
    typeof state.currentGig?.capacity === 'number' &&
    Number.isFinite(state.currentGig.capacity)
      ? state.currentGig.capacity
      : null

  nextState = QuestEvents.emit(
    nextState,
    createGigCompletedQuestEvent({
      score,
      capacity: finiteNumberOr(capacity, 0),
      venueId: state.currentGig?.id || '',
      region: location
    })
  )
  nextState = QuestEvents.emit(
    nextState,
    createVenueGigCompletedQuestEvent({
      score,
      venueId: state.currentGig?.id || '',
      region: location
    })
  )

  if (score < 30) {
    if (!isForbiddenKey(location)) {
      nextState.reputationByRegion[location] = clampReputation(
        finiteNumberOr(nextState.reputationByRegion[location], 0) - 10
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
      if (
        finiteNumberOr(nextState.reputationByRegion[location], 0) <=
        REGION_BLACKLIST_THRESHOLD
      ) {
        const gigVenueId = state.currentGig?.id || 'unknown_venue'
        nextState = handleAddVenueBlacklist(nextState, {
          venueId: gigVenueId,
          toastId: payload.toastId || `${gigVenueId}-blacklisted`
        })
      }
    }
    if (venueId && !isForbiddenKey(venueId)) {
      nextState.reputationByVenue[venueId] = clampReputation(
        finiteNumberOr(nextState.reputationByVenue[venueId], 0) - 10
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
      const currentRep = finiteNumberOr(
        nextState.reputationByRegion[location],
        0
      )
      const bonus = score >= 90 ? 10 : 5
      const nextRep = clampReputation(currentRep + bonus)
      if (nextRep > currentRep) {
        nextState.reputationByRegion[location] = nextRep
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
      const currentVenueRep = finiteNumberOr(
        nextState.reputationByVenue[venueId],
        0
      )
      const venueBonus = score >= 90 ? 10 : 5
      const nextVenueRep = clampReputation(currentVenueRep + venueBonus)
      if (nextVenueRep > currentVenueRep) {
        nextState.reputationByVenue[venueId] = nextVenueRep
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
        capacity: finiteNumberOr(capacity, 0),
        venueId: state.currentGig?.id || '',
        region: location
      })
    )
    nextState = QuestEvents.emit(
      nextState,
      createVenueGoodGigQuestEvent({
        score,
        capacity: capacity || undefined,
        venueId: state.currentGig?.id || '',
        region: location
      })
    )
    if (capacity !== null && capacity <= 300) {
      nextState = QuestEvents.emit(
        nextState,
        createSmallVenueGoodQuestEvent({
          score,
          capacity,
          venueId: state.currentGig?.id || '',
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
