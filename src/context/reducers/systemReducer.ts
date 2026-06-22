import {
  sanitizePlayer,
  sanitizeBand,
  sanitizeSocial,
  sanitizeStringArray,
  sanitizeSetlist,
  sanitizeActiveEvent,
  sanitizeToasts,
  sanitizeReputationByRegion,
  sanitizeActiveQuests,
  sanitizeQuestCooldowns,
  sanitizeQuestScopes,
  sanitizeNpcs,
  sanitizeGigModifiers,
  sanitizeVenue,
  sanitizeLastGigStats,
  sanitizeMinigameState,
  sanitizeRivalBand,
  normalizeLoadedGameMap,
  migratePlayerLocation,
  migrateLegacyVenueId
} from './sanitizers/stateSanitizers'
import {
  processAssetTick,
  processLiabilityTick,
  processCrowdfundTick,
  rollAssetRiskEvents
} from '../../utils/assetTicks'
import { QuestEvents } from '../../utils/questProgress'
import { sanitizeSettingsPayload } from '../../utils/settingsSanitizer'
import { DEFAULT_PLAYER_STATE } from '../initialState'
import {
  createAssetRiskTriggeredQuestEvent,
  createAssetRiskResolvedQuestEvent
} from '../../quests/producers/assetQuestEvents'
import type {
  GameState,
  BandState,
  BandMember,
  ToastPayload,
  GameMap,
  GameSettings,
  RawGameSettings,
  ResetStatePayload
} from '../../types'
import { logger } from '../../utils/logger'
import {
  clampBandHarmony,
  clampBandStress,
  clampMemberMood,
  isForbiddenKey,
  finiteNumberOr,
  BALANCE_CONSTANTS
} from '../../utils/gameState'
import { calculateDailyUpdates } from '../../utils/simulationUtils'
import { shouldTriggerBankruptcy } from '../../utils/economyEngine'
import { getTotalDailyObligations } from '../../utils/assetSelectors'
import { generateDailyTrend } from '../../utils/socialEngine'
import { checkTraitUnlocks } from '../../utils/unlockCheck'
import { applyTraitUnlocks } from '../../utils/traitUtils'
import { getRegionKeyForLocation } from '../../utils/mapUtils'
import { createInitialState } from '../initialState'
import { GAME_PHASES } from '../gameConstants'
import { QuestLifecycle } from '../../domain/questLifecycle'
import { getQuestDefinition } from '../../data/questRegistry'
import { getSafeRandom } from '../../utils/crypto'
import {
  sanitizeAssets,
  sanitizeAssetKinds,
  sanitizeCrowdfundCampaigns,
  sanitizeLiabilities,
  sanitizeRiskEventDescriptor,
  sanitizeRngSeed
} from './assetSanitizers'
import type { RiskEventDescriptor } from '../../types/assets'

/**
 * Loads persisted state through migration and sanitizer gates.
 *
 * @param state - Current in-memory state used as a fallback baseline.
 * @param payload - Raw save payload from storage.
 * @returns Migrated and sanitized game state.
 *
 * @remarks
 * Loading a save forces the scene back to `OVERWORLD` and upgrades the persisted
 * version marker to the current schema version after migrations run.
 */
