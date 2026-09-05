import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialState } from '../../src/context/initialState.ts'
import { composeExpeditionFailureSignal } from '../../src/domain/expedition/failure.ts'

test('selected crew at maximum stress produces the canonical crew-collapse signal', () => {
  const base = createInitialState()
  const state = {
    ...base,
    expedition: {
      ...base.expedition,
      status: 'active',
      loadout: { crewIds: ['mika'] },
      crew: { stressByCrewId: { mika: 100 }, injuryByCrewId: {} }
    }
  }
  assert.deepEqual(composeExpeditionFailureSignal(state), {
    reason: 'crew_collapse',
    sourceId: 'mika',
    choices: ['accept_failure']
  })
})

test('critical required-band injury exposes an attributable failure instead of deadlocking PreGig', () => {
  const base = createInitialState()
  const memberId = base.band.members[0].id
  const state = {
    ...base,
    expedition: {
      ...base.expedition,
      status: 'active',
      bandInjuryByMemberId: { [memberId]: 'critical' }
    }
  }
  assert.deepEqual(composeExpeditionFailureSignal(state), {
    reason: 'crew_collapse',
    sourceId: memberId,
    choices: ['accept_failure']
  })
})
