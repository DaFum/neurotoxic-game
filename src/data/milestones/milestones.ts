/**
 * Game Progression Milestones Data
 * @module milestones
 */

import {
  createUpdatePlayerAction,
  createUpdateSocialAction
} from '../../context/actionCreators'
import type { GameState, GameAction } from '../../types'

export interface Milestone {
  id: string
  condition: (state: GameState) => boolean
  createRewardAction?: () => GameAction
  labelKey: string
}

export const MILESTONES = [
  {
    id: 'survive_1_week',
    condition: (state: GameState) => state.player.day > 7,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        money: prev.money + 100
      })),
    labelKey: 'milestones.survive_1_week'
  },
  {
    id: 'first_gig_done',
    condition: (state: GameState) => state.lastGigStats !== null,
    createRewardAction: () =>
      createUpdateSocialAction((prev: GameState['social']) => ({
        tiktok: prev.tiktok + 10,
        instagram: prev.instagram + 10
      })),
    labelKey: 'milestones.first_gig_done'
  },
  {
    id: 'high_harmony',
    condition: (state: GameState) => state.band.harmony >= 90,
    labelKey: 'milestones.high_harmony'
  }
] satisfies readonly Milestone[]
