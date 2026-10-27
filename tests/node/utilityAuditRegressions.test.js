import test from 'node:test'
import assert from 'node:assert/strict'
import { translateContextKeys } from '../../src/utils/translationUtils.ts'
import { getOptionPreviewMoney } from '../../src/utils/eventEngine/resolvers.ts'
import { selectEvent } from '../../src/utils/eventEngine/eventSelection.ts'
import { validateGameEvent } from '../../src/utils/eventValidator.ts'
import {
  getAssetAggregateBoni,
  getAssetTotalDailyRevenue,
  getAssetTotalUpkeep,
  getActiveAssetModifiers,
  getTotalDailyObligations
} from '../../src/utils/assets/assetSelectors.ts'
import {
  CHASSIS_CONFIG,
  CONDITION_DECAY_PER_DAY
} from '../../src/utils/assets/assetConfig.ts'
import { processAssetTick } from '../../src/utils/assets/assetTicks.ts'
import {
  computeDropChance,
  DROP_BASE_CHANCE,
  MAX_DROP_CHANCE
} from '../../src/utils/contrabandUtils.ts'
import {
  getStashStackCount,
  addContrabandToBand
} from '../../src/utils/contrabandStashUtils.ts'
import {
  applyStatModifier,
  applyUnlockHQ
} from '../../src/utils/purchaseLogicUtils.ts'

const eventWithEffect = effect => ({
  id: 'test_cycle',
  title: 'events:test.title',
  description: 'events:test.description',
  options: [
    { label: 'events:test.label', outcomeText: 'events:test.outcome', effect }
  ]
})
const asset = overrides => ({
  id: 'asset',
  kind: 'studio_chassis',
  chassisFlavor: 'legit',
  chassisTier: 1,
  condition: 100,
  baseUpkeep: 10,
  baseDailyRevenue: 20,
  slots: [],
  ...overrides
})

test('translation skips ancestor cycles and translates shared descendants of frozen parents', () => {
  const child = { label: 'ui:label' }
  const cyclic = { child, repeated: child }
  cyclic.self = cyclic
  const result = translateContextKeys(
    Object.freeze(cyclic),
    key => `translated:${key}`
  )
  assert.equal(result.self, undefined)
  assert.deepEqual(result.child, { label: 'translated:ui:label' })
  assert.deepEqual(result.repeated, result.child)
  assert.equal(child.label, 'ui:label')
  const array = ['ui:label']
  array.push(array)
  assert.deepEqual(
    translateContextKeys(array, key => `translated:${key}`),
    ['translated:ui:label', undefined]
  )
})

test('money previews skip cycles while counting each shared effect occurrence', () => {
  const money = { type: 'resource', resource: 'money', value: 10 }
  const composite = { type: 'composite', effects: [money, money] }
  composite.effects.push(composite)
  assert.equal(
    getOptionPreviewMoney(
      { effect: Object.freeze(composite) },
      { player: { money: 100 } }
    ),
    20
  )
})

test('effect validators reject ancestor cycles and accept shared effect subtrees', () => {
  const shared = { type: 'resource', resource: 'money', value: 10 }
  assert.equal(
    validateGameEvent(
      eventWithEffect(
        Object.freeze({ type: 'composite', effects: [shared, shared] })
      )
    ),
    true
  )
  const composite = { type: 'composite', effects: [] }
  composite.effects.push(composite)
  assert.throws(
    () => validateGameEvent(eventWithEffect(composite)),
    /[Cc]yclic effect/
  )
  const check = { type: 'skillCheck', success: shared }
  check.failure = check
  assert.throws(
    () => validateGameEvent(eventWithEffect(check)),
    /[Cc]yclic effect/
  )
})

test('asset boni selector accepts the partial slots contract used by event selection', () => {
  assert.deepEqual(getAssetAggregateBoni({ condition: 100 }), {})
})

