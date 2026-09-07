/**
 * The HQ facilities a Career can build, and how far each is actually built.
 *
 * @remarks
 * `maxImplementedLevel` is the honest ceiling, not an aspirational one: a level
 * is listed here only once something reads it. Selling a level that changes
 * nothing is worse than not selling it, so the registry test refuses a
 * purchasable level with no capability consumer.
 */

import type {
  ExpeditionHqFacilityId,
  ExpeditionHqFacilityLevel
} from '../../types/career'

/** How far each facility is implemented, and therefore purchasable. */
export const HQ_FACILITY_MAX_IMPLEMENTED_LEVEL = {
  workshop: 1,
  rehearsal: 1,
  management_office: 2,
  garage: 1,
  black_market_contact: 1,
  crew_lounge: 1
} as const satisfies Record<ExpeditionHqFacilityId, ExpeditionHqFacilityLevel>

/** Tour Tokens each level costs, keyed by the level being bought. */
export const HQ_FACILITY_LEVEL_COSTS = {
  1: 2,
  2: 4
} as const satisfies Record<ExpeditionHqFacilityLevel, number>

/** Every facility id, for iteration and registry invariants. */
export const HQ_FACILITY_IDS = Object.keys(
  HQ_FACILITY_MAX_IMPLEMENTED_LEVEL
) as readonly ExpeditionHqFacilityId[]

/**
 * Narrows an untrusted value to a known facility id.
 *
 * @param value - Raw candidate, typically from a payload or a save.
 * @returns True when the id is in the registry.
 */
export const isExpeditionHqFacilityId = (
  value: unknown
): value is ExpeditionHqFacilityId =>
  typeof value === 'string' &&
  Object.hasOwn(HQ_FACILITY_MAX_IMPLEMENTED_LEVEL, value)

/**
 * The Tour Token cost of raising a facility to a level.
 *
 * @param facilityId - Facility being raised.
 * @param level - Level being bought.
 * @returns The cost, or `null` when the level is not purchasable.
 */
export const getExpeditionHqFacilityLevelCost = (
  facilityId: unknown,
  level: unknown
): number | null => {
  if (!isExpeditionHqFacilityId(facilityId)) return null
  if (level !== 1 && level !== 2) return null
  if (level > HQ_FACILITY_MAX_IMPLEMENTED_LEVEL[facilityId]) return null
  return HQ_FACILITY_LEVEL_COSTS[level]
}
