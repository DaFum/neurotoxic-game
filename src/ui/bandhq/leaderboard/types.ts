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
  /** Opaque server-derived reference; never the internal player id. */
  playerRef: string
  playerName: string
  score: number
}
