import type { GameState, PostGigSummary, Venue } from '../types'
import type { RhythmSongStatsEntry } from '../types/rhythmGame'
import { SONGS_BY_ID } from '../data/songs'
import { logger } from './logger'
import { finiteNumberOr } from './finiteNumber'
import { isLeaderboardSyncEnabled } from './leaderboardSyncFlag'
import { getSafeStorageItem, setSafeStorageItem } from './storage'
import { isLooseRecord } from './objectUtils'

/**
 * Per-song score payload accepted by the song leaderboard endpoint.
 */
type SongStat = Pick<RhythmSongStatsEntry, 'songId' | 'score' | 'accuracy'>

type ScoreIdentity = Pick<GameState['player'], 'playerId' | 'playerName'>
const pendingKey = (playerId: string) =>
  `neurotoxic_pending_song_scores:${playerId}`
const inFlight = new Map<string, Promise<void>>()
const retryTimers = new Map<string, ReturnType<typeof setTimeout>>()
const knownSongs = new Set<string>()
for (const song of SONGS_BY_ID.values()) {
  if (song.leaderboardId) knownSongs.add(song.leaderboardId)
}

const readPendingScores = (playerId: string): SongStat[] => {
  const raw = getSafeStorageItem<unknown>(pendingKey(playerId), [])
  if (!Array.isArray(raw)) return []
  const scores: SongStat[] = []
  for (const entry of raw.slice(0, 100)) {
    if (
      !isLooseRecord(entry) ||
      typeof entry.songId !== 'string' ||
      !knownSongs.has(entry.songId) ||
      typeof entry.score !== 'number' ||
      !Number.isFinite(entry.score) ||
      entry.score < 0 ||
      entry.score > 10_000_000
    )
      continue
    scores.push({
      songId: entry.songId,
      score: entry.score,
      accuracy: finiteNumberOr(entry.accuracy, 0)
    })
  }
  return scores
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
  const scores = readPendingScores(playerId)
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
        setSafeStorageItem(
          pendingKey(playerId),
          readPendingScores(playerId).filter(
            score => score.score > (sent.get(score.songId) ?? -1)
          )
        )
      }
      inFlight.delete(playerId)
      if (retry && readPendingScores(playerId).length > 0) {
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

  // Persist before sending; GT writes need only the best pending score per song.
  const pending = new Map(
    readPendingScores(player.playerId).map(score => [score.songId, score])
  )
  for (const score of scoresToSubmit) {
    if (score.score > (pending.get(score.songId)?.score ?? -1))
      pending.set(score.songId, score)
  }
  setSafeStorageItem(pendingKey(player.playerId), [...pending.values()])
  await retryPendingLeaderboardScores(player)
}
