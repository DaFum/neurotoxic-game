import type { GameState, PostGigSummary, Venue } from '../types'
import type { RhythmSongStatsEntry } from '../types/rhythmGame'
import { SONGS_BY_ID } from '../data/songs'
import { logger } from './logger'
import { finiteNumberOr } from './finiteNumber'
import { isLeaderboardSyncEnabled } from './leaderboardSyncFlag'
import {
  defaultStorageAdapter,
  discardBufferedStorageItem,
  getSafeStorageItem,
  listStorageKeys,
  removeStorageItem,
  setSafeStorageItem
} from './storage'
import { getSafeUUID } from './crypto'
import { isLooseRecord, safeJsonParse } from './objectUtils'

/**
 * Per-song score payload accepted by the song leaderboard endpoint.
 */
type SongStat = Pick<RhythmSongStatsEntry, 'songId' | 'score' | 'accuracy'>

type ScoreIdentity = Pick<GameState['player'], 'playerId' | 'playerName'>
const pendingKey = (playerId: string) =>
  `neurotoxic_pending_song_scores:${playerId}`
const pendingJournalPrefix = (playerId: string) =>
  `${pendingKey(playerId)}:item:`
const inFlight = new Map<string, Promise<void>>()
const retryTimers = new Map<string, ReturnType<typeof setTimeout>>()
let warnedMissingLocks = false
const withPendingScoresLock = (
  playerId: string,
  update: () => void
): Promise<void> => {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(pendingKey(playerId), update)
  }
  if (!warnedMissingLocks) {
    warnedMissingLocks = true
    logger.warn('PostGig', 'Web Locks unavailable; retaining score journal')
  }
  update()
  return Promise.resolve()
}
const knownSongs = new Set<string>()
for (const song of SONGS_BY_ID.values()) {
  if (song.leaderboardId) knownSongs.add(song.leaderboardId)
}

type ValidPendingScore = { songId: string; score: number; accuracy?: unknown }
const isValidPendingScore = (entry: unknown): entry is ValidPendingScore =>
  isLooseRecord(entry) &&
  typeof entry.songId === 'string' &&
  knownSongs.has(entry.songId) &&
  typeof entry.score === 'number' &&
  Number.isFinite(entry.score) &&
  entry.score >= 0 &&
  entry.score <= 10_000_000

// Remove only scores dominated by another immutable record. A buffered-only
// winner cannot justify deleting persistent records that would survive reload.
const compactPendingJournal = (playerId: string): void => {
  const prefix = pendingJournalPrefix(playerId)
  const records: {
    key: string
    score: ValidPendingScore
    durable: boolean
    persisted: ValidPendingScore | null
  }[] = []
  const winners = new Map<string, (typeof records)[number]>()
  for (const key of listStorageKeys()) {
    if (!key.startsWith(prefix)) continue
    const score = getSafeStorageItem<unknown>(key, null)
    if (!isValidPendingScore(score)) continue
    let durable = false
    let persistedScore: ValidPendingScore | null = null
    const persisted = defaultStorageAdapter.get(key)
    if (persisted !== null) {
      try {
        const stored = safeJsonParse<unknown>(persisted)
        if (isValidPendingScore(stored)) persistedScore = stored
        durable =
          persistedScore !== null &&
          persistedScore.songId === score.songId &&
          persistedScore.score === score.score &&
          finiteNumberOr(persistedScore.accuracy, 0) ===
            finiteNumberOr(score.accuracy, 0)
      } catch {
        // Leave malformed or unreadable persistent data untouched.
      }
    }
    const record = { key, score, durable, persisted: persistedScore }
    records.push(record)
    const current = winners.get(score.songId)
    if (
      !current ||
      score.score > current.score.score ||
      (score.score === current.score.score &&
        (Number(durable) > Number(current.durable) ||
          (durable === current.durable && key > current.key)))
    ) {
      winners.set(score.songId, record)
    }
  }
  for (const record of records) {
    const winner = winners.get(record.score.songId)
    if (!winner || winner.key === record.key) continue
    if (
      winner.durable &&
      record.persisted?.songId === winner.score.songId &&
      record.persisted.score <= winner.score.score
    ) {
      removeStorageItem(record.key)
    } else {
      discardBufferedStorageItem(record.key)
    }
  }
}

