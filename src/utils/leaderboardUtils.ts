import type { GameState, PostGigSummary, Venue } from '../types'
import type { RhythmSongStatsEntry } from '../types/rhythmGame'
import { SONGS_BY_ID } from '../data/songs'
import { logger } from './logger'

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

  // Create a unified list of song stats to submit
  let songsToSubmit: SongStat[]

  if (lastGigStats?.songStats && lastGigStats.songStats.length > 0) {
    // Use the detailed per-song stats generated during the gig
    songsToSubmit = lastGigStats.songStats.map((stat: SongStat) => ({
      songId: stat.songId,
      score: stat.score,
      accuracy: stat.accuracy
    }))
  } else {
    // Fallback for legacy saves or early aborted gigs without per-song stats
    const setlistFirstId =
      typeof setlist?.[0] === 'string' ? setlist[0] : setlist?.[0]?.id
    const playedSongId = currentGig?.songId ?? setlistFirstId
    if (typeof playedSongId === 'string') {
      songsToSubmit = [
        {
          songId: playedSongId,
          score: lastGigStats?.score ?? 0,
          accuracy: lastGigStats?.accuracy ?? 0
        }
      ]
    } else {
      logger.warn('PostGig', 'No valid songId found for legacy fallback')
      return
    }
  }

  // Collect all valid scores to submit in a single batch
  const scoresToSubmit: { songId: string; score: number; accuracy: number }[] = []
  for (let i = 0; i < songsToSubmit.length; i++) {
    const songData = songsToSubmit[i]
    if (songData) {
      const leaderboardSongId = SONGS_BY_ID.get(songData.songId)?.leaderboardId
      if (leaderboardSongId) {
        scoresToSubmit.push({
          songId: leaderboardSongId,
          score: songData.score,
          accuracy: songData.accuracy
        })
      }
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
