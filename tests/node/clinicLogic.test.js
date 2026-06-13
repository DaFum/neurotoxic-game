import test from 'node:test'
import assert from 'node:assert/strict'
import {
  handleClinicHeal,
  handleClinicEnhance,
  handleBloodBankDonate
} from '../../src/context/reducers/clinicReducer'
import { calculateDailyUpdates } from '../../src/utils/simulationUtils'

// The reducer computes costs internally from CLINIC_CONFIG and clinicVisits.
// At 0 visits: heal cost = 150 money, enhance cost = 500 fame.

test('clinicReducer', async t => {
  await t.test('handleClinicHeal', async t2 => {
    await t2.test('heals member and deducts cost, clamps bounds', () => {
      const state = {
        player: { money: 500, fame: 100, clinicVisits: 0 },
        band: {
          members: [
            { id: 'm1', name: 'M1', stamina: 50, mood: 50 },
            { id: 'm2', name: 'M2', stamina: 100, mood: 100 }
          ]
        }
      }

      const payload = {
        memberId: 'm1',
        type: 'heal',
        staminaGain: 60, // Should clamp to 100
        moodGain: 10
      }

      const nextState = handleClinicHeal(state, payload)

      // Cost at 0 visits = 280 money
      assert.equal(nextState.player.money, 220)
      assert.equal(nextState.player.clinicVisits, 1)
      assert.equal(nextState.band.members[0].stamina, 100)
      assert.equal(nextState.band.members[0].mood, 60)
      assert.equal(nextState.band.members[1].stamina, 100)
    })

    await t2.test('heals a member whose persisted stamina/mood is NaN', () => {
      // Regression: a stale save can carry NaN stats. `?? 0` does not strip NaN,
      // so the addend stayed NaN and the clamp collapsed the heal to 0 (no-op).
      // finiteNumberOr must coerce the NaN base to 0 so the gain still applies.
      const state = {
        player: { money: 500, fame: 100, clinicVisits: 0 },
        band: {
          members: [{ id: 'm1', name: 'M1', stamina: NaN, mood: NaN }]
        }
      }

      const payload = {
        memberId: 'm1',
        type: 'heal',
        staminaGain: 40,
        moodGain: 25
      }

      const nextState = handleClinicHeal(state, payload)

      assert.equal(nextState.band.members[0].stamina, 40)
      assert.equal(nextState.band.members[0].mood, 25)
    })

    await t2.test('drops non-finite gains instead of clamp-maxing them', () => {
      // Regression: `Number(v) || 0` collapses NaN but passes Infinity, which
      // the clamp turned into a free full heal. finiteNumberOr drops both.
      const state = {
        player: { money: 500, fame: 100, clinicVisits: 0 },
        band: {
          members: [{ id: 'm1', name: 'M1', stamina: 50, mood: 50 }]
        }
      }

      const payload = {
        memberId: 'm1',
        type: 'heal',
        staminaGain: Infinity,
        moodGain: -Infinity
      }

      const nextState = handleClinicHeal(state, payload)

      assert.equal(nextState.band.members[0].stamina, 50)
      assert.equal(nextState.band.members[0].mood, 50)
    })

    await t2.test('appends successToast to state.toasts on success', () => {
      const state = {
        player: { money: 500, fame: 100, clinicVisits: 0 },
        band: {
          members: [{ id: 'm1', name: 'M1', stamina: 50, mood: 50 }]
        },
        toasts: []
      }

      const toast = { id: 'toast-1', message: 'Healed!', type: 'success' }
      const payload = {
        memberId: 'm1',
        type: 'heal',
        staminaGain: 30,
        moodGain: 10,
        successToast: toast
      }

      const nextState = handleClinicHeal(state, payload)

      assert.equal(nextState.toasts.length, 1)
      assert.equal(nextState.toasts[0].id, 'toast-1')
      assert.equal(nextState.toasts[0].message, 'Healed!')
    })

    await t2.test('does not append toast when action is rejected', () => {
      const state = {
        player: { money: 50, fame: 100, clinicVisits: 0 },
        band: { members: [{ id: 'm1', stamina: 50, mood: 50 }] },
        toasts: []
      }

      const toast = { id: 'toast-2', message: 'Healed!', type: 'success' }
      const payload = {
        memberId: 'm1',
        type: 'heal',
        staminaGain: 30,
        moodGain: 10,
        successToast: toast
      }

      const nextState = handleClinicHeal(state, payload)

      assert.equal(nextState, state) // Rejected, no toast
    })

    await t2.test('fails if not enough money', () => {
      const state = {
        player: { money: 50, fame: 100, clinicVisits: 0 },
        band: { members: [{ id: 'm1', stamina: 50, mood: 50 }] }
      }

      // Heal base cost is 150 at 0 visits, player only has 50
      const payload = { memberId: 'm1', type: 'heal' }
      const nextState = handleClinicHeal(state, payload)

      assert.equal(nextState, state) // Returns original state
    })
  })

  await t.test('handleClinicEnhance', async t2 => {
    await t2.test('adds trait and deducts fame', () => {
      const state = {
        player: { money: 1000, fame: 500, clinicVisits: 0 },
        band: {
          members: [
            { id: 'm1', traits: { existing_trait: { id: 'existing_trait' } } }
          ]
        }
      }

      const payload = {
        memberId: 'm1',
        type: 'enhance',
        trait: 'cyber_lungs'
      }

      const nextState = handleClinicEnhance(state, payload)

      // Enhance base cost is 500 fame at 0 visits
      assert.equal(nextState.player.fame, 0)
      assert.equal(nextState.player.clinicVisits, 1)
      assert.equal(Object.keys(nextState.band.members[0].traits).length, 2)
      assert.ok(nextState.band.members[0].traits['cyber_lungs'])
      assert.equal(
        nextState.band.members[0].traits['cyber_lungs'].id,
        'cyber_lungs'
      )
    })

    await t2.test('fails if missing trait string', () => {
      const state = {
        player: { money: 1000, fame: 500 },
        band: { members: [{ id: 'm1', traits: {} }] }
      }

      const payload = { memberId: 'm1', type: 'enhance' }
      const nextState = handleClinicEnhance(state, payload)

      assert.equal(nextState, state)
    })

    await t2.test('fails if insufficient fame', () => {
      const state = {
        player: { money: 1000, fame: 0, clinicVisits: 0 },
        band: {
          members: [{ id: 'm1', traits: {} }]
        }
      }

      const payload = {
        memberId: 'm1',
        type: 'enhance',
        trait: 'cyber_lungs'
      }

      const nextState = handleClinicEnhance(state, payload)

      assert.equal(nextState, state)
    })
  })

  await t.test('handleBloodBankDonate', async t2 => {
    await t2.test(
      'normalizes and rejects without economy effects when a member has NaN stamina (which coerces to 0)',
      () => {
        // Regression mirror of the heal case: a stale save can carry NaN stamina.
        // handleBloodBankDonate must coerce the NaN base to 0 (finiteNumberOr) so
        // NaN never propagates into stored stamina.
        // Since 0 < staminaCost + 10, the affordability check will reject the donation,
        // returning the normalized state without economy effects or toasts.
        const staminaCost = 20
        const state = {
          player: { money: 100, fame: 0, clinicVisits: 0 },
          band: {
            harmony: 50,
            members: [{ id: 'm1', name: 'M1', stamina: NaN, mood: 50 }]
          },
          social: { controversyLevel: 0 },
          toasts: []
        }

        const nextState = handleBloodBankDonate(state, {
          moneyGain: 50,
          harmonyCost: 0,
          staminaCost,
          controversyGain: 0,
          successToast: { id: 'bb-toast', message: 'Donated', type: 'success' }
        })

        // Stamina is normalized to 0.
        assert.equal(nextState.band.members[0].stamina, 0)
        assert.equal(Number.isNaN(nextState.band.members[0].stamina), false)

        // No economy effects applied.
        assert.equal(nextState.player.money, 100)
        assert.equal(nextState.band.harmony, 50)

        // No toast generated because the action was rejected.
        assert.equal(nextState.toasts.length, 0)
      }
    )
  })

  await t.test('cyber_lungs trait grants daily stamina regen bonus', () => {
    const currentState = {
      player: {
        day: 1,
        money: 1000,
        hqUpgrades: [],
        van: { condition: 100 }
      },
      band: {
        members: [
          {
            name: 'Matze',
            mood: 50,
            stamina: 50,
            traits: { cyber_lungs: { id: 'cyber_lungs' } }
          },
          { name: 'Marius', mood: 50, stamina: 50, traits: {} }
        ],
        harmony: 50
      },
      social: { instagram: 100 }
    }

    const { band } = calculateDailyUpdates(currentState)

    // Member with cyber_lungs: 50 - 5 (decay) + 3 (cyber_lungs) = 48
    // Member without:          50 - 5 (decay) = 45
    assert.equal(band.members[0].stamina, 48)
    assert.equal(band.members[1].stamina, 45)
  })
})