export const handleLoadGame = (
  state: GameState,
  payload: unknown
): GameState => {
  logger.info('GameState', 'Game Loaded')

  const loadedState: Record<string, unknown> = (
    typeof payload === 'object' && payload !== null ? payload : {}
  ) as Record<string, unknown>

  // 1. Sanitize Player
  const mergedPlayer = sanitizePlayer(loadedState.player)
  // 2. Sanitize Band
  const validatedBand = sanitizeBand(loadedState.band)
  // 3. Sanitize Social
  const mergedSocial = sanitizeSocial(loadedState.social)

  // 4. Construct Safe State (Whitelist)
  const rawVersion = Object.hasOwn(loadedState, 'version')
    ? loadedState.version
    : state.version
  const parsedVersion = Number(rawVersion)
  const explicitVersion = Number.isFinite(parsedVersion) ? parsedVersion : 0

  // Assets must be sanitized before liabilities so orphan-detection
  // (sanitizeLiabilities filters out liabilities pointing at non-existent assets)
  // sees the validated asset set.
  const sanitizedAssets = sanitizeAssets(loadedState.assets)
  const sanitizedLiabilities = sanitizeLiabilities(
    loadedState.liabilities,
    sanitizedAssets
  )

  const safeState: GameState = {
    ...state,
    version: explicitVersion,
    player: mergedPlayer,
    band: validatedBand,
    social: mergedSocial,
    gameMap: normalizeLoadedGameMap(loadedState.gameMap) ?? state.gameMap,
    setlist: sanitizeSetlist(loadedState.setlist),
    activeStoryFlags: sanitizeStringArray(loadedState.activeStoryFlags),
    pendingEvents: sanitizeStringArray(loadedState.pendingEvents),
    pendingForeclosureNotices: sanitizeAssetKinds(
      loadedState.pendingForeclosureNotices
    ),
    pendingRiskEvent: sanitizeRiskEventDescriptor(loadedState.pendingRiskEvent),
    eventCooldowns: sanitizeStringArray(loadedState.eventCooldowns),
    activeEvent: sanitizeActiveEvent(loadedState.activeEvent),
    toasts: sanitizeToasts(loadedState.toasts),
    reputationByRegion: sanitizeReputationByRegion(
      loadedState.reputationByRegion
    ),
    reputationByVenue: sanitizeReputationByRegion(
      loadedState.reputationByVenue
    ),
    venueBlacklist: sanitizeStringArray(loadedState.venueBlacklist),
    activeQuests: sanitizeActiveQuests(loadedState.activeQuests),
    questCooldowns: sanitizeQuestCooldowns(loadedState.questCooldowns),
    completedQuestIds: sanitizeStringArray(loadedState.completedQuestIds),
    completedQuestScopes: sanitizeQuestScopes(loadedState.completedQuestScopes),
    npcs: sanitizeNpcs(loadedState.npcs),
    gigModifiers: sanitizeGigModifiers(loadedState.gigModifiers),
    currentScene: GAME_PHASES.OVERWORLD,
    currentGig: sanitizeVenue(loadedState.currentGig),
    lastGigStats: sanitizeLastGigStats(loadedState.lastGigStats),
    settings: {
      ...state.settings,
      ...(typeof loadedState.settings === 'object' &&
      loadedState.settings !== null &&
      !Array.isArray(loadedState.settings)
        ? sanitizeSettingsPayload(
            loadedState.settings as Record<string, unknown>
          )
        : {})
    },
    minigame: sanitizeMinigameState(loadedState.minigame),
    unlocks: Array.isArray(loadedState.unlocks)
      ? sanitizeStringArray(loadedState.unlocks)
      : (state.unlocks ?? []),
    completedMilestones: Array.isArray(loadedState.completedMilestones)
      ? sanitizeStringArray(loadedState.completedMilestones)
      : (state.completedMilestones ?? []),
    assets: sanitizedAssets,
    liabilities: sanitizedLiabilities,
    crowdfundCampaigns: sanitizeCrowdfundCampaigns(
      loadedState.crowdfundCampaigns,
      sanitizedAssets
    ),
    rngSeed: sanitizeRngSeed(loadedState.rngSeed),
    rivalBand: sanitizeRivalBand(loadedState.rivalBand)
  }

  // Apply venue migrations using spreads
  const migratedState: GameState = {
    ...safeState,
    player: {
      ...safeState.player,
      location:
        typeof safeState.player.location === 'string'
          ? migratePlayerLocation(safeState.player.location)
          : DEFAULT_PLAYER_STATE.location
    },
    venueBlacklist: (() => {
      const acc: string[] = []
      for (const id of safeState.venueBlacklist) {
        const migrated = migrateLegacyVenueId(id)
        if (migrated.length > 0) acc.push(migrated)
      }
      return acc
    })(),
    // Region reputation is keyed per canonical city key. Older saves keyed
    // entries by `venues:<id>.name` (the player.location display key), which
    // the regional booking ban in checkVenueAccess never read. Remap; on
    // collision keep the entry with the larger magnitude so blacklist-grade
    // negatives and earned reputation both survive.
    reputationByRegion: (() => {
      const migrated: GameState['reputationByRegion'] = {}
      for (const [key, value] of Object.entries(safeState.reputationByRegion)) {
        const regionKey = getRegionKeyForLocation(key) ?? key
        if (isForbiddenKey(regionKey)) continue
        const existing = migrated[regionKey]
        if (existing === undefined || Math.abs(value) > Math.abs(existing)) {
          migrated[regionKey] = value
        }
      }
      return migrated
    })(),
    // perRegion quest scopes were stamped from player.location and may carry
    // the venue display key; progress events now emit city keys, so remap.
    activeQuests: (() => {
      // ⚡ BOLT OPTIMIZATION: Replaced .map() with procedural loop.
      // Why: Avoids closure allocation and intermediate arrays in hot paths.
      const len = safeState.activeQuests.length
      const out = new Array(len)
      for (let i = 0; i < len; i++) {
        const quest = safeState.activeQuests[i]
        if (!quest || typeof quest.scopeKey !== 'string') {
          out[i] = quest as GameState['activeQuests'][number]
          continue
        }
        if (getQuestDefinition(quest.id)?.repeatPolicy !== 'perRegion') {
          out[i] = quest as GameState['activeQuests'][number]
          continue
        }
        const regionKey = getRegionKeyForLocation(quest.scopeKey)
        if (regionKey && regionKey !== quest.scopeKey) {
          out[i] = { ...quest, scopeKey: regionKey }
        } else {
          out[i] = quest as GameState['activeQuests'][number]
        }
      }
      return out
    })(),
    completedQuestScopes: (() => {
      // ⚡ BOLT OPTIMIZATION: Replaced .map() with procedural loop.
      // Why: Avoids closure allocation and intermediate arrays in hot paths.
      const len = safeState.completedQuestScopes.length
      const out = new Array(len)
      for (let i = 0; i < len; i++) {
        const scope = safeState.completedQuestScopes[i]
        if (
          !scope ||
          getQuestDefinition(scope.questId)?.repeatPolicy !== 'perRegion'
        ) {
          out[i] = scope as GameState['completedQuestScopes'][number]
          continue
        }
        const regionKey = getRegionKeyForLocation(scope.scopeKey)
        if (regionKey && regionKey !== scope.scopeKey) {
          out[i] = { ...scope, scopeKey: regionKey }
        } else {
          out[i] = scope as GameState['completedQuestScopes'][number]
        }
      }
      return out
    })()
  }

  // Version Migration Map
  if (migratedState.version < 2) {
    // 1.0 -> 2 additions (if any structured layout changes need applying)
    migratedState.version = 2
  }

  return migratedState
}

