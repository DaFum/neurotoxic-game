import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createDeterministicHiddenDefect,
  getVisibleExpeditionDefects,
  evaluateExpeditionDefectTriggers
} from '../../src/domain/expedition/defects'
import {
  handleRevealExpeditionDefect,
  handleTriggerExpeditionDefect,
  handleResolveExpeditionDefect
} from '../../src/context/reducers/expeditionReducer'
import {
  revealExpeditionDefect,
  triggerExpeditionDefect,
  resolveExpeditionDefect
} from '../../src/context/expeditionActionCreators'
import { gameReducer } from '../../src/context/gameReducer'
import { createInitialState } from '../../src/context/initialState'

test('Task 7: Hidden-Defect Lifecycle', async t => {
  const createActiveStateWithDefects = (defects = [], tcOverrides = {}) => {
    const state = createInitialState()
    state.runSeed = 424242
    state.expedition = {
      ...state.expedition,
      status: 'active',
      routeStep: 2,
      technicalCondition: {
        pa: 100,
        instruments: 100,
        stageGear: 100,
        defects,
        ...tcOverrides
      }
    }
    return state
  }

  await t.test(
    'createDeterministicHiddenDefect produces stable deterministic defects',
    () => {
      const defect1 = createDeterministicHiddenDefect(
        424242,
        'pa',
        'improvise',
        2,
        1
      )
      const defect2 = createDeterministicHiddenDefect(
        424242,
        'pa',
        'improvise',
        2,
        1
      )

      assert.equal(defect1.id, defect2.id)
      assert.equal(defect1.group, 'pa')
      assert.equal(defect1.source, 'improvise')
      assert.equal(defect1.createdAtRouteStep, 2)
      assert.equal(defect1.severity, 1)
      assert.equal(defect1.status, 'hidden')
      assert.ok(
        ['post_travel', 'pre_gig', 'post_gig'].includes(defect1.triggerAt)
      )
    }
  )

  await t.test(
    'REVEAL_EXPEDITION_DEFECT transitions status from hidden to revealed',
    () => {
      const defect = createDeterministicHiddenDefect(
        424242,
        'pa',
        'improvise',
        2,
        1
      )
      const state = createActiveStateWithDefects([defect])

      const nextState = handleRevealExpeditionDefect(state, {
        defectId: defect.id,
        expectedRouteStep: 2
      })

      assert.notEqual(nextState, state)
      const updated = nextState.expedition.technicalCondition.defects.find(
        d => d.id === defect.id
      )
      assert.equal(updated?.status, 'revealed')

      // Stale route step guard
      const staleState = handleRevealExpeditionDefect(state, {
        defectId: defect.id,
        expectedRouteStep: 1 // state is at 2
      })
      assert.equal(staleState, state)
    }
  )

  await t.test(
    'TRIGGER_EXPEDITION_DEFECT applies severity damage to condition group',
    () => {
      // Severity 1: -8
      const defect1 = {
        id: 'd1',
        group: 'pa',
        severity: 1,
        status: 'revealed',
        source: 'improvise',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 2
      }
      const state1 = createActiveStateWithDefects([defect1], { pa: 50 })
      const triggered1 = handleTriggerExpeditionDefect(state1, {
        defectId: 'd1',
        trigger: 'pre_gig',
        expectedRouteStep: 2
      })
      assert.equal(triggered1.expedition.technicalCondition.pa, 42) // 50 - 8
      assert.equal(
        triggered1.expedition.technicalCondition.defects[0].status,
        'triggered'
      )

      // Severity 2: -15
      const defect2 = {
        id: 'd2',
        group: 'instruments',
        severity: 2,
        status: 'hidden',
        source: 'field_repair',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 2
      }
      const state2 = createActiveStateWithDefects([defect2], {
        instruments: 50
      })
      const triggered2 = handleTriggerExpeditionDefect(state2, {
        defectId: 'd2',
        trigger: 'pre_gig',
        expectedRouteStep: 2
      })
      assert.equal(triggered2.expedition.technicalCondition.instruments, 35) // 50 - 15
      assert.equal(
        triggered2.expedition.technicalCondition.defects[0].status,
        'triggered'
      )

      // Severity 3: -25 and clamps to 0
      const defect3 = {
        id: 'd3',
        group: 'stageGear',
        severity: 3,
        status: 'hidden',
        source: 'critical_wear',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 2
      }
      const state3 = createActiveStateWithDefects([defect3], { stageGear: 20 })
      const triggered3 = handleTriggerExpeditionDefect(state3, {
        defectId: 'd3',
        trigger: 'pre_gig',
        expectedRouteStep: 2
      })
      assert.equal(triggered3.expedition.technicalCondition.stageGear, 0) // clamped 0
      assert.equal(
        triggered3.expedition.technicalCondition.defects[0].status,
        'triggered'
      )
    }
  )

  await t.test(
    'RESOLVE_EXPEDITION_DEFECT marks revealed/triggered defects as resolved',
    () => {
      const defect = {
        id: 'd1',
        group: 'pa',
        severity: 1,
        status: 'triggered',
        source: 'improvise',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 2
      }
      const state = createActiveStateWithDefects([defect])

      const nextState = handleResolveExpeditionDefect(state, {
        defectId: 'd1',
        expectedRouteStep: 2
      })

      assert.equal(
        nextState.expedition.technicalCondition.defects[0].status,
        'resolved'
      )
    }
  )

  await t.test(
    'evaluateExpeditionDefectTriggers automatically triggers matching defects',
    () => {
      const pendingDefect = {
        id: 'd_pending',
        group: 'pa',
        severity: 1,
        status: 'hidden',
        source: 'improvise',
        createdAtRouteStep: 1,
        triggerAt: 'post_travel',
        triggerRouteStep: 2
      }
      const futureDefect = {
        id: 'd_future',
        group: 'instruments',
        severity: 2,
        status: 'hidden',
        source: 'field_repair',
        createdAtRouteStep: 1,
        triggerAt: 'post_travel',
        triggerRouteStep: 3 // not yet
      }

      const state = createActiveStateWithDefects(
        [pendingDefect, futureDefect],
        {
          pa: 100,
          instruments: 100
        }
      )
      const evaluated = evaluateExpeditionDefectTriggers(state, 'post_travel')

      // d_pending triggers: pa 100 -> 92
      assert.equal(evaluated.expedition.technicalCondition.pa, 92)
      assert.equal(
        evaluated.expedition.technicalCondition.defects.find(
          d => d.id === 'd_pending'
        )?.status,
        'triggered'
      )

      // d_future stays hidden: instruments stays 100
      assert.equal(evaluated.expedition.technicalCondition.instruments, 100)
      assert.equal(
        evaluated.expedition.technicalCondition.defects.find(
          d => d.id === 'd_future'
        )?.status,
        'hidden'
      )
    }
  )

  await t.test(
    'getVisibleExpeditionDefects strictly hides unrevealed defects to prevent visual/ARIA leaks',
    () => {
      const hidden = {
        id: 'secret_leak',
        group: 'pa',
        severity: 3,
        status: 'hidden',
        source: 'improvise',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 2
      }
      const revealed = {
        id: 'known_defect',
        group: 'instruments',
        severity: 1,
        status: 'revealed',
        source: 'field_repair',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 2
      }
      const resolved = {
        id: 'fixed_defect',
        group: 'stageGear',
        severity: 2,
        status: 'resolved',
        source: 'critical_wear',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 2
      }

      const state = createActiveStateWithDefects([hidden, revealed, resolved])
      const visible = getVisibleExpeditionDefects(state)

      assert.equal(visible.length, 1)
      assert.equal(visible[0].id, 'known_defect')
      assert.equal(
        visible.some(d => d.id === 'secret_leak'),
        false
      )
      assert.equal(
        visible.some(d => d.id === 'fixed_defect'),
        false
      )
    }
  )

  await t.test(
    'reveal, trigger, and resolve action creators build valid actions handled by gameReducer',
    () => {
      const defect = {
        id: 'defect_pa_test',
        group: 'pa',
        severity: 2,
        status: 'hidden',
        source: 'field_repair',
        createdAtRouteStep: 1,
        triggerAt: 'pre_gig',
        triggerRouteStep: 2
      }
      let state = createActiveStateWithDefects([defect], { pa: 80 })

      // 1. revealExpeditionDefect
      const revealAction = revealExpeditionDefect(
        state,
        'defect_pa_test'
      )
      assert.ok(revealAction)
      assert.equal(revealAction.type, 'REVEAL_EXPEDITION_DEFECT')
      state = gameReducer(state, revealAction)
      assert.equal(
        state.expedition.technicalCondition.defects[0].status,
        'revealed'
      )

      // 2. triggerExpeditionDefect
      const triggerAction = triggerExpeditionDefect(
        state,
        'defect_pa_test',
        'pre_gig'
      )
      assert.ok(triggerAction)
      assert.equal(triggerAction.type, 'TRIGGER_EXPEDITION_DEFECT')
      state = gameReducer(state, triggerAction)
      assert.equal(
        state.expedition.technicalCondition.defects[0].status,
        'triggered'
      )
      assert.equal(state.expedition.technicalCondition.pa, 65) // 80 - 15

      // 3. resolveExpeditionDefect
      const resolveAction = resolveExpeditionDefect(
        state,
        'defect_pa_test'
      )
      assert.ok(resolveAction)
      assert.equal(resolveAction.type, 'RESOLVE_EXPEDITION_DEFECT')
      state = gameReducer(state, resolveAction)
      assert.equal(
        state.expedition.technicalCondition.defects[0].status,
        'resolved'
      )
    }
  )
})
