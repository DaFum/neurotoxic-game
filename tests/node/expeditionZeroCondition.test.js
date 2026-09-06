/**
 * @fileoverview Test suite for Task 10: Zero-Condition Recovery & Softlock Prevention.
 *
 * Verifies recovery controls (field, pro, cannibalize, insurance, accept_failure),
 * softlock prevention, getTechnicalFailureSignal behavior, PreGig start blocking,
 * and failure creation without premature termination.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { canStartExpeditionPreGig } from '../../src/domain/expedition/condition.ts'
import {
  getAvailableTechnicalRecoveryControls,
  getTechnicalFailureSignal,
  hasLegalTechnicalRecovery,
  syncExpeditionPendingFailure
} from '../../src/domain/expedition/failure.ts'
import {
  acceptExpeditionFailure,
  acceptExpeditionTechnicalFailure,
  executeExpeditionRepair,
  resolveExpeditionCrisis
} from '../../src/context/expeditionActionCreators.ts'
import {
  startedState,
  walkTo
} from '../expeditionLifecycleFixture.js'

const createZeroConditionState = (overrides = {}) => {
  const base = startedState()
  const active = walkTo(base, 1)
  active.expedition.cargo = {
    spareParts: 0,
    supplies: 0,
    technicalGearItemIds: [],
    merch: [],
    contraband: []
  }
  active.expedition.technicalCondition = {
    pa: 0,
    instruments: 40,
    stageGear: 40,
    defects: []
  }
  active.player.money = 100
  active.expedition.loadout.build.protectedCareerCash = 100 // spendable cash = 0
  active.expedition.insurancePolicyId = null
  active.expedition.insuranceClaimConsumed = false
  active.expedition.claimConsumed = false

  if (overrides.spareParts !== undefined) {
    active.expedition.cargo.spareParts = overrides.spareParts
  }
  if (overrides.technicalCondition) {
    active.expedition.technicalCondition = {
      ...active.expedition.technicalCondition,
      ...overrides.technicalCondition
    }
  }
  if (overrides.money !== undefined) {
    active.player.money = overrides.money
  }
  if (overrides.insurancePolicyId !== undefined) {
    active.expedition.insurancePolicyId = overrides.insurancePolicyId
  }
  if (overrides.serviceLocation) {
    active.gameMap = {
      nodes: {
        [active.player.currentNodeId]: {
          id: active.player.currentNodeId,
          type: 'SUPPLY_STOP',
          label: 'Service Stop'
        }
      },
      meta: {}
    }
  }

  return active
}

describe('Task 10: Technical Recovery Controls & Eligibility', () => {
  it('reports all controls disabled except acceptTechnicalFailure when resources are empty', () => {
    const state = createZeroConditionState()
    const controls = getAvailableTechnicalRecoveryControls(state, 'pa')

    assert.equal(controls.fieldRepair, false)
    assert.equal(controls.professionalRepair, false)
    assert.equal(controls.cannibalize, false)
    assert.equal(controls.insuranceClaim, false)
    assert.equal(controls.salvageRights, false)
    assert.equal(controls.acceptTechnicalFailure, true)

    assert.equal(hasLegalTechnicalRecovery(state, 'pa'), false)
  })

  it('enables fieldRepair control when spare parts >= 1', () => {
    const state = createZeroConditionState({ spareParts: 1 })
    const controls = getAvailableTechnicalRecoveryControls(state, 'pa')

    assert.equal(controls.fieldRepair, true)
    assert.equal(hasLegalTechnicalRecovery(state, 'pa'), true)
  })

  it('enables professionalRepair control at service location with spendable cash', () => {
    const state = createZeroConditionState({
      serviceLocation: true,
      money: 1500 // 100 protected + 1400 spendable >= (100-0)*10 = 1000
    })
    const controls = getAvailableTechnicalRecoveryControls(state, 'pa')

    assert.equal(controls.professionalRepair, true)
    assert.equal(hasLegalTechnicalRecovery(state, 'pa'), true)
  })

  it('enables cannibalize control when another group has condition >= 55', () => {
    const state = createZeroConditionState({
      technicalCondition: { pa: 0, instruments: 60, stageGear: 40 }
    })
    const controls = getAvailableTechnicalRecoveryControls(state, 'pa')

    assert.equal(controls.cannibalize, true)
    assert.equal(hasLegalTechnicalRecovery(state, 'pa'), true)
  })

  it('enables insuranceClaim control when unconsumed policy covers technical', () => {
    const state = createZeroConditionState({
      insurancePolicyId: 'equipment'
    })
    const controls = getAvailableTechnicalRecoveryControls(state, 'pa')

    assert.equal(controls.insuranceClaim, true)
    assert.equal(hasLegalTechnicalRecovery(state, 'pa'), true)
  })
})

describe('Task 10: getTechnicalFailureSignal Derivation', () => {
  it('returns null when all technical condition groups are above zero', () => {
    const state = createZeroConditionState({
      technicalCondition: { pa: 70, instruments: 70, stageGear: 70 }
    })
    assert.equal(getTechnicalFailureSignal(state), null)
  })

  it('returns null when a group is at 0 but legal recovery is available and failure not accepted', () => {
    const state = createZeroConditionState({ spareParts: 2 })
    // Has spare parts -> legal recovery exists -> no premature crisis dialog
    assert.equal(getTechnicalFailureSignal(state), null)
  })

  it('returns technical_shutdown signal when a group is at 0 and NO legal recovery exists', () => {
    const state = createZeroConditionState()
    const signal = getTechnicalFailureSignal(state)

    assert.ok(signal)
    assert.equal(signal.reason, 'technical_shutdown')
    assert.equal(signal.sourceId, 'pa')
    assert.ok(signal.choices.includes('accept_failure'))
  })

  it('returns technical_shutdown signal when player explicitly accepts technical failure even if recovery exists', () => {
    const state = createZeroConditionState({ spareParts: 2 })
    state.expedition.technicalFailureAccepted = true

    const signal = getTechnicalFailureSignal(state)
    assert.ok(signal)
    assert.equal(signal.reason, 'technical_shutdown')
    assert.equal(signal.sourceId, 'pa')
    assert.ok(signal.choices.includes('accept_failure'))
  })
})

describe('Task 10: PreGig Start Blocking & Unblocking', () => {
  it('allows gig start when all condition groups are healthy', () => {
    const state = createZeroConditionState({
      technicalCondition: { pa: 80, instruments: 80, stageGear: 80 }
    })
    assert.equal(canStartExpeditionPreGig(state), true)
  })

  it('blocks gig start when a condition group is disabled', () => {
    const state = createZeroConditionState({ spareParts: 1 })
    // Group PA is 0 -> start is blocked while recovery controls are enabled
    assert.equal(canStartExpeditionPreGig(state), false)
  })

  it('unblocks gig start once field repair restores the disabled group', () => {
    const state = createZeroConditionState({ spareParts: 1 })
    assert.equal(canStartExpeditionPreGig(state), false)

    // Execute field repair
    const repairAction = executeExpeditionRepair(state, {
      mode: 'field',
      targetGroup: 'pa',
      quality: 0.8,
      expectedRouteStep: state.expedition.routeStep
    })
    assert.ok(repairAction)

    const nextState = gameReducer(state, repairAction)
    assert.ok(nextState.expedition.technicalCondition.pa > 0)
    assert.equal(canStartExpeditionPreGig(nextState), true)
  })
})

describe('Task 10: Explicit Technical Failure & Terminal Settlement', () => {
  it('acceptExpeditionTechnicalFailure creates G1 technical_shutdown PendingFailure', () => {
    const state = createZeroConditionState({ spareParts: 1 })
    // With spare parts, pendingFailure is initially null
    assert.equal(state.expedition.pendingFailure, null)

    const action = acceptExpeditionTechnicalFailure(state)
    assert.ok(action)
    assert.equal(action.type, ActionTypes.ACCEPT_EXPEDITION_TECHNICAL_FAILURE)

    const nextState = gameReducer(state, action)
    assert.equal(nextState.expedition.technicalFailureAccepted, true)
    assert.ok(nextState.expedition.pendingFailure)
    assert.equal(
      nextState.expedition.pendingFailure.reason,
      'technical_shutdown'
    )
    assert.equal(nextState.expedition.pendingFailure.sourceId, 'pa')
  })

  it('acceptExpeditionFailure finalizes run with reason: technical_shutdown', () => {
    const state = createZeroConditionState()
    // No recovery -> pendingFailure is automatically derived
    const stateWithPending = syncExpeditionPendingFailure(state)
    assert.ok(stateWithPending.expedition.pendingFailure)
    assert.equal(
      stateWithPending.expedition.pendingFailure.reason,
      'technical_shutdown'
    )

    const acceptAction = acceptExpeditionFailure(stateWithPending)
    assert.ok(acceptAction)

    const terminalState = gameReducer(stateWithPending, acceptAction)
    assert.equal(terminalState.expedition.status, 'failed')
    assert.ok(terminalState.expedition.outcome)
    assert.equal(terminalState.expedition.outcome.kind, 'failed')
    assert.equal(terminalState.expedition.outcome.reason, 'technical_shutdown')
  })

  it('insurance_claim resolves technical_shutdown crisis and restores group to 25', () => {
    const state = createZeroConditionState({
      insurancePolicyId: 'equipment'
    })
    state.expedition.technicalFailureAccepted = true
    const stateWithCrisis = syncExpeditionPendingFailure(state)
    assert.ok(stateWithCrisis.expedition.pendingFailure)
    assert.equal(
      stateWithCrisis.expedition.pendingFailure.reason,
      'technical_shutdown'
    )

    const resolveAction = resolveExpeditionCrisis(
      stateWithCrisis,
      'insurance_claim'
    )
    assert.ok(resolveAction)

    const recoveredState = gameReducer(stateWithCrisis, resolveAction)
    assert.equal(recoveredState.expedition.technicalCondition.pa, 25)
    assert.equal(recoveredState.expedition.insuranceClaimConsumed, true)
    assert.equal(recoveredState.expedition.pendingFailure, null)
    assert.equal(canStartExpeditionPreGig(recoveredState), true)
  })
})
