/**
 * The Regions a Tour can be committed to.
 *
 * @remarks
 * A Region is two profiles and nothing else: a numeric one that composes into
 * {@link getEffectiveExpeditionRules}, and a route one that composes into the
 * route-pressure profile. Keeping both as data is what stops Region identity
 * from leaking back into the code as id-specific branches.
 */

import type {
  ExpeditionRegionDefinition,
  ExpeditionRegionId
} from '../../types/expedition'

/**
 * Every Region, keyed by its canonical id.
 *
 * @remarks
 * `industrial_belt` is the pre-G5 baseline Region and keeps its id so existing
 * runs, seeds and saves still resolve.
 */
export const EXPEDITION_REGIONS = {
  home_turf: {
    id: 'home_turf',
    labelKey: 'ui:expedition.region.home_turf',
    numeric: {},
    route: {}
  },
  industrial_belt: {
    id: 'industrial_belt',
    labelKey: 'ui:expedition.region.industrial_belt',
    numeric: { roadWearMultiplier: 1.15, repairCostMultiplier: 0.9 },
    route: {
      supplyNodeWeightMultiplier: 1.25,
      technicalNodeWeightMultiplier: 1.25,
      recoveryNodeWeightMultiplier: 1.05
    }
  },
  festival_fields: {
    id: 'festival_fields',
    labelKey: 'ui:expedition.region.festival_fields',
    numeric: {
      exposureGainMultiplier: 1.2,
      technicalWearMultiplier: 1.1,
      rivalEventWeightMultiplier: 1.1
    },
    route: {
      festivalHighProfileNodeWeightMultiplier: 1.3,
      gigNodeWeightMultiplier: 1.1,
      rivalNodeWeightMultiplier: 1.1
    }
  },
  corporate_circuit: {
    id: 'corporate_circuit',
    labelKey: 'ui:expedition.region.corporate_circuit',
    numeric: {
      authorityEventWeightMultiplier: 1.15,
      contractRewardMultiplier: 1.1
    },
    route: {
      sponsorContractEventWeightMultiplier: 1.3,
      festivalHighProfileNodeWeightMultiplier: 1.1
    },
    // The Region's own rule, not a branch elsewhere: a run this hot is not
    // what a corporate Sponsor wants its logo next to.
    corporateSponsorHeatCeiling: 60
  },
  underground_scene: {
    id: 'underground_scene',
    labelKey: 'ui:expedition.region.underground_scene',
    numeric: {
      rareRewardChanceMultiplier: 1.2,
      heatGainMultiplier: 1.15,
      authorityEventWeightMultiplier: 1.2
    },
    route: {
      undergroundNodeWeightMultiplier: 1.35,
      rivalNodeWeightMultiplier: 1.1,
      recoveryNodeWeightMultiplier: 0.9
    }
  }
} as const satisfies Record<ExpeditionRegionId, ExpeditionRegionDefinition>

/** Reads a Region definition, or `null` for an id the registry does not have. */
export const getExpeditionRegion = (
  regionId: unknown
): ExpeditionRegionDefinition | null =>
  typeof regionId === 'string' && Object.hasOwn(EXPEDITION_REGIONS, regionId)
    ? EXPEDITION_REGIONS[regionId as ExpeditionRegionId]
    : null
