import type { AssetModule } from '../types/assets'

/**
 * Bare registry stores — no section imports, no circular deps.
 *
 * Section modules (`assetSections/*Modules.ts`) import from here so they can
 * mutate the registries without creating a circular dependency back through
 * `assetModuleRegistry.ts` (which triggers the side-effect imports).
 *
 * Consumers should import from `assetModuleRegistry.ts`, which re-exports these
 * and triggers all section registrations as side effects.
 */
export const MODULE_REGISTRY: Record<string, AssetModule> = {}
export const MODULE_PROMPTS: Record<string, string> = {}
