import { CHASSIS_CONFIG } from './assetConfig'

export const VALID_ASSET_KINDS: ReadonlySet<string> = new Set(
  Object.keys(CHASSIS_CONFIG)
)
export const VALID_ASSET_FLAVORS: ReadonlySet<string> = new Set([
  'legit',
  'diy'
])
export const VALID_ASSET_TIERS: ReadonlySet<number> = new Set([1, 2, 3])
export const VALID_ASSET_ACQUISITION_MODES: ReadonlySet<string> = new Set([
  'cash',
  'loan',
  'crowdfund'
])
