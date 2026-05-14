/**
 * Game Progression Milestones Data
 * @module milestones
 */

import type { GameState, GameAction } from '../../types/game'
import { ActionTypes } from '../../context/actionTypes'

export interface Milestone {
  id: string
  condition: (state: GameState) => boolean
  rewardAction?: GameAction
  labelKey: string
}

export const MILESTONES = [
  {
    id: 'survive_1_week',
    condition: (state: GameState) => state.player.day > 7,
    rewardAction: {
      type: ActionTypes.UPDATE_PLAYER,
      payload: (prev: GameState['player']) => ({ money: prev.money + 100 })
    },
    labelKey: 'milestones.survive_1_week'
  },
  {
    id: 'first_gig_done',
    condition: (state: GameState) => state.lastGigStats !== null,
    rewardAction: {
      type: ActionTypes.UPDATE_SOCIAL,
      payload: (prev: GameState['social']) => ({
        tiktok: prev.tiktok + 10,
        instagram: prev.instagram + 10
      })
    },
    labelKey: 'milestones.first_gig_done'
  },
  {
    id: 'high_harmony',
    condition: (state: GameState) => state.band.harmony >= 90,
    labelKey: 'milestones.high_harmony'
  }
] satisfies readonly Milestone[]
