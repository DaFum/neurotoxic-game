import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  handleClinicEnhance,
  handleGraftNeuroOverclock
} from '../../src/context/reducers/clinicReducer'
import { handleSetLastGigStats } from '../../src/context/reducers/gigReducer'
import { CLINIC_GRAFT_COST } from '../../src/context/gameConstants'
import {
  applyNeuroOverclockGigCost,
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

  it('floors the grafted member stamina at 1', () => {
    const state = richState()
    const members = state.band.members.map((member, index) =>
      index === 0 ? { ...member, stamina: 10 } : member
    )
    const next = handleGraftNeuroOverclock(
      { ...state, band: { ...state.band, members } },
      { memberId: members[0].id }
    )
    assert.equal(next.band.members[0].stamina, 1)
  })

  it('does not raise a member already below the floor', () => {
    const state = richState()
    const members = state.band.members.map((member, index) =>
      index === 0 ? { ...member, stamina: 0 } : member
    )
    const next = handleGraftNeuroOverclock(
      { ...state, band: { ...state.band, members } },
      { memberId: members[0].id }
    )
    assert.equal(next.band.members[0].stamina, 0)
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

describe('legacy neuro_overclock saves', () => {
  // Shape the pre-registration graft fallback wrote: raw i18n keys under the
  // wrong names, `description` instead of `desc`, and no `unlockHint`.
  const legacyTrait = {
    id: 'neuro_overclock',
    name: 'traits:neuro_overclock.name',
    description: 'traits:neuro_overclock.description',
    effects: { rhythmMultiplier: 1.5, stressPerGig: 5, healthPerGig: -10 }
  }

  it('rehydrates the stored fallback object to the canonical trait on load', () => {
    const state = richState()
    const legacyBand = {
      ...state.band,
      members: state.band.members.map((member, index) =>
        index === 0
          ? {
              ...member,
              traits: { ...member.traits, neuro_overclock: legacyTrait }
            }
          : member
      )
    }

    const reloaded = sanitizeBand(JSON.parse(JSON.stringify(legacyBand)))

    assert.deepEqual(
      reloaded.members[0].traits.neuro_overclock,
      getTraitById('neuro_overclock')
    )
  })

  it('keeps a stored trait whose id has no canonical definition', () => {
    const state = richState()
    const unknownTrait = { id: 'retired_trait', name: 'old' }
    const legacyBand = {
      ...state.band,
      members: state.band.members.map((member, index) =>
        index === 0
          ? { ...member, traits: { retired_trait: unknownTrait } }
          : member
      )
    }

    const reloaded = sanitizeBand(JSON.parse(JSON.stringify(legacyBand)))

    assert.deepEqual(reloaded.members[0].traits.retired_trait, unknownTrait)
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
      Math.max(
        Math.min(carrierBefore, 1),
        carrierBefore + effects.staminaPerGig
      )
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

  it('floors the carrier stamina at the graft floor instead of 0', () => {
    const base = richState()
    const grafted = handleGraftNeuroOverclock(base, {
      memberId: base.band.members[0].id
    })
    const tired = {
      ...grafted.band,
      members: grafted.band.members.map((member, index) =>
        index === 0 ? { ...member, stamina: 5 } : member
      )
    }
    assert.equal(applyNeuroOverclockGigCost(tired).members[0].stamina, 1)
  })

  it('never raises a carrier that is already below the floor', () => {
    const base = richState()
    const grafted = handleGraftNeuroOverclock(base, {
      memberId: base.band.members[0].id
    })
    const drained = {
      ...grafted.band,
      members: grafted.band.members.map((member, index) =>
        index === 0 ? { ...member, stamina: 0 } : member
      )
    }
    assert.equal(applyNeuroOverclockGigCost(drained).members[0].stamina, 0)
  })

  it('does nothing without a carrier', () => {
    const base = richState()
    const done = finishGig(base)
    assert.equal(done.band.stress, (base.band.stress ?? 0) + 5)
  })
})
