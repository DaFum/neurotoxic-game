/**
 * How each legacy HQ/Van upgrade behaves once Expeditions exist.
 *
 * @remarks
 * The pre-Expedition catalog was balanced against the overworld, so letting it
 * apply untouched would let a Career buy Expedition advantage with Cash rather
 * than earn it. Every catalog entry is classified, `HQ_ITEMS.van` included, and
 * there is deliberately no permissive fallback: an entry whose effects reach an
 * Expedition domain and carries no explicit policy fails the catalog test
 * rather than defaulting to harmless.
 */

import { getUnifiedUpgradeCatalog } from '../../data/upgradeCatalog'
import { hasExpeditionUnlockSet } from '../../data/expedition/unlockSets'
import { finiteNumberOr } from '../../utils/finiteNumber'
import { careerHasExpeditionRank } from './meta'
import type { CareerState } from '../../types/career'
import type { ExpeditionStatus } from '../../types/expedition'
import type { CatalogItem } from '../../types/components'

/** What an Expedition does with a legacy upgrade the Career owns. */
export type ExpeditionLegacyHqPolicy =
  | { kind: 'unaffected' }
  | { kind: 'between_tours_only' }
  | { kind: 'requires_roadtested' }
  | { kind: 'requires_headliner' }
  | { kind: 'requires_capability'; capabilitySetId: string }

/**
 * The binding policy for every unified-catalog entry.
 *
 * @remarks
 * All 28 currently purchasable entries are named, so nothing reaches the
 * `unaffected` default. An entry appearing in the catalog without a policy
 * here is a test failure rather than a silently harmless upgrade.
 */
const EXPLICIT_POLICY: Readonly<Record<string, ExpeditionLegacyHqPolicy>> = {
  // between_tours_only: ownership stays, the effect is ignored inside a run,
  // and the purchase itself needs one finalized run and a Career that is not
  // mid-tour.
  hq_van_sound_system: { kind: 'between_tours_only' },
  hq_van_mattress: { kind: 'between_tours_only' },
  hq_van_sleeping_bags: { kind: 'between_tours_only' },
  hq_van_tape_glue: { kind: 'between_tours_only' },
  hq_room_coffee: { kind: 'between_tours_only' },
  hq_room_sofa: { kind: 'between_tours_only' },
  hq_room_old_couch: { kind: 'between_tours_only' },
  hq_room_cheap_beer_fridge: { kind: 'between_tours_only' },
  hq_room_diy_soundproofing: { kind: 'between_tours_only' },

  hq_van_suspension: { kind: 'requires_roadtested' },
  hq_van_tyre_spare: { kind: 'requires_roadtested' },
  hq_van_paint_job: { kind: 'requires_roadtested' },
  hq_van_spoiler: { kind: 'requires_roadtested' },
  hq_van_disco: { kind: 'requires_roadtested' },
  hq_room_cat: { kind: 'requires_roadtested' },
  hq_room_marketing: { kind: 'requires_roadtested' },
  hq_room_poster_wall: { kind: 'requires_roadtested' },
  hq_room_shrine: { kind: 'requires_roadtested' },
  hq_room_void_altar: { kind: 'requires_roadtested' },
  hq_room_skull: { kind: 'requires_roadtested' },
  social_bot: { kind: 'requires_roadtested' },

  hq_van_tuning: { kind: 'requires_headliner' },
  hq_van_flamethrower: { kind: 'requires_headliner' },
  hq_room_beer_pipeline: { kind: 'requires_headliner' },
  label_contact: { kind: 'requires_headliner' },

  hq_van_storage: {
    kind: 'requires_capability',
    capabilitySetId: 'chassis_network'
  },
  pr_manager_contract: {
    kind: 'requires_capability',
    capabilitySetId: 'industry_network'
  },
  hq_room_label: {
    kind: 'requires_capability',
    capabilitySetId: 'industry_network'
  }
}

/**
 * Effect shapes that reach an Expedition domain.
 *
 * @remarks
 * The domains the plan lists: Harmony/recovery, travel/Fuel/vehicle breakdown,
 * inventory/cargo capacity, Fame/Exposure/Sponsor/Rival signal, active
 * performance modifiers, and Expedition repair/Condition/Pressure inputs.
 */
const EXPEDITION_TOUCHING_STATS = new Set([
  'harmony',
  'mood',
  'stamina',
  'luck',
  'breakdownChance',
  'fuelEfficiency',
  'inventorySlots',
  'fame',
  'passiveFollowers'
])

/** HQ unlocks that a daily tick or a gig actually reads. */
const EXPEDITION_TOUCHING_HQ_UNLOCKS = new Set([
  'hq_coffee',
  'hq_sofa',
  'hq_cheap_beer_fridge',
  'hq_old_couch',
  'pr_manager_contract'
])

