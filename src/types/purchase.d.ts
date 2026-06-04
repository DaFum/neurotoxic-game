import type { PlayerState, BandState } from './game'

/**
 * Partial player update shape that supports nested van updates.
 */
export type PlayerPatch = Omit<Partial<PlayerState>, 'van'> & {
  van?: Partial<PlayerState['van']>
  fameLevel?: number
}

/**
 * Partial band update shape accepted by purchase effects.
 */
export type BandPatch = Partial<BandState> | null
