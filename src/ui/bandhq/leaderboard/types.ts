export type LeaderboardView =
  | 'BALANCE'
  | 'SONG'
  | 'FAME'
  | 'FOLLOWERS'
  | 'DISTANCE'
  | 'CONFLICTS'
  | 'STAGE_DIVES'

export type LeaderboardEntry = {
  rank: number
  playerId: string
  playerName: string
  score: number
}
