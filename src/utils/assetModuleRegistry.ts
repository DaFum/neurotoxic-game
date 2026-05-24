import type { AssetModule } from '../types/assets'

/**
 * Central registry of every long-term asset module across all four sections.
 *
 * Foundation creates the empty registry. Section plans (2–5) populate it via
 * side-effect imports of `assetSections/<section>Modules.ts`, each of which
 * mutates this object to add its entries. Consumers (selectors, action
 * creators, UI) look modules up by id.
 *
 * Build-time invariants enforced by tests in `tests/node/assetModuleRegistry.test.js`:
 * - No module has `slotType === addsSlots[i].slotType` (prevents recursive
 *   self-stacking exploits).
 * - Every module's `imagePromptKey` exists in `MODULE_PROMPTS`.
 */
export const MODULE_REGISTRY: Record<string, AssetModule> = {}

/**
 * Image prompt texts indexed by `AssetModule.imagePromptKey`. Multiple modules
 * may share a key when they should render the same image (e.g., legit/diy
 * variants of the same physical object). Foundation creates the empty map;
 * section plans add entries alongside their module definitions.
 */
export const MODULE_PROMPTS: Record<string, string> = {}