/**
 * Recreates initial game state while preserving allowed persistent settings and unlocks.
 *
 * @param state - Current game state before reset.
 * @param payload - Optional reset overrides for settings and unlocks.
 * @returns Fresh initial state seeded with the preserved reset data.
 */
export const handleResetState = (
  state: GameState,
  payload: ResetStatePayload = {}
): GameState => {
  logger.info('GameState', 'State Reset (Debug)')

  // Construct the data to preserve across reset
  const persistedData: {
    settings?: Partial<GameSettings>
    unlocks?: string[]
  } = {
    settings:
      payload.settings !== null &&
      payload.settings !== undefined &&
      typeof payload.settings === 'object' &&
      !Array.isArray(payload.settings)
        ? sanitizeSettingsPayload(payload.settings as RawGameSettings)
        : state.settings,
    unlocks: Array.isArray(payload.unlocks)
      ? sanitizeStringArray(payload.unlocks)
      : (state.unlocks ?? [])
  }

  return createInitialState(persistedData)
}

/**
 * Applies whitelisted settings updates from a raw settings payload.
 *
 * @param state - Current game state before settings update.
 * @param payload - Raw settings object to sanitize and merge.
 * @returns Updated state with sanitized settings, or the original state for invalid payloads.
 */
export const handleUpdateSettings = (
  state: GameState,
  payload: Record<string, unknown>
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  return {
    ...state,
    settings: { ...state.settings, ...sanitizeSettingsPayload(payload) }
  }
}

