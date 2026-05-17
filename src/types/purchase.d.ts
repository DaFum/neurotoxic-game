import type { PlayerState, BandState } from './game'

export type PlayerPatch = Omit<Partial<PlayerState>, 'van'> & {
  van?: Partial<PlayerState['van']>
  fameLevel?: number
}

export type BandPatch = Partial<BandState> | null
