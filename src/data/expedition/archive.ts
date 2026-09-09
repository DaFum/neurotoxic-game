/**
 * The Tour Archive's categories and what counts as a canonical entry.
 *
 * @remarks
 * The Archive is a record of what a Career has *met*, and nothing else. It
 * grants no capability and gates no completion, which is exactly why every
 * entry has to be canonical: a log that accepted a free `(category, id)` pair
 * would be a place to write anything, and the entries it holds are read back
 * as evidence that something was really encountered.
 */

import type { ExpeditionArchiveCategory } from '../../types/career'
import { EXPEDITION_CREW_BY_ID } from './crew'
import { EXPEDITION_REGIONS } from './regions'
import { EXPEDITION_FINALES_BY_ID } from './finales'
import { EXPEDITION_PRESSURE_EVENTS } from './pressureEvents'
import { BRAND_DEALS_BY_ID } from '../brandDeals'
import { CONTRABAND_BY_ID } from '../contraband'
import { MODULE_REGISTRY } from '../../utils/assetModuleRegistry'
import { CHASSIS_CONFIG } from '../../utils/assetConfig'
import { isForbiddenKey } from '../../utils/objectUtils'

/** Every Archive category, in the order the Archive lists them. */
export const EXPEDITION_ARCHIVE_CATEGORIES = [
  'crew',
  'module',
  'chassis',
  'rival',
  'sponsor',
  'region',
  'finale',
  'special_event',
  'contraband'
] as const

const CATEGORY_SET: ReadonlySet<string> = new Set(EXPEDITION_ARCHIVE_CATEGORIES)

export const isExpeditionArchiveCategory = (
  value: unknown
): value is ExpeditionArchiveCategory =>
  typeof value === 'string' && CATEGORY_SET.has(value)

/**
 * The canonical chassis identity an Archive entry names.
 *
 * @param kind - Asset kind the chassis belongs to.
 * @param flavor - `legit` or `diy`.
 * @param tier - Chassis tier.
 * @returns The Archive id for that chassis.
 *
 * @remarks
 * Chassis have no registry id of their own - they are a `(kind, flavor, tier)`
 * coordinate in `CHASSIS_CONFIG` - so the Archive composes one, and validates
 * it by looking the coordinate back up rather than by parsing the string.
 */
export const getExpeditionArchiveChassisId = (
  kind: string,
  flavor: string,
  tier: number
): string => `${kind}:${flavor}:${tier}`

/** Whether `CHASSIS_CONFIG` actually implements a composed chassis id. */
const isCanonicalChassisId = (id: string): boolean => {
  const parts = id.split(':')
  // Exactly three: a trailing segment would otherwise be ignored, and two ids
  // that differ only in what is ignored would be the same Archive entry.
  if (parts.length !== 3) return false
  const [kind, flavor, tierText] = parts
  if (
    kind === undefined ||
    flavor === undefined ||
    tierText === undefined ||
    isForbiddenKey(kind) ||
    isForbiddenKey(flavor)
  ) {
    return false
  }
  const kindConfig = Object.hasOwn(CHASSIS_CONFIG, kind)
    ? CHASSIS_CONFIG[kind as keyof typeof CHASSIS_CONFIG]
    : undefined
  if (!kindConfig || !Object.hasOwn(kindConfig, flavor)) return false
  const tiers = kindConfig[flavor as keyof typeof kindConfig]
  const tier = Number(tierText)
  return (
    /^\d+$/.test(tierText) &&
    typeof tiers === 'object' &&
    tiers !== null &&
    Object.hasOwn(tiers, String(tier))
  )
}

/**
 * Whether an id is a real entry of its category.
 *
 * @param category - Archive category.
 * @param id - The entry the caller claims to have met.
 * @returns True when a canonical registry holds it.
 *
 * @remarks
 * `rival` is the one category with no static registry: a Rival is generated
 * per Career, so its canonical set is the Career's own `rivalsById`. That
 * check belongs with the state, so this returns `false` for it and
 * `canRecordExpeditionArchiveDiscovery` validates the Rival against the
 * Career instead.
 */
export const isCanonicalExpeditionArchiveEntry = (
  category: ExpeditionArchiveCategory,
  id: string
): boolean => {
  if (typeof id !== 'string' || id.length === 0 || isForbiddenKey(id)) {
    return false
  }
  switch (category) {
    case 'crew':
      return Object.hasOwn(EXPEDITION_CREW_BY_ID, id)
    case 'module':
      return Object.hasOwn(MODULE_REGISTRY, id)
    case 'chassis':
      return isCanonicalChassisId(id)
    case 'sponsor':
      return BRAND_DEALS_BY_ID.has(id)
    case 'region':
      return Object.hasOwn(EXPEDITION_REGIONS, id)
    case 'finale':
      return [...EXPEDITION_FINALES_BY_ID.keys()].some(key => key === id)
    case 'special_event':
      return EXPEDITION_PRESSURE_EVENTS.some(event => event.id === id)
    case 'contraband':
      return CONTRABAND_BY_ID.has(id)
    case 'rival':
    default:
      return false
  }
}
