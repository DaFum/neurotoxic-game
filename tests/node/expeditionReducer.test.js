/**
 * @fileoverview Expedition run lifecycle reducer authority.
 *
 * The Expedition slice must never become a second map/run seed owner: the root
 * `GameState.runSeed` stays canonical. These suites start from deliberately
 * mismatched fixture data so a regression that reintroduces an Expedition-local
 * seed, or lets a caller author a transition, fails here instead of shipping.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../../src/context/initialState'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { prepareExpeditionRun } from '../../src/context/expeditionActionCreators'
import { createDefaultExpeditionState } from '../../src/domain/expedition/defaults'
import { nextSeed } from '../../src/utils/seededRng'
import { CHASSIS_CONFIG } from '../../src/utils/assetConfig'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry'
import {
  sanitizeExpeditionIntelMap,
  sanitizeExpeditionState
} from '../../src/context/reducers/expeditionSanitizers'

// A real roof-slot module, read from the registry rather than hardcoded so a
// retuned module id does not silently turn the freeze assertions into no-ops.
const FIRST_TOURBUS_MODULE_ID = Object.keys(MODULE_REGISTRY).find(
  id => MODULE_REGISTRY[id]?.slotType === 'tb_roof'
)

const prepareAction = (prepId, runSeed) => ({
  type: ActionTypes.PREPARE_EXPEDITION_RUN,
  payload: { prepId, runSeed }
})

describe('expedition default state', () => {
  it('starts idle with no run identity', () => {
    const state = createInitialState()
    assert.equal(state.expedition.status, 'idle')
    assert.equal(state.expedition.prep, null)
    assert.equal(state.expedition.runId, null)
    assert.equal(state.expedition.loadout, null)
    assert.equal(state.expedition.outcome, null)
    assert.deepEqual(state.expedition.rewardLedger, [])
  })

  it('declares no expedition-local run seed', () => {
    const state = createInitialState()
    assert.equal(
      Object.hasOwn(state.expedition, 'runSeed'),
      false,
      'expedition must not own a seed — GameState.runSeed is canonical'
    )
    assert.equal(
      Object.hasOwn(createDefaultExpeditionState(), 'runSeed'),
      false
    )
  })

  it('gives every fresh state its own nested collections', () => {
    const a = createInitialState()
    const b = createInitialState()
    assert.notEqual(a.expedition, b.expedition)
    assert.notEqual(a.expedition.rewardLedger, b.expedition.rewardLedger)
    a.expedition.rewardLedger.push({ id: 'leak' })
    assert.equal(b.expedition.rewardLedger.length, 0)
  })

  it('keys node intel on a null-prototype record', () => {
    const state = createInitialState()
    assert.equal(Object.getPrototypeOf(state.expedition.intelByNodeId), null)
  })
})

describe('PREPARE_EXPEDITION_RUN', () => {
  it('claims the root run seed atomically with the prepared status', () => {
    const state = createInitialState()
    state.runSeed = 111
    const next = gameReducer(state, prepareAction('prep-1', 4242))

    assert.equal(next.runSeed, 4242)
    assert.equal(next.expedition.status, 'prepared')
    assert.deepEqual(next.expedition.prep, { prepId: 'prep-1' })
    // Run identity is only claimed at START; PREPARE stays edit-only.
    assert.equal(next.expedition.runId, null)
  })

  it('derives a deterministic, persistable seed in the creator', () => {
    const state = createInitialState()
    state.runSeed = 987654
    const action = prepareExpeditionRun(state)

    assert.equal(action.type, ActionTypes.PREPARE_EXPEDITION_RUN)
    assert.equal(action.payload.runSeed, nextSeed(987654))
    assert.equal(typeof action.payload.prepId, 'string')
    assert.ok(action.payload.prepId.length > 0)
    // Same input seed, same next seed: a reported run reproduces its map.
    assert.equal(prepareExpeditionRun(state).payload.runSeed, nextSeed(987654))
    assert.ok(Number.isInteger(action.payload.runSeed))
    assert.ok(action.payload.runSeed >= 0)
    assert.ok(action.payload.runSeed <= 0xffffffff)
  })

  it('clears stale run residue from a previous finalized run', () => {
    const state = createInitialState()
    state.expedition = {
      ...createDefaultExpeditionState(),
      visitedNodeIds: ['node_stale'],
      rewardLedger: [{ id: 'stale' }],
      extractionWindowsSeen: [3]
    }
    const next = gameReducer(state, prepareAction('prep-2', 7))

    assert.deepEqual(next.expedition.visitedNodeIds, [])
    assert.deepEqual(next.expedition.rewardLedger, [])
    assert.deepEqual(next.expedition.extractionWindowsSeen, [])
  })

  it('returns the identical state reference for a second PREPARE', () => {
    const state = createInitialState()
    const prepared = gameReducer(state, prepareAction('prep-1', 555))
    for (const status of [
      'prepared',
      'active',
      'extracted',
      'completed',
      'failed'
    ]) {
      const source = {
        ...prepared,
        expedition: { ...prepared.expedition, status }
      }
      const again = gameReducer(source, prepareAction('prep-2', 999))
      assert.equal(again, source, `${status} must not accept a re-PREPARE`)
      assert.equal(again.runSeed, 555, `${status} must not reroll the seed`)
    }
  })

  it('rejects a malformed prep id or seed without touching state', () => {
    const state = createInitialState()
    state.runSeed = 111
    const rejected = [
      prepareAction('', 5),
      prepareAction(42, 5),
      prepareAction('prep', Number.NaN),
      prepareAction('prep', Number.POSITIVE_INFINITY),
      prepareAction('prep', -1),
      prepareAction('prep', 1.5),
      prepareAction('prep', 0x1_0000_0000),
      prepareAction('prep', '5'),
      { type: ActionTypes.PREPARE_EXPEDITION_RUN, payload: null }
    ]
    for (const action of rejected) {
      const next = gameReducer(state, action)
      assert.equal(next, state, `rejected payload must return the same state`)
      assert.equal(next.runSeed, 111)
    }
  })

  it('accepts the boundary seed values of the UInt32 range', () => {
    const state = createInitialState()
    for (const seed of [0, 0xffffffff]) {
      const next = gameReducer(state, prepareAction('prep', seed))
      assert.equal(next.runSeed, seed)
      assert.equal(next.expedition.status, 'prepared')
    }
  })
})

describe('sanitizeExpeditionState', () => {
  const activeSave = () => ({
    status: 'active',
    prep: { prepId: 'run_1' },
    runId: 'run_1',
    routeStep: 4,
    visitedNodeIds: ['exp_0_0', 'exp_1_0', 'exp_1_0'],
    intelByNodeId: { n2: 1, n3: 2 },
    intelGrants: [],
    scoutReconUsedRouteSteps: [2, 2, 3],
    loadout: {
      tourTypeId: 'standard_tour',
      regionId: 'industrial_belt',
      build: { protectedCareerCash: 300 }
    },
    startingMoney: 1000,
    startingFame: 50,
    protectedCareerCash: 300,
    rewardLedger: [],
    extractionWindowsSeen: [3],
    pendingFailure: null,
    outcome: null
  })

  it('resumes a consistent active run', () => {
    const sanitized = sanitizeExpeditionState(activeSave())
    assert.equal(sanitized.status, 'active')
    assert.equal(sanitized.runId, 'run_1')
    assert.equal(sanitized.routeStep, 4)
    assert.deepEqual(sanitized.visitedNodeIds, ['exp_0_0', 'exp_1_0'])
    assert.deepEqual(sanitized.scoutReconUsedRouteSteps, [2, 3])
    assert.equal(sanitized.loadout?.tourTypeId, 'standard_tour')
  })

  it('collapses to idle when an active run has no committed build', () => {
    const save = activeSave()
    save.loadout = null
    const sanitized = sanitizeExpeditionState(save)
    assert.equal(sanitized.status, 'idle')
    assert.equal(sanitized.runId, null)
  })

  it('collapses to idle when an active run has no run id', () => {
    const save = activeSave()
    save.runId = null
    assert.equal(sanitizeExpeditionState(save).status, 'idle')
  })

  it('collapses a terminal status whose outcome does not match the run', () => {
    const save = activeSave()
    save.status = 'extracted'
    save.outcome = {
      runId: 'other_run',
      kind: 'extracted',
      finalizedAtRouteStep: 4,
      settlement: {}
    }
    assert.equal(sanitizeExpeditionState(save).status, 'idle')

    save.outcome.runId = 'run_1'
    save.outcome.kind = 'failed'
    assert.equal(
      sanitizeExpeditionState(save).status,
      'idle',
      'outcome kind must match the terminal status'
    )
  })

  it('requires a failure reason on a failed outcome', () => {
    const save = activeSave()
    save.status = 'failed'
    save.outcome = {
      runId: 'run_1',
      kind: 'failed',
      reason: null,
      finalizedAtRouteStep: 5,
      settlement: {}
    }
    assert.equal(sanitizeExpeditionState(save).status, 'idle')

    save.outcome.reason = 'fuel_stranded'
    const sanitized = sanitizeExpeditionState(save)
    assert.equal(sanitized.status, 'failed')
    assert.equal(sanitized.outcome?.reason, 'fuel_stranded')
  })

  it('derives the protected slice from the committed build, not a loose field', () => {
    const save = activeSave()
    // A hostile save raising the loose field must not widen the protected
    // slice past what the build actually committed.
    save.protectedCareerCash = 999999
    assert.equal(sanitizeExpeditionState(save).protectedCareerCash, 300)
  })

  it('rejects unknown statuses and coerced numerics', () => {
    assert.equal(sanitizeExpeditionState({ status: 'winning' }).status, 'idle')

    const save = activeSave()
    save.routeStep = '9'
    save.startingMoney = true
    save.startingFame = [50]
    const sanitized = sanitizeExpeditionState(save)
    assert.equal(sanitized.routeStep, 0)
    assert.equal(sanitized.startingMoney, 0)
    assert.equal(sanitized.startingFame, 0)
  })

  it('rejects non-finite numerics rather than clamping them', () => {
    const save = activeSave()
    save.routeStep = Number.NaN
    save.startingMoney = Number.POSITIVE_INFINITY
    const sanitized = sanitizeExpeditionState(save)
    assert.equal(sanitized.routeStep, 0)
    assert.equal(sanitized.startingMoney, 0)
  })

  it('strips forbidden keys from the intel map', () => {
    const hostile = JSON.parse(
      '{"__proto__": 2, "constructor": 1, "prototype": 1, "n9": 2}'
    )
    const sanitized = sanitizeExpeditionIntelMap(hostile)
    assert.equal(Object.hasOwn(sanitized, '__proto__'), false)
    assert.equal(Object.hasOwn(sanitized, 'constructor'), false)
    assert.equal(Object.hasOwn(sanitized, 'prototype'), false)
    assert.equal(sanitized.n9, 2)
    assert.equal(Object.getPrototypeOf(sanitized), null)
  })

  it('drops illegal intel levels', () => {
    const sanitized = sanitizeExpeditionIntelMap({
      a: 3,
      b: -1,
      c: 1.5,
      d: '2',
      e: 0
    })
    assert.deepEqual(Object.keys(sanitized), ['e'])
  })

  it('drops a crisis with no legal recovery choice', () => {
    const save = activeSave()
    save.pendingFailure = {
      id: 'crisis_1',
      reason: 'fuel_stranded',
      sourceId: 'node_3',
      raisedAtRouteStep: 4,
      choices: []
    }
    assert.equal(sanitizeExpeditionState(save).pendingFailure, null)

    save.pendingFailure.choices = ['refuel', 'accept_failure', 'teleport']
    const sanitized = sanitizeExpeditionState(save)
    assert.deepEqual(sanitized.pendingFailure?.choices, [
      'refuel',
      'accept_failure'
    ])
  })

  it('drops duplicate ledger and grant ids', () => {
    const save = activeSave()
    save.visitedNodeIds = ['exp_1_0']
    const entry = {
      id: 'reward_route_merch_crate::exp_1_0',
      rewardDefinitionId: 'reward_route_merch_crate',
      sourceType: 'route_rare',
      sourceId: 'exp_1_0',
      secured: false,
      earnedAtRouteStep: 1,
      materialized: false
    }
    save.rewardLedger = [entry, { ...entry }]
    save.intelGrants = [
      {
        id: 'grant_1',
        source: 'social',
        sourceProofId: 'proof_1',
        nodeId: 'n5',
        targetLevel: 1
      },
      {
        id: 'grant_1',
        source: 'contact',
        sourceProofId: 'proof_2',
        nodeId: 'n6',
        targetLevel: 2
      }
    ]
    const sanitized = sanitizeExpeditionState(save)
    assert.equal(sanitized.rewardLedger.length, 1)
    assert.equal(sanitized.intelGrants.length, 1)
    assert.equal(sanitized.intelGrants[0]?.source, 'social')
  })

  it('drops a grant with no canonical source proof', () => {
    const save = activeSave()
    save.intelGrants = [
      { id: 'grant_1', source: 'social', nodeId: 'n5', targetLevel: 1 },
      {
        id: 'grant_2',
        source: 'rumor',
        sourceProofId: 'proof',
        nodeId: 'n5',
        targetLevel: 1
      },
      {
        id: 'grant_3',
        source: 'social',
        sourceProofId: 'proof',
        nodeId: 'n5',
        targetLevel: 0
      }
    ]
    assert.deepEqual(sanitizeExpeditionState(save).intelGrants, [])
  })

  it('returns the idle default for a non-object payload', () => {
    for (const value of [null, undefined, 42, 'active', []]) {
      assert.equal(sanitizeExpeditionState(value).status, 'idle')
    }
  })
})

describe('committed identity freeze while active', () => {
  const activeState = overrides => {
    const state = createInitialState()
    state.setlist = [{ id: 'song_a' }, { id: 'song_b' }]
    state.player.money = 100000
    const tier = CHASSIS_CONFIG.tourbus_chassis.legit[1]
    state.assets = [
      {
        id: 'asset_bus',
        kind: 'tourbus_chassis',
        chassisFlavor: 'legit',
        chassisTier: 1,
        condition: 90,
        baseUpkeep: tier.upkeep,
        baseDailyRevenue: tier.revenue,
        slots: [
          {
            id: 'slot_1',
            slotType: 'tb_roof',
            position: { x: 0.5, y: 0.2 },
            installedModuleId: null
          }
        ],
        acquiredOnDay: 2,
        acquisitionMode: 'cash',
        baseRiskEventChance: tier.baseRiskEventChance
      },
      {
        id: 'asset_spare',
        kind: 'tourbus_chassis',
        chassisFlavor: 'legit',
        chassisTier: 1,
        condition: 90,
        baseUpkeep: tier.upkeep,
        baseDailyRevenue: tier.revenue,
        slots: [
          {
            id: 'slot_2',
            slotType: 'tb_roof',
            position: { x: 0.5, y: 0.2 },
            installedModuleId: null
          }
        ],
        acquiredOnDay: 2,
        acquisitionMode: 'cash',
        baseRiskEventChance: tier.baseRiskEventChance
      }
    ]
    state.expedition = {
      ...createDefaultExpeditionState(),
      status: 'active',
      runId: 'run_1',
      loadout: {
        tourTypeId: 'standard_tour',
        regionId: 'industrial_belt',
        activeTourbusAssetId: 'asset_bus',
        crewIds: [],
        cargo: { spareParts: 0, supplies: 0 },
        starterPerkId: null,
        nativeContracts: [],
        insurancePolicyId: null,
        pressureModifierIds: [],
        build: {
          setlistSongIds: ['song_a', 'song_b'],
          equipment: { selectedGearItemIds: [] },
          selectedTourbusModuleIds: [],
          merch: [],
          contraband: [],
          sponsorOfferId: null,
          startingFuelTarget: 100,
          protectedCareerCash: 0
        }
      },
      ...overrides
    }
    return state
  }

  const installModule = assetId => ({
    type: ActionTypes.INSTALL_MODULE,
    payload: {
      assetId,
      slotId: assetId === 'asset_bus' ? 'slot_1' : 'slot_2',
      moduleId: FIRST_TOURBUS_MODULE_ID,
      newSlotIds: []
    }
  })

  it('rejects a setlist that drifts from the commitment', () => {
    const state = activeState()
    const next = gameReducer(state, {
      type: ActionTypes.SET_SETLIST,
      payload: [{ id: 'song_c' }]
    })
    assert.equal(next, state)
    assert.deepEqual(next.setlist, [{ id: 'song_a' }, { id: 'song_b' }])
  })

  it('rejects a reordered setlist', () => {
    const state = activeState()
    const next = gameReducer(state, {
      type: ActionTypes.SET_SETLIST,
      payload: [{ id: 'song_b' }, { id: 'song_a' }]
    })
    assert.equal(next, state)
  })

  it('accepts an identical setlist so a replay is a no-op, not a rejection', () => {
    const state = activeState()
    const next = gameReducer(state, {
      type: ActionTypes.SET_SETLIST,
      payload: ['song_a', 'song_b']
    })
    // Contents alone cannot tell accept from reject here, since the stored
    // setlist already matches: the fresh reference is what proves the
    // committed-setlist guard let the replay through.
    assert.notEqual(next, state)
    assert.deepEqual(next.setlist, [{ id: 'song_a' }, { id: 'song_b' }])
  })

  it('leaves the setlist editable outside an active run', () => {
    for (const status of [
      'idle',
      'prepared',
      'extracted',
      'completed',
      'failed'
    ]) {
      const state = activeState({ status })
      const next = gameReducer(state, {
        type: ActionTypes.SET_SETLIST,
        payload: [{ id: 'song_c' }]
      })
      assert.deepEqual(next.setlist, [{ id: 'song_c' }], `status ${status}`)
    }
  })

  it('rejects a module install on the committed chassis', () => {
    const state = activeState()
    const next = gameReducer(state, installModule('asset_bus'))
    assert.equal(next, state)
    assert.equal(next.player.money, 100000)
  })

  it('rejects a module removal on the committed chassis', () => {
    const state = activeState()
    state.assets[0].slots[0].installedModuleId = FIRST_TOURBUS_MODULE_ID
    const next = gameReducer(state, {
      type: ActionTypes.REMOVE_MODULE,
      payload: { assetId: 'asset_bus', slotId: 'slot_1' }
    })
    assert.equal(next, state)
    assert.equal(
      next.assets[0].slots[0].installedModuleId,
      FIRST_TOURBUS_MODULE_ID
    )
  })

  it('still allows servicing an asset the run did not commit', () => {
    const state = activeState()
    const next = gameReducer(state, installModule('asset_spare'))
    assert.notEqual(next, state)
    const spare = next.assets.find(asset => asset.id === 'asset_spare')
    assert.equal(spare?.slots[0]?.installedModuleId, FIRST_TOURBUS_MODULE_ID)
  })

  it('leaves module changes open when no chassis was committed', () => {
    const state = activeState()
    state.expedition.loadout.activeTourbusAssetId = null
    const next = gameReducer(state, installModule('asset_bus'))
    assert.notEqual(next, state)
  })
})

describe('persisted reward entries cannot be authored by a save', () => {
  const saveWithLedger = rewardLedger => ({
    status: 'active',
    prep: { prepId: 'run_1' },
    runId: 'run_1',
    routeStep: 4,
    visitedNodeIds: ['exp_0_0', 'exp_1_0', 'exp_2_0', 'exp_3_0'],
    loadout: {
      tourTypeId: 'standard_tour',
      regionId: 'industrial_belt',
      build: { protectedCareerCash: 0 }
    },
    rewardLedger
  })

  const canonicalEntry = (overrides = {}) => ({
    id: 'reward_route_merch_crate::exp_1_0',
    rewardDefinitionId: 'reward_route_merch_crate',
    sourceType: 'route_rare',
    sourceId: 'exp_1_0',
    secured: false,
    earnedAtRouteStep: 1,
    materialized: false,
    ...overrides
  })

  it('accepts a well-formed canonical entry', () => {
    const sanitized = sanitizeExpeditionState(
      saveWithLedger([canonicalEntry()])
    )
    assert.equal(sanitized.rewardLedger.length, 1)
    assert.equal(sanitized.rewardLedger[0]?.secured, false)
  })

  it('re-derives a save-claimed secured flag from the definition', () => {
    // The attack the review named: an unsecured route rare claiming to be
    // secured would survive a failure and then be granted at settlement.
    const sanitized = sanitizeExpeditionState(
      saveWithLedger([canonicalEntry({ secured: true })])
    )
    assert.equal(sanitized.rewardLedger[0]?.secured, false)
  })

  it('re-derives a save-claimed source family from the definition', () => {
    const sanitized = sanitizeExpeditionState(
      saveWithLedger([canonicalEntry({ sourceType: 'contract' })])
    )
    assert.equal(sanitized.rewardLedger[0]?.sourceType, 'route_rare')
  })

  it('drops a reward id the registry does not know', () => {
    const sanitized = sanitizeExpeditionState(
      saveWithLedger([
        canonicalEntry({
          id: 'reward_invented::exp_3_0',
          rewardDefinitionId: 'reward_invented'
        })
      ])
    )
    assert.deepEqual(sanitized.rewardLedger, [])
  })

  it('drops an entry whose id the reducer could not have produced', () => {
    // The derived `<definition>::<source>` key is what the duplicate check
    // keys on, so a forged id could otherwise smuggle a second row.
    for (const id of [
      'forged',
      'reward_route_merch_crate::other_node',
      'reward_route_vinyl_stash::exp_3_0'
    ]) {
      const sanitized = sanitizeExpeditionState(
        saveWithLedger([canonicalEntry({ id })])
      )
      assert.deepEqual(sanitized.rewardLedger, [], id)
    }
  })

  it('keeps a persisted materialized flag, so a reward is never paid twice', () => {
    const sanitized = sanitizeExpeditionState(
      saveWithLedger([canonicalEntry({ materialized: true })])
    )
    assert.equal(sanitized.rewardLedger[0]?.materialized, true)
  })
})
