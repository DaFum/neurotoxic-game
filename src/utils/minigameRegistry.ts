import { ActionTypes, type ActionType } from '../context/actionTypes'
import { GAME_PHASES } from '../context/gameConstants'
import type { GamePhase } from '../types'
import {
  calculateTravelMinigameResult,
  calculateRoadieMinigameResult,
  calculateAmpCalibrationResult,
  calculateKabelsalatMinigameResult
} from './economyEngine'

export interface MinigameRegistryEntry {
  startAction: ActionType
  completeAction: ActionType
  scene: GamePhase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calculateResult: (...args: any[]) => unknown
}

export const MINIGAME_REGISTRY = {
  travel: {
    startAction: ActionTypes.START_TRAVEL_MINIGAME,
    completeAction: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
    scene: GAME_PHASES.TRAVEL_MINIGAME,
    calculateResult: calculateTravelMinigameResult
  },
  roadie: {
    startAction: ActionTypes.START_ROADIE_MINIGAME,
    completeAction: ActionTypes.COMPLETE_ROADIE_MINIGAME,
    scene: GAME_PHASES.PRE_GIG_MINIGAME,
    calculateResult: calculateRoadieMinigameResult
  },
  ampCalibration: {
    startAction: ActionTypes.START_AMP_CALIBRATION,
    completeAction: ActionTypes.COMPLETE_AMP_CALIBRATION,
    scene: GAME_PHASES.PRE_GIG_MINIGAME,
    calculateResult: calculateAmpCalibrationResult
  },
  kabelsalat: {
    startAction: ActionTypes.START_KABELSALAT_MINIGAME,
    completeAction: ActionTypes.COMPLETE_KABELSALAT_MINIGAME,
    scene: GAME_PHASES.PRE_GIG_MINIGAME,
    calculateResult: calculateKabelsalatMinigameResult
  }
} as const satisfies Record<
  'travel' | 'roadie' | 'ampCalibration' | 'kabelsalat',
  MinigameRegistryEntry
>

export type MinigameKey = keyof typeof MINIGAME_REGISTRY