/**
 * Stores the generated map or records a null map fallback.
 *
 * @param state - Current game state before map replacement.
 * @param payload - Generated game map, or null when generation failed safely.
 * @returns Updated state with `gameMap` replaced.
 */
export const handleSetMap = (
  state: GameState,
  payload: GameMap | null
): GameState => {
  if (payload) {
    logger.info('GameState', 'Map Generated')
  } else {
    logger.info('GameState', 'Map generation null fallback applied')
  }
  return { ...state, gameMap: payload }
}

/**
 * Appends a toast payload to the active toast queue.
 *
 * @param state - Current game state before adding the toast.
 * @param payload - Toast payload prepared by the caller.
 * @returns Updated state with the toast appended.
 */
export const handleAddToast = (
  state: GameState,
  payload: ToastPayload
): GameState => {
  return { ...state, toasts: [...state.toasts, payload] }
}

/**
 * Removes a toast by id from the active toast queue.
 *
 * @param state - Current game state before removing the toast.
 * @param payload - Toast id to remove.
 * @returns Updated state with matching toasts filtered out.
 */
export const handleRemoveToast = (
  state: GameState,
  payload: string
): GameState => {
  return {
    ...state,
    toasts: state.toasts.filter(t => t.id !== payload)
  }
}

const finiteEffectValue = (value: unknown): number => finiteNumberOr(value, 0)

const EFFECT_REVERTERS: Record<
  string,
  (band: BandState, value: unknown) => BandState
