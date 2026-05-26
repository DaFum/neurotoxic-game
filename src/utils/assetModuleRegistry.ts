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
export { MODULE_REGISTRY, MODULE_PROMPTS } from './assetRegistryStore'

import './assetSections/tourbusModules'