// Journal records are immutable: their individual keys prevent concurrent
// read/merge/write operations from losing a submission when Web Locks is absent.
const readPendingScores = (
  playerId: string
): { scores: SongStat[]; journalKeys: string[] } => {
  const raw = getSafeStorageItem<unknown>(pendingKey(playerId), [])
  const scores = new Map<string, SongStat>()
  const journalKeys: string[] = []
  const add = (entry: unknown): string | undefined => {
    if (!isValidPendingScore(entry)) return undefined
    const existing = scores.get(entry.songId)
    if (!existing && scores.size >= 100) return undefined
    if (!existing || entry.score > existing.score) {
      scores.set(entry.songId, {
        songId: entry.songId,
        score: entry.score,
        accuracy: finiteNumberOr(entry.accuracy, 0)
      })
    }
    return entry.songId
  }
  if (Array.isArray(raw)) {
    for (const entry of raw.slice(0, 100)) add(entry)
  }
  const prefix = pendingJournalPrefix(playerId)
  for (const key of listStorageKeys()) {
    if (!key.startsWith(prefix)) continue
    const songId = add(getSafeStorageItem<unknown>(key, null))
    if (songId) journalKeys.push(key)
  }
  return {
    scores: [...scores.values()],
    journalKeys
  }
}

/** Retries persisted scores after startup or a transient network/server failure. */
export const retryPendingLeaderboardScores = (
  player: ScoreIdentity
): Promise<void> => {
  const { playerId, playerName } = player
  if (!isLeaderboardSyncEnabled() || !playerId || !playerName)
    return Promise.resolve()
  clearTimeout(retryTimers.get(playerId))
  retryTimers.delete(playerId)
  const current = inFlight.get(playerId)
  if (current) return current
  const { scores, journalKeys } = readPendingScores(playerId)
  if (scores.length === 0) return Promise.resolve()

  const request = (async () => {
    const controller = new AbortController()
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let acknowledged = false
    let retry = true
    try {
      await Promise.race([
        (async () => {
          const res = await fetch('/api/leaderboard/song', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, playerName, scores }),
            signal: controller.signal
          })
          if (controller.signal.aborted) return
          if (res.status === 404) {
            retry = false
            logger.info(
              'PostGig',
              'Leaderboard endpoint unavailable for batch submission'
            )
            return
          }
          if (!res.ok) {
            acknowledged =
              res.status >= 400 &&
              res.status < 500 &&
              res.status !== 408 &&
              res.status !== 429
            const err = await res.text()
            if (controller.signal.aborted) return
            throw new Error(`HTTP ${res.status}: ${err}`)
          }
          acknowledged = true
        })(),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            controller.abort()
            reject(new Error('Song score submission timed out'))
          }, 5000)
        })
      ])
    } catch (err) {
      logger.error('PostGig', 'Batch score submit failed', err)
    } finally {
      clearTimeout(timeoutId)
      if (acknowledged) {
        const sent = new Map(scores.map(score => [score.songId, score.score]))
        try {
          await withPendingScoresLock(playerId, () => {
            setSafeStorageItem(
              pendingKey(playerId),
              readPendingScores(playerId).scores.filter(
                score => score.score > (sent.get(score.songId) ?? -1)
              )
            )
          })
          for (const key of journalKeys) removeStorageItem(key)
        } catch (err) {
          retry = true
          logger.error('PostGig', 'Pending score cleanup failed', err)
        }
      }
      inFlight.delete(playerId)
      if (retry && readPendingScores(playerId).scores.length > 0) {
        retryTimers.set(
          playerId,
          setTimeout(() => {
            retryTimers.delete(playerId)
            void retryPendingLeaderboardScores(player)
          }, 15_000)
        )
      }
    }
  })()
  inFlight.set(playerId, request)
  return request
}