> = {
  harmony: (band: BandState, value: unknown) => ({
    ...band,
    harmony: clampBandHarmony(
      finiteNumberOr(band.harmony, 1) - finiteEffectValue(value)
    )
  }),
  guitar_difficulty: (band: BandState, value: unknown) => ({
    ...band,
    performance: {
      ...band.performance,
      // Exact additive inverse of the apply path (no floor); the rhythm game
      // clamps the divisor to GUITAR_MIN_DIFFICULTY at read time.
      guitarDifficulty:
        finiteNumberOr(band.performance?.guitarDifficulty, 1) -
        finiteEffectValue(value)
    }
  }),
  luck: (band: BandState, value: unknown) => ({
    ...band,
    luck: Math.max(0, finiteNumberOr(band.luck, 0) - finiteEffectValue(value))
  }),
  stamina_max: (band: BandState, value: unknown) => {
    // ⚡ BOLT OPTIMIZATION: Replaced .map() with procedural loop.
    // Why: Avoids closure allocation and intermediate arrays.
    const sourceMembers = band.members || []
    const newMembers = new Array(sourceMembers.length)
    const effectVal = finiteEffectValue(value)
    for (let i = 0; i < sourceMembers.length; i++) {
      const m = sourceMembers[i]
      newMembers[i] = {
        ...m,
        staminaMax: Math.max(0, finiteNumberOr(m?.staminaMax, 100) - effectVal)
      }
    }
    return {
      ...band,
      members: newMembers as BandMember[]
    }
  },
  style: (band: BandState, value: unknown) => ({
    ...band,
    style: Math.max(0, finiteNumberOr(band.style, 0) - finiteEffectValue(value))
  }),
  tour_success: (band: BandState, value: unknown) => ({
    ...band,
    tourSuccess: Math.max(
      0,
      finiteNumberOr(band.tourSuccess, 0) - finiteEffectValue(value)
    )
  }),
  gig_modifier: (band: BandState, value: unknown) => ({
    ...band,
    gigModifier: Math.max(
      0,
      finiteNumberOr(band.gigModifier, 0) - finiteEffectValue(value)
    )
  }),
  tempo: (band: BandState, value: unknown) => ({
    ...band,
    tempo: Math.max(0, finiteNumberOr(band.tempo, 0) - finiteEffectValue(value))
  }),
  practice_gain: (band: BandState, value: unknown) => ({
    ...band,
    practiceGain: Math.max(
      0,
      finiteNumberOr(band.practiceGain, 0) - finiteEffectValue(value)
    )
  }),
  crit: (band: BandState, value: unknown) => ({
    ...band,
    crit: Math.max(0, finiteNumberOr(band.crit, 0) - finiteEffectValue(value))
  }),
  affinity: (band: BandState, value: unknown) => ({
    ...band,
    affinity: Math.max(
      0,
      finiteNumberOr(band.affinity, 0) - finiteEffectValue(value)
    )
  }),
  crowd_control: (band: BandState, value: unknown) => ({
    ...band,
    crowdControl: Math.max(
      0,
      finiteNumberOr(band.crowdControl, 0) - finiteEffectValue(value)
    )
  })
}

/**
 * Processes contraband effect expiry and reversion as a pure function.
 * @param band - The current band state
 * @returns Updated band state
 */
const processContrabandExpiry = (band: BandState): BandState => {
  const activeEffects = band.activeContrabandEffects || []
  const stillActive: unknown[] = []
  const expired: Record<string, unknown>[] = []

  for (let i = 0; i < activeEffects.length; i++) {
    const effect = activeEffects[i]
    if (typeof effect !== 'object' || effect === null) continue
    const effectObj = effect as Record<string, unknown>
    const updatedEffect = {
      ...effectObj,
      remainingDuration: (effectObj.remainingDuration as number) - 1
    }
    if (updatedEffect.remainingDuration > 0) {
      stillActive.push(updatedEffect)
    } else {
      expired.push(updatedEffect)
    }
  }

  let nextBand = { ...band }

  // Revert expired effects
  for (let i = 0; i < expired.length; i++) {
    const e = expired[i]
    if (!e) continue
    const effectType = e.effectType as string
    const reverter = EFFECT_REVERTERS[effectType]
    if (reverter) {
      nextBand = reverter(nextBand, e.value)
    } else {
      logger.warn(
        'SystemReducer',
        `No reverter defined for expired effect type: ${effectType}`,
        { value: e.value, effect: e }
      )
    }

    // Unmark applied status in stash so relics can be used again
    if (nextBand.stash) {
      // Lazy clone stash once if needed
      if (nextBand.stash === band.stash) {
        nextBand.stash = Object.assign(Object.create(null), band.stash)
      }
      for (const itemKey in nextBand.stash) {
        if (!Object.hasOwn(nextBand.stash, itemKey)) continue
        const item = nextBand.stash[itemKey]
        if (typeof item !== 'object' || item === null) continue
        const itemObj = item as Record<string, unknown>
        if (e.instanceId != null && itemObj.instanceId === e.instanceId) {
          nextBand.stash[itemKey] = {
            ...itemObj,
            stacks: Number.isFinite(itemObj.stacks)
              ? (itemObj.stacks as number)
              : 1,
            applied: false
          }
          break
        }
      }
    }
  }

  nextBand.activeContrabandEffects = stillActive
  return nextBand
}

