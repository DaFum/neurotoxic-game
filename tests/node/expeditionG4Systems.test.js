import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialState } from '../../src/context/initialState.ts'
import { buildPreparedExpeditionSponsorOffers } from '../../src/domain/expedition/sponsors.ts'
import {
  applyExpeditionPressureDelta,
  derivePressureDirectorContext,
  selectPressureEvent
} from '../../src/domain/expedition/pressure.ts'
import { EXPEDITION_SOCIAL_RESULTS } from '../../src/domain/expedition/social.ts'
import { EXPEDITION_PRESSURE_EVENTS } from '../../src/data/expedition/pressureEvents.ts'
import {
  getAuthorityCrisisSignal,
  getAvailableAuthoritySafeExits
} from '../../src/domain/expedition/authority.ts'
import {
  rehydrateRivalBand,
  selectExpeditionRivalForRun
} from '../../src/domain/expedition/rivals.ts'
import {
  createExpeditionExtractionQuestEvent,
  createExpeditionFinaleQuestEvent,
  createExpeditionNodeResolvedQuestEvent,
  createExpeditionRivalOutcomeQuestEvent
} from '../../src/quests/producers/expeditionQuestEvents.ts'
import { buildExpeditionMap } from '../../src/domain/expedition/map.ts'
import { NEUTRAL_EXPEDITION_ROUTE_PROFILE } from '../../src/domain/expedition/defaults.ts'
import {
  getAvailableNativeContractTemplateIds,
  getAvailableSponsorOfferIds
} from '../../src/domain/expedition/loadout.ts'
import { materializeCommittedContracts } from '../../src/domain/expedition/contracts.ts'
import {
  doubleDownExpeditionObligation,
  offerExpeditionDraft,
  recordExpeditionObligationSignal,
  selectExpeditionDraft
} from '../../src/context/expeditionActionCreators.ts'

const activeState = () => {
  const initialState = createInitialState()
  return {
    ...initialState,
    runSeed: 123,
    expedition: { ...initialState.expedition, status: 'active', runId: 'run-1' }
  }
}

test('staged sponsor offers are deterministic and side-effect free', () => {
  const state = activeState()
  const before = JSON.stringify(state)
  assert.deepEqual(
    buildPreparedExpeditionSponsorOffers(state),
    buildPreparedExpeditionSponsorOffers(state)
  )
  assert.equal(JSON.stringify(state), before)
})

test('pressure director consumes all nine bounded inputs with neutral G4 fame expectation', () => {
  const context = derivePressureDirectorContext(activeState())
  assert.deepEqual(Object.keys(context).sort(), [
    'activeObligationPressure',
    'cashPressure',
    'crewStressPressure',
    'exposure',
    'fameExpectationPressure',
    'heat',
    'rivalPressure',
    'routeDepthPressure',
    'technicalConditionPressure'
  ])
  assert.equal(context.fameExpectationPressure, 0)
})

test('pressure event selection is deterministic and observes severe relief', () => {
  const state = activeState()
  const events = [
    {
      id: 'a',
      severity: 'severe',
      pressureFamily: 'authority',
      baseWeight: 2,
      negative: true
    },
    {
      id: 'b',
      severity: 'normal',
      pressureFamily: 'social',
      baseWeight: 2,
      negative: false
    }
  ]
  assert.deepEqual(
    selectPressureEvent(state, events),
    selectPressureEvent(state, events)
  )
})

test('social registry gives real sponsor, rival, intel, and hype consequences', () => {
  assert.ok(
    Object.values(EXPEDITION_SOCIAL_RESULTS).some(
      result => result.sponsorInterest !== 0
    )
  )
  assert.ok(
    Object.values(EXPEDITION_SOCIAL_RESULTS).some(
      result => result.rivalPressure !== 0
    )
  )
  assert.ok(
    Object.values(EXPEDITION_SOCIAL_RESULTS).some(
      result => result.intelTargetLevel !== null
    )
  )
  assert.ok(
    Object.values(EXPEDITION_SOCIAL_RESULTS).some(
      result => result.crowdHype !== 0
    )
  )
  assert.equal(EXPEDITION_SOCIAL_RESULTS.weaponize.requiresRival, true)
})

test('authority exports only a source-derived G1B crisis seam', () => {
  const state = activeState()
  state.expedition.pressure.heat = 90
  state.player.money = 0
  state.player.van.fuel = 0
  state.expedition.activeObligations = [
    {
      id: 'a',
      sourceType: 'native',
      sourceId: 'a',
      constraints: [],
      progressByConstraintId: {},
      status: 'active',
      settled: false,
      doubleDown: null
    },
    {
      id: 'b',
      sourceType: 'native',
      sourceId: 'b',
      constraints: [],
      progressByConstraintId: {},
      status: 'active',
      settled: false,
      doubleDown: null
    }
  ]
  assert.deepEqual(getAuthorityCrisisSignal(state), {
    sourceId: 'authority:run-1:0',
    expectedRouteStep: 0
  })
  assert.deepEqual(getAvailableAuthoritySafeExits(state), [])
})

test('rival selection and quest/event seams are deterministic production data', () => {
  const state = activeState()
  const map = buildExpeditionMap(
    state.runSeed,
    'standard_tour',
    'industrial_belt',
    NEUTRAL_EXPEDITION_ROUTE_PROFILE
  )
  assert.deepEqual(
    selectExpeditionRivalForRun(state, map, NEUTRAL_EXPEDITION_ROUTE_PROFILE),
    selectExpeditionRivalForRun(state, map, NEUTRAL_EXPEDITION_ROUTE_PROFILE)
  )
  assert.ok(
    EXPEDITION_PRESSURE_EVENTS.some(event => event.severity === 'severe')
  )
  assert.equal(
    createExpeditionFinaleQuestEvent('illegal_show', true).type,
    'expedition.finaleCompleted'
  )
  const record = selectExpeditionRivalForRun(
    state,
    map,
    NEUTRAL_EXPEDITION_ROUTE_PROFILE
  )?.record
  if (record) assert.equal(rehydrateRivalBand(record).id, record.snapshot.id)
  assert.equal(
    createExpeditionNodeResolvedQuestEvent('n').type,
    'expedition.nodeResolved'
  )
  assert.equal(
    createExpeditionExtractionQuestEvent('r').type,
    'expedition.extracted'
  )
  assert.equal(
    createExpeditionRivalOutcomeQuestEvent('x', true).type,
    'expedition.rivalOutcome'
  )
  assert.ok(getAvailableNativeContractTemplateIds(state, map).length >= 4)
  assert.deepEqual(getAvailableSponsorOfferIds(state, map), [])
  assert.deepEqual(materializeCommittedContracts([], map), [])
  assert.equal(applyExpeditionPressureDelta(state, { heat: 5 }).heat, 5)
  assert.equal(
    recordExpeditionObligationSignal(state, 'gig', null).type,
    'RECORD_EXPEDITION_OBLIGATION_SIGNAL'
  )
  assert.equal(
    doubleDownExpeditionObligation(state, 'x', 'y').type,
    'DOUBLE_DOWN_EXPEDITION_OBLIGATION'
  )
  assert.equal(
    offerExpeditionDraft(state, 'supply', 'x').type,
    'OFFER_EXPEDITION_DRAFT'
  )
  assert.equal(
    selectExpeditionDraft(state, 'cold_trail').type,
    'SELECT_EXPEDITION_DRAFT'
  )
})
