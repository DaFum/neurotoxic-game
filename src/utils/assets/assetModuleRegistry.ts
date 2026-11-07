/**
 * Public asset module catalogue: the single place where the four section
 * catalogues are composed.
 *
 * @remarks
 * Section files (`assetSections/*Modules.ts`) only export an ordered module
 * array and a prompt record; importing them has no side effects. This module
 * composes them once, in Tourbus → Studio → Bandhaus → Workshop order, when it
 * is first evaluated. A new section is wired in `ASSET_CATALOGUE_SECTIONS`
 * below; nothing registers itself.
 */
import type { AssetModule } from '../../types/assets'
import {
  TOURBUS_MODULES,
  TOURBUS_PROMPTS
} from './assetSections/tourbusModules'
import { STUDIO_MODULES, STUDIO_PROMPTS } from './assetSections/studioModules'
import {
  BANDHAUS_MODULES,
  BANDHAUS_PROMPTS
} from './assetSections/bandhausModules'
import {
  WORKSHOP_MODULES,
  WORKSHOP_PROMPTS
} from './assetSections/workshopModules'

/** One section's contribution to the catalogue. */
interface AssetCatalogueSection {
  readonly modules: readonly AssetModule[]
  readonly prompts: Readonly<Record<string, string>>
}

/** The composed catalogue views built from a list of sections. */
interface AssetCatalogue {
  readonly modulesMap: ReadonlyMap<string, Readonly<AssetModule>>
  readonly registry: Record<string, AssetModule>
  readonly prompts: Record<string, string>
}

const ASSET_CATALOGUE_SECTIONS: readonly AssetCatalogueSection[] = [
  { modules: TOURBUS_MODULES, prompts: TOURBUS_PROMPTS },
  { modules: STUDIO_MODULES, prompts: STUDIO_PROMPTS },
  { modules: BANDHAUS_MODULES, prompts: BANDHAUS_PROMPTS },
  { modules: WORKSHOP_MODULES, prompts: WORKSHOP_PROMPTS }
]

/**
 * Composes section catalogues into the frozen map, the mutable registry and
 * the merged prompt record, preserving section and in-section order.
 *
 * @remarks
 * The map and the registry each hold their own `structuredClone` of every
 * module, so neither shares objects with the section sources or with each
 * other. Prompt records are merged as own data properties; modules may share
 * one `imagePromptKey`.
 *
 * @param sections - Section catalogues in composition order.
 * @returns The composed catalogue views.
 * @throws Error when two modules share an id; keyed composition would
 *   otherwise drop the earlier definition silently.
 */
export const composeAssetCatalogue = (
  sections: readonly AssetCatalogueSection[]
): AssetCatalogue => {
  const modules = sections.flatMap(section => section.modules)
  const seenIds = new Set<string>()
  for (const m of modules) {
    if (seenIds.has(m.id)) {
      throw new Error(`Duplicate asset module id "${m.id}"`)
    }
    seenIds.add(m.id)
  }
  return {
    modulesMap: new Map(
      modules.map(m => [m.id, Object.freeze(structuredClone(m))])
    ),
    registry: Object.fromEntries(modules.map(m => [m.id, structuredClone(m)])),
    prompts: Object.fromEntries(
      sections.flatMap(section => Object.entries(section.prompts))
    )
  }
}

const ASSET_CATALOGUE = composeAssetCatalogue(ASSET_CATALOGUE_SECTIONS)

/**
 * Immutable compile-time static map of asset modules.
 * Cloned and frozen to isolate from runtime mutations on MODULE_REGISTRY.
 */
export const ASSET_MODULES_MAP: ReadonlyMap<
  string,
  Readonly<AssetModule>
> = ASSET_CATALOGUE.modulesMap

/**
 * Mutable compatibility registry with independent clones of module objects.
 * One shared object: tests patch and restore entries in place, and
 * `getRegisteredModule` reads the live entries.
 */
export const MODULE_REGISTRY: Record<string, AssetModule> =
  ASSET_CATALOGUE.registry

/** Image prompt text keyed by `AssetModule.imagePromptKey`. */
export const MODULE_PROMPTS: Record<string, string> = ASSET_CATALOGUE.prompts

export const getRegisteredModule = (
  moduleId: unknown
): AssetModule | undefined =>
  typeof moduleId === 'string' && Object.hasOwn(MODULE_REGISTRY, moduleId)
    ? MODULE_REGISTRY[moduleId]
    : undefined
