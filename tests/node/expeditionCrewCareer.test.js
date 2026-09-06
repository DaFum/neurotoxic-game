import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialState } from '../../src/context/initialState.ts'
import {
  handleSettleExpeditionCrewCareer,
  handleAcquireExpeditionCrewSignature
} from '../../src/context/reducers/careerReducer.ts'
import { createCrewDevelopmentEligibilityProof } from '../../src/domain/expedition/career.ts'

test('career settlement is once-only and creates serious recovery debt', () => {
  const base = createInitialState()
  const state = {
    ...base,
    expedition: {
      ...base.expedition,
      status: 'completed',
      runId: 'run-1',
      loadout: { crewIds: ['mika'] },
      crew: {
        stressByCrewId: { mika: 20 },
        injuryByCrewId: { mika: 'serious' }
      },
      outcome: {
        runId: 'run-1',
        kind: 'completed',
        reason: null,
        finalizedAtRouteStep: 3,
        settlement: {},
        finaleResultId: 'finale'
      }
    }
  }
  const settled = handleSettleExpeditionCrewCareer(state, { runId: 'run-1' })
  assert.equal(settled.career.crewById.mika.loyalty, 3)
  assert.equal(settled.career.crewRecoveryDebtById.mika.toursRemaining, 1)
  assert.equal(
    handleSettleExpeditionCrewCareer(settled, { runId: 'run-1' }),
    settled
  )
})

test('signature proof is derived after settlement and acquisition rejects stale trait ids', () => {
  const base = createInitialState()
  const state = {
    ...base,
    career: {
      ...base.career,
      finalizedExpeditionRuns: 3,
      crewById: {
        mika: {
          loyalty: 60,
          storyProgress: 3,
          signatureTraitId: null,
          unavailableUntilCompletedRunCount: 0
        }
      }
    }
  }
  const proof = createCrewDevelopmentEligibilityProof(state, 'mika')
  assert.equal(proof, 'crew-development:mika:3')
  assert.equal(
    handleAcquireExpeditionCrewSignature(state, {
      crewId: 'mika',
      expectedTraitId: 'forged',
      sourceType: 'career_development',
      sourceId: proof
    }),
    state
  )
  const acquired = handleAcquireExpeditionCrewSignature(state, {
    crewId: 'mika',
    expectedTraitId: 'signature_field_surgeon',
    sourceType: 'career_development',
    sourceId: proof
  })
  assert.equal(
    acquired.career.crewById.mika.signatureTraitId,
    'signature_field_surgeon'
  )
})
