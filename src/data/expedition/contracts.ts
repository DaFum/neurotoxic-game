import type { ExpeditionContractTemplate } from '../../types/expedition'

export const MAX_NATIVE_EXPEDITION_CONTRACTS = 2 as const

const templates = [
  {
    id: 'contract_three_good_gigs',
    kind: 'performance',
    constraints: [
      {
        id: 'three_good_gigs',
        kind: 'gig_accuracy_count',
        minAccuracy: 65,
        requiredCount: 3
      }
    ],
    reward: { money: 1500, fame: 500, rewardMultiplier: 1 },
    failure: { heat: 8, controversy: 3 },
    tourEndingOnFailure: false
  },
  {
    id: 'contract_keep_it_clean',
    kind: 'behavior',
    constraints: [{ id: 'keep_heat_clean', kind: 'max_heat', maxHeat: 40 }],
    reward: { money: 1800, fame: 300, rewardMultiplier: 1 },
    failure: { heat: 10, controversy: 5 },
    tourEndingOnFailure: false
  },
  {
    id: 'contract_route_target',
    kind: 'route',
    constraints: [
      {
        id: 'visit_route_target',
        kind: 'visit_matching_node',
        routeTargetRule: { nodeType: 'SPECIAL' }
      }
    ],
    reward: { money: 1200, fame: 400, rewardMultiplier: 1 },
    failure: { heat: 8, controversy: 3 },
    tourEndingOnFailure: false
  },
  {
    id: 'contract_no_rest_finale',
    kind: 'high_risk',
    constraints: [
      { id: 'no_rest', kind: 'no_rest_before_finale' },
      { id: 'complete_finale', kind: 'finale_completed', minHeatAtFinale: null }
    ],
    reward: { money: 0, fame: 1000, rewardMultiplier: 1.2 },
    failure: { heat: 15, controversy: 8 },
    tourEndingOnFailure: false
  },
  {
    id: 'contract_all_in',
    kind: 'high_risk',
    constraints: [
      { id: 'hot_finale', kind: 'finale_completed', minHeatAtFinale: 60 },
      {
        id: 'all_in_finale',
        kind: 'special_finale',
        profileId: 'all_in_showcase'
      }
    ],
    reward: { money: 2500, fame: 800, rewardMultiplier: 1.35 },
    failure: { heat: 30, controversy: 20 },
    tourEndingOnFailure: true
  }
] as const satisfies readonly ExpeditionContractTemplate[]

export const EXPEDITION_CONTRACTS_BY_ID = new Map<
  string,
  ExpeditionContractTemplate
>(templates.map(template => [template.id, template]))
