import { GAME_PHASES } from '../context/gameConstants'
import type { GamePhase } from '../types'

export interface MinigameRegistryEntry {
  scene: GamePhase
}

export const MINIGAME_REGISTRY = {
  travel: {
    scene: GAME_PHASES.TRAVEL_MINIGAME
  },
  roadie: {
    scene: GAME_PHASES.PRE_GIG_MINIGAME
  },
  ampCalibration: {
    scene: GAME_PHASES.PRE_GIG_MINIGAME
  },
  kabelsalat: {
    scene: GAME_PHASES.PRE_GIG_MINIGAME
  }
} as const satisfies Record<
  'travel' | 'roadie' | 'ampCalibration' | 'kabelsalat',
  MinigameRegistryEntry
>
