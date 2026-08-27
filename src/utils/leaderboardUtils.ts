import type { GameState, PostGigSummary, Venue } from '../types'
import type { RhythmSongStatsEntry } from '../types/rhythmGame'
import { SONGS_BY_ID } from '../data/songs'
import { logger } from './logger'
import { finiteNumberOr } from './gameState'

/**
 * Per-song score payload accepted by the song leaderboard endpoint.
 */
export type SongStat = Pick<
  RhythmSongStatsEntry,
  'songId' | 'score' | 'accuracy'
>

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

  // Submit all songs in a single request
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch('/api/leaderboard/song', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: player.playerId,
        playerName: player.playerName,
        scores: scoresToSubmit
      }),
      signal: controller.signal
    })

    if (res.status === 404) {
      logger.info(
        'PostGig',
        `Leaderboard endpoint unavailable for batch submission`
      )
      return
    }
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`HTTP ${res.status}: ${err}`)
    }
  } catch (err) {
    logger.error('PostGig', `Batch score submit failed`, err)
  } finally {
    clearTimeout(timeoutId)
  }
}
