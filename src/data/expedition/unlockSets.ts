/**
 * The unlock sets a Career can buy, and the capabilities each is worth.
 *
 * @remarks
 * A set is only ever worth its capabilities. Consumers ask
 * {@link isExpeditionCapabilityUnlocked} for a capability rather than testing
 * which set the Career owns, so a set can be re-costed, renamed or split
 * without touching a single availability lookup.
 */

import type {
  ExpeditionCapabilityId,
  ExpeditionUnlockSetDefinition,
  ExpeditionUnlockSetId
} from '../../types/career'

/** Every unlock set, keyed by its canonical id. */
export const EXPEDITION_UNLOCK_SETS = {
  mechanic_network: {
    id: 'mechanic_network',
    cost: 2,
    requiredRank: 'rookie',
    requiredFacility: { id: 'workshop', level: 1 },
    capabilities: [
      'region_industrial_belt',
      'tour_survival_tour',
      'perk_mechanic_kit',
      'advanced_inspection'
    ]
  },
  industry_network: {
    id: 'industry_network',
    cost: 3,
    requiredRank: 'roadtested',
    requiredFacility: { id: 'management_office', level: 1 },
    capabilities: [
      'crew_manager',
      'region_corporate_circuit',
      'tour_corporate_tour',
      'perk_press_pass',
      'premium_sponsor_pool'
    ]
  },
  underground_network: {
    id: 'underground_network',
    cost: 3,
    requiredRank: 'roadtested',
    requiredFacility: { id: 'black_market_contact', level: 1 },
    capabilities: [
      'crew_security',
      'region_underground_scene',
      'tour_underground_tour',
      'perk_underground_contact',
      'black_market_content'
    ]
  },
  festival_network: {
    id: 'festival_network',
    cost: 3,
    requiredRank: 'roadtested',
    requiredFacility: { id: 'rehearsal', level: 1 },
    capabilities: [
      'region_festival_fields',
      'tour_blitz_tour',
      'perk_rehearsed_set',
      'performance_contract_pool'
    ]
  },
  crew_network: {
    id: 'crew_network',
    cost: 4,
    requiredRank: 'roadtested',
    requiredFacility: { id: 'crew_lounge', level: 1 },
    capabilities: ['crew_signature_traits']
  },
  chassis_network: {
    id: 'chassis_network',
    cost: 5,
    requiredRank: 'headliner',
    requiredFacility: { id: 'garage', level: 1 },
    capabilities: ['chassis_higher_tier']
  },
  rival_network: {
    id: 'rival_network',
    cost: 5,
    requiredRank: 'headliner',
    requiredFacility: { id: 'management_office', level: 2 },
    capabilities: ['tour_rival_hunt_tour', 'rival_quest_continuation']
  }
} as const satisfies Record<
  ExpeditionUnlockSetId,
  ExpeditionUnlockSetDefinition
>

/** Every unlock set id, for iteration and registry invariants. */
export const EXPEDITION_UNLOCK_SET_IDS = Object.keys(
  EXPEDITION_UNLOCK_SETS
) as readonly ExpeditionUnlockSetId[]

/**
 * Narrows an untrusted value to a known unlock set id.
 *
 * @param value - Raw candidate, typically from a payload or a save.
 * @returns True when the id is in the registry.
 */
export const isExpeditionUnlockSetId = (
  value: unknown
): value is ExpeditionUnlockSetId =>
  typeof value === 'string' && Object.hasOwn(EXPEDITION_UNLOCK_SETS, value)

/**
 * Reads an unlock set, or `null` for an id the registry does not have.
 *
 * @param setId - Candidate id.
 * @returns The definition, or `null`.
 */
export const getExpeditionUnlockSet = (
  setId: unknown
): ExpeditionUnlockSetDefinition | null =>
  isExpeditionUnlockSetId(setId) ? EXPEDITION_UNLOCK_SETS[setId] : null

/**
 * Whether the owned sets grant a capability.
 *
 * @param unlockedSetIds - Set ids the Career owns.
 * @param capabilityId - Capability the caller needs.
 * @returns True when any owned set grants it.
 *
 * @remarks
 * The only set-derived capability resolver. Crew, Region, Tour and Perk
 * availability all route through here, so no consumer ever names a set id.
 */
export const isExpeditionCapabilityUnlocked = (
  unlockedSetIds: readonly string[] | undefined,
  capabilityId: ExpeditionCapabilityId
): boolean => {
  if (!Array.isArray(unlockedSetIds)) return false
  for (const setId of unlockedSetIds) {
    const set = getExpeditionUnlockSet(setId)
    if (set?.capabilities.includes(capabilityId)) return true
  }
  return false
}

/**
 * Whether the Career owns one unlock set outright.
 *
 * @param unlockedSetIds - Set ids the Career owns.
 * @param setId - Set the caller requires.
 * @returns True when it is owned.
 *
 * @remarks
 * Used where content is gated on the *set* rather than on one of the
 * capabilities inside it - the legacy HQ policy names sets, not capabilities.
 */
export const hasExpeditionUnlockSet = (
  unlockedSetIds: readonly string[] | undefined,
  setId: unknown
): boolean =>
  Array.isArray(unlockedSetIds) &&
  isExpeditionUnlockSetId(setId) &&
  unlockedSetIds.includes(setId)
