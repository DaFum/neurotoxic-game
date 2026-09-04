import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveExpeditionRepair } from '../../src/domain/expedition/repairs'
import { handleExecuteExpeditionRepair } from '../../src/context/reducers/expeditionReducer'
import { executeExpeditionRepair } from '../../src/context/expeditionActionCreators'
import { gameReducer } from '../../src/context/gameReducer'
import { createInitialState } from '../../src/context/initialState'

test('Task 6: Expedition Repair Modes Registry and Pure Resolver', async t => {
  const createActiveExpeditionState = (overrides = {}) => {
    const state = createInitialState()
    state.player.money = 2000
    state.expedition = {
      ...state.expedition,
      status: 'active',
      routeStep: 3,
      visitedNodeIds: ['node_1'],
      protectedCareerCash: 500,
      cargo: {
        spareParts: 2,
        supplies: 1,
        technicalGearItemIds: [],
        merch: [],
        contraband: []
      },
      technicalCondition: {
        pa: 30,
        instruments: 70,
        stageGear: 80,
        defects: []
      },
      ...overrides
    }
    return state
  }

  await t.test(
    'Field repair: restores condition according to minigame quality and consumes 1 spare part',
    () => {
      const state = createActiveExpeditionState()

      // High quality (>= 0.45) does not create hidden defect
      const highQualityRes = resolveExpeditionRepair(state, {
        mode: 'field',
        targetGroup: 'pa',
        quality: 0.8,
        expectedRouteStep: 3
      })
      assert.equal(highQualityRes.ok, true)
      if (highQualityRes.ok) {
        assert.equal(highQualityRes.result.sparePartsCost, 1)
        assert.equal(highQualityRes.result.moneyCost, 0)
        assert.equal(highQualityRes.result.sourceDamage, 0)
        assert.equal(highQualityRes.result.createsHiddenDefect, false)
        assert.equal(highQualityRes.result.resolvesTargetDefects, false)
        // rawRestore = 20 + 0.8 * 35 = 48 -> restore = 48
        assert.equal(highQualityRes.result.targetRestore, 48)
      }

      // Low quality (< 0.45) creates hidden defect
      const lowQualityRes = resolveExpeditionRepair(state, {
        mode: 'field',
        targetGroup: 'pa',
        quality: 0.2,
        expectedRouteStep: 3
      })
      assert.equal(lowQualityRes.ok, true)
      if (lowQualityRes.ok) {
        assert.equal(lowQualityRes.result.createsHiddenDefect, true)
        // rawRestore = 20 + 0.2 * 35 = 27
        assert.equal(lowQualityRes.result.targetRestore, 27)
      }

      // Fails when no spare parts available
      const noPartsState = createActiveExpeditionState({
        cargo: {
          spareParts: 0,
          supplies: 0,
          technicalGearItemIds: [],
          merch: [],
          contraband: []
        }
      })
      const noPartsRes = resolveExpeditionRepair(noPartsState, {
        mode: 'field',
        targetGroup: 'pa',
        quality: 0.8,
        expectedRouteStep: 3
      })
      assert.equal(noPartsRes.ok, false)
    }
  )

  await t.test(
    'Professional repair: restores target to 100 and prices by missing condition at service locations',
    () => {
      const state = createActiveExpeditionState()

      // Service available: prices (100 - 30) * €10 = €700
      const res = resolveExpeditionRepair(
        state,
        {
          mode: 'professional',
          targetGroup: 'pa',
          expectedRouteStep: 3
        },
        { serviceAvailable: true }
      )

      assert.equal(res.ok, true)
      if (res.ok) {
        assert.equal(res.result.moneyCost, 700)
        assert.equal(res.result.sparePartsCost, 0)
        assert.equal(res.result.targetRestore, 70) // 30 + 70 = 100
        assert.equal(res.result.resolvesTargetDefects, true)
        assert.equal(res.result.createsHiddenDefect, false)
      }

      // Service unavailable: rejected
      const unavailRes = resolveExpeditionRepair(
        state,
        {
          mode: 'professional',
          targetGroup: 'pa',
          expectedRouteStep: 3
        },
        { serviceAvailable: false }
      )
      assert.equal(unavailRes.ok, false)

      // Insufficient spendable cash: player has 600 total, 500 protected = 100 spendable, repair costs 700
      const poorState = createActiveExpeditionState()
      poorState.player.money = 600
      const poorRes = resolveExpeditionRepair(
        poorState,
        {
          mode: 'professional',
          targetGroup: 'pa',
          expectedRouteStep: 3
        },
        { serviceAvailable: true }
      )
      assert.equal(poorRes.ok, false)
    }
  )

  await t.test(
    'Improvise repair: free emergency restore capped at 45 that always creates a hidden defect',
    () => {
      const state = createActiveExpeditionState()
      // PA is 30 (< 50)
      const res = resolveExpeditionRepair(state, {
        mode: 'improvise',
        targetGroup: 'pa',
        expectedRouteStep: 3
      })
      assert.equal(res.ok, true)
      if (res.ok) {
        assert.equal(res.result.moneyCost, 0)
        assert.equal(res.result.sparePartsCost, 0)
        // 30 + 20 = 50, but capped at 45 -> restore = 15 (resulting condition: 45)
        assert.equal(res.result.targetRestore, 15)
        assert.equal(res.result.createsHiddenDefect, true)
        assert.equal(res.result.resolvesTargetDefects, false)
      }

      // Rejected when target condition >= 50
      const highState = createActiveExpeditionState({
        technicalCondition: {
          pa: 60,
          instruments: 70,
          stageGear: 80,
          defects: []
        }
      })
      const highRes = resolveExpeditionRepair(highState, {
        mode: 'improvise',
        targetGroup: 'pa',
        expectedRouteStep: 3
      })
      assert.equal(highRes.ok, false)
    }
  )

  await t.test(
    'Cannibalize repair: sacrifices 15 points from source (>= 55) to restore +25 capped at 60',
    () => {
      const state = createActiveExpeditionState()
      // Target: PA (30), Source: Instruments (70 >= 55)
      const res = resolveExpeditionRepair(state, {
        mode: 'cannibalize',
        targetGroup: 'pa',
        sourceGroup: 'instruments',
        expectedRouteStep: 3
      })
      assert.equal(res.ok, true)
      if (res.ok) {
        assert.equal(res.result.sourceDamage, 15)
        // 30 + 25 = 55 (below cap of 60) -> restore = 25
        assert.equal(res.result.targetRestore, 25)
        assert.equal(res.result.moneyCost, 0)
        assert.equal(res.result.sparePartsCost, 0)
        assert.equal(res.result.resolvesTargetDefects, true)
        assert.equal(res.result.createsHiddenDefect, false)
      }

      // Target: PA (45) -> +25 would reach 70, capped at 60 -> restore = 15
      const nearCapState = createActiveExpeditionState({
        technicalCondition: {
          pa: 45,
          instruments: 70,
          stageGear: 80,
          defects: []
        }
      })
      const nearCapRes = resolveExpeditionRepair(nearCapState, {
        mode: 'cannibalize',
        targetGroup: 'pa',
        sourceGroup: 'instruments',
        expectedRouteStep: 3
      })
      assert.equal(nearCapRes.ok, true)
      if (nearCapRes.ok) {
        assert.equal(nearCapRes.result.targetRestore, 15)
      }

      // Fails when source condition < 55
      const lowSourceState = createActiveExpeditionState({
        technicalCondition: {
          pa: 20,
          instruments: 50, // < 55
          stageGear: 80,
          defects: []
        }
      })
      const lowSourceRes = resolveExpeditionRepair(lowSourceState, {
        mode: 'cannibalize',
        targetGroup: 'pa',
        sourceGroup: 'instruments',
        expectedRouteStep: 3
      })
      assert.equal(lowSourceRes.ok, false)

      // Fails when source === target
      const sameGroupRes = resolveExpeditionRepair(state, {
        mode: 'cannibalize',
        targetGroup: 'pa',
        sourceGroup: 'pa',
        expectedRouteStep: 3
      })
      assert.equal(sameGroupRes.ok, false)
    }
  )

  await t.test(
    'Reducer authority: handleExecuteExpeditionRepair enforces authoritative execution',
    () => {
      const state = createActiveExpeditionState()

      // 1. Valid field repair
      const nextState = handleExecuteExpeditionRepair(state, {
        mode: 'field',
        targetGroup: 'pa',
        quality: 0.5,
        expectedRouteStep: 3
      })
      assert.notEqual(nextState, state)
      assert.equal(nextState.expedition.cargo?.spareParts, 1) // 2 - 1
      assert.ok(nextState.expedition.technicalCondition.pa > 30)

      // 2. Stale expectedRouteStep is rejected (identical reference returned)
      const staleState = handleExecuteExpeditionRepair(state, {
        mode: 'field',
        targetGroup: 'pa',
        quality: 0.5,
        expectedRouteStep: 2 // state is at 3
      })
      assert.equal(staleState, state)

      // 3. Forged caller-supplied values are ignored
      const forgedState = handleExecuteExpeditionRepair(state, {
        mode: 'field',
        targetGroup: 'pa',
        quality: 0.5,
        expectedRouteStep: 3,
        // Hostile injected fields:
        sparePartsCost: 0,
        targetRestore: 999
      })
      assert.equal(forgedState.expedition.cargo?.spareParts, 1) // still deducted 1
      assert.ok(forgedState.expedition.technicalCondition.pa <= 100)
    }
  )

  await t.test(
    'Condition-0 recovery paths for field, professional, and cannibalize',
    () => {
      // Condition-0 PA
      const zeroPAState = createActiveExpeditionState({
        technicalCondition: {
          pa: 0,
          instruments: 70,
          stageGear: 70,
          defects: []
        }
      })

      // Recovery 1: Field repair restores PA > 0
      const fieldRecovered = handleExecuteExpeditionRepair(zeroPAState, {
        mode: 'field',
        targetGroup: 'pa',
        quality: 0.6,
        expectedRouteStep: 3
      })
      assert.ok(fieldRecovered.expedition.technicalCondition.pa > 0)

      // Recovery 2: Cannibalize restores PA > 0
      const cannibalizeRecovered = handleExecuteExpeditionRepair(zeroPAState, {
        mode: 'cannibalize',
        targetGroup: 'pa',
        sourceGroup: 'instruments',
        expectedRouteStep: 3
      })
      assert.equal(cannibalizeRecovered.expedition.technicalCondition.pa, 25)
      assert.equal(
        cannibalizeRecovered.expedition.technicalCondition.instruments,
        55
      )

      // Recovery 3: Professional restores PA to 100
      // (mock SUPPLY_STOP on gameMap)
      zeroPAState.gameMap = {
        nodes: {
          node_1: {
            id: 'node_1',
            type: 'SUPPLY_STOP',
            label: 'Supply Stop',
            layer: 3
          }
        }
      }
      const proRecovered = handleExecuteExpeditionRepair(zeroPAState, {
        mode: 'professional',
        targetGroup: 'pa',
        expectedRouteStep: 3
      })
      assert.equal(proRecovered.expedition.technicalCondition.pa, 100)
    }
  )

  await t.test(
    'executeExpeditionRepair action creator builds typed action handled by gameReducer',
    () => {
      const state = createActiveExpeditionState()
      const action = executeExpeditionRepair(state, {
        mode: 'field',
        targetGroup: 'pa',
        quality: 0.7,
        expectedRouteStep: 3
      })

      assert.ok(action)
      assert.equal(action.type, 'EXECUTE_EXPEDITION_REPAIR')
      assert.equal(action.payload.mode, 'field')
      assert.equal(action.payload.targetGroup, 'pa')
      assert.equal(action.payload.expectedRouteStep, 3)

      const nextState = gameReducer(state, action)
      assert.equal(nextState.expedition.cargo?.spareParts, 1)
      assert.ok(nextState.expedition.technicalCondition.pa > 30)
    }
  )
})
