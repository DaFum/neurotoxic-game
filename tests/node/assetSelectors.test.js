import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getActiveAssetModifiers,
  getAssetAggregateBoni,
  getAssetTotalDailyRevenue,
  getAssetTotalUpkeep,
  getLockReasons,
  getModulePoolForAsset,
  getSlotConflicts,
  getTotalDailyObligations,
  isModuleUnlocked,
  NEUTRAL_ASSET_MODIFIERS
} from '../../src/utils/assetSelectors.ts'
import {
  MODULE_PROMPTS,
  MODULE_REGISTRY
} from '../../src/utils/assetModuleRegistry.ts'

const registrySnapshot = structuredClone(MODULE_REGISTRY)
const promptsSnapshot = structuredClone(MODULE_PROMPTS)

after(() => {
  for (const key of Object.keys(MODULE_REGISTRY)) delete MODULE_REGISTRY[key]
  Object.assign(MODULE_REGISTRY, registrySnapshot)
  for (const key of Object.keys(MODULE_PROMPTS)) delete MODULE_PROMPTS[key]
  Object.assign(MODULE_PROMPTS, promptsSnapshot)
})

const registerTestModule = (id, override = {}) => {
  const base = {
    id,
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_roof',
    flavor: 'legit',
    cost: 100,
    installCost: 10,
    removalRefundFraction: 0.5,
    boni: {},
    unlock: {},
    imagePromptKey: `prompt_${id}`
  }
  MODULE_REGISTRY[id] = { ...base, ...override }
  MODULE_PROMPTS[`prompt_${id}`] = `pixel art ${id} test`
}

const makeAsset = (overrides = {}) => ({
  id: 'asset_1',
  kind: 'tourbus_chassis',
  chassisFlavor: 'legit',
  chassisTier: 1,
  condition: 100,
  baseUpkeep: 10,
  baseDailyRevenue: 0,
  slots: [],
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  baseRiskEventChance: 0.005,
  ...overrides
})

const makeState = (overrides = {}) => ({
  player: { fame: 0, money: 0, fameLevel: 0, ...overrides.player },
  band: { members: [], ...overrides.band },
  social: { ...overrides.social },
  activeStoryFlags: overrides.activeStoryFlags ?? [],
  assets: overrides.assets ?? [],
  liabilities: overrides.liabilities ?? []
})

describe('NEUTRAL_ASSET_MODIFIERS', () => {
  it('has 1.0 multipliers and 0 additives', () => {
    assert.equal(NEUTRAL_ASSET_MODIFIERS.fuelMultiplier, 1.0)
    assert.equal(NEUTRAL_ASSET_MODIFIERS.merchCostMultiplier, 1.0)
    assert.equal(NEUTRAL_ASSET_MODIFIERS.baseRiskChanceMultiplier, 1.0)
    assert.equal(NEUTRAL_ASSET_MODIFIERS.staminaRegenBonusPerDay, 0)
    assert.equal(NEUTRAL_ASSET_MODIFIERS.songQualityBonus, 0)
    assert.equal(NEUTRAL_ASSET_MODIFIERS.flags.infightingDamper, false)
    assert.equal(NEUTRAL_ASSET_MODIFIERS.flags.enablesReRecording, false)
  })
})

