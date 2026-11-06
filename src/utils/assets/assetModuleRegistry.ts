/**
 * Central registry of every long-term asset module across all four sections.
 *
 * `assetRegistryStore.ts` aggregates all section modules and prompts declaratively,
 * exporting both static maps (`STATIC_MODULE_CATALOG`, `STATIC_PROMPT_CATALOG`) and
 * mutable records (`MODULE_REGISTRY`, `MODULE_PROMPTS`) for test overrides and
 * backwards compatibility. Consumers (selectors, action creators, UI) look
 * modules up by id.
 *
 * Build-time invariants enforced by tests in `tests/node/assetModuleRegistry.test.js`:
 * - No module has `slotType === addsSlots[i].slotType` (prevents recursive
 *   self-stacking exploits).
 * - Every module's `imagePromptKey` exists in `MODULE_PROMPTS`.
 */
import type { AssetModule } from '../../types/assets'
import { MODULE_REGISTRY } from './assetRegistryStore'

export {
  MODULE_REGISTRY,
  MODULE_PROMPTS,
  STATIC_MODULE_CATALOG,
  STATIC_PROMPT_CATALOG,
  ALL_ASSET_MODULES,
  ALL_ASSET_PROMPTS
} from './assetRegistryStore'

/**
 * Looks a module up by id, accepting only own registry entries.
 *
 * @remarks
 * Plain `MODULE_REGISTRY[id]` resolves hostile ids such as `'constructor'` or
 * `'__proto__'` to truthy inherited values with no `cost`. Reducers and action
 * creators use this for ids that arrive in payloads.
 *
 * @param moduleId - Candidate module id.
 * @returns The registered module, or `undefined` for unknown or inherited keys.
 */
export const getRegisteredModule = (
  moduleId: unknown
): AssetModule | undefined =>
  typeof moduleId === 'string' && Object.hasOwn(MODULE_REGISTRY, moduleId)
    ? MODULE_REGISTRY[moduleId]
    : undefined