test('event selection and asset modifiers share the active flag threshold', () => {
  const pool = [
    {
      id: 'conflict',
      category: 'band',
      trigger: 'random',
      chance: 0.4,
      tags: ['conflict']
    }
  ]
  for (const [condition, active] of [
    [19.9, false],
    [20, true],
    [NaN, true],
    [Infinity, true],
    [-Infinity, true]
  ]) {
    const assets = [
      asset({ condition, slots: [{ installedModuleId: 'bh_hot_tub' }] })
    ]
    assert.equal(
      getAssetAggregateBoni(assets[0]).infightingDamper === true,
      active
    )
    assert.equal(getActiveAssetModifiers(assets).flags.infightingDamper, active)
    assert.equal(
      selectEvent(pool, { assets }, 'random', () => 0.3)?.id ?? null,
      active ? null : 'conflict'
    )
  }
})

test('asset financial calculations recover non-finite operands from chassis defaults', () => {
  const config = CHASSIS_CONFIG.studio_chassis.legit[1]
  for (const value of [NaN, Infinity, -Infinity]) {
    const brokenNumbers = asset({
      condition: value,
      baseUpkeep: value,
      baseDailyRevenue: value
    })
    assert.equal(getAssetTotalUpkeep(brokenNumbers), config.upkeep)
    assert.equal(getAssetTotalDailyRevenue(brokenNumbers), config.revenue)
    assert.deepEqual(
      getActiveAssetModifiers([brokenNumbers]),
      getActiveAssetModifiers([asset()])
    )
    const next = processAssetTick({
      assets: [brokenNumbers],
      player: { money: 100, day: 1 }
    })
    assert.equal(next.assets[0].condition, 100 - CONDITION_DECAY_PER_DAY)
    assert.equal(next.player.money, 100 + config.revenue - config.upkeep)
    const dailyState = {
      assets: [brokenNumbers],
      player: { fame: 0 },
      band: { members: [] },
      social: {},
      liabilities: {}
    }
    const baseObligations = getTotalDailyObligations({
      ...dailyState,
      assets: []
    })
    assert.equal(
      getTotalDailyObligations(dailyState),
      baseObligations + config.upkeep - config.revenue
    )
  }
  assert.equal(getAssetTotalDailyRevenue(asset({ condition: 150 })), 20)
  assert.equal(getAssetTotalDailyRevenue(asset({ condition: -10 })), 0)
})

test('drop chance normalizes non-finite base probabilities and retains bounds', () => {
  for (const base of [NaN, Infinity, -Infinity])
    assert.equal(computeDropChance(base, 2), DROP_BASE_CHANCE + 0.01)
  assert.equal(computeDropChance(-1, 0), 0)
  assert.equal(computeDropChance(10, 0), MAX_DROP_CHANCE)
})

test('stash counts and additions use whole owned units', () => {
  for (const [stacks, expected] of [
    [0.5, 0],
    [1.9, 1],
    [-0.5, 0]
  ]) {
    const band = { stash: { c_void_energy: { stacks } } }
    assert.equal(getStashStackCount(band.stash, 'c_void_energy'), expected)
    assert.equal(
      addContrabandToBand(band, { contrabandId: 'c_void_energy' }).stash
        .c_void_energy.stacks,
      expected + 1
    )
    assert.equal(band.stash.c_void_energy.stacks, stacks)
  }
})

test('performance stat modifiers accept a null band', () => {
  assert.deepEqual(
    applyStatModifier(
      { target: 'performance', stat: 'crit', value: 0.2 },
      {},
      {},
      null
    ),
    {
      playerPatch: {},
      bandPatch: null
    }
  )
})

for (const [id, stat, delta] of [
  ['hq_room_coffee', 'mood', 20],
  ['hq_room_sofa', 'stamina', 30],
  ['hq_room_old_couch', 'stamina', 10],
  ['hq_room_cheap_beer_fridge', 'mood', 5]
]) {
  test(`comfort upgrade ${id} keeps its explicit member transformation`, () => {
    const band = {
      members: [{ id: 'member', mood: 40, stamina: 40, staminaMax: 100 }]
    }
    const result = applyUnlockHQ({ id }, {}, {}, band)
    assert.equal(result.bandPatch.members[0][stat], 40 + delta)
    assert.equal(band.members[0][stat], 40)
  })
}
