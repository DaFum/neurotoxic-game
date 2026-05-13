/**
 * Game Progression Milestones Data
 * @module milestones
 */

import type { GameState, GameAction } from '../../types/game'
import { ActionTypes } from '../../context/actionTypes'
import { getSafeUUID } from '../../utils/crypto'

export interface Milestone {
  id: string
  condition: (state: GameState) => boolean
  rewardAction: GameAction
  labelKey: string
}

export const MILESTONES: Milestone[] = [
  {
    id: 'survive_1_week',
    condition: (state: GameState) => state.player.day > 7,
    rewardAction: {
      type: ActionTypes.UPDATE_PLAYER,
      payload: { money: 100 }
    },
    labelKey: 'milestones.survive_1_week'
  },
  {
    id: 'first_gig_done',
    condition: (state: GameState) => state.lastGigStats !== null,
    rewardAction: {
      type: ActionTypes.UPDATE_SOCIAL,
      payload: { tiktok: 10, instagram: 10 }
    },
    labelKey: 'milestones.first_gig_done'
  },
  {
    id: 'high_harmony',
    condition: (state: GameState) => state.band.harmony >= 90,
    rewardAction: {
      type: ActionTypes.ADD_TOAST,
      payload: {
        id: getSafeUUID(),
        type: 'info',
        messageKey: 'milestones.high_harmony.reward'
      }
    },
    labelKey: 'milestones.high_harmony'
  }
]
