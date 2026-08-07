import { finiteNumberOr, isFiniteNumber } from './finiteNumber'
import { hasTrait } from './traitUtils'
import { CHARACTERS } from '../data/characters'
import { SONGS_BY_ID } from '../data/songs'
import { isLooseRecord } from './objectUtils'
import { isEmptyObject } from './gameState'
import type { BandMember, GameState } from '../types'

/**
 * Domain logic for trait unlock evaluation.
 * Inspects game state + a context envelope and returns the
 * list of `memberId, traitId` pairs that have been earned.
 *
 * Does NOT persist anything. For persistence, see ./unlockManager.ts.
 */

type UnlockCheckState = Pick<GameState, 'player' | 'band' | 'social'>

/** Band members that trait unlocks can target. */
type UnlockMemberKey = 'MATZE' | 'MARIUS' | 'LARS'

/** Context envelope kinds that can produce trait unlocks. */
type UnlockEventType =
  | 'GIG_COMPLETE'
  | 'TRAVEL_COMPLETE'
  | 'PURCHASE'
  | 'SOCIAL_UPDATE'
  | 'EVENT_RESOLVED'

/**
 * Gig metrics derived once per `GIG_COMPLETE` envelope and shared by every
 * performance rule. Absent when the gig failed or nothing was actually played.
 */
type PerformanceContext = {
  accuracy: number
  misses: number
  maxCombo: number
  songs: Record<string, unknown>[]
}

/** Everything an unlock predicate may read. */
type UnlockRuleContext = {
  state: UnlockCheckState
  ctx: Record<string, unknown>
  performance: PerformanceContext | undefined
}

/**
 * One declarative trait-unlock rule.
 *
 * @remarks
 * The member lookup, existing-trait check, and result construction are handled
 * by {@link checkTraitUnlocks}; a rule only declares when it is earned.
 */
type UnlockRule = {
  eventType: UnlockEventType
  member: UnlockMemberKey
  traitId: string
  predicate: (context: UnlockRuleContext, member: BandMember) => boolean
}

const hasRelationshipBelow = (
  relationships: unknown,
  threshold: number
): boolean => {
  if (!isLooseRecord(relationships)) return false
  return Object.values(relationships).some(
    score =>
      typeof score === 'number' && Number.isFinite(score) && score < threshold
  )
}

/**
 * Resolves the singular `gigStats.song` envelope into metadata that is safe to
 * evaluate traits against. Songs carrying an id are resolved through
 * `SONGS_BY_ID` and their embedded bpm/difficulty is discarded; id-less legacy
 * objects keep only the numeric fields that are actually finite.
 */
const resolvePerformanceSong = (
  song: unknown
): Record<string, unknown> | undefined => {
  if (!isLooseRecord(song)) return undefined
  // A present id must resolve: only an absent one falls back to legacy
  // metadata, so a malformed id cannot smuggle forged bpm/difficulty through.
  if (Object.hasOwn(song, 'id')) {
    if (typeof song.id !== 'string') return undefined
    const canonical = SONGS_BY_ID.get(song.id)
    return canonical
      ? (canonical as unknown as Record<string, unknown>)
      : undefined
  }
  const resolved: Record<string, unknown> = {}
  if (isFiniteNumber(song.bpm)) resolved.bpm = song.bpm
  if (isFiniteNumber(song.difficulty)) resolved.difficulty = song.difficulty
  return isEmptyObject(resolved) ? undefined : resolved
}

/**
 * Builds the shared performance metrics for a `GIG_COMPLETE` envelope.
 *
 * @returns Derived metrics, or `undefined` when the gig failed or nothing was played.
 */
const buildPerformanceContext = (
  ctx: Record<string, unknown>
): PerformanceContext | undefined => {
  if (ctx.type !== 'GIG_COMPLETE' || !isLooseRecord(ctx.gigStats)) {
    return undefined
  }
  const gigStats = ctx.gigStats
  const misses = finiteNumberOr(gigStats.misses, 0)
  const perfectHits = finiteNumberOr(gigStats.perfectHits, 0)
  const maxCombo = finiteNumberOr(gigStats.maxCombo, 0)

  const songStats = Array.isArray(gigStats.songStats) ? gigStats.songStats : []
  const songs = songStats.flatMap(songStat => {
    if (!isLooseRecord(songStat) || typeof songStat.songId !== 'string') {
      return []
    }
    const song = SONGS_BY_ID.get(songStat.songId)
    return song ? [song as unknown as Record<string, unknown>] : []
  })
  const directSong = resolvePerformanceSong(gigStats.song)
  if (directSong) songs.push(directSong)

  const hasAttemptedPerformance =
    perfectHits > 0 || misses > 0 || maxCombo > 0 || songs.length > 0
  if (gigStats.failed === true || !hasAttemptedPerformance) return undefined

  return {
    accuracy: finiteNumberOr(gigStats.accuracy, 0),
    misses,
    maxCombo,
    songs
  }
}

const hasHighDifficultySong = (songs: Record<string, unknown>[]): boolean => {
  return songs.some(song => song && finiteNumberOr(song.difficulty, 0) > 3)
}

const isBpmFast = (bpm: number) => bpm > 160
const isBpmSlow = (bpm: number) => bpm < 120

const hasSongBpm = (
  songs: Record<string, unknown>[],
  predicate: (bpm: number) => boolean
): boolean => {
  return songs.some(
    song =>
      song &&
      typeof song.bpm === 'number' &&
      Number.isFinite(song.bpm) &&
      predicate(song.bpm)
  )
}