const applyDailyBankruptcyCheck = (state: GameState): GameState => {
  const totalDailyObligations = getTotalDailyObligations(state)
  // No gig income during day advance; obligations go through the dedicated
  // third parameter instead of being smuggled through netIncome.
  if (!shouldTriggerBankruptcy(state.player.money, 0, totalDailyObligations)) {
    return state
  }

  return {
    ...state,
    currentScene: GAME_PHASES.GAMEOVER
  }
}

/**
 * Advances the simulation by one day, including asset ticks, daily economy, social trends, deadlines, and bankruptcy checks.
 *
 * @remarks
 * Use the typed `advanceDay(state)` action creator so `dayRngStream` and
 * `nextRngSeed` are pre-generated. Dispatching a payloadless action skips
 * deterministic asset risk-event resolution.
 *
 * @param state - Current game state before the day tick.
 * @param payload - Optional deterministic RNG stream and next seed supplied by the action creator.
 * @returns Updated state after all daily systems have run.
 */
export const handleAdvanceDay = (
  state: GameState,
  payload?: {
    dayRngStream?: number[]
    nextRngSeed?: number
    rng?: () => number
  }
): GameState => {
  let nextStatePre = processAssetTick(state)
  const liabilityTick = processLiabilityTick(nextStatePre)
  nextStatePre = liabilityTick.state
  if (liabilityTick.foreclosedKinds.length > 0) {
    const pendingForeclosureNotices = [
      ...(nextStatePre.pendingForeclosureNotices ?? [])
    ]
    for (const kind of liabilityTick.foreclosedKinds) {
      if (!pendingForeclosureNotices.includes(kind)) {
        pendingForeclosureNotices.push(kind)
      }
    }
    nextStatePre = {
      ...nextStatePre,
      pendingForeclosureNotices
    }
  }
  nextStatePre = processCrowdfundTick(nextStatePre)
  if (payload?.dayRngStream) {
    const { state: s, events } = rollAssetRiskEvents(
      nextStatePre,
      payload.dayRngStream,
      0
    )
    nextStatePre = s
    // Surface fired risk events as toasts so the player gets feedback. We
    // dedupe by `${assetId}:${eventType}` within this single tick, which is
    // naturally bounded (each asset can only fire one event per day) but
    // guards against a future refactor that splits the rolls.
    if (events.length > 0) {
      const seen = new Set<string>()
      const newToasts: ToastPayload[] = []
      for (const ev of events) {
        const dedupKey = `${ev.assetId}:${ev.eventType}`
        if (seen.has(dedupKey)) continue
        seen.add(dedupKey)
        newToasts.push({
          id: `risk_${ev.assetId}_${ev.eventType}_${state.player.day ?? 0}`,
          type: 'warning',
          messageKey: `assets:risk.event.${ev.eventType}`,
          options: { assetId: ev.assetId }
        })
      }
      if (newToasts.length > 0) {
        nextStatePre = {
          ...nextStatePre,
          toasts: [...(nextStatePre.toasts ?? []), ...newToasts]
        }
      }
      const firstEvent = events[0]
      if (firstEvent && nextStatePre.pendingRiskEvent === null) {
        nextStatePre = {
          ...nextStatePre,
          pendingRiskEvent: firstEvent
        }
      }
      const emittedRisk = new Set<string>()
      const assetKinds = new Map<string, string>()
      if (nextStatePre.assets) {
        for (const asset of nextStatePre.assets) {
          assetKinds.set(asset.id, asset.kind)
        }
      }
      for (const ev of events) {
        const dedupKey = `${ev.assetId}:${ev.eventType}`
        if (emittedRisk.has(dedupKey)) continue
        emittedRisk.add(dedupKey)
        const assetKind = assetKinds.get(ev.assetId) ?? 'unknown'
        nextStatePre = QuestEvents.emit(
          nextStatePre,
          createAssetRiskTriggeredQuestEvent({
            assetId: ev.assetId,
            assetKind,
            riskType: ev.eventType
          })
        )
      }
    }
  }
  const rngSeed = payload?.nextRngSeed ?? nextStatePre.rngSeed
  state = { ...nextStatePre, rngSeed }

  const rng = typeof payload?.rng === 'function' ? payload.rng : getSafeRandom
  const { player, band, social, pendingFlags } = calculateDailyUpdates(
    state,
    rng
  )

  // Reset daily event counter immutably
  const nextPlayer = { ...player, eventsTriggeredToday: 0 }

  const nextBand = { ...band }
  if (typeof nextBand.harmony === 'number') {
    nextBand.harmony = clampBandHarmony(nextBand.harmony)
  }

  // Band stress loop: high stress drains member mood, then decays daily.
  // Gigs add stress (gigReducer); contraband `stress` effects can reduce it.
  const currentStress = clampBandStress(finiteNumberOr(nextBand.stress, 0))
  if (currentStress > 0) {
    const moodPenalty = Math.floor(
      currentStress / BALANCE_CONSTANTS.STRESS_MOOD_PENALTY_DIVISOR
    )
    if (moodPenalty > 0 && Array.isArray(nextBand.members)) {
      // ⚡ BOLT OPTIMIZATION: Replaced .map() with procedural loop.
      // Why: Avoids closure allocation and intermediate arrays.
      const sourceMembers = nextBand.members
      const newMembers = new Array(sourceMembers.length)
      for (let i = 0; i < sourceMembers.length; i++) {
        const member = sourceMembers[i]
        newMembers[i] = {
          ...member,
          mood: clampMemberMood(finiteNumberOr(member?.mood, 0) - moodPenalty)
        }
      }
      nextBand.members = newMembers as BandMember[]
    }
    nextBand.stress = clampBandStress(
      currentStress - BALANCE_CONSTANTS.STRESS_DAILY_DECAY
    )
  }

  const socialUnlockState: Pick<GameState, 'player' | 'band' | 'social'> = {
    player: nextPlayer,
    band: nextBand,
    social
  }

  // Check Social Unlocks
  const socialUnlocks = checkTraitUnlocks(socialUnlockState, {
    type: 'SOCIAL_UPDATE'
  })

  const traitResult = applyTraitUnlocks(
    { band: nextBand, toasts: state.toasts },
    socialUnlocks
  )

  // --- Contraband expiry ---
  const finalBandState = processContrabandExpiry(traitResult.band)
  // -------------------------

  const newTrend = generateDailyTrend(rng)

  // Expire quest cooldowns whose window has elapsed (mirrors the deadline check
  // pattern). Entries are kept while expiresOnDay is still in the future.
  const currentDay = finiteNumberOr(nextPlayer.day, 0)
  const activeQuestCooldowns = (state.questCooldowns ?? []).filter(
    cd => cd.expiresOnDay > currentDay
  )

  // Keep timed event cooldowns (`eventId:expiryDay`) alive until their expiry
  // day, while legacy untimed daily cooldowns (no `:`) reset every day as
  // before. Without this filter the new ego_management_retry / failure cooldown
  // entries would silently evaporate on the next advanceDay.
  // NOTE: All new event cooldowns must use the `eventId:expiryDay` format.
  // Legacy format without ':' will be intentionally dropped every day.
  const activeEventCooldowns = (state.eventCooldowns ?? []).filter(cd => {
    if (typeof cd !== 'string') return false
    const idx = cd.indexOf(':')
    if (idx < 0) return false // legacy daily entry → drop
    const expiry = parseInt(cd.slice(idx + 1), 10)
    return Number.isFinite(expiry) && expiry > currentDay
  })

  let nextState: GameState = {
    ...state,
    player: nextPlayer,
    band: finalBandState,
    social: { ...social, trend: newTrend },
    eventCooldowns: activeEventCooldowns,
    questCooldowns: activeQuestCooldowns,
    toasts: traitResult.toasts
  }

  nextState = QuestLifecycle.checkDeadlines(nextState)

  const pendingFlagsObj =
    typeof pendingFlags === 'object' && pendingFlags !== null
      ? (pendingFlags as Record<string, unknown>)
      : null
  if (pendingFlagsObj?.scandal) {
    nextState.pendingEvents = [
      ...(nextState.pendingEvents || []),
      'consequences_bandmate_scandal'
    ]
  }

  nextState = applyDailyBankruptcyCheck(nextState)

  logger.info('GameState', `Day Advanced to ${player.day}`)
  return nextState
}

