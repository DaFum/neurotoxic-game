/**
 * The Tour Types a run can be committed to.
 *
 * @remarks
 * Same shape as a Region: a numeric profile, a route profile, and the route
 * shape itself (depth and where extraction is legal). A Tour never carries
 * behaviour — only the numbers the one composition path reads.
 */

import type {
  ExpeditionTourTypeDefinition,
  ExpeditionTourTypeId
} from '../../types/expedition'

/**
 * Every Tour Type, keyed by its canonical id.
 *
 * @remarks
 * `standard_tour` is the pre-G5 baseline and keeps its id and its 8-step route
 * so existing seeds resolve to the same map.
 */
export const EXPEDITION_TOUR_TYPES = {
  standard_tour: {
    id: 'standard_tour',
    labelKey: 'ui:expedition.tour.standard_tour',
    depth: 8,
    extractionWindowRange: [3, 6],
    numeric: {},
    route: {},
    forcedRival: false
  },
  blitz_tour: {
    id: 'blitz_tour',
    labelKey: 'ui:expedition.tour.blitz_tour',
    depth: 6,
    extractionWindowRange: [2, 4],
    numeric: { completionMultiplier: 0.95 },
    route: {
      gigNodeWeightMultiplier: 1.25,
      recoveryNodeWeightMultiplier: 0.9
    },
    forcedRival: false
  },
  underground_tour: {
    id: 'underground_tour',
    labelKey: 'ui:expedition.tour.underground_tour',
    depth: 8,
    extractionWindowRange: [3, 6],
    numeric: { startingHeat: 10 },
    route: {
      undergroundNodeWeightMultiplier: 1.3,
      sponsorContractEventWeightMultiplier: 0.9
    },
    forcedRival: false
  },
  corporate_tour: {
    id: 'corporate_tour',
    labelKey: 'ui:expedition.tour.corporate_tour',
    depth: 8,
    extractionWindowRange: [3, 6],
    numeric: { contractRewardMultiplier: 1.1 },
    route: {
      sponsorContractEventWeightMultiplier: 1.25,
      festivalHighProfileNodeWeightMultiplier: 1.1
    },
    forcedRival: false
  },
  rival_hunt_tour: {
    id: 'rival_hunt_tour',
    labelKey: 'ui:expedition.tour.rival_hunt_tour',
    depth: 8,
    extractionWindowRange: [3, 6],
    numeric: { rivalEventWeightMultiplier: 1.3 },
    route: { rivalNodeWeightMultiplier: 1.5 },
    // The one Tour that guarantees the feud rather than weighting it.
    forcedRival: true
  },
  survival_tour: {
    id: 'survival_tour',
    labelKey: 'ui:expedition.tour.survival_tour',
    depth: 9,
    extractionWindowRange: [4, 7],
    numeric: { completionMultiplier: 1.2 },
    route: {
      recoveryNodeWeightMultiplier: 0.7,
      technicalNodeWeightMultiplier: 1.2
    },
    forcedRival: false
  }
} as const satisfies Record<ExpeditionTourTypeId, ExpeditionTourTypeDefinition>

/** Reads a Tour definition, or `null` for an id the registry does not have. */
export const getExpeditionTourType = (
  tourTypeId: unknown
): ExpeditionTourTypeDefinition | null =>
  typeof tourTypeId === 'string' &&
  Object.hasOwn(EXPEDITION_TOUR_TYPES, tourTypeId)
    ? EXPEDITION_TOUR_TYPES[tourTypeId as ExpeditionTourTypeId]
    : null
