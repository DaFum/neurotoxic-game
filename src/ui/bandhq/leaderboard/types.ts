import type { LeaderboardEntry } from '../../../types/leaderboard'

/** Leaderboard tabs selectable in the band HQ. */
export type LeaderboardView =
  | 'BALANCE'
  | 'SONG'
  | 'FAME'
  | 'FOLLOWERS'
  | 'DISTANCE'
  | 'CONFLICTS'
  | 'STAGE_DIVES'

/** Fetch state of the active leaderboard tab; `ready` is the only variant that carries entries. */
export type LeaderboardState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'unavailable' }
  | { status: 'ready'; entries: LeaderboardEntry[] }

export type { LeaderboardEntry }
