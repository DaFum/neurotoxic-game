import {
  sanitizePlayer,
  sanitizeBand,
  sanitizeSocial,
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
import { CURRENT_SAVE_VERSION, runSaveMigrations } from './migrations'
import { createRngStream, nextSeed } from '../../utils/seededRng'
import { getAdvanceDayRngStreamLength } from '../../utils/assetConfig'
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
  parseCooldownEntry,
  sanitizeStringArray,
  BALANCE_CONSTANTS
} from '../../utils/gameState'
import { calculateDailyUpdates } from '../../utils/simulationUtils'
import { shouldTriggerBankruptcy } from '../../utils/economy'
import { getTotalDailyObligations } from '../../utils/assetSelectors'
import { generateDailyTrend } from '../../utils/socialEngine'
import { checkTraitUnlocks } from '../../utils/unlockCheck'
import { applyTraitUnlocks } from '../../utils/traitUtils'
import { getRegionKeyForLocation } from '../../utils/mapUtils'
import { createInitialState } from '../initialState'
import { GAME_PHASES } from '../gameConstants'
import { QuestLifecycle } from '../../domain/questLifecycle'
import { getQuestDefinition } from '../../data/questRegistry'
import { applySharedBandEffect } from '../../utils/contrabandEffects'
import {
  sanitizeAssets,
  sanitizeAssetKinds,
  sanitizeCrowdfundCampaigns,
  sanitizeLiabilities,
  sanitizeRiskEventDescriptor,
  sanitizeRngSeed,
  sanitizeRunSeed
} from './assetSanitizers'
import type { RiskEventDescriptor } from '../../types/assets'

/**
 * Remaps `perRegion` quest scope keys from legacy venue-display keys to canonical
 * city keys. Older saves stamped scope keys from `player.location` (a
 * `venues:<id>.name` display key); quest progress events now emit region keys, so
 * both active quests and completed scopes must be migrated on load. Items whose
 * quest is not `perRegion`, or that lack a string `scopeKey`, pass through
 * unchanged. Uses a preallocated procedural loop to avoid intermediate arrays.
 *
 * @param items - The active-quest or completed-scope entries to migrate.
 * @param getQuestId - Reads the quest id from an entry (`id` vs `questId`).
 * @returns A new array with `perRegion` scope keys remapped to region keys.
 */
const remapPerRegionScopeKeys = <T extends { scopeKey?: unknown }>(
  items: readonly T[],
  getQuestId: (item: T) => string
): T[] => {
  // ⚡ BOLT OPTIMIZATION: Replaced .map() with a procedural loop to avoid closure allocation and intermediate arrays in hot paths.
  const len = items.length
  const result = new Array<T>(len)
  for (let i = 0; i < len; i++) {
    const item = items[i]
    if (item === undefined) {
      result[i] = item as unknown as T
      continue
    }
    const scopeKey = item.scopeKey
    if (
      typeof scopeKey !== 'string' ||
      getQuestDefinition(getQuestId(item as T))?.repeatPolicy !== 'perRegion'
    ) {
      result[i] = item as T
      continue
    }
    const regionKey = getRegionKeyForLocation(scopeKey)
    result[i] =
      regionKey && regionKey !== scopeKey
        ? ({ ...item, scopeKey: regionKey } as T)
        : (item as T)
  }
  return result
}

