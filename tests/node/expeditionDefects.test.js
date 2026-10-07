import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyExpeditionDefectResolution,
  applyExpeditionDefectReveal,
  applyExpeditionDefectTrigger,
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
import { sanitizeExpeditionState } from '../../src/context/reducers/expeditionSanitizers'
import { startedState } from '../expeditionLifecycleFixture.js'
import { DIAGNOSTIC_FEE_BASE } from '../../src/domain/expedition/inspections'

test('Task 7: Hidden-Defect Lifecycle', async t => {
  const createActiveStateWithDefects = (defects = [], tcOverrides = {}) => {
    const state = createInitialState()
    state.runSeed = 424242
    state.expedition = {
      ...state.expedition,
      status: 'active',
      routeStep: 2,
      // A committed roadie makes the free crew inspection available, the
      // canonical source a reveal is authorised by.
      loadout: { ...state.expedition.loadout, crewIds: ['crew_roadie_bob'] },
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
        source: { mode: 'crew_inspection' },
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
        source: { mode: 'crew_inspection' },
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
        repair: {
          mode: 'cannibalize',
          targetGroup: 'pa',
          sourceGroup: 'instruments'
        },
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
    'the three lifecycle transitions are single domain functions the handlers and sweep share',
    () => {
      const defect = {
        id: 'd_shared',
        group: 'pa',
        severity: 2,
        status: 'hidden',
        source: 'field_repair',
        createdAtRouteStep: 1,
        triggerAt: 'post_travel',
        triggerRouteStep: 2
      }
      const state = createActiveStateWithDefects([defect], { pa: 60 })
      const tc = state.expedition.technicalCondition

      // Reveal: hidden -> revealed; anything else is refused.
      const revealed = applyExpeditionDefectReveal(tc, 'd_shared')
      assert.equal(revealed?.defects[0].status, 'revealed')
      assert.equal(applyExpeditionDefectReveal(revealed, 'd_shared'), null)
      assert.equal(applyExpeditionDefectReveal(tc, 'missing'), null)
      assert.deepEqual(
        handleRevealExpeditionDefect(state, {
          defectId: 'd_shared',
          source: { mode: 'crew_inspection' },
          expectedRouteStep: 2
        }).expedition.technicalCondition,
        revealed
      )

      // Trigger: severity damage applied once; a triggered defect is refused.
      const triggered = applyExpeditionDefectTrigger(tc, 'd_shared')
      assert.equal(triggered?.pa, 45)
      assert.equal(triggered?.defects[0].status, 'triggered')
      assert.equal(applyExpeditionDefectTrigger(triggered, 'd_shared'), null)
      assert.deepEqual(
        handleTriggerExpeditionDefect(state, {
          defectId: 'd_shared',
          trigger: 'post_travel',
          expectedRouteStep: 2
        }).expedition.technicalCondition,
        triggered
      )
      assert.deepEqual(
        evaluateExpeditionDefectTriggers(state, 'post_travel').expedition
          .technicalCondition,
        triggered
      )

      // Resolve: any unresolved status -> resolved; resolved is refused.
      const resolved = applyExpeditionDefectResolution(triggered, 'd_shared')
      assert.equal(resolved?.defects[0].status, 'resolved')
      assert.equal(resolved?.pa, 45)
      assert.equal(applyExpeditionDefectResolution(resolved, 'd_shared'), null)
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
      const revealAction = revealExpeditionDefect(state, 'defect_pa_test', {
        mode: 'crew_inspection'
      })
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
      const resolveAction = resolveExpeditionDefect(state, 'defect_pa_test', {
        mode: 'cannibalize',
        targetGroup: 'pa',
        sourceGroup: 'instruments'
      })
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

test('defect reducers refuse raw dispatches the inspection/repair paths would refuse', async t => {
  const makeDefect = (id, overrides = {}) => ({
    id,
    group: 'pa',
    severity: 1,
    status: 'hidden',
    source: 'improvise',
    createdAtRouteStep: 1,
    triggerAt: 'pre_gig',
    triggerRouteStep: 2,
    ...overrides
  })
  // No committed crew, no inspection module, no service location: only the
  // free paths a test opts into are available.
  const buildState = (defects, { atService = false, crew = false } = {}) => {
    const state = createInitialState()
    state.runSeed = 424242
    state.player.money = 1500
    if (atService) {
      state.player.currentNodeId = 'service_node'
      state.gameMap = {
        nodes: {
          service_node: {
            id: 'service_node',
            type: 'SUPPLY_STOP',
            label: 'Supply Stop',
            layer: 0
          }
        },
        connections: []
      }
    }
    state.expedition = {
      ...state.expedition,
      status: 'active',
      routeStep: 2,
      protectedCareerCash: 0,
      visitedNodeIds: atService ? ['service_node'] : [],
      loadout: {
        ...state.expedition.loadout,
        crewIds: crew ? ['crew_roadie_bob'] : [],
        build: { selectedTourbusModuleIds: [] }
      },
      technicalCondition: {
        pa: 60,
        instruments: 100,
        stageGear: 100,
        defects
      }
    }
    state.band = {
      ...state.band,
      members: state.band.members.map(member => ({ ...member, role: 'band' }))
    }
    return state
  }
  const statusOf = (state, id) =>
    state.expedition.technicalCondition.defects.find(d => d.id === id)?.status

  await t.test('a reveal without an inspection source is refused', () => {
    const state = buildState([makeDefect('d1')], { crew: true })
    for (const payload of [
      { defectId: 'd1', expectedRouteStep: 2 },
      { defectId: 'd1', source: null, expectedRouteStep: 2 },
      { defectId: 'd1', source: 'crew_inspection', expectedRouteStep: 2 },
      { defectId: 'd1', source: { mode: 'bogus' }, expectedRouteStep: 2 },
      { defectId: 'd1', source: { mode: 'quick_check' }, expectedRouteStep: 2 },
      { defectId: 7, source: { mode: 'crew_inspection' }, expectedRouteStep: 2 }
    ]) {
      assert.equal(handleRevealExpeditionDefect(state, payload), state)
    }
  })

  await t.test('a reveal needs the inspection gate the UI path checks', () => {
    // No eligible crew, no inspection module, not at a service location.
    const state = buildState([makeDefect('d1')])
    for (const mode of [
      'crew_inspection',
      'module_inspection',
      'full_service'
    ]) {
      assert.equal(
        handleRevealExpeditionDefect(state, {
          defectId: 'd1',
          source: { mode },
          expectedRouteStep: 2
        }),
        state,
        mode
      )
    }
  })

  await t.test('a reveal the inspection would not produce is refused', () => {
    // An untrained crew finds only the first hidden defect.
    const state = buildState(
      [
        makeDefect('d1'),
        makeDefect('d2'),
        makeDefect('d3', { status: 'revealed' })
      ],
      { crew: true }
    )
    for (const defectId of ['d2', 'd3', 'missing']) {
      assert.equal(
        handleRevealExpeditionDefect(state, {
          defectId,
          source: { mode: 'crew_inspection' },
          expectedRouteStep: 2
        }),
        state,
        defectId
      )
    }
    const revealed = handleRevealExpeditionDefect(state, {
      defectId: 'd1',
      source: { mode: 'crew_inspection' },
      expectedRouteStep: 2
    })
    assert.equal(statusOf(revealed, 'd1'), 'revealed')
    assert.equal(statusOf(revealed, 'd2'), 'hidden')
  })

  await t.test(
    'a full-service reveal charges the diagnostic fee and nothing else',
    () => {
      const state = buildState([makeDefect('d1')], { atService: true })
      const next = handleRevealExpeditionDefect(state, {
        defectId: 'd1',
        // A smuggled repair target must not turn the reveal into a repair.
        source: { mode: 'full_service', repairTargetGroup: 'pa' },
        expectedRouteStep: 2
      })
      assert.equal(statusOf(next, 'd1'), 'revealed')
      assert.equal(next.player.money, 1500 - DIAGNOSTIC_FEE_BASE)
      assert.equal(next.expedition.technicalCondition.pa, 60)

      const broke = buildState([makeDefect('d1')], { atService: true })
      broke.player.money = DIAGNOSTIC_FEE_BASE - 1
      assert.equal(
        handleRevealExpeditionDefect(broke, {
          defectId: 'd1',
          source: { mode: 'full_service' },
          expectedRouteStep: 2
        }),
        broke
      )
    }
  )

  await t.test('a resolve without a resolving repair is refused', () => {
    const state = buildState([makeDefect('d1', { status: 'revealed' })])
    for (const payload of [
      { defectId: 'd1', expectedRouteStep: 2 },
      { defectId: 'd1', repair: null, expectedRouteStep: 2 },
      { defectId: 'd1', repair: 'professional', expectedRouteStep: 2 },
      // Improvise never resolves a defect.
      {
        defectId: 'd1',
        repair: { mode: 'improvise', targetGroup: 'pa' },
        expectedRouteStep: 2
      },
      // A repair on another group does not touch this defect.
      {
        defectId: 'd1',
        repair: {
          mode: 'cannibalize',
          targetGroup: 'stageGear',
          sourceGroup: 'instruments'
        },
        expectedRouteStep: 2
      },
      // Professional repair needs a service location.
      {
        defectId: 'd1',
        repair: { mode: 'professional', targetGroup: 'pa' },
        expectedRouteStep: 2
      }
    ]) {
      assert.equal(handleResolveExpeditionDefect(state, payload), state)
    }
  })

  await t.test('a hidden or already resolved defect cannot be resolved', () => {
    const cannibalize = {
      mode: 'cannibalize',
      targetGroup: 'pa',
      sourceGroup: 'instruments'
    }
    for (const status of ['hidden', 'resolved']) {
      const state = buildState([makeDefect('d1', { status })])
      assert.equal(
        handleResolveExpeditionDefect(state, {
          defectId: 'd1',
          repair: cannibalize,
          expectedRouteStep: 2
        }),
        state,
        status
      )
    }
  })

  await t.test('a professional resolve charges the repair cost', () => {
    const state = buildState([makeDefect('d1', { status: 'triggered' })], {
      atService: true
    })
    const next = handleResolveExpeditionDefect(state, {
      defectId: 'd1',
      repair: { mode: 'professional', targetGroup: 'pa' },
      expectedRouteStep: 2
    })
    assert.equal(statusOf(next, 'd1'), 'resolved')
    // (100 - 60) * 10 at the default repair multiplier.
    assert.equal(next.player.money, 1100)
    assert.equal(next.expedition.technicalCondition.pa, 100)
  })

  await t.test(
    'a trigger must name a valid boundary the defect is due at',
    () => {
      const state = buildState([
        makeDefect('due', { triggerAt: 'pre_gig', triggerRouteStep: 2 }),
        makeDefect('later', { triggerAt: 'pre_gig', triggerRouteStep: 3 })
      ])
      for (const payload of [
        { defectId: 'due', expectedRouteStep: 2 },
        { defectId: 'due', trigger: 'bogus', expectedRouteStep: 2 },
        { defectId: 'due', trigger: 'post_gig', expectedRouteStep: 2 },
        { defectId: 'later', trigger: 'pre_gig', expectedRouteStep: 2 }
      ]) {
        assert.equal(handleTriggerExpeditionDefect(state, payload), state)
      }
      const triggered = handleTriggerExpeditionDefect(state, {
        defectId: 'due',
        trigger: 'pre_gig',
        expectedRouteStep: 2
      })
      assert.equal(statusOf(triggered, 'due'), 'triggered')
      assert.equal(triggered.expedition.technicalCondition.pa, 52)
    }
  )

  await t.test(
    'throwing payload getters are refused without being read',
    () => {
      let reads = 0
      const withThrowingGetter = (record, key) =>
        Object.defineProperty(record, key, {
          enumerable: true,
          get() {
            reads += 1
            throw new Error(`hostile ${key} getter`)
          }
        })
      const hiddenState = buildState([makeDefect('d1')], { crew: true })
      const knownState = buildState([makeDefect('d1', { status: 'revealed' })])
      const cases = [
        [
          'reveal defectId',
          handleRevealExpeditionDefect,
          hiddenState,
          withThrowingGetter(
            { source: { mode: 'crew_inspection' }, expectedRouteStep: 2 },
            'defectId'
          )
        ],
        [
          'reveal expectedRouteStep',
          handleRevealExpeditionDefect,
          hiddenState,
          withThrowingGetter(
            { defectId: 'd1', source: { mode: 'crew_inspection' } },
            'expectedRouteStep'
          )
        ],
        [
          'reveal source.mode',
          handleRevealExpeditionDefect,
          hiddenState,
          {
            defectId: 'd1',
            source: withThrowingGetter({}, 'mode'),
            expectedRouteStep: 2
          }
        ],
        [
          'resolve repair.mode',
          handleResolveExpeditionDefect,
          knownState,
          {
            defectId: 'd1',
            repair: withThrowingGetter({ targetGroup: 'pa' }, 'mode'),
            expectedRouteStep: 2
          }
        ],
        [
          'trigger trigger',
          handleTriggerExpeditionDefect,
          hiddenState,
          withThrowingGetter(
            { defectId: 'd1', expectedRouteStep: 2 },
            'trigger'
          )
        ]
      ]
      for (const [label, handler, state, payload] of cases) {
        assert.equal(handler(state, payload), state, label)
      }
      assert.equal(reads, 0)
    }
  )

  await t.test(
    'creators carry only the authorising source and repair fields',
    () => {
      const state = buildState([makeDefect('d1')])
      const reveal = revealExpeditionDefect(state, 'd1', {
        mode: 'full_service',
        crewId: 'crew_roadie_bob',
        repairTargetGroup: 'pa'
      })
      assert.deepEqual(reveal.payload, {
        defectId: 'd1',
        source: { mode: 'full_service', crewId: 'crew_roadie_bob' },
        expectedRouteStep: 2
      })
      const resolve = resolveExpeditionDefect(state, 'd1', {
        mode: 'cannibalize',
        targetGroup: 'pa',
        sourceGroup: 'instruments',
        expectedRouteStep: 99
      })
      assert.deepEqual(resolve.payload, {
        defectId: 'd1',
        repair: {
          mode: 'cannibalize',
          targetGroup: 'pa',
          sourceGroup: 'instruments'
        },
        expectedRouteStep: 2
      })
    }
  )
})

test('hydration keeps only the first defect for a duplicated id', () => {
  // Every transition looks a defect up by id, so a second copy could never be
  // revealed, triggered or resolved and would stay pending for the whole run.
  const base = startedState()
  const raw = structuredClone(base.expedition)
  const defect = createDeterministicHiddenDefect(
    base.runSeed,
    'pa',
    'improvise',
    1,
    1
  )
  raw.technicalCondition = {
    pa: 90,
    instruments: 100,
    stageGear: 100,
    defects: [
      { ...defect, id: 'dup', group: 'instruments', severity: 7 },
      { ...defect, id: 'dup', status: 'revealed' },
      { ...defect, id: 'other' },
      { ...defect, id: 'dup', status: 'resolved' }
    ]
  }

  const { defects } = sanitizeExpeditionState(
    raw,
    base.runSeed
  ).technicalCondition
  // The malformed first entry is dropped, so the first *valid* one wins.
  assert.deepEqual(
    defects.map(d => [d.id, d.status]),
    [
      ['dup', 'revealed'],
      ['other', 'hidden']
    ]
  )
})
