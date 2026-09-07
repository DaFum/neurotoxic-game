/**
 * The five Legendary capabilities and how a Finale earns one.
 *
 * @remarks
 * A Legendary is not a number: each one changes a rule the run otherwise has
 * to obey, exactly once. This module is the registry half - which Legendaries
 * exist, which Finale earns which, and what their persistence markers are
 * called. The eligibility and the transforms live in
 * `src/domain/expedition/legendaries.ts`.
 */

import type { ExpeditionFinaleType } from '../../types/expedition'
import type { ExpeditionLegendaryId } from '../../types/career'

/**
 * Every Legendary, in the order `contract_special` walks when it awards the
 * first one the Career does not own.
 */
export const EXPEDITION_LEGENDARY_IDS = [
  'safe_harbor',
  'the_fixer',
  'nemesis_key',
  'ghost_route',
  'salvage_rights'
] as const

const LEGENDARY_ID_SET: ReadonlySet<string> = new Set(EXPEDITION_LEGENDARY_IDS)

export const isExpeditionLegendaryId = (
  value: unknown
): value is ExpeditionLegendaryId =>
  typeof value === 'string' && LEGENDARY_ID_SET.has(value)

/**
 * Prefix of the durable unlock marker one Legendary is persisted under.
 *
 * @remarks
 * The same shape as the capability markers an unlock set writes, and for the
 * same reason: one key per Legendary means two tabs finishing different runs
 * cannot overwrite each other's award.
 */
const EXPEDITION_LEGENDARY_MARKER_PREFIX = 'expedition.legendary.'

/**
 * The durable marker id for one Legendary.
 *
 * @param legendaryId - Legendary the marker belongs to.
 * @returns The `unlockManager` key.
 */
export const getExpeditionLegendaryMarkerId = (
  legendaryId: ExpeditionLegendaryId
): string => `${EXPEDITION_LEGENDARY_MARKER_PREFIX}${legendaryId}`

/**
 * Which Finale earns which Legendary.
 *
 * @remarks
 * `contract_special` is deliberately absent: it is the Finale a Contract
 * forces rather than one the run's own pressure produced, so it has no
 * signature Legendary of its own and awards the first unowned one instead.
 */
export const EXPEDITION_LEGENDARY_BY_FINALE: Readonly<
  Partial<Record<ExpeditionFinaleType, ExpeditionLegendaryId>>
> = {
  regional_headliner: 'safe_harbor',
  corporate_showcase: 'the_fixer',
  rival_battle: 'nemesis_key',
  illegal_show: 'ghost_route',
  disaster_gig: 'salvage_rights'
}
