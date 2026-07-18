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

  // ⚡ BOLT OPTIMIZATION: Collapsed .map() and separate filter loop into a single procedural pass
  // Why: Avoids intermediate array allocations and closure allocations on hot path
  // Impact: Reduces GC pressure and iteration time when preparing batch submissions
  const scoresToSubmit: SongStat[] = []

  const songStats = lastGigStats?.songStats

  if (songStats && songStats.length > 0) {
    // Use the detailed per-song stats generated during the gig
    const statsLen = songStats.length
    for (let i = 0; i < statsLen; i++) {
      const stat = songStats[i]
      if (!stat) continue
      const leaderboardSongId = SONGS_BY_ID.get(stat.songId)?.leaderboardId
      if (leaderboardSongId) {
        scoresToSubmit.push({
          songId: leaderboardSongId,
          score: finiteNumberOr(stat.score, 0),
          accuracy: finiteNumberOr(stat.accuracy, 0)
        })
      }
    }
  } else {
    // Fallback for legacy saves or early aborted gigs without per-song stats
    const setlistFirstId =
      typeof setlist?.[0] === 'string' ? setlist[0] : setlist?.[0]?.id
    const playedSongId = currentGig?.songId ?? setlistFirstId
    if (typeof playedSongId === 'string') {
      const leaderboardSongId = SONGS_BY_ID.get(playedSongId)?.leaderboardId
      if (leaderboardSongId) {
        scoresToSubmit.push({
          songId: leaderboardSongId,
          score: finiteNumberOr(lastGigStats?.score, 0),
          accuracy: finiteNumberOr(lastGigStats?.accuracy, 0)
        })
      }
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

    clearTimeout(timeoutId)

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
    clearTimeout(timeoutId)
    logger.error('PostGig', `Batch score submit failed`, err)
  }
}
