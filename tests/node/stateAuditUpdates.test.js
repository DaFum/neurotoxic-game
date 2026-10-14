import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_BAND_STATE,
  DEFAULT_PLAYER_STATE
} from '../../src/context/initialState.ts'
import { handleUpdateBand } from '../../src/context/reducers/bandReducer.ts'
import { handleUpdatePlayer } from '../../src/context/reducers/playerReducer.ts'
import { handleInstallModule } from '../../src/context/reducers/assetReducer.ts'
import {
  createUpdateBandAction,
  createUpdatePlayerAction
} from '../../src/context/actionCreators.ts'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry.ts'
import { installModule } from '../../src/context/assetActionCreators.ts'
import {
  sanitizeBand,
  sanitizePlayer
} from '../../src/context/reducers/sanitizers/stateSanitizers.ts'
import { sanitizeCareerState } from '../../src/context/reducers/careerSanitizers.ts'

const originalModuleRegistry = structuredClone(MODULE_REGISTRY)
after(() => {
  for (const key of Object.keys(MODULE_REGISTRY)) delete MODULE_REGISTRY[key]
  Object.assign(MODULE_REGISTRY, originalModuleRegistry)
})

const base = () => ({
  band: structuredClone(DEFAULT_BAND_STATE),
  player: {
    ...structuredClone(DEFAULT_PLAYER_STATE),
    money: 100000,
    fame: 100000
  },
  assets: [],
  social: { scenePresence: 100000 },
  activeStoryFlags: []
})

test('band rejects nested forbidden keys and accessors before reads, including functional and creator patches', () => {
  const state = base()
  let reads = 0
  const accessor = { inventory: {} }
  Object.defineProperty(accessor.inventory, 'count', {
    enumerable: true,
    get() {
      reads++
      return 1
    }
  })
  for (const patch of [
    JSON.parse('{"inventory":{"__proto__":{"polluted":true}}}'),
    accessor
  ]) {
    for (const payload of [patch, () => patch]) {
      assert.equal(handleUpdateBand(state, payload), state)
      assert.equal(
        handleUpdateBand(state, createUpdateBandAction(payload).payload),
        state
      )
    }
  }
  assert.equal(reads, 0)
})

test('malformed required band containers preserve their existing values', () => {
  for (const key of [
    'members',
    'inventory',
    'stash',
    'performance',
    'activeContrabandEffects'
  ]) {
    for (const invalid of [
      null,
      12,
      'broken',
      ...(key === 'members' || key === 'activeContrabandEffects' ? [{}] : [[]])
    ]) {
      const state = base()
      const next = handleUpdateBand(state, { [key]: invalid, harmony: 60 })
      assert.equal(next.band[key], state.band[key], key)
      assert.equal(next.band.harmony, 60)
    }
  }
})

test('player and band numeric patches follow load bounds through creators and direct/functional updates', () => {
  for (const [slice, reducer, creator, sanitize, patch] of [
    [
      'player',
      handleUpdatePlayer,
      createUpdatePlayerAction,
      sanitizePlayer,
      {
        clinicVisits: -10,
        passiveFollowers: -3.5,
        score: -4,
        totalTravels: -2,
        eventsTriggeredToday: -2,
        tutorialStep: -8
      }
    ],
    [
      'band',
      handleUpdateBand,
      createUpdateBandAction,
      sanitizeBand,
      { inventorySlots: -20, style: -1, crit: -1, tempo: 150, luck: -10 }
    ]
  ]) {
    for (const wrapped of [false, true]) {
      const state = base()
      const payload = wrapped ? () => patch : patch
      const expected = sanitize({ ...state[slice], ...patch })
      const created = creator(payload).payload
      for (const candidate of [payload, created]) {
        const next = reducer(state, candidate)
        for (const key of Object.keys(patch))
          assert.equal(next[slice][key], expected[key], key)
      }
      const bad = Object.fromEntries(
        Object.keys(patch).map(key => [key, Infinity])
      )
      const next = reducer(state, creator(wrapped ? () => bad : bad).payload)
      for (const key of Object.keys(patch))
        assert.equal(next[slice][key], state[slice][key], key)
    }
  }
})

