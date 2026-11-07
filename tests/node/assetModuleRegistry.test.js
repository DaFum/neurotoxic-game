import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  MODULE_REGISTRY,
  MODULE_PROMPTS,
  ASSET_MODULES_MAP,
  composeAssetCatalogue,
  getRegisteredModule
} from '../../src/utils/assets/assetModuleRegistry.ts'
import {
  TOURBUS_MODULES,
  TOURBUS_PROMPTS
} from '../../src/utils/assets/assetSections/tourbusModules.ts'
import {
  STUDIO_MODULES,
  STUDIO_PROMPTS
} from '../../src/utils/assets/assetSections/studioModules.ts'
import {
  BANDHAUS_MODULES,
  BANDHAUS_PROMPTS
} from '../../src/utils/assets/assetSections/bandhausModules.ts'
import {
  WORKSHOP_MODULES,
  WORKSHOP_PROMPTS
} from '../../src/utils/assets/assetSections/workshopModules.ts'

const SECTION_MODULES = [
  TOURBUS_MODULES,
  STUDIO_MODULES,
  BANDHAUS_MODULES,
  WORKSHOP_MODULES
]
const SECTION_PROMPTS = [
  TOURBUS_PROMPTS,
  STUDIO_PROMPTS,
  BANDHAUS_PROMPTS,
  WORKSHOP_PROMPTS
]

/**
 * Minimal module fixture for composition tests.
 * @param {string} id
 * @param {string} [imagePromptKey]
 */
const fixtureModule = (id, imagePromptKey = id) => ({
  id,
  ownerKind: 'tourbus_chassis',
  slotType: 'tb_roof',
  flavor: 'legit',
  cost: 100,
  installCost: 10,
  removalRefundFraction: 0.5,
  boni: { fuelMultiplier: 0.9 },
  unlock: {},
  addsSlots: [{ slotType: 'tb_interior', count: 1 }],
  imagePromptKey
})

describe('MODULE_REGISTRY invariants', () => {
  it('mutating MODULE_REGISTRY in place does not mutate ASSET_MODULES_MAP', () => {
    const testId = 'tb_roof_rack'
    const originalStatic = ASSET_MODULES_MAP.get(testId)
    assert.ok(originalStatic)
    const prevExclusive = originalStatic.exclusiveWithGroup

    const originalRegistry = structuredClone(MODULE_REGISTRY[testId])
    try {
      MODULE_REGISTRY[testId].exclusiveWithGroup = 'mutated_test_group'
      assert.equal(
        ASSET_MODULES_MAP.get(testId)?.exclusiveWithGroup,
        prevExclusive
      )
    } finally {
      MODULE_REGISTRY[testId] = originalRegistry
    }
  })
  it('no module has self-referential addsSlots (anti-stacking)', () => {
    for (const [id, m] of Object.entries(MODULE_REGISTRY)) {
      for (const a of m.addsSlots ?? []) {
        assert.notEqual(
          a.slotType,
          m.slotType,
          `${id} adds same slotType as it occupies — would enable infinite self-stacking`
        )
      }
    }
  })

  it('every module imagePromptKey exists in MODULE_PROMPTS', () => {
    for (const [id, m] of Object.entries(MODULE_REGISTRY)) {
      assert.ok(
        Object.hasOwn(MODULE_PROMPTS, m.imagePromptKey),
        `${id} references missing prompt key "${m.imagePromptKey}"`
      )
    }
  })

  it('module ids are unique and match their registry key', () => {
    for (const [key, m] of Object.entries(MODULE_REGISTRY)) {
      assert.equal(m.id, key, `id ${m.id} stored under different key ${key}`)
    }
  })

  it('section catalogues declare no duplicate module ids or prompt keys', () => {
    const ids = SECTION_MODULES.flat().map(m => m.id)
    const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i)
    assert.deepEqual(duplicateIds, [], 'duplicate module ids across sections')

    const promptKeys = SECTION_PROMPTS.flatMap(p => Object.keys(p))
    const duplicateKeys = promptKeys.filter(
      (key, i) => promptKeys.indexOf(key) !== i
    )
    assert.deepEqual(duplicateKeys, [], 'prompt keys defined by two sections')
  })

  it('registry and map keep section order: tourbus, studio, bandhaus, workshop', () => {
    const expected = SECTION_MODULES.flat().map(m => m.id)
    assert.equal(expected.length, 66)
    assert.deepEqual(Object.keys(MODULE_REGISTRY), expected)
    assert.deepEqual([...ASSET_MODULES_MAP.keys()], expected)
  })

  it('getRegisteredModule returns live own entries only', () => {
    for (const hostile of [
      'constructor',
      '__proto__',
      'toString',
      'hasOwnProperty',
      'no_such_module',
      42,
      null,
      undefined
    ]) {
      assert.equal(getRegisteredModule(hostile), undefined, String(hostile))
    }
    assert.equal(
      getRegisteredModule('tb_roof_rack'),
      MODULE_REGISTRY.tb_roof_rack
    )
    assert.notEqual(
      getRegisteredModule('tb_roof_rack'),
      ASSET_MODULES_MAP.get('tb_roof_rack')
    )
  })
})

