import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialState } from '../../src/context/initialState.ts'
import {
  getExpeditionPerformanceProfile,
  canPerformExpeditionGig
} from '../../src/domain/expedition/injuries.ts'

test('band injury composes once with condition performance and critical blocks the required band path', () => {
  const base = createInitialState()
  const memberId = base.band.members[0].id
  const state = {
    ...base,
    expedition: {
      ...base.expedition,
      status: 'active',
      bandInjuryByMemberId: { [memberId]: 'light' }
    }
  }
  const profile = getExpeditionPerformanceProfile(state)
  assert.equal(profile.timingMultiplier, 0.99)
  assert.equal(profile.missStaminaMultiplier, 1.08 * 1.05)
  assert.equal(
    canPerformExpeditionGig({
      ...state,
      expedition: {
        ...state.expedition,
        bandInjuryByMemberId: { [memberId]: 'critical' }
      }
    }),
    false
  )
})
