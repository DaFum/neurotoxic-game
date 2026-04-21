import { SONGS_BY_ID } from '../data/songs'
import { logger } from './logger'

export const submitLeaderboardScores = ({
  player,
  lastGigStats,
  currentGig,
  setlist
}: {
  player: any
  lastGigStats: any
  currentGig: any
  setlist: any
}) => {
  if (!player.playerId || !player.playerName) return

  // Create a unified list of song stats to submit
  let songsToSubmit

  if (lastGigStats?.songStats && lastGigStats.songStats.length > 0) {
    // Use the detailed per-song stats generated during the gig
    songsToSubmit = lastGigStats.songStats.map((stat: any) => ({
      songId: stat.songId,
      score: stat.score,
      accuracy: stat.accuracy
    }))
  } else {
    // Fallback for legacy saves or early aborted gigs without per-song stats
    const setlistFirstId =
      typeof setlist?.[0] === 'string' ? setlist[0] : setlist?.[0]?.id
    const playedSongId = currentGig?.songId || setlistFirstId
    songsToSubmit = [
      {
        songId: playedSongId,
        score: lastGigStats?.score || 0,
        accuracy: lastGigStats?.accuracy || 0
      }
    ]
  }

  // Submit each song individually
  songsToSubmit.forEach((songData: any) => {
    // Resolve to leaderboardId (API-safe slug)
    const leaderboardSongId = SONGS_BY_ID.get(songData.songId)?.leaderboardId

    if (leaderboardSongId) {
      fetch('/api/leaderboard/song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: player.playerId,
          playerName: player.playerName,
          songId: leaderboardSongId,
          score: songData.score,
          accuracy: songData.accuracy
        })
      })
        .then(async res => {
          if (!res.ok) {
            const err = await res.text()
            throw new Error(`HTTP ${res.status}: ${err}`)
          }
        })
        .catch(err =>
          logger.error(
            'PostGig',
            `Score submit failed for ${leaderboardSongId}`,
            err
          )
        )
    }
  })
}
