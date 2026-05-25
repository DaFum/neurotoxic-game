import test from 'node:test'
import assert from 'node:assert'
import {
  handlePurchaseChassis,
  handleInstallModule,
  handleRemoveModule,
  handleAssetFailedAction
} from '../../src/context/reducers/assetReducer.ts'
import { CHASSIS_CONFIG } from '../../src/utils/assetConfig.ts'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry.ts'

// MODULE_REGISTRY is a mutable shared module-scoped object. To prevent
// pollution into other test files run in the same process, snapshot the
// original 'test_mod' entry (if any) and restore it after every test below.
// If the entry didn't exist, we delete the injected one.
const originalTestMod = MODULE_REGISTRY['test_mod']
// @ts-expect-error test mock — minimal AssetModule shape
MODULE_REGISTRY['test_mod'] = {
  id: 'test_mod',
  ownerKind: 'tourbus_chassis',
  slotType: 'tb_roof',
  flavor: 'legit',
  cost: 100,
  installCost: 50,
  removalRefundFraction: 0.5,
  boni: {},
  unlock: {},
  imagePromptKey: 'test'
}

test.after(() => {
  if (originalTestMod === undefined) {
    delete MODULE_REGISTRY['test_mod']
  } else {
    MODULE_REGISTRY['test_mod'] = originalTestMod
  }
})

const mockState = {
  player: { money: 1000, day: 10 },
  band: { fame: 100 },
  assets: [],
  liabilities: [],
  crowdfundCampaigns: []
}

test('handlePurchaseChassis - happy path cash', () => {
  const kind = 'tourbus_chassis'
  const configTier = CHASSIS_CONFIG[kind].legit[1]
  const slotIds = configTier.slots.map((_, i) => `slot_${i}`)

  const payload = {
    id: 'a1',
    kind,
    flavor: 'legit',
    tier: 1,
    mode: 'cash',
    slotIds,
    today: mockState.player.day
  }

  const next = handlePurchaseChassis(mockState, payload)
  assert.strictEqual(next.assets[0].id, 'a1')
})

test('handleInstallModule - happy path', () => {
  const startState = {
    ...mockState,
    assets: [
      {
        id: 'a1',
        slots: [{ id: 's1', slotType: 'tb_roof', installedModuleId: null }]
      }
    ]
  }

  const next = handleInstallModule(startState, {
    assetId: 'a1',
    slotId: 's1',
    moduleId: 'test_mod'
  })
  assert.strictEqual(next.assets[0].slots[0].installedModuleId, 'test_mod')
})

test('handleRemoveModule - cleans up added child slots and refunds', () => {
  const startState = {
    ...mockState,
    assets: [
      {
        id: 'a1',
        slots: [
          { id: 's1', installedModuleId: 'test_mod' },
          { id: 's2', addedByModuleId: 'test_mod' }
        ]
      }
    ]
  }

  const next = handleRemoveModule(startState, { assetId: 'a1', slotId: 's1' })
  assert.strictEqual(next.assets[0].slots.length, 1)
  // test_mod is registered with cost: 100, removalRefundFraction: 0.5 →
  // refund of 50 added to the starting 1000.
  assert.strictEqual(next.player.money, mockState.player.money + 50)
})

test('handleAssetFailedAction - is no-op', () => {
  const next = handleAssetFailedAction(mockState)
  assert.strictEqual(next, mockState)
})