const migrateVenueBlacklist = (blacklist: string[]): string[] => {
  const acc: string[] = []
  for (let i = 0; i < blacklist.length; i++) {
    const id = blacklist[i]
    if (!id) continue
    const migrated = migrateLegacyVenueId(id)
    if (migrated.length > 0) acc.push(migrated)
  }
  return acc
}

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

  const rawState: Record<string, unknown> = (
    typeof payload === 'object' && payload !== null ? payload : {}
  ) as Record<string, unknown>

  const rawVersion = Object.hasOwn(rawState, 'version')
    ? rawState.version
    : state.version
  const parsedVersion = Number(rawVersion)
  const explicitVersion = Number.isFinite(parsedVersion) ? parsedVersion : 0

  // Fold the raw payload through every migration step above its stored version
  // before any sanitizer runs, so each step sees the layout it was written for.
  //
  // `usePersistence` already quarantines and bails out on a throwing migration,
  // so this fold is a no-op on the normal load path. A direct LOAD_GAME dispatch
  // bypasses that guard, and a reducer must not throw: fall back to the
  // un-migrated payload and let the sanitizers below clamp whatever survives.
  let migratedPayload: unknown = rawState
  try {
    migratedPayload = runSaveMigrations(rawState, explicitVersion)
  } catch (error) {
    logger.error(
      'GameState',
      `Save migration from version ${explicitVersion} failed; loading unmigrated payload`,
      error instanceof Error ? error.message : String(error)
    )
  }
  const loadedState: Record<string, unknown> = (
    typeof migratedPayload === 'object' && migratedPayload !== null
      ? migratedPayload
      : {}
  ) as Record<string, unknown>

  // 1. Sanitize Player
  const mergedPlayer = sanitizePlayer(loadedState.player)
  // 2. Sanitize Band
  const validatedBand = sanitizeBand(loadedState.band)
  // 3. Sanitize Social
  const mergedSocial = sanitizeSocial(loadedState.social)

  // 4. Construct Safe State (Whitelist)
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
    version: Math.max(explicitVersion, CURRENT_SAVE_VERSION),
    player: mergedPlayer,
    band: validatedBand,
    social: mergedSocial,
    gameMap:
      Object.hasOwn(loadedState, 'gameMap') && loadedState.gameMap === null
        ? null
        : (normalizeLoadedGameMap(loadedState.gameMap) ?? state.gameMap),
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
    runSeed: sanitizeRunSeed(loadedState.runSeed),
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
    venueBlacklist: migrateVenueBlacklist(safeState.venueBlacklist),
    // Region reputation is keyed per canonical city key. Older saves keyed
    // entries by `venues:<id>.name` (the player.location display key), which
    // the regional booking ban in checkVenueAccess never read. Remap; on
    // collision keep the entry with the larger magnitude so blacklist-grade
    // negatives and earned reputation both survive.
    reputationByRegion: (() => {
      const migrated: GameState['reputationByRegion'] = {}
      for (const key in safeState.reputationByRegion) {
        if (!Object.hasOwn(safeState.reputationByRegion, key)) continue
        const value = safeState.reputationByRegion[key] as number
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
    activeQuests: remapPerRegionScopeKeys(
      safeState.activeQuests,
      quest => quest.id
    ),
    completedQuestScopes: remapPerRegionScopeKeys(
      safeState.completedQuestScopes,
      scope => scope.questId
    )
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
      remainingDuration: finiteNumberOr(effectObj.remainingDuration, 0) - 1
    }
    if (updatedEffect.remainingDuration > 0) {
      stillActive.push(updatedEffect)
    } else {
      expired.push(updatedEffect)
    }
  }

  const nextBand = { ...band }

  // Revert expired effects
  for (let i = 0; i < expired.length; i++) {
    const e = expired[i]
    if (!e) continue
    const effectType = e.effectType as string

    // Apply exact additive inverse (no floor) to revert the effect.
    // The rhythm game clamps `guitar_difficulty` to `GUITAR_MIN_DIFFICULTY` at read time.
    const applied = applySharedBandEffect(
      nextBand,
      effectType,
      -finiteNumberOr(e.value, 0)
    )

    if (applied) {
      // Re-clamp bounds for stats that cannot drop below zero
      if (
        effectType === 'luck' ||
        effectType === 'style' ||
        effectType === 'tour_success' ||
        effectType === 'gig_modifier' ||
        effectType === 'tempo' ||
        effectType === 'practice_gain' ||
        effectType === 'crit' ||
        effectType === 'affinity' ||
        effectType === 'crowd_control'
      ) {
        // We know from applySharedBandEffect which property maps to the effectType
        // All of these map directly or to camelCase variants
        const key = effectType.replace(/_([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        )
        const bandRecord = nextBand as unknown as Record<
          string,
          number | undefined
        >
        const val = finiteNumberOr(bandRecord[key], 0)
        bandRecord[key] = Math.max(0, val)
      } else if (effectType === 'harmony') {
        // Harmony has a dedicated 0-100 clamp
        nextBand.harmony = clampBandHarmony(finiteNumberOr(nextBand.harmony, 1))
      } else if (effectType === 'stress') {
        // Stress has a dedicated 0-100 clamp
        nextBand.stress = clampBandStress(finiteNumberOr(nextBand.stress, 0))
      } else if (effectType === 'stamina_max') {
        // Members' staminaMax clamp
        if (nextBand.members) {
          // ⚡ BOLT OPTIMIZATION: Replaced .map() with procedural loop.
          // Why: Avoids intermediate array allocation inside the hot state update path.
          const len = nextBand.members.length
          const updatedMembers = new Array<BandMember>(len)
          for (let mIdx = 0; mIdx < len; mIdx++) {
            const m = nextBand.members[mIdx] as BandMember
            updatedMembers[mIdx] = {
              ...m,
              staminaMax: Math.max(0, finiteNumberOr(m?.staminaMax, 100))
            }
          }
          nextBand.members = updatedMembers
        }
      }
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
 * `nextRngSeed` are pre-generated. Payloadless dispatches (legacy callers,
 * direct reducer tests) derive the same deterministic stream from
 * `state.rngSeed`, so every random daily outcome stays deterministic.
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
    nextStatePre = {
      ...nextStatePre,
      pendingForeclosureNotices: Array.from(
        new Set([
          ...(nextStatePre.pendingForeclosureNotices ?? []),
          ...liabilityTick.foreclosedKinds
        ])
      )
    }
  }
  nextStatePre = processCrowdfundTick(nextStatePre)
  // Payloadless dispatches derive the same deterministic stream that
  // advanceDay(state) would have pre-rolled from state.rngSeed, so direct
  // reducer dispatches cannot skip asset risk-event integration. Pure: the
  // fallback seed is a fixed clamp, never Date.now().
  const baseSeed = finiteNumberOr(state.rngSeed, 0) >>> 0
  const dayRngStream = Array.isArray(payload?.dayRngStream)
    ? payload.dayRngStream
    : createRngStream(
        baseSeed,
        getAdvanceDayRngStreamLength(nextStatePre.assets?.length ?? 0)
      )
  let dayRngCursor = 0
  {
    const {
      state: s,
      cursor,
      events
    } = rollAssetRiskEvents(nextStatePre, dayRngStream, 0)
    nextStatePre = s
    dayRngCursor = cursor
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
  const rngSeed = finiteNumberOr(payload?.nextRngSeed, nextSeed(baseSeed)) >>> 0
  state = { ...nextStatePre, rngSeed }

  const rng =
    typeof payload?.rng === 'function'
      ? payload.rng
      : () => {
          const roll = dayRngStream[dayRngCursor++]
          if (!Number.isFinite(roll)) return 1
          return Math.min(Math.max(roll!, 0), 1 - Number.EPSILON)
        }
  const { player, band, social, pendingFlags } = calculateDailyUpdates(
    state,
    rng
  )

  // Reset daily event counter immutably
  const nextPlayer = { ...player, eventsTriggeredToday: 0 }

  const nextBand = { ...band }
  if (typeof nextBand.harmony !== 'undefined') {
    nextBand.harmony = clampBandHarmony(finiteNumberOr(nextBand.harmony, 50))
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
      // Why: Eliminates intermediate array allocations in high-frequency day advance ticks.
      const len = nextBand.members.length
      const updatedMembers = new Array<BandMember>(len)
      for (let i = 0; i < len; i++) {
        const member = nextBand.members[i] as BandMember
        updatedMembers[i] = {
          ...member,
          mood: clampMemberMood(finiteNumberOr(member?.mood, 0) - moodPenalty)
        }
      }
      nextBand.members = updatedMembers
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
    cd => cd && cd.expiresOnDay > currentDay
  )

  // Keep timed event cooldowns (`eventId:expiryDay`) alive until their expiry
  // day, while legacy untimed daily cooldowns (no `:`) reset every day as
  // before. Without this filter the new ego_management_retry / failure cooldown
  // entries would silently evaporate on the next advanceDay.
  // NOTE: All new event cooldowns must use the `eventId:expiryDay` format.
  // Legacy format without ':' will be intentionally dropped every day.
  // The entry grammar lives in `parseCooldownEntry`, shared with every
  // cooldown reader, so expiry here cannot drift from what `isOnCooldown`
  // enforces. A null expiryDay is a legacy untimed entry and still resets.
  const activeEventCooldowns = (state.eventCooldowns ?? []).filter(cd => {
    const parsed = parseCooldownEntry(cd)
    return parsed?.expiryDay != null && parsed.expiryDay > currentDay
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
