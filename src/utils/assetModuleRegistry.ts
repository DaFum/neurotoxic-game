/**
 * Central registry of every long-term asset module across all four sections.
 *
 * Foundation creates the empty registry in `assetRegistryStore.ts`. Section
 * plans (2–5) populate it via side-effect imports of
 * `assetSections/<section>Modules.ts`, each of which mutates the registry
 * objects to add its entries. Consumers (selectors, action creators, UI) look
 * modules up by id.
 *
 * Build-time invariants enforced by tests in `tests/node/assetModuleRegistry.test.js`:
 * - No module has `slotType === addsSlots[i].slotType` (prevents recursive
 *   self-stacking exploits).
 * - Every module's `imagePromptKey` exists in `MODULE_PROMPTS`.
 *
 * NOTE: Section modules import from `assetRegistryStore.ts` (not here) to
 * avoid circular ESM dependencies. This file is the consumer-facing entry
 * point; importing it triggers all registered section side-effects.
 */
import type { AssetModule } from '../types/assets'
import { MODULE_REGISTRY } from './assetRegistryStore'

export { MODULE_REGISTRY, MODULE_PROMPTS } from './assetRegistryStore'

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

import './assetSections/tourbusModules'
import './assetSections/studioModules'
import './assetSections/bandhausModules'
import './assetSections/workshopModules'
