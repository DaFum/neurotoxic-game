import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  handleClinicEnhance,
  handleGraftNeuroOverclock
} from '../../src/context/reducers/clinicReducer'
import { handleSetLastGigStats } from '../../src/context/reducers/gigReducer'
import { CLINIC_GRAFT_COST } from '../../src/context/gameConstants'
import {
  getNeuroOverclockEffects,
  getTraitById,
  hasTrait
} from '../../src/utils/traitUtils'
import { createInitialState } from '../../src/context/initialState'
import { sanitizeBand } from '../../src/context/reducers/sanitizers/stateSanitizers'

const richState = () => {
  const state = createInitialState()
  return {
    ...state,
    player: { ...state.player, money: CLINIC_GRAFT_COST + 1000 }
  }
}

describe('neuro_overclock trait registration', () => {
  it('is a real, namespaced trait definition with numeric effects', () => {
    const def = getTraitById('neuro_overclock')
    assert.ok(def, 'getTraitById must hit')
    assert.equal(def.id, 'neuro_overclock')
    assert.equal(def.name, 'traits:neuroOverclock.name')
    assert.equal(def.desc, 'traits:neuroOverclock.desc')
    assert.equal(Object.hasOwn(def, 'description'), false)
    const effects = getNeuroOverclockEffects()
    assert.equal(effects.rhythmMultiplier, 1.5)
    assert.equal(effects.stressPerGig, 5)
    assert.equal(effects.staminaPerGig, -10)
  })

  it('keeps the legacy +0.5 hit-window bonus the rhythm hook used to hardcode', () => {
    // useRhythmGameLogic adds `rhythmMultiplier - 1` to band tempo.
    assert.equal(getNeuroOverclockEffects().rhythmMultiplier - 1, 0.5)
  })
})

describe('handleGraftNeuroOverclock', () => {
  it('stores the canonical trait and applies the graft cost to real member/band fields', () => {
    const state = richState()
    const member = state.band.members[0]
    const stressBefore = state.band.stress ?? 0
    const next = handleGraftNeuroOverclock(state, { memberId: member.id })

    const grafted = next.band.members[0]
    assert.deepEqual(
      grafted.traits.neuro_overclock,
      getTraitById('neuro_overclock')
    )
    assert.equal(hasTrait(grafted, 'neuro_overclock'), true)
    // The member model has no health/stress: the cost lands on stamina and
    // on the band-level stress loop instead of inert side fields.
    assert.equal(Object.hasOwn(grafted, 'health'), false)
    assert.equal(Object.hasOwn(grafted, 'stress'), false)
    assert.equal(grafted.stamina, Math.max(1, member.stamina - 20))
    assert.equal(next.band.stress, stressBefore + 30)
    assert.equal(next.player.money, state.player.money - CLINIC_GRAFT_COST)
  })

  it('does not re-charge an already grafted member', () => {
    const state = richState()
    const once = handleGraftNeuroOverclock(state, {
      memberId: state.band.members[0].id
    })
    const twice = handleGraftNeuroOverclock(once, {
      memberId: state.band.members[0].id
    })
    assert.strictEqual(twice, once)
  })

  it('survives a save round trip through sanitizeBand with name and effects intact', () => {
    const state = richState()
    const next = handleGraftNeuroOverclock(state, {
      memberId: state.band.members[0].id
    })
    const reloaded = sanitizeBand(JSON.parse(JSON.stringify(next.band)))
    assert.equal(
      hasTrait(reloaded.members[0], 'neuro_overclock'),
      true,
      'trait must survive reload'
    )
    assert.equal(reloaded.stress, next.band.stress)
  })
})

describe('handleClinicEnhance cannot bypass the graft', () => {
  it('rejects neuro_overclock so it cannot be bought for the cheap enhance fee', () => {
    const state = richState()
    const next = handleClinicEnhance(state, {
      memberId: state.band.members[0].id,
      trait: 'neuro_overclock',
      type: 'enhance'
    })
    assert.strictEqual(next, state)
  })
})

describe('neuro_overclock per-gig cost', () => {
  const finishGig = (state, payload = { score: 5000, accuracy: 80 }) =>
    handleSetLastGigStats(
      { ...state, currentGig: { id: 'v1', name: 'Test Venue' } },
      payload
    )

  it('adds the trait stress and drains the carrier stamina after a real gig', () => {
    const base = richState()
    const grafted = handleGraftNeuroOverclock(base, {
      memberId: base.band.members[0].id
    })
    const plain = finishGig(base)
    const withTrait = finishGig(grafted)

    const effects = getNeuroOverclockEffects()
    assert.equal(
      withTrait.band.stress - plain.band.stress,
      30 + effects.stressPerGig,
      'carrier adds graft stress (30) plus the per-gig stress'
    )
    const carrierBefore = grafted.band.members[0].stamina
    assert.equal(
      withTrait.band.members[0].stamina,
      Math.max(0, carrierBefore + effects.staminaPerGig)
    )
    // Non-carriers are untouched.
    assert.equal(
      withTrait.band.members[1].stamina,
      plain.band.members[1].stamina
    )
  })

  it('charges nothing for a practice gig', () => {
    const base = richState()
    const grafted = handleGraftNeuroOverclock(base, {
      memberId: base.band.members[0].id
    })
    const practice = handleSetLastGigStats(
      { ...grafted, currentGig: { isPractice: true } },
      { score: 100 }
    )
    assert.equal(
      practice.band.members[0].stamina,
      grafted.band.members[0].stamina
    )
    assert.equal(practice.band.stress, grafted.band.stress)
  })

  it('does nothing without a carrier', () => {
    const base = richState()
    const done = finishGig(base)
    assert.equal(done.band.stress, (base.band.stress ?? 0) + 5)
  })
})