describe('getActiveAssetModifiers', () => {
  it('returns NEUTRAL for empty asset list', () => {
    const out = getActiveAssetModifiers([])
    assert.equal(out.fuelMultiplier, 1.0)
    assert.equal(out.staminaRegenBonusPerDay, 0)
  })

  it('aggregates multipliers multiplicatively', () => {
    registerTestModule('test_fuel_a', { boni: { fuelMultiplier: 0.85 } })
    registerTestModule('test_fuel_b', {
      slotType: 'tb_front',
      boni: { fuelMultiplier: 0.9 }
    })
    const asset = makeAsset({
      slots: [
        {
          id: 's1',
          slotType: 'tb_roof',
          position: { x: 0, y: 0 },
          installedModuleId: 'test_fuel_a'
        },
        {
          id: 's2',
          slotType: 'tb_front',
          position: { x: 0, y: 0 },
          installedModuleId: 'test_fuel_b'
        }
      ]
    })
    const out = getActiveAssetModifiers([asset])
    assert.ok(Math.abs(out.fuelMultiplier - 0.85 * 0.9) < 1e-9)
  })

  it('aggregates additive bonuses by sum', () => {
    registerTestModule('test_stamina_a', {
      boni: { staminaRegenBonusPerDay: 3 }
    })
    registerTestModule('test_stamina_b', {
      slotType: 'tb_front',
      boni: { staminaRegenBonusPerDay: 2 }
    })
    const asset = makeAsset({
      slots: [
        {
          id: 's1',
          slotType: 'tb_roof',
          position: { x: 0, y: 0 },
          installedModuleId: 'test_stamina_a'
        },
        {
          id: 's2',
          slotType: 'tb_front',
          position: { x: 0, y: 0 },
          installedModuleId: 'test_stamina_b'
        }
      ]
    })
    const out = getActiveAssetModifiers([asset])
    assert.equal(out.staminaRegenBonusPerDay, 5)
  })

  it('ORs flags', () => {
    registerTestModule('test_flag_a', { boni: { infightingDamper: true } })
    const asset = makeAsset({
      slots: [
        {
          id: 's1',
          slotType: 'tb_roof',
          position: { x: 0, y: 0 },
          installedModuleId: 'test_flag_a'
        }
      ]
    })
    const out = getActiveAssetModifiers([asset])
    assert.equal(out.flags.infightingDamper, true)
  })

  it('ignores broken assets (condition < 20)', () => {
    registerTestModule('test_broken', { boni: { fuelMultiplier: 0.5 } })
    const broken = makeAsset({
      condition: 10,
      slots: [
        {
          id: 's1',
          slotType: 'tb_roof',
          position: { x: 0, y: 0 },
          installedModuleId: 'test_broken'
        }
      ]
    })
    const out = getActiveAssetModifiers([broken])
    assert.equal(out.fuelMultiplier, 1.0)
  })
})

describe('getAssetAggregateBoni / Upkeep / Revenue', () => {
  it('upkeep includes upkeepDelta from modules', () => {
    registerTestModule('test_upkeep', { boni: { upkeepDelta: 5 } })
    const asset = makeAsset({
      baseUpkeep: 10,
      slots: [
        {
          id: 's1',
          slotType: 'tb_roof',
          position: { x: 0, y: 0 },
          installedModuleId: 'test_upkeep'
        }
      ]
    })
    assert.equal(getAssetTotalUpkeep(asset), 15)
  })

  it('revenue scales by condition', () => {
    registerTestModule('test_rev', { boni: { baseDailyRevenueDelta: 50 } })
    const asset = makeAsset({
      condition: 50,
      baseDailyRevenue: 10,
      slots: [
        {
          id: 's1',
          slotType: 'tb_roof',
          position: { x: 0, y: 0 },
          installedModuleId: 'test_rev'
        }
      ]
    })
    // (10 + 50) * 0.5 = 30
    assert.equal(getAssetTotalDailyRevenue(asset), 30)
  })

  it('broken asset contributes empty aggregate boni', () => {
    registerTestModule('test_broken2', { boni: { fuelMultiplier: 0.5 } })
    const asset = makeAsset({
      condition: 5,
      slots: [
        {
          id: 's1',
          slotType: 'tb_roof',
          position: { x: 0, y: 0 },
          installedModuleId: 'test_broken2'
        }
      ]
    })
    assert.deepEqual(getAssetAggregateBoni(asset), {})
  })
})

