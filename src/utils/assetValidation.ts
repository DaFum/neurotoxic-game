import { CHASSIS_CONFIG } from './assetConfig'

/**
 * Valid long-term asset kinds derived from chassis configuration.
 */
export const VALID_ASSET_KINDS: ReadonlySet<string> = new Set(
  Object.keys(CHASSIS_CONFIG)
)

/**
 * Acquisition flavor allow-list used when validating chassis and module payloads.
 */
export const VALID_ASSET_FLAVORS: ReadonlySet<string> = new Set([
  'legit',
  'diy'
])

/**
 * Chassis tier allow-list shared by action creators, reducers, and sanitizers.
 */
export const VALID_ASSET_TIERS: ReadonlySet<number> = new Set([1, 2, 3])

/**
 * Acquisition modes accepted for chassis purchase or campaign payloads.
 */
export const VALID_ASSET_ACQUISITION_MODES: ReadonlySet<string> = new Set([
  'cash',
  'loan',
  'crowdfund'
])
