/**
 * Game Progression Milestones Data
 * Module: `milestones`.
 */

import {
  createUpdateBandAction,
  createUpdatePlayerAction,
  createUpdateSocialAction
} from '../../context/actionCreators'
import i18n from '../../i18n'
import { formatCurrency } from '../../utils/numberUtils'
import type { GameState, GameAction } from '../../types'

/**
 * Static milestone definition with condition and optional reward action factory.
 */
export interface Milestone {
  id: string
  condition: (state: GameState) => boolean
  createRewardAction?: () => GameAction
  labelKey: string
  createLabelOptions?: () => Record<string, unknown>
}

const totalFollowers = (social: GameState['social']): number =>
  social.tiktok + social.instagram + social.youtube + social.newsletter

/** Canonical milestone definitions evaluated against game state. */
export const MILESTONES = [
  // === Survival ===
  {
    id: 'survive_1_week',
    condition: (state: GameState) => state.player.day > 7,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        money: prev.money + 100
      })),
    labelKey: 'ui:milestones.survive_1_week'
  },
  {
    id: 'survive_2_weeks',
    condition: (state: GameState) => state.player.day > 14,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        money: prev.money + 250
      })),
    labelKey: 'ui:milestones.survive_2_weeks'
  },
  {
    id: 'survive_1_month',
    condition: (state: GameState) => state.player.day > 30,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        money: prev.money + 500,
        fame: prev.fame + 25
      })),
    labelKey: 'ui:milestones.survive_1_month'
  },
  {
    id: 'survive_100_days',
    condition: (state: GameState) => state.player.day > 100,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        money: prev.money + 2000,
        fame: prev.fame + 100
      })),
    labelKey: 'ui:milestones.survive_100_days'
  },

  // === Gigs / Performance ===
  {
    id: 'first_gig_done',
    condition: (state: GameState) => state.lastGigStats !== null,
    createRewardAction: () =>
      createUpdateSocialAction((prev: GameState['social']) => ({
        tiktok: prev.tiktok + 10,
        instagram: prev.instagram + 10
      })),
    labelKey: 'ui:milestones.first_gig_done'
  },
  {
    id: 'flawless_gig',
    condition: (state: GameState) =>
      (state.lastGigStats?.misses ?? Number.POSITIVE_INFINITY) === 0 &&
      (state.lastGigStats?.score ?? 0) > 0,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        fame: prev.fame + 50,
        money: prev.money + 250
      })),
    labelKey: 'ui:milestones.flawless_gig'
  },
  {
    id: 'big_combo',
    condition: (state: GameState) => (state.lastGigStats?.maxCombo ?? 0) >= 50,
    createRewardAction: () =>
      createUpdateSocialAction((prev: GameState['social']) => ({
        viral: prev.viral + 5,
        tiktok: prev.tiktok + 25
      })),
    labelKey: 'ui:milestones.big_combo'
  },

  // === Money / Wealth ===
  {
    id: 'wealth_starter',
    condition: (state: GameState) => state.player.money >= 1000,
    createRewardAction: () =>
      createUpdateBandAction((prev: GameState['band']) => ({
        luck: prev.luck + 5
      })),
    labelKey: 'ui:milestones.wealth_starter',
    createLabelOptions: () => ({
      amount: formatCurrency(1000, i18n.language)
    })
  },
  {
    id: 'wealth_established',
    condition: (state: GameState) => state.player.money >= 5000,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        fame: prev.fame + 50
      })),
    labelKey: 'ui:milestones.wealth_established',
    createLabelOptions: () => ({
      amount: formatCurrency(5000, i18n.language)
    })
  },
  {
    id: 'wealth_baron',
    condition: (state: GameState) => state.player.money >= 25000,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        fame: prev.fame + 200
      })),
    labelKey: 'ui:milestones.wealth_baron',
    createLabelOptions: () => ({
      amount: formatCurrency(25000, i18n.language)
    })
  },

  // === Fame ===
  {
    id: 'fame_rising',
    condition: (state: GameState) => state.player.fame >= 250,
    createRewardAction: () =>
      createUpdateSocialAction((prev: GameState['social']) => ({
        tiktok: prev.tiktok + 100,
        instagram: prev.instagram + 100
      })),
    labelKey: 'ui:milestones.fame_rising'
  },
  {
    id: 'fame_legend',
    condition: (state: GameState) => state.player.fame >= 1500,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        money: prev.money + 1000
      })),
    labelKey: 'ui:milestones.fame_legend'
  },

  // === Social Reach ===
  {
    id: 'social_influencer',
    condition: (state: GameState) => totalFollowers(state.social) >= 500,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        money: prev.money + 500
      })),
    labelKey: 'ui:milestones.social_influencer'
  },
  {
    id: 'social_megastar',
    condition: (state: GameState) => totalFollowers(state.social) >= 5000,
    createRewardAction: () =>
      createUpdateSocialAction((prev: GameState['social']) => ({
        viral: prev.viral + 25,
        zealotry: prev.zealotry + 10
      })),
    labelKey: 'ui:milestones.social_megastar'
  },
  {
    id: 'gone_viral',
    condition: (state: GameState) => state.social.viral >= 50,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        fame: prev.fame + 100
      })),
    labelKey: 'ui:milestones.gone_viral'
  },
  {
    id: 'cult_following',
    condition: (state: GameState) => state.social.zealotry >= 50,
    createRewardAction: () =>
      createUpdateSocialAction((prev: GameState['social']) => ({
        newsletter: prev.newsletter + 250,
        loyalty: prev.loyalty + 10
      })),
    labelKey: 'ui:milestones.cult_following'
  },

  // === Band ===
  {
    id: 'high_harmony',
    condition: (state: GameState) => state.band.harmony >= 90,
    labelKey: 'ui:milestones.high_harmony'
  },
  {
    id: 'perfect_harmony',
    condition: (state: GameState) => state.band.harmony >= 99,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        fame: prev.fame + 75
      })),
    labelKey: 'ui:milestones.perfect_harmony'
  },
  {
    id: 'full_band',
    condition: (state: GameState) => state.band.members.length >= 4,
    createRewardAction: () =>
      createUpdateBandAction((prev: GameState['band']) => ({
        harmony: prev.harmony + 10
      })),
    labelKey: 'ui:milestones.full_band'
  },
  {
    id: 'peacekeeper',
    condition: (state: GameState) => state.player.stats.conflictsResolved >= 5,
    createRewardAction: () =>
      createUpdateBandAction((prev: GameState['band']) => ({
        harmony: prev.harmony + 15
      })),
    labelKey: 'ui:milestones.peacekeeper'
  },

  // === Road / Travel ===
  {
    id: 'road_warrior',
    condition: (state: GameState) => state.player.totalTravels >= 10,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        money: prev.money + 200
      })),
    labelKey: 'ui:milestones.road_warrior'
  },
  {
    id: 'road_legend',
    condition: (state: GameState) => state.player.totalTravels >= 50,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        money: prev.money + 750,
        fame: prev.fame + 50
      })),
    labelKey: 'ui:milestones.road_legend'
  },

  // === Stage Presence & HQ ===
  {
    id: 'stage_diver',
    condition: (state: GameState) => state.player.stats.stageDives >= 10,
    createRewardAction: () =>
      createUpdateSocialAction((prev: GameState['social']) => ({
        tiktok: prev.tiktok + 200,
        viral: prev.viral + 10
      })),
    labelKey: 'ui:milestones.stage_diver'
  },
  {
    id: 'hq_builder',
    condition: (state: GameState) => state.player.hqUpgrades.length >= 3,
    createRewardAction: () =>
      createUpdateBandAction((prev: GameState['band']) => ({
        luck: prev.luck + 5
      })),
    labelKey: 'ui:milestones.hq_builder'
  },
  {
    id: 'van_tuned',
    condition: (state: GameState) => state.player.van.upgrades.length >= 2,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        money: prev.money + 250
      })),
    labelKey: 'ui:milestones.van_tuned'
  },

  // === Resilience ===
  {
    id: 'clinic_survivor',
    condition: (state: GameState) => state.player.clinicVisits >= 3,
    createRewardAction: () =>
      createUpdateBandAction((prev: GameState['band']) => ({
        harmony: prev.harmony + 5
      })),
    labelKey: 'ui:milestones.clinic_survivor'
  },

  // === Meta ===
  {
    id: 'collector',
    condition: (state: GameState) => state.unlocks.length >= 5,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        fame: prev.fame + 50,
        money: prev.money + 300
      })),
    labelKey: 'ui:milestones.collector'
  },
  {
    id: 'milestone_chaser',
    condition: (state: GameState) => state.completedMilestones.length >= 10,
    createRewardAction: () =>
      createUpdatePlayerAction((prev: GameState['player']) => ({
        money: prev.money + 1000,
        fame: prev.fame + 100
      })),
    labelKey: 'ui:milestones.milestone_chaser'
  }
] satisfies readonly Milestone[]
