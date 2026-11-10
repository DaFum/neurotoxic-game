import type { LeaderboardEntry } from '../../../types/leaderboard'

export type LeaderboardView =
  | 'BALANCE'
  | 'SONG'
  | 'FAME'
  | 'FOLLOWERS'
  | 'DISTANCE'
  | 'CONFLICTS'
  | 'STAGE_DIVES'

export type LeaderboardState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'unavailable' }
  | { status: 'ready'; entries: LeaderboardEntry[] }

export type { LeaderboardEntry }