describe('getTotalDailyObligations', () => {
  it('includes liability payments and asset cashflow', () => {
    const asset = makeAsset({ baseUpkeep: 20, baseDailyRevenue: 10 })
    const state = makeState({
      player: { fame: 0, money: 1000, fameLevel: 0 },
      band: {
        members: [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
      },
      social: {},
      assets: [asset],
      liabilities: [
        {
          id: 'l1',
          source: 'loan',
          assetId: 'asset_1',
          principalRemaining: 1000,
          interestRate: 0.05,
          dailyPayment: 17,
          termDaysRemaining: 60,
          defaultCounter: 0
        }
      ]
    })
    // guaranteed daily cost (3 members, fameLevel 0) = 62 + 24 + 0 = 86
    // assetUpkeep = 20, assetRevenue = 10 (condition 100), liability = 17
    // total = 86 + 20 - 10 + 17 = 113
    const total = getTotalDailyObligations(state)
    assert.equal(total, 113)
  })

  it('returns base cost only when no assets and no liabilities', () => {
    const state = makeState({
      player: { fame: 0, money: 100, fameLevel: 0 },
      band: { members: [{ id: 'a' }] },
      social: {}
    })
    // 62 + 8 + 0 = 70
    assert.equal(getTotalDailyObligations(state), 70)
  })
})

describe('isModuleUnlocked', () => {
  it('returns true when no requirements', () => {
    registerTestModule('test_open', {})
    assert.equal(isModuleUnlocked(MODULE_REGISTRY.test_open, makeState()), true)
  })

  it('checks minFame', () => {
    registerTestModule('test_fame', { unlock: { minFame: 50 } })
    assert.equal(
      isModuleUnlocked(
        MODULE_REGISTRY.test_fame,
        makeState({ player: { fame: 20 } })
      ),
      false
    )
    assert.equal(
      isModuleUnlocked(
        MODULE_REGISTRY.test_fame,
        makeState({ player: { fame: 60 } })
      ),
      true
    )
  })

  it('checks all story flags AND', () => {
    registerTestModule('test_story', {
      unlock: { requiredStoryFlags: ['a', 'b'] }
    })
    assert.equal(
      isModuleUnlocked(
        MODULE_REGISTRY.test_story,
        makeState({ activeStoryFlags: ['a'] })
      ),
      false
    )
    assert.equal(
      isModuleUnlocked(
        MODULE_REGISTRY.test_story,
        makeState({ activeStoryFlags: ['a', 'b'] })
      ),
      true
    )
  })

  it('checks OR semantics for requiredOtherModuleInstalled array', () => {
    registerTestModule('test_or', {
      unlock: { requiredOtherModuleInstalled: ['mod_a', 'mod_b'] }
    })
    const stateWithA = makeState({
      assets: [
        makeAsset({
          slots: [
            {
              id: 's',
              slotType: 'tb_roof',
              position: { x: 0, y: 0 },
              installedModuleId: 'mod_a'
            }
          ]
        })
      ]
    })
    const stateWithNeither = makeState({ assets: [makeAsset()] })
    assert.equal(isModuleUnlocked(MODULE_REGISTRY.test_or, stateWithA), true)
    assert.equal(
      isModuleUnlocked(MODULE_REGISTRY.test_or, stateWithNeither),
      false
    )
  })

  it('checks real band member baseStats/top-level stats for skill requirements', () => {
    registerTestModule('test_real_member_stats', {
      unlock: { requiredMemberSkill: { skill: 'tech', tier: 2 } }
    })

    const state = makeState({
      band: {
        members: [
          {
            id: 'matze',
            mood: 50,
            stamina: 50,
            traits: {},
            relationships: {},
            baseStats: { technical: 2 },
            technical: 1
          }
        ]
      }
    })

    assert.equal(
      isModuleUnlocked(MODULE_REGISTRY.test_real_member_stats, state),
      true
    )
  })

  it('keeps production asset skill unlocks tied to reachable member stats', () => {
    const reachableSkills = new Set([
      'skill',
      'charisma',
      'technical',
      'tech',
      'stamina',
      'mood',
      'improv',
      'composition',
      'luck'
    ])

    for (const module of Object.values(MODULE_REGISTRY)) {
      const skill = module.unlock.requiredMemberSkill?.skill
      if (skill === undefined) continue
      assert.equal(
        reachableSkills.has(skill),
        true,
        `${module.id} requires unreachable member skill "${skill}"`
      )
    }
  })
})

describe('getLockReasons', () => {
  it('returns empty array when unlocked', () => {
    registerTestModule('test_open2', {})
    assert.deepEqual(
      getLockReasons(MODULE_REGISTRY.test_open2, makeState()),
      []
    )
  })

  it('reports each failed requirement', () => {
    registerTestModule('test_multi', {
      unlock: { minFame: 50, minMoney: 1000 }
    })
    const reasons = getLockReasons(MODULE_REGISTRY.test_multi, makeState())
    assert.equal(reasons.length, 2)
    assert.ok(reasons.find(r => r.kind === 'fame' && r.amount === 50))
    assert.ok(reasons.find(r => r.kind === 'money' && r.amount === 1000))
  })

  it('distinguishes skill vs skillAny by memberId presence', () => {
    registerTestModule('test_skill_any', {
      unlock: { requiredMemberSkill: { skill: 'tech', tier: 2 } }
    })
    registerTestModule('test_skill_named', {
      unlock: {
        requiredMemberSkill: { memberId: 'matze', skill: 'tech', tier: 2 }
      }
    })
    const reasonsAny = getLockReasons(
      MODULE_REGISTRY.test_skill_any,
      makeState()
    )
    const reasonsNamed = getLockReasons(
      MODULE_REGISTRY.test_skill_named,
      makeState()
    )
    assert.equal(reasonsAny[0].kind, 'skillAny')
    assert.equal(reasonsNamed[0].kind, 'skill')
  })
})

describe('getSlotConflicts', () => {
  it('returns canInstall=true when no exclusivity', () => {
    registerTestModule('test_no_excl', {})
    const asset = makeAsset()
    const result = getSlotConflicts(asset, 'test_no_excl')
    assert.equal(result.canInstall, true)
    assert.deepEqual(result.conflictingModuleIds, [])
  })

  it('finds conflicting installed module sharing the same group', () => {
    registerTestModule('test_excl_a', {
      exclusiveWithGroup: 'power_hog'
    })
    registerTestModule('test_excl_b', {
      slotType: 'tb_front',
      exclusiveWithGroup: 'power_hog'
    })
    const asset = makeAsset({
      slots: [
        {
          id: 's1',
          slotType: 'tb_front',
          position: { x: 0, y: 0 },
          installedModuleId: 'test_excl_b'
        }
      ]
    })
    const result = getSlotConflicts(asset, 'test_excl_a')
    assert.equal(result.canInstall, false)
    assert.deepEqual(result.conflictingModuleIds, ['test_excl_b'])
  })
})

describe('getModulePoolForAsset', () => {
  it('filters by ownerKind and reports unlocked status', () => {
    registerTestModule('test_pool_a', { unlock: {} })
    registerTestModule('test_pool_locked', { unlock: { minFame: 999 } })
    registerTestModule('test_other_kind', {
      ownerKind: 'studio_chassis',
      slotType: 'st_control'
    })
    const asset = makeAsset()
    const pool = getModulePoolForAsset(asset, makeState())
    const ids = pool.map(p => p.module.id)
    assert.ok(ids.includes('test_pool_a'))
    assert.ok(ids.includes('test_pool_locked'))
    assert.ok(!ids.includes('test_other_kind'))
    const lockedEntry = pool.find(p => p.module.id === 'test_pool_locked')
    assert.equal(lockedEntry.unlocked, false)
    assert.equal(lockedEntry.lockReasons[0].kind, 'fame')
  })
})