/**
 * Adds an unlock id if it is valid and not already present.
 *
 * @param state - Game state before the unlock.
 * @param unlockId - Unlock id to append.
 * @returns State with the unlock appended, or the original state for invalid or
 * duplicate ids.
 */
export const handleAddUnlock = (
  state: GameState,
  unlockId: string
): GameState => {
  if (!unlockId || typeof unlockId !== 'string') return state
  if (state.unlocks?.includes(unlockId)) return state
  return { ...state, unlocks: [...(state.unlocks ?? []), unlockId] }
}

/**
 * Sets the deferred Band HQ open flag.
 *
 * @param state - Game state before updating the pending flag.
 * @param isOpen - Next pending open state.
 * @returns State with the pending flag changed, or the original state when it
 * already matches.
 */
export const handleSetPendingBandHQOpen = (
  state: GameState,
  isOpen: boolean
): GameState => {
  if (state.pendingBandHQOpen === isOpen) return state
  return { ...state, pendingBandHQOpen: isOpen }
}

/**
 * Stores the temporary supply-stop inventory shown by the current travel stop.
 *
 * @param state - Current game state before pending inventory changes.
 * @param inventory - Pending supply-stop inventory, or a non-array value to clear it.
 * @returns Updated state with normalized pending inventory.
 */