test('functional numeric patches use current reducer state', () => {
  const state = base()
  const action = createUpdatePlayerAction(prev => ({
    clinicVisits: prev.clinicVisits + 1
  }))
  const first = handleUpdatePlayer(state, action.payload)
  assert.equal(
    handleUpdatePlayer(first, action.payload).player.clinicVisits,
    state.player.clinicVisits + 2
  )
})

const moduleState = (slotType, tier = 3) => ({
  ...base(),
  assets: [
    {
      id: 'bus',
      kind: 'tourbus_chassis',
      chassisFlavor: 'legit',
      chassisTier: tier,
      condition: 100,
      slots: [0, 1].map(i => ({
        id: `slot${i}`,
        slotType,
        installedModuleId: null,
        position: { x: 0, y: 0 }
      }))
    }
  ]
})

test('raw module installs reject fame locks and asset-tier locks without charging', () => {
  const fameState = moduleState('tb_roof')
  fameState.player.fame = 0
  const tierState = moduleState('tb_interior_cabin', 1)
  for (const [state, moduleId] of [
    [fameState, 'tb_solar_panel'],
    [tierState, 'tb_sleeping_bunks']
  ]) {
    const raw = { assetId: 'bus', slotId: 'slot0', moduleId }
    assert.equal(installModule(raw, state).type, 'INSTALL_MODULE_FAILED')
    assert.equal(handleInstallModule(state, raw), state)
  }
})

test('raw module installs reject an exclusivity conflict without charging', () => {
  const state = moduleState('tb_audio')
  const original = structuredClone(MODULE_REGISTRY.tb_roof_rack)
  try {
    MODULE_REGISTRY.tb_roof_rack.exclusiveWithGroup = 'tb_power_hog'
    state.assets[0].slots[1].installedModuleId = 'tb_roof_rack'
    const raw = {
      assetId: 'bus',
      slotId: 'slot0',
      moduleId: 'tb_subwoofer_stack'
    }
    assert.equal(installModule(raw, state).payload.reason, 'EXCLUSIVITY')
    assert.equal(handleInstallModule(state, raw), state)
  } finally {
    MODULE_REGISTRY.tb_roof_rack = original
  }
})

test('module actions queued from one snapshot cannot exceed per-asset cap', () => {
  const state = moduleState('tb_trailer_addon')
  const actions = [0, 1].map(i =>
    installModule(
      { assetId: 'bus', slotId: `slot${i}`, moduleId: 'tb_trailer_merch_box' },
      state
    )
  )
  assert.ok(actions.every(action => action.type === 'INSTALL_MODULE'))
  const first = handleInstallModule(state, actions[0].payload)
  assert.notEqual(first, state)
  assert.equal(handleInstallModule(first, actions[1].payload), first)
})

test('career integer counters use strict non-negative integer normalization', () => {
  for (const value of [-1, 3.8, Infinity, NaN, '4', true]) {
    const next = sanitizeCareerState({
      tourTokens: value,
      completedExpeditionRuns: value
    })
    const expected =
      typeof value === 'number' && Number.isFinite(value)
        ? Math.max(0, Math.floor(value))
        : 0
    assert.equal(next.tourTokens, expected)
    assert.equal(next.completedExpeditionRuns, expected)
  }
})

test('partial performance and member patches preserve required nested containers', () => {
  const state = base()
  const member = state.band.members[0]
  const next = handleUpdateBand(state, {
    performance: { guitarDifficulty: Infinity },
    members: [
      {
        id: member.id,
        traits: null,
        relationships: null,
        baseStats: null,
        equipment: null
      }
    ]
  })
  assert.deepEqual(next.band.performance, state.band.performance)
  const updatedMember = next.band.members[0]
  for (const key of ['traits', 'relationships', 'baseStats', 'equipment']) {
    assert.equal(updatedMember[key], member[key], key)
  }
})
