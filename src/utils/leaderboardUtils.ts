import type { GameState, GigStats, Venue } from '../types/game'
import { SONGS_BY_ID } from '../data/songs'
import { logger } from './logger'

export interface SongStat {
  songId: string
  score: number
  accuracy: number
}

export const submitLeaderboardScores = async ({
  player,
  lastGigStats,
  currentGig,
  setlist
}: {
  player: GameState['player']
  lastGigStats: GigStats | null
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
    if (playedSongId) {
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

  // Submit each song individually
  const fetchPromises = songsToSubmit.map((songData: SongStat) => {
    // Resolve to leaderboardId (API-safe slug)
    const leaderboardSongId = SONGS_BY_ID.get(songData.songId)?.leaderboardId

    if (leaderboardSongId) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      return fetch('/api/leaderboard/song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: player.playerId,
          playerName: player.playerName,
          songId: leaderboardSongId,
          score: songData.score,
          accuracy: songData.accuracy
        }),
        signal: controller.signal
      })
        .then(async res => {
          clearTimeout(timeoutId)
          if (!res.ok) {
            const err = await res.text()
            throw new Error(`HTTP ${res.status}: ${err}`)
          }
        })
        .catch(err => {
          clearTimeout(timeoutId)
          logger.error(
            'PostGig',
            `Score submit failed for ${leaderboardSongId}`,
            err
          )
        })
    }
    return Promise.resolve()
  })

  await Promise.allSettled(fetchPromises)
}