/**
 * Builds a leaderboard score entry for a song, resolving its leaderboard id.
 *
 * @param songId - Internal song id to resolve through `SONGS_BY_ID`.
 * @param score - Raw score; coerced to a finite number.
 * @param accuracy - Raw accuracy; coerced to a finite number.
 * @returns The score entry, or `undefined` when the song has no leaderboard id.
 */
const toLeaderboardScore = (
  songId: string | undefined,
  score: unknown,
  accuracy: unknown
): SongStat | undefined => {
  const leaderboardSongId =
    typeof songId === 'string'
      ? SONGS_BY_ID.get(songId)?.leaderboardId
      : undefined
  if (!leaderboardSongId) return undefined
  return {
    songId: leaderboardSongId,
    score: finiteNumberOr(score, 0),
    accuracy: finiteNumberOr(accuracy, 0)
  }
}

/**
 * Submits per-song leaderboard scores for the last gig.
 *
 * @remarks
 * Does nothing while `VITE_ENABLE_LEADERBOARD_SYNC` is off (see
 * {@link isLeaderboardSyncEnabled}).
 *
 * @param params - Submission context containing player identity, last gig stats,
 * current gig, and setlist fallback data.
 */
export const submitLeaderboardScores = async ({
  player,
  lastGigStats,
  currentGig,
  setlist
}: {
  player: GameState['player']
  lastGigStats: PostGigSummary | null
  currentGig: Venue | null
  setlist: GameState['setlist']
}) => {
  if (!isLeaderboardSyncEnabled()) return
  if (!player.playerId || !player.playerName) return
  const playerId = player.playerId

  const scoresToSubmit: SongStat[] = []

  const songStats = lastGigStats?.songStats

  if (songStats && songStats.length > 0) {
    // Use the detailed per-song stats generated during the gig
    // ⚡ BOLT OPTIMIZATION: Replaced chained .map().filter() with a single procedural loop.
    // Why: Eliminates intermediate array allocations and reduces garbage collection pressure.
    for (let i = 0; i < songStats.length; i++) {
      const stat = songStats[i]
      const entry = toLeaderboardScore(
        stat?.songId,
        stat?.score,
        stat?.accuracy
      )
      if (entry !== undefined) {
        scoresToSubmit.push(entry)
      }
    }
  } else {
    // Fallback for legacy saves or early aborted gigs without per-song stats
    const setlistFirstId =
      typeof setlist?.[0] === 'string' ? setlist[0] : setlist?.[0]?.id
    const playedSongId = currentGig?.songId ?? setlistFirstId
    if (typeof playedSongId === 'string') {
      const entry = toLeaderboardScore(
        playedSongId,
        lastGigStats?.score,
        lastGigStats?.accuracy
      )
      if (entry) scoresToSubmit.push(entry)
    } else {
      logger.warn('PostGig', 'No valid songId found for legacy fallback')
      return
    }
  }

  if (scoresToSubmit.length === 0) return

  // Keep each new score in an immutable record before touching the shared
  // queue. A concurrent fallback write can overwrite the queue, but not these
  // records, which remain discoverable after reload until acknowledged.
  for (const score of scoresToSubmit) {
    if (isValidPendingScore(score)) {
      compactPendingJournal(playerId)
      setSafeStorageItem(
        `${pendingJournalPrefix(playerId)}${getSafeUUID()}`,
        score
      )
    }
  }
  compactPendingJournal(playerId)

  // Persist before sending; GT writes need only the best pending score per song.
  const persistAndSend = async (): Promise<void> => {
    try {
      await withPendingScoresLock(playerId, () => {
        const pending = new Map(
          readPendingScores(playerId).scores.map(score => [score.songId, score])
        )
        for (const score of scoresToSubmit) {
          if (score.score > (pending.get(score.songId)?.score ?? -1))
            pending.set(score.songId, score)
        }
        setSafeStorageItem(pendingKey(playerId), [...pending.values()])
      })
    } catch (err) {
      logger.error('PostGig', 'Pending score persistence failed', err)
      setTimeout(() => {
        void persistAndSend()
      }, 15_000)
      return
    }
    await retryPendingLeaderboardScores(player)
  }
  await persistAndSend()
}
