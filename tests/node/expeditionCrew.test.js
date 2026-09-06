import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialState } from '../../src/context/initialState.ts'
import { EXPEDITION_CREW } from '../../src/data/expedition/crew.ts'
import {
  getAvailableCrewIds,
  validateExpeditionBuildCommitment
} from '../../src/domain/expedition/loadout.ts'
import { validateExpeditionCrewSelection } from '../../src/domain/expedition/crew.ts'
import { getCrewStressBand } from '../../src/domain/expedition/crewStress.ts'
import { createCrewDevelopmentEligibilityProof } from '../../src/domain/expedition/career.ts'
import {
  canResolveCrewRecoveryDebt,
  resolveCrewRecoveryDebt,
  EXPEDITION_INJURY_PERFORMANCE_PROFILES
} from '../../src/domain/expedition/injuries.ts'
import {
  recordExpeditionCrewStressSource,
  recordExpeditionRelationshipOutcome,
  advanceExpeditionCrewInjury,
  advanceExpeditionBandInjury
} from '../../src/context/expeditionActionCreators.ts'
import {
  createAcquireExpeditionCrewSignatureAction,
  createSettleExpeditionCrewCareerAction
} from '../../src/context/careerActionCreators.ts'

test('six baseline crew are available and selection is bounded', () => {
  const state = createInitialState()
  assert.equal(EXPEDITION_CREW.length, 6)
  assert.equal(getAvailableCrewIds(state).length, 6)
  assert.equal(
    validateExpeditionCrewSelection(state, ['mika', 'tom', 'ines']).valid,
    true
  )
  assert.equal(
    validateExpeditionCrewSelection(state, ['mika', 'tom', 'ines', 'yara'])
      .valid,
    false
  )
})

test('stress bands, injury profile and recovery lifecycle are bounded', () => {
  assert.equal(getCrewStressBand(39), 'stable')
  assert.equal(getCrewStressBand(90), 'severe')
  assert.equal(
    EXPEDITION_INJURY_PERFORMANCE_PROFILES.critical.cannotPerform,
    true
  )
  const state = createInitialState()
  const career = {
    ...state.career,
    crewRecoveryDebtById: {
      mika: {
        crewId: 'mika',
        createdFromRunId: 'run',
        severity: 'serious',
        toursRemaining: 1
      }
    }
  }
  assert.equal(canResolveCrewRecoveryDebt(career, 'mika'), true)
  assert.equal(
    canResolveCrewRecoveryDebt(
      resolveCrewRecoveryDebt(career, 'mika', 'rehab'),
      'mika'
    ),
    false
  )
})

test('typed creator surfaces derive route guards and career proof actions', () => {
  const state = createInitialState()
  assert.equal(
    recordExpeditionCrewStressSource(state, 'mika', 'travel', 'travel:1')
      .payload.expectedRouteStep,
    0
  )
  assert.equal(
    recordExpeditionRelationshipOutcome(state, {
      first: { kind: 'crew', id: 'mika' },
      second: { kind: 'crew', id: 'tom' },
      sourceType: 'crew_event',
      sourceId: 'event:1'
    }).type,
    'RECORD_EXPEDITION_RELATIONSHIP_OUTCOME'
  )
  assert.equal(
    advanceExpeditionCrewInjury(state, 'mika', 'event:2').type,
    'ADVANCE_EXPEDITION_CREW_INJURY'
  )
  assert.equal(
    advanceExpeditionBandInjury(state, state.band.members[0].id, 'event:3')
      .type,
    'ADVANCE_EXPEDITION_BAND_INJURY'
  )
  assert.equal(
    createSettleExpeditionCrewCareerAction('run').type,
    'SETTLE_EXPEDITION_CREW_CAREER'
  )
  assert.equal(
    createAcquireExpeditionCrewSignatureAction(
      'mika',
      'signature_field_surgeon',
      'proof'
    ).type,
    'ACQUIRE_EXPEDITION_CREW_SIGNATURE'
  )
  assert.equal(createCrewDevelopmentEligibilityProof(state, 'mika'), null)
  assert.equal(typeof validateExpeditionBuildCommitment, 'function')
})
