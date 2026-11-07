import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// No static imports of the asset catalogue: node:test runs each file in its
// own process, so the dynamic imports below observe a fresh module graph.
const ASSETS = '../../src/utils/assets'

describe('public asset catalogue initialization', () => {
  it('importing only the public entry point yields the fully composed catalogue', async () => {
    const tourbus = await import(`${ASSETS}/assetSections/tourbusModules.ts`)
    const tourbusBefore = structuredClone(tourbus.TOURBUS_MODULES)

    const catalogue = await import(`${ASSETS}/assetModuleRegistry.ts`)
    const studio = await import(`${ASSETS}/assetSections/studioModules.ts`)
    const bandhaus = await import(`${ASSETS}/assetSections/bandhausModules.ts`)
    const workshop = await import(`${ASSETS}/assetSections/workshopModules.ts`)

    const sections = [
      { modules: tourbus.TOURBUS_MODULES, prompts: tourbus.TOURBUS_PROMPTS },
      { modules: studio.STUDIO_MODULES, prompts: studio.STUDIO_PROMPTS },
      {
        modules: bandhaus.BANDHAUS_MODULES,
        prompts: bandhaus.BANDHAUS_PROMPTS
      },
      { modules: workshop.WORKSHOP_MODULES, prompts: workshop.WORKSHOP_PROMPTS }
    ]
    const expectedIds = sections.flatMap(s => s.modules.map(m => m.id))

    assert.equal(Object.keys(catalogue.MODULE_REGISTRY).length, 66)
    assert.deepEqual(Object.keys(catalogue.MODULE_REGISTRY), expectedIds)
    assert.deepEqual([...catalogue.ASSET_MODULES_MAP.keys()], expectedIds)

    // The live views are exactly the explicit composition of the sections.
    const composed = catalogue.composeAssetCatalogue(sections)
    assert.deepEqual(catalogue.MODULE_REGISTRY, composed.registry)
    assert.deepEqual(catalogue.MODULE_PROMPTS, composed.prompts)
    assert.deepEqual(
      [...catalogue.ASSET_MODULES_MAP.entries()],
      [...composed.modulesMap.entries()]
    )

    // Composition reads the sections without mutating or aliasing them.
    assert.deepEqual(tourbus.TOURBUS_MODULES, tourbusBefore)
    for (const m of sections.flatMap(s => s.modules)) {
      assert.notEqual(catalogue.MODULE_REGISTRY[m.id], m, m.id)
    }

    // A second public consumer sees the same live registry and prompts.
    const imageGen = await import('../../src/utils/imageGen.ts')
    const roofRack = catalogue.MODULE_REGISTRY.tb_roof_rack
    assert.ok(roofRack)
    assert.equal(
      imageGen.getModuleImagePrompt('tb_roof_rack'),
      catalogue.MODULE_PROMPTS[roofRack.imagePromptKey]
    )
  })
})
