import test from 'node:test'
import assert from 'node:assert/strict'
import {
  handleClinicHeal,
  handleClinicEnhance
} from '../src/context/reducers/clinicReducer.js'
import { calculateDailyUpdates } from '../src/utils/simulationUtils.js'

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

      // Cost at 0 visits = 150 money
      assert.equal(nextState.player.money, 350)
      assert.equal(nextState.player.clinicVisits, 1)
      assert.equal(nextState.band.members[0].stamina, 100)
      assert.equal(nextState.band.members[0].mood, 60)
      assert.equal(nextState.band.members[1].stamina, 100)
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
      const traits = nextState.band.members[0].traits
      assert.ok(Object.hasOwn(traits, 'existing_trait'))
      assert.ok(Object.hasOwn(traits, 'cyber_lungs'))
      assert.equal(traits.cyber_lungs.id, 'cyber_lungs')
    })

    await t2.test('fails if missing trait string', () => {
      const state = {
        player: { money: 1000, fame: 500 },
        band: { members: [{ id: 'm1', traits: [] }] }
      }

      const payload = { memberId: 'm1', type: 'enhance' }
      const nextState = handleClinicEnhance(state, payload)

      assert.equal(nextState, state)
    })

    await t2.test('fails if insufficient fame', () => {
      const state = {
        player: { money: 1000, fame: 0, clinicVisits: 0 },
        band: {
          members: [{ id: 'm1', traits: [] }]
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
          { name: 'Marius', mood: 50, stamina: 50, traits: [] }
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