const UNLOCK_RULES: readonly UnlockRule[] = [
  // 1. Performance unlocks (post-gig)
  {
    eventType: 'GIG_COMPLETE',
    member: 'MATZE',
    traitId: 'virtuoso',
    predicate: ({ performance }) => performance?.misses === 0
  },
  {
    eventType: 'GIG_COMPLETE',
    member: 'MATZE',
    traitId: 'perfektionist',
    predicate: ({ performance }) => performance?.accuracy === 100
  },
  {
    eventType: 'GIG_COMPLETE',
    member: 'MARIUS',
    traitId: 'blast_machine',
    predicate: ({ performance }) =>
      !!performance &&
      hasSongBpm(performance.songs, isBpmFast) &&
      performance.maxCombo > 50
  },
  {
    eventType: 'GIG_COMPLETE',
    member: 'LARS',
    traitId: 'melodic_genius',
    predicate: ({ performance }) =>
      !!performance &&
      hasSongBpm(performance.songs, isBpmSlow) &&
      performance.maxCombo > 30
  },
  {
    eventType: 'GIG_COMPLETE',
    member: 'MATZE',
    traitId: 'tech_wizard',
    predicate: ({ performance }) =>
      !!performance &&
      hasHighDifficultySong(performance.songs) &&
      performance.accuracy === 100
  },

  // 2. Travel unlocks
  {
    eventType: 'TRAVEL_COMPLETE',
    member: 'LARS',
    traitId: 'road_warrior',
    predicate: ({ state }) =>
      finiteNumberOr(state.player.stats?.totalDistance, 0) >= 5000
  },

  // 3. Purchase unlocks
  {
    eventType: 'PURCHASE',
    member: 'MARIUS',
    traitId: 'party_animal',
    predicate: ({ ctx, state }) => {
      const item = isLooseRecord(ctx.item) ? ctx.item : undefined
      return (
        item?.id === 'hq_room_cheap_beer_fridge' ||
        (state.player.hqUpgrades || []).includes('hq_room_cheap_beer_fridge')
      )
    }
  },
  {
    eventType: 'PURCHASE',
    member: 'MATZE',
    traitId: 'gear_nerd',
    // gearCount is pre-calculated by usePurchaseLogic after filtering
    // inventory against HQ gear/instrument categories.
    predicate: ({ ctx }) => finiteNumberOr(ctx.gearCount, 0) >= 5
  },

  // 4. Social unlocks
  {
    eventType: 'SOCIAL_UPDATE',
    member: 'LARS',
    traitId: 'social_manager',
    predicate: ({ state }) =>
      Math.max(
        finiteNumberOr(state.social?.instagram, 0),
        finiteNumberOr(state.social?.tiktok, 0),
        finiteNumberOr(state.social?.youtube, 0)
      ) >= 1000
  },
  {
    eventType: 'SOCIAL_UPDATE',
    member: 'MARIUS',
    traitId: 'clumsy',
    predicate: ({ state }) =>
      finiteNumberOr(state.player.stats?.failedStageDives, 0) >= 2
  },

  // 5. Event unlocks
  {
    eventType: 'EVENT_RESOLVED',
    member: 'LARS',
    traitId: 'bandleader',
    predicate: ({ state }) =>
      finiteNumberOr(state.player.stats?.conflictsResolved, 0) >= 3
  },
  {
    eventType: 'EVENT_RESOLVED',
    member: 'MARIUS',
    traitId: 'showman',
    predicate: ({ state }) =>
      finiteNumberOr(state.player.stats?.stageDives, 0) >= 3
  },
  {
    eventType: 'EVENT_RESOLVED',
    member: 'MATZE',
    traitId: 'grudge_holder',
    predicate: (_context, member) =>
      !!member.relationships && hasRelationshipBelow(member.relationships, 30)
  },
  {
    eventType: 'EVENT_RESOLVED',
    member: 'LARS',
    traitId: 'peacemaker',
    predicate: ({ state }) => (state.band.harmony ?? 1) >= 90
  }
]

/**
 * Checks for trait unlocks based on game state changes.
 * @param state - The full game state (player, band, etc.).
 * @param context - Contextual data (gigStats, purchaseItem, etc.).
 * @returns List of `memberId, traitId` to unlock.
 */
export const checkTraitUnlocks = (
  state: UnlockCheckState,
  context: unknown = {}
) => {
  const ctx: Record<string, unknown> = isLooseRecord(context) ? context : {}
  const members = state.band?.members || []

  // Resolve the three rule-targeted members in a single pass.
  const byKey: Partial<Record<UnlockMemberKey, BandMember>> = {}
  for (const member of members) {
    if (!member) continue
    if (member.name === CHARACTERS.MATZE.name) byKey.MATZE = member
    else if (member.name === CHARACTERS.MARIUS.name) byKey.MARIUS = member
    else if (member.name === CHARACTERS.LARS.name) byKey.LARS = member
  }

  const ruleContext: UnlockRuleContext = {
    state,
    ctx,
    performance: buildPerformanceContext(ctx)
  }

  const newUnlocks: { memberId: string; traitId: string }[] = []
  for (const rule of UNLOCK_RULES) {
    if (ctx.type !== rule.eventType) continue
    const member = byKey[rule.member]
    if (!member || hasTrait(member, rule.traitId)) continue
    if (!rule.predicate(ruleContext, member)) continue
    // `member` was matched by name against this character, so the canonical
    // character name is the member id.
    newUnlocks.push({
      memberId: CHARACTERS[rule.member].name,
      traitId: rule.traitId
    })
  }

  return newUnlocks
}
