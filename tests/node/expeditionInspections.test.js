import test from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveExpeditionInspection,
  getConditionBand,
  DIAGNOSTIC_FEE_BASE
} from '../../src/domain/expedition/inspections'
import { handleExecuteExpeditionInspection } from '../../src/context/reducers/expeditionReducer'
import { executeExpeditionInspection } from '../../src/context/expeditionActionCreators'
import { gameReducer } from '../../src/context/gameReducer'
import { createInitialState } from '../../src/context/initialState'

test('Task 8: Expedition Inspections', async t => {
  const createActiveStateWithDefects = (defects = [], overrides = {}) => {
    const { technicalCondition: tcOverrides, ...restOverrides } = overrides
    const state = createInitialState()
    state.runSeed = 12345
    state.player.money = 1500
    state.player.currentNodeId = 'service_node'
    state.player.van = { ...state.player.van, fuel: 50, condition: 100 }
    state.gameMap = {
      nodes: {
        service_node: {
          id: 'service_node',
          type: 'SUPPLY_STOP',
          label: 'Supply Stop',
          layer: 0
        },
        next_node: {
          id: 'next_node',
          type: 'GIG',
          label: 'Gig Venue',
          layer: 1
        }
      },
      connections: [{ from: 'service_node', to: 'next_node', distance: 10 }],
      meta: {
        service_node: { nodeClass: 'supply' }
      }
    }
    state.expedition = {
      ...state.expedition,
      status: 'active',
      routeStep: 2,
      visitedNodeIds: ['service_node'],
      protectedCareerCash: 200,
      loadout: {
        crewIds: [],
        build: {
          selectedTourbusModuleIds: []
        }
      },
      ...restOverrides,
      technicalCondition: {
        pa: 85,
        instruments: 55,
        stageGear: 20,
        defects,
        ...tcOverrides
      }
    }
    return state
  }

  await t.test('getConditionBand maps condition values to bands', () => {
    assert.equal(getConditionBand(100), 'optimal')
    assert.equal(getConditionBand(70), 'optimal')
    assert.equal(getConditionBand(69), 'degraded')
    assert.equal(getConditionBand(40), 'degraded')
    assert.equal(getConditionBand(39), 'critical')
    assert.equal(getConditionBand(1), 'critical')
    assert.equal(getConditionBand(0), 'disabled')
  })

  await t.test(
    'quick_check is free, reveals 0 defects, returns condition bands',
    () => {
      const hidden = {
        id: 'd1',
        group: 'pa',
        severity: 1,
        status: 'hidden',
        source: 'improvise',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 3
      }
      const state = createActiveStateWithDefects([hidden])
      const res = resolveExpeditionInspection(state, {
        mode: 'quick_check',
        expectedRouteStep: 2
      })

      assert.equal(res.ok, true)
      if (res.ok) {
        assert.equal(res.result.mode, 'quick_check')
        assert.equal(res.result.diagnosticFee, 0)
        assert.deepEqual(res.result.revealedDefectIds, [])
        assert.deepEqual(res.result.conditionBands, {
          pa: 'optimal',
          instruments: 'degraded',
          stageGear: 'critical'
        })
      }
    }
  )

  await t.test('crew_inspection fails when no eligible crew is present', () => {
    const state = createActiveStateWithDefects([])
    const res = resolveExpeditionInspection(state, {
      mode: 'crew_inspection',
      expectedRouteStep: 2
    })

    assert.equal(res.ok, false)
    if (!res.ok) {
      assert.equal(res.reason, 'NO_ELIGIBLE_CREW')
    }
  })

  await t.test(
    'crew_inspection succeeds with technician/roadie and reveals one defect',
    () => {
      const defect1 = {
        id: 'd1',
        group: 'pa',
        severity: 1,
        status: 'hidden',
        source: 'improvise',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 3
      }
      const defect2 = {
        id: 'd2',
        group: 'instruments',
        severity: 2,
        status: 'hidden',
        source: 'field_repair',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 3
      }

      const state = createActiveStateWithDefects([defect1, defect2], {
        loadout: {
          crewIds: ['crew_roadie_bob'],
          build: { selectedTourbusModuleIds: [] }
        }
      })

      const res = resolveExpeditionInspection(state, {
        mode: 'crew_inspection',
        crewId: 'crew_roadie_bob',
        expectedRouteStep: 2
      })

      assert.equal(res.ok, true)
      if (res.ok) {
        assert.equal(res.result.mode, 'crew_inspection')
        assert.equal(res.result.diagnosticFee, 0)
        assert.equal(res.result.revealedDefectIds.length, 1)
        assert.equal(res.result.revealedDefectIds[0], 'd1')
      }
    }
  )

  await t.test('module_inspection fails when inspectionLevel is 0', () => {
    const state = createActiveStateWithDefects([])
    const res = resolveExpeditionInspection(state, {
      mode: 'module_inspection',
      expectedRouteStep: 2
    })

    assert.equal(res.ok, false)
    if (!res.ok) {
      assert.equal(res.reason, 'MODULE_INSPECTION_UNAVAILABLE')
    }
  })

  await t.test(
    'module_inspection succeeds with inspectionLevel >= 1 and reveals one defect',
    () => {
      const defect1 = {
        id: 'd1',
        group: 'stageGear',
        severity: 3,
        status: 'hidden',
        source: 'critical_wear',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 3
      }

      // tb_cb_radio_mesh provides inspectionLevel 1
      const state = createActiveStateWithDefects([defect1], {
        loadout: {
          crewIds: [],
          build: { selectedTourbusModuleIds: ['tb_cb_radio_mesh'] }
        }
      })

      const res = resolveExpeditionInspection(state, {
        mode: 'module_inspection',
        expectedRouteStep: 2
      })

      assert.equal(res.ok, true)
      if (res.ok) {
        assert.equal(res.result.mode, 'module_inspection')
        assert.equal(res.result.diagnosticFee, 0)
        assert.equal(res.result.revealedDefectIds.length, 1)
        assert.equal(res.result.revealedDefectIds[0], 'd1')
      }
    }
  )

  await t.test('full_service fails when not at a service location', () => {
    const state = createActiveStateWithDefects([])
    if (state.gameMap?.nodes?.service_node) {
      state.gameMap.nodes.service_node.type = 'ROAD'
    }
    if (state.gameMap?.meta?.service_node) {
      state.gameMap.meta.service_node = { nodeClass: 'transit' }
    }

    const res = resolveExpeditionInspection(state, {
      mode: 'full_service',
      expectedRouteStep: 2
    })

    assert.equal(res.ok, false)
    if (!res.ok) {
      assert.equal(res.reason, 'SERVICE_LOCATION_REQUIRED')
    }
  })

  await t.test(
    'full_service fails when spendable cash is below diagnostic fee',
    () => {
      const state = createActiveStateWithDefects([])
      // money 250, protected 200 -> spendable 50, fee 150
      state.player.money = 250
      state.expedition.protectedCareerCash = 200

      const res = resolveExpeditionInspection(state, {
        mode: 'full_service',
        expectedRouteStep: 2
      })

      assert.equal(res.ok, false)
      if (!res.ok) {
        assert.equal(res.reason, 'INSUFFICIENT_FUNDS')
      }
    }
  )

  await t.test(
    'full_service reveals all hidden defects and charges diagnostic fee',
    () => {
      const defect1 = {
        id: 'd1',
        group: 'pa',
        severity: 1,
        status: 'hidden',
        source: 'improvise',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 3
      }
      const defect2 = {
        id: 'd2',
        group: 'instruments',
        severity: 2,
        status: 'hidden',
        source: 'field_repair',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 3
      }
      const defect3 = {
        id: 'd3',
        group: 'stageGear',
        severity: 1,
        status: 'revealed',
        source: 'critical_wear',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 3
      }

      const state = createActiveStateWithDefects([defect1, defect2, defect3])
      const res = resolveExpeditionInspection(state, {
        mode: 'full_service',
        expectedRouteStep: 2
      })

      assert.equal(res.ok, true)
      if (res.ok) {
        assert.equal(res.result.mode, 'full_service')
        assert.equal(res.result.diagnosticFee, DIAGNOSTIC_FEE_BASE)
        assert.equal(res.result.revealedDefectIds.length, 2)
        assert.ok(res.result.revealedDefectIds.includes('d1'))
        assert.ok(res.result.revealedDefectIds.includes('d2'))
        assert.ok(!res.result.revealedDefectIds.includes('d3')) // already revealed
      }
    }
  )

  await t.test(
    'full_service with optional repairTargetGroup invokes professional repair',
    () => {
      const defect1 = {
        id: 'd1',
        group: 'pa',
        severity: 1,
        status: 'hidden',
        source: 'improvise',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 3
      }
      const state = createActiveStateWithDefects([defect1], {
        technicalCondition: { pa: 60 } // needs 40 restored -> (100 - 60) * 10 = €400 repair fee
      })

      const res = resolveExpeditionInspection(state, {
        mode: 'full_service',
        repairTargetGroup: 'pa',
        expectedRouteStep: 2
      })

      assert.equal(res.ok, true)
      if (res.ok) {
        assert.equal(res.result.diagnosticFee, 150)
        assert.ok(res.result.professionalRepair)
        assert.equal(res.result.professionalRepair.moneyCost, 400)
        assert.equal(res.result.professionalRepair.targetRestore, 40)
        assert.equal(res.result.professionalRepair.resolvesTargetDefects, true)
      }
    }
  )

  await t.test(
    'executeExpeditionInspection handled via gameReducer and respects stale route guard',
    () => {
      const defect1 = {
        id: 'd1',
        group: 'pa',
        severity: 1,
        status: 'hidden',
        source: 'improvise',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 3
      }
      let state = createActiveStateWithDefects([defect1], {
        technicalCondition: { pa: 60 }
      })

      // Stale route step guard
      const staleAction = executeExpeditionInspection(state, {
        mode: 'full_service',
        expectedRouteStep: 1 // state is at 2
      })
      const staleState = gameReducer(state, {
        type: 'EXECUTE_EXPEDITION_INSPECTION',
        payload: { mode: 'full_service', expectedRouteStep: 1 }
      })
      assert.equal(staleState, state)

      // Valid action with repairTargetGroup
      const action = executeExpeditionInspection(state, {
        mode: 'full_service',
        repairTargetGroup: 'pa',
        expectedRouteStep: 2
      })
      assert.ok(action)
      assert.equal(action.type, 'EXECUTE_EXPEDITION_INSPECTION')

      const nextState = gameReducer(state, action)
      assert.notEqual(nextState, state)
      // Money deducted: 1500 - (150 diag + 400 repair) = 950
      assert.equal(nextState.player.money, 950)
      // PA restored to 100
      assert.equal(nextState.expedition.technicalCondition.pa, 100)
      // Defect resolved
      assert.equal(
        nextState.expedition.technicalCondition.defects[0].status,
        'resolved'
      )
    }
  )
})
