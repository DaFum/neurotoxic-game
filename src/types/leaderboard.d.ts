/**
 * One player's stats snapshot as sent to `POST /api/leaderboard/stats`.
 *
 * @remarks
 * Shared by `useLeaderboardSync` (which builds it from game state) and the sync
 * controller (which queues, throttles and sends it). The server adds nothing
 * and trusts nothing: the board is honor-based.
 */
export type LeaderboardStatsPayload = {
  playerId: string
  playerName: string
  money: number
  fame: number
  followers: number
  distance: number
  conflicts: number
  stageDives: number
  day?: number
  revision?: number
}

export type LeaderboardStatsSyncResult =
  | { success: true; stale?: false }
  | { success: true; stale: true; revision: number }

export interface LeaderboardEntry {
  rank: number
  /** Opaque server-derived reference; never the internal player id. */
  playerRef: string
  playerName: string
  score: number
}

export interface LeaderboardSongScoreItem {
  songId: string
  score: number
}

export interface LeaderboardSongBatchPayload {
  playerId: string
  playerName: string
  scores: LeaderboardSongScoreItem[]
}
