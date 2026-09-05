import type {
  ExpeditionFinaleProfile,
  ExpeditionFinaleType
} from '../../types/expedition'
export const EXPEDITION_FINALES_BY_ID = new Map<
  ExpeditionFinaleType,
  ExpeditionFinaleProfile
>([
  [
    'regional_headliner',
    {
      timingWindowMultiplier: 1,
      missPenaltyMultiplier: 1,
      staminaDrainMultiplier: 1,
      comboBonusMultiplier: 1.1,
      technicalWearMultiplier: 1,
      crowdHypeStartBonus: 10,
      rewardMultiplier: 1.15,
      heatOnSuccess: 0,
      requiresRival: false
    }
  ],
  [
    'corporate_showcase',
    {
      timingWindowMultiplier: 0.97,
      missPenaltyMultiplier: 1.1,
      staminaDrainMultiplier: 1.05,
      comboBonusMultiplier: 1,
      technicalWearMultiplier: 1.05,
      crowdHypeStartBonus: 0,
      rewardMultiplier: 1.2,
      heatOnSuccess: 0,
      requiresRival: false
    }
  ],
  [
    'rival_battle',
    {
      timingWindowMultiplier: 0.96,
      missPenaltyMultiplier: 1.1,
      staminaDrainMultiplier: 1.05,
      comboBonusMultiplier: 1.2,
      technicalWearMultiplier: 1,
      crowdHypeStartBonus: 5,
      rewardMultiplier: 1.25,
      heatOnSuccess: 5,
      requiresRival: true
    }
  ],
  [
    'illegal_show',
    {
      timingWindowMultiplier: 0.98,
      missPenaltyMultiplier: 1.1,
      staminaDrainMultiplier: 1.1,
      comboBonusMultiplier: 1.1,
      technicalWearMultiplier: 1.1,
      crowdHypeStartBonus: 10,
      rewardMultiplier: 1.3,
      heatOnSuccess: 12,
      requiresRival: false
    }
  ],
  [
    'disaster_gig',
    {
      timingWindowMultiplier: 0.94,
      missPenaltyMultiplier: 1.15,
      staminaDrainMultiplier: 1.15,
      comboBonusMultiplier: 1,
      technicalWearMultiplier: 1.35,
      crowdHypeStartBonus: 0,
      rewardMultiplier: 1.25,
      heatOnSuccess: 5,
      requiresRival: false
    }
  ],
  [
    'contract_special',
    {
      timingWindowMultiplier: 0.95,
      missPenaltyMultiplier: 1.15,
      staminaDrainMultiplier: 1.1,
      comboBonusMultiplier: 1.15,
      technicalWearMultiplier: 1.1,
      crowdHypeStartBonus: 5,
      rewardMultiplier: 1.35,
      heatOnSuccess: 8,
      requiresRival: false
    }
  ]
])
