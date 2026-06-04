import { CHASSIS_CONFIG } from './assetConfig'

/**
 * Valid long-term asset kinds derived from chassis configuration.
 */
export const VALID_ASSET_KINDS: ReadonlySet<string> = new Set(
  Object.keys(CHASSIS_CONFIG)
)

/**
 * Valid asset acquisition flavors.
 */
export const VALID_ASSET_FLAVORS: ReadonlySet<string> = new Set([
  'legit',
  'diy'
])

/**
 * Valid chassis tier values.
 */
export const VALID_ASSET_TIERS: ReadonlySet<number> = new Set([1, 2, 3])

/**
 * Valid chassis acquisition modes.
 */
export const VALID_ASSET_ACQUISITION_MODES: ReadonlySet<string> = new Set([
  'cash',
  'loan',
  'crowdfund'
])