/**
 * Whether an item's effects reach any Expedition domain.
 *
 * @param item - Catalog entry to inspect.
 * @returns True when at least one effect touches a listed domain.
 *
 * @remarks
 * Deliberately conservative: an effect shape this does not recognize counts as
 * touching, so a new effect type cannot slip into `unaffected` unnoticed.
 */
export const doesLegacyHqItemTouchExpedition = (item: CatalogItem): boolean => {
  const effects = Array.isArray(item.effects) ? item.effects : []
  for (const effect of effects) {
    switch (effect.type) {
      case 'stat_modifier':
        if (EXPEDITION_TOUCHING_STATS.has(String(effect.stat))) return true
        break
      case 'inventory_add':
        return true
      case 'passive':
        return true
      case 'unlock_hq':
        if (EXPEDITION_TOUCHING_HQ_UNLOCKS.has(String(effect.id))) return true
        break
      case 'unlock_upgrade':
        return true
      default:
        // Unrecognized shape: treated as touching rather than assumed safe.
        return true
    }
  }
  return false
}

/**
 * Classifies one legacy catalog entry.
 *
 * @param item - Catalog entry to classify.
 * @returns Its policy.
 *
 * @remarks
 * `unaffected` is only ever returned for an entry whose effects are provably
 * inert for Expeditions. Everything else has to be named explicitly.
 */
export const classifyExpeditionLegacyHqItem = (
  item: CatalogItem
): ExpeditionLegacyHqPolicy => {
  const id = String(item.id)
  if (Object.hasOwn(EXPLICIT_POLICY, id)) {
    const policy = EXPLICIT_POLICY[id]
    if (policy) return policy
  }
  return { kind: 'unaffected' }
}

/**
 * Reads the policy for a catalog id.
 *
 * @param itemId - Catalog id to look up.
 * @returns Its policy, or `null` for an id the catalog does not have.
 */
const getPolicyForItemId = (
  itemId: string
): ExpeditionLegacyHqPolicy | null => {
  const item = getUnifiedUpgradeCatalog().find(
    entry => String(entry.id) === itemId
  )
  return item ? classifyExpeditionLegacyHqItem(item) : null
}

/**
 * Whether a fresh purchase of a legacy upgrade is allowed right now.
 *
 * @param career - Career slice, which carries the counters every gate reads.
 * @param expeditionStatus - Status of the current run, if any.
 * @param itemId - Catalog id being bought.
 * @returns True when the Career has cleared the item's gate.
 *
 * @remarks
 * Ownership is never revoked - an old save keeps everything it bought. This
 * only blocks *new* purchases, and a Career that has not finished a single
 * Expedition buys no Expedition-affecting advantage at all, which is the
 * "fresh Career advantage = 0" rule. Every catalog entry is gated, so this
 * returns true for a known id only once its own condition is met.
 */
export const isExpeditionLegacyHqPurchaseAllowed = (
  career: CareerState,
  expeditionStatus: ExpeditionStatus | undefined,
  itemId: string
): boolean => {
  const policy = getPolicyForItemId(itemId)
  // An id outside the unified upgrade catalog is not this policy's business:
  // the Shop tab shares the same purchase path and must stay untouched.
  if (!policy || policy.kind === 'unaffected') return true

  // Narrowed before the comparison: `NaN < 1` is false, so a poisoned counter
  // would skip this guard entirely and reach the per-policy checks, none of
  // which re-derive the run count.
  if (Math.floor(finiteNumberOr(career.finalizedExpeditionRuns, 0)) < 1)
    return false

  switch (policy.kind) {
    case 'between_tours_only':
      // Ownership is untouched, but the purchase itself is a between-tours
      // act: buying comfort mid-tour is exactly the Cash-for-advantage the
      // policy exists to stop.
      return expeditionStatus !== 'active' && expeditionStatus !== 'prepared'
    case 'requires_capability':
      // Gated on the set itself. The registry validates the id, so an unknown
      // one owns nothing and therefore blocks the purchase.
      return hasExpeditionUnlockSet(
        career.unlockedSetIds,
        policy.capabilitySetId
      )
    case 'requires_roadtested':
      return careerHasExpeditionRank(career, 'roadtested')
    case 'requires_headliner':
      return careerHasExpeditionRank(career, 'headliner')
  }
}

/**
 * Whether an owned legacy upgrade's effect applies right now.
 *
 * @param isRunActive - True while an Expedition run is active.
 * @param itemId - Catalog id to check.
 * @returns False only for a `between_tours_only` item inside a live run.
 */
export const isExpeditionLegacyHqEffectActive = (
  isRunActive: boolean,
  itemId: string
): boolean => {
  if (!isRunActive) return true
  return getPolicyForItemId(itemId)?.kind !== 'between_tours_only'
}
