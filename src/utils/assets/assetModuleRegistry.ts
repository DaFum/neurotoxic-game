import type { AssetModule } from '../../types/assets'
import { MODULE_REGISTRY } from './assetRegistryStore'

export {
  MODULE_REGISTRY,
  MODULE_PROMPTS,
  ASSET_MODULES_MAP
} from './assetRegistryStore'

export const getRegisteredModule = (
  moduleId: unknown
): AssetModule | undefined =>
  typeof moduleId === 'string' && Object.hasOwn(MODULE_REGISTRY, moduleId)
    ? MODULE_REGISTRY[moduleId]
    : undefined