describe('composeAssetCatalogue', () => {
  it('rejects a module id declared twice across sections', () => {
    assert.throws(
      () =>
        composeAssetCatalogue([
          { modules: [fixtureModule('dup')], prompts: {} },
          { modules: [fixtureModule('dup')], prompts: {} }
        ]),
      /Duplicate asset module id "dup"/
    )
  })

  it('rejects a prompt key declared by two sections', () => {
    assert.throws(
      () =>
        composeAssetCatalogue([
          { modules: [fixtureModule('a')], prompts: { shared: 'one' } },
          { modules: [fixtureModule('b')], prompts: { shared: 'two' } }
        ]),
      /Duplicate asset prompt key "shared"/
    )
  })

  it('rejects a module id declared twice within one section', () => {
    assert.throws(
      () =>
        composeAssetCatalogue([
          {
            modules: [
              fixtureModule('a'),
              fixtureModule('b'),
              fixtureModule('a')
            ],
            prompts: {}
          }
        ]),
      /Duplicate asset module id "a"/
    )
  })

  it('precomposes ordered, independent registry and frozen map clones', () => {
    const first = [fixtureModule('s1_b'), fixtureModule('s1_a')]
    const second = [fixtureModule('s2_a')]
    const catalogue = composeAssetCatalogue([
      { modules: first, prompts: {} },
      { modules: second, prompts: {} }
    ])

    assert.deepEqual(Object.keys(catalogue.registry), ['s1_b', 's1_a', 's2_a'])
    assert.deepEqual([...catalogue.modulesMap.keys()], ['s1_b', 's1_a', 's2_a'])

    const source = first[0]
    const registered = catalogue.registry.s1_b
    const mapped = catalogue.modulesMap.get('s1_b')
    assert.deepEqual(registered, source)
    assert.deepEqual(mapped, source)
    assert.notEqual(registered, source)
    assert.notEqual(mapped, source)
    assert.notEqual(registered, mapped)
    assert.notEqual(registered.addsSlots, source.addsSlots)
    assert.ok(Object.isFrozen(mapped))
    assert.ok(!Object.isFrozen(registered))

    source.cost = 999
    source.addsSlots[0].count = 7
    assert.equal(registered.cost, 100)
    assert.equal(mapped?.cost, 100)
    assert.equal(registered.addsSlots?.[0]?.count, 1)
    assert.equal(mapped?.addsSlots?.[0]?.count, 1)
  })

  it('merges prompts in section order and lets modules share a prompt key', () => {
    const catalogue = composeAssetCatalogue([
      {
        modules: [fixtureModule('x1', 'shared'), fixtureModule('x2', 'shared')],
        prompts: { shared: 'pixel art shared' }
      },
      {
        modules: [fixtureModule('y1')],
        prompts: { y1: 'pixel art y1', ['__proto__']: 'pixel art proto' }
      }
    ])
    assert.deepEqual(Object.keys(catalogue.prompts), [
      'shared',
      'y1',
      '__proto__'
    ])
    assert.ok(Object.hasOwn(catalogue.prompts, '__proto__'))
    assert.equal(Object.getPrototypeOf(catalogue.prompts), Object.prototype)
    assert.equal(
      catalogue.prompts[catalogue.registry.x1.imagePromptKey],
      'pixel art shared'
    )
    assert.equal(
      catalogue.prompts[catalogue.registry.x2.imagePromptKey],
      'pixel art shared'
    )
  })
})
