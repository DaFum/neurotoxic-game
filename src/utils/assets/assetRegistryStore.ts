import type { AssetModule } from '../../types/assets'
import {
  TOURBUS_MODULES,
  TOURBUS_PROMPTS
} from './assetSections/tourbusModules'
import {
  STUDIO_MODULES,
  STUDIO_PROMPTS
} from './assetSections/studioModules'
import {
  BANDHAUS_MODULES,
  BANDHAUS_PROMPTS
} from './assetSections/bandhausModules'
import {
  WORKSHOP_MODULES,
  WORKSHOP_PROMPTS
} from './assetSections/workshopModules'

export const ALL_ASSET_MODULES: readonly AssetModule[] = [
  ...TOURBUS_MODULES,
  ...STUDIO_MODULES,
  ...BANDHAUS_MODULES,
  ...WORKSHOP_MODULES
]

export const ASSET_MODULES_MAP: ReadonlyMap<string, AssetModule> = new Map(
  ALL_ASSET_MODULES.map(m => [m.id, m])
)

export const MODULE_REGISTRY: Record<string, AssetModule> = Object.fromEntries(
  ALL_ASSET_MODULES.map(m => [m.id, m])
)

export const MODULE_PROMPTS: Record<string, string> = {
  ...TOURBUS_PROMPTS,
  ...STUDIO_PROMPTS,
  ...BANDHAUS_PROMPTS,
  ...WORKSHOP_PROMPTS
}