export const handleSetPendingSupplyStopInventory = (
  state: GameState,
  inventory: GameState['pendingSupplyStopInventory']
): GameState => {
  const nextInventory = Array.isArray(inventory) ? inventory : null
  if (state.pendingSupplyStopInventory === nextInventory) return state

  return {
    ...state,
    pendingSupplyStopInventory: nextInventory
  }
}

/**
 * Stores or clears the currently pending asset risk event and emits resolution progress when cleared.
 *
 * @param state - Current game state before pending risk event changes.
 * @param event - Risk event descriptor to store, or null to resolve the current pending event.
 * @returns Updated state with the pending risk event changed or resolved.
 */
export const handleSetPendingRiskEvent = (
  state: GameState,
  event: RiskEventDescriptor | null
): GameState => {
  if (event === null) {
    if (state.pendingRiskEvent === null) return state
    const resolved = state.pendingRiskEvent

    let asset: NonNullable<typeof state.assets>[number] | undefined
    if (state.assets) {
      for (let i = 0; i < state.assets.length; i++) {
        const a = state.assets[i]
        if (a?.id === resolved.assetId) {
          asset = a
          break
        }
      }
    }

    const assetKind = asset?.kind ?? 'unknown'
    return QuestEvents.emit(
      {
        ...state,
        pendingRiskEvent: null
      },
      createAssetRiskResolvedQuestEvent({
        assetId: resolved.assetId,
        assetKind,
        riskType: resolved.eventType,
        success: true
      })
    )
  }

  const nextEvent = sanitizeRiskEventDescriptor(event)
  if (!nextEvent) return state
  if (
    state.pendingRiskEvent?.assetId === nextEvent.assetId &&
    state.pendingRiskEvent.eventType === nextEvent.eventType &&
    state.pendingRiskEvent.conditionLoss === nextEvent.conditionLoss
  ) {
    return state
  }

  return {
    ...state,
    pendingRiskEvent: nextEvent
  }
}
