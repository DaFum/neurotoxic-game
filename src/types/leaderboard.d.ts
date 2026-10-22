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
  day: number
  fame: number
  followers: number
  distance: number
  conflicts: number
  stageDives: number
}
